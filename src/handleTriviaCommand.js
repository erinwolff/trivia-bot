const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetchSingleQuestion = require("./fetchSingleQuestion");
const shuffleArray = require("./shuffleArray");
const constants = require("./constants");

module.exports = async function handleTriviaCommand(interaction, questionBank) {
  try {
    const userId = interaction.user.id;
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
