const fetchRandomQuestions = require("./fetchRandomQuestions");
const generateLeaderboard = require("./generateLeaderboard");
const handleTriviaCommand = require("./handleTriviaCommand");

// Function to handle slash commands incoming from Discord (interaction)
module.exports = function slashCommands(client) {
  let questionBank = [];

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "question") {
      // If the question bank is empty, fetch a new batch of questions.
      if (questionBank.length === 0) {
        try {
          questionBank = await fetchRandomQuestions();
        } catch (error) {
          await interaction.editReply(
            "Oops, a glitch in the trivia matrix! Try again later."
          );
          console.error("Error fetching questions:", error);
          return;
        }
      }
      handleTriviaCommand(interaction, questionBank);
    } else if (commandName === "leaderboard") {
      // Placeholder for leaderboard command
      await interaction.deferReply();
      const message = await generateLeaderboard(client, interaction);

      await interaction.editReply(message);
    }
  });
};
