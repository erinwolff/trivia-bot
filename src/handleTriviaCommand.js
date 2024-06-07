const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetchSingleQuestion = require("./fetchSingleQuestion");
const shuffleArray = require("./shuffleArray");
const constants = require("./constants");
const sqlite3 = require("sqlite3").verbose();

module.exports = async function handleTriviaCommand(interaction, questionBank) {
  const guildId = interaction.guild.id;
  const guildName = interaction.guild.name;
  const userId = interaction.user.id;
  const username = interaction.user.username;
  try {
    const db = new sqlite3.Database("./data/trivia_data.db", (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return;
      }
      // Create the tables using db.run()
      db.run(
        `CREATE TABLE IF NOT EXISTS servers (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT NOT NULL,
                request_count INTEGER DEFAULT 0
            )`,
        (err) => {
          if (err) {
            console.error("Error creating 'servers' table:", err.message);
          } else {
            // Insert or update the server data after the table is created
            db.run(
              `
              INSERT OR IGNORE INTO servers (guild_id, guild_name) VALUES (?, ?)
          `,
              [guildId, guildName],
              function (err) {
                if (err) {
                  console.error("Error inserting/ignoring server:", err);
                } else {
                  db.run(
                    `
                  UPDATE servers 
                  SET request_count = request_count + 1 
                  WHERE guild_id = ?
              `,
                    [guildId]
                  );
                }
              }
            );
          }
        }
      );

      // Create a table to store user data
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          user_id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          request_count INTEGER DEFAULT 0
        )`,
        (err) => {
          if (err) {
            console.error("Error creating 'users' table:", err.message);
          } else {
            db.run(
              `
              INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)
            `,
              [userId, username],
              function (err) {
                if (err) {
                  console.error("Error inserting/ignoring user:", err);
                } else {
                  db.run(
                    `
                  UPDATE users 
                  SET request_count = request_count + 1 
                  WHERE user_id = ?
              `,
                    [userId]
                  );
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error("Error inserting/ignoring server:", error);
  }

  try {
    let currentQuestion = null;
    const finalSassyMessageIndex = constants.sassyMessages.length - 1;
    let clickCount = 0;

    // Fetch new questions only if questionBank is empty
    if (questionBank.length === 0) {
      questionBank = await fetchRandomQuestions();
    }

    // Generate Category Buttons
    let randomCategories = shuffleArray(constants.allCategories).slice(0, 3);
    const categoriesRow = new ActionRowBuilder();

    randomCategories.forEach((category) => {
      categoriesRow.addComponents(
        new ButtonBuilder()
          .setCustomId(category)
          .setLabel(
            category === "General_Knowledge"
              ? "General Knowledge"
              : category.replace("_and_", " & ")
          )
          .setStyle(ButtonStyle.Primary)
      );
    });
    categoriesRow.addComponents(
      new ButtonBuilder()
        .setCustomId("random") // A special ID for "random"
        .setLabel("Surprise me!")
        .setStyle(ButtonStyle.Primary)
    );
    await interaction.deferReply();
    const collectorFilter = (i) => {
      if (i.user.id !== userId) {
        const messageIndex =
          clickCount <= finalSassyMessageIndex
            ? clickCount
            : finalSassyMessageIndex;
        i.reply({
          content: constants.sassyMessages[messageIndex],
          ephemeral: true,
        });
        clickCount++;
        return false;
      }
      return true;
    };
    const categoryResponse = await interaction.editReply({
      content: `Select a category to get started, ${interaction.user.username}!`,
      components: [categoriesRow],
      fetchReply: true,
    });

    let selectedCategory;
    try {
      const confirmation = await categoryResponse.awaitMessageComponent({
        filter: collectorFilter,
        time: 150_000,
      });
      await confirmation.deferUpdate();
      if (confirmation.customId === "random") {
        selectedCategory = "random"; // Special value to indicate "random" selection
      } else {
        selectedCategory = confirmation.customId; // Only return the selected category
      }
    } catch (error) {
      // Timeout or other error occurred
      if (error.code === "InteractionCollectorError") {
        // Interaction timed out
        await interaction.editReply({
          content: `Category selection timed out.`,
          components: [], // Remove buttons
        });
        return;
      } else {
        // Other error
        console.error("Error in handleQuestionCommand:", error);
        await interaction.editReply({
          content: "Oops, something went wrong with the trivia question.",
          components: [],
        });
        return;
      }
    }

    // Now handle both 'random' and category-based fetching
    if (selectedCategory === "random") {
      currentQuestion = questionBank.pop();
    } else {
      currentQuestion = await fetchSingleQuestion(selectedCategory);
    }

    const { question, allAnswers, correctAnswer } = currentQuestion;

    // Shuffle the answers
    const shuffledAnswers = shuffleArray(allAnswers);

    // Construct buttons to display the Answer Options
    const answerButtons = shuffledAnswers.map((answer) => {
      return new ButtonBuilder()
        .setCustomId(answer) // Store answer as the button ID
        .setLabel(answer)
        .setStyle(ButtonStyle.Primary);
    });

    const answerRow = new ActionRowBuilder().addComponents(answerButtons);

    const answerResponse = await interaction.editReply({
      content: question,
      components: [answerRow],
      fetchReply: true,
    });
    try {
      const confirmation = await answerResponse.awaitMessageComponent({
        filter: collectorFilter,
        time: 250_000,
      });
      await confirmation.deferUpdate();
      if (confirmation.customId === correctAnswer) {
        await interaction.editReply({
          content: `Correct! ${interaction.user.username} wins again! 🎉
         **Original Question:** ${question}
         **Correct Answer:** ${correctAnswer}`,
          components: [],
        });
      } else {
        await interaction.editReply({
          content: `Nice try, ${interaction.user.username}, but that's not the right answer 😔
          **Original Question:** ${question}
          **Your Answer:** ${confirmation.customId}
          **Correct Answer:** ${correctAnswer}`,
          components: [],
        });
      }
    } catch (error) {
      // Timeout or other error occurred
      if (error.code === "InteractionCollectorError") {
        // Interaction timed out
        await interaction.editReply({
          content: `Time's up! The correct answer was: ${correctAnswer}`,
          components: [], // Remove buttons
        });
      } else {
        // Other error
        console.error("Error in handleQuestionCommand:", error);
        await interaction.editReply({
          content: "Oops, something went wrong with the trivia question.",
          components: [],
        });
      }
    }
  } catch (error) {
    console.error("Error fetching trivia:", error);
    await interaction.editReply({
      content: "Oops, couldn't get a trivia question right now!",
      components: [],
    });
  }
};
