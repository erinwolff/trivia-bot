const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  bold,
} = require("discord.js");
const fetchSingleQuestion = require("./fetchSingleQuestion");
const generateCategoryButtons = require("./generateCategoryButtons");
const shuffleArray = require("./shuffleArray");
const constants = require("./constants");

const activeTriviaSessions = new Map();
const finalSassyMessageIndex = constants.sassyMessages.length - 1;

module.exports = async function handleQuestionCommand(
  interaction,
  questionBank
) {
  try {
    // Generate Category Buttons
    const { chosenOption: selectedCategory, userId: categorySelectorId } =
      await generateCategoryButtons(interaction);

    if (selectedCategory == null) {
      interaction.editReply(`Category selection timed out.`);
      return;
    }

    activeTriviaSessions.set(interaction.id, {
      categorySelectorId,
      clickCount: 0,
      currentQuestion: null,
    });

    let currentQuestion; // To store the fetched question

    // Fetch new questions only if questionBank is empty
    if (questionBank.length === 0) {
      questionBank = await fetchRandomQuestions();
    }

    // Now handle both 'random' and category-based fetching
    if (selectedCategory === "random") {
      currentQuestion = questionBank.pop();
    } else {
      currentQuestion = await fetchSingleQuestion(selectedCategory);
    }

    const { question, allAnswers, correctAnswer } = currentQuestion;

    activeTriviaSessions.set(interaction.id, {
      ...activeTriviaSessions.get(interaction.id),
      currentQuestion,
    });

    // Shuffle the answers
    const shuffledAnswers = shuffleArray(allAnswers);

    // Construct buttons to display the Answer Options
    const buttons = shuffledAnswers.map((answer) =>
      new ButtonBuilder()
        .setCustomId(answer) // Store answer as the button ID
        .setLabel(answer)
        .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({
      content: question,
      components: [row],
    });

    // Button Interaction Collector
    const collector = interaction.channel.createMessageComponentCollector({
      time: 120000,
    });

    collector.on("collect", async (i) => {
      const sessionData = activeTriviaSessions.get(interaction.id);
      if (!sessionData) {
        return i.reply({
          content: "This trivia session seems to have ended.",
          ephemeral: true,
        });
      }

      // Filter to only collect interactions from the user who initiated the command
      const filter = (i) => i.user.id === sessionData.categorySelectorId;

      if (!filter(i)) {
        const messageIndex =
          sessionData.clickCount <= finalSassyMessageIndex
            ? sessionData.clickCount
            : finalSassyMessageIndex;
        i.reply({
          content: constants.sassyMessages[messageIndex],
          ephemeral: true,
        });
        sessionData.clickCount++;
        return;
      }
      await i.deferUpdate();

      const chosenAnswer = i.customId;

      // If the answer is correct, displays message with question & correct answer. If incorrect, alerts user and shares question & correct answer.
      if (correctAnswer === chosenAnswer) {
        await interaction.editReply({
          content: `Correct! ${interaction.user.username} wins again! 🎉 
        ${bold("Original Question:")} ${question} 
        ${bold("Correct Answer:")} ${correctAnswer}  `,
          components: [],
        });
      } else {
        await interaction.editReply({
          content: `Nice try, ${
            interaction.user.username
          }, but that's not the right answer 😔 
        ${bold("Original Question:")} ${question}
        ${bold("Your Answer:")} ${chosenAnswer}
        ${bold("Correct Answer:")} ${correctAnswer}`,
          components: [],
        });
      }

      collector.stop(); // End the button listening
    });

    // Ends button listening if user didn't select an answer in time.
    collector.on("end", (collected) => {
      const sessionData = activeTriviaSessions.get(interaction.id);
      if (collected.size === 0 && sessionData) {
        interaction.followUp(
          `Time\'s up! The correct answer was ${sessionData.currentQuestion.correctAnswer}.`
        );
      }
      activeTriviaSessions.delete(interaction.id);
    });
  } catch (error) {
    console.error("Error fetching trivia:", error);
    await interaction.editReply({
      content: "Oops, couldn't get a trivia question right now!",
      components: [],
    });
  }
};
