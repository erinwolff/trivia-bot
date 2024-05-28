const { REST, Routes } = require("discord.js");
const config = require("../config.json");

// Define your slash commands
const commands = [
  {
    name: "question",
    description: "Get a random trivia question!",
  },
  {
    name: "leaderboard",
    description: "Get the current leaderboard.",
  },
  // Add other commands as needed
];

// Set up REST for deploying commands
const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    // Globally registering the commands
    await rest.put(Routes.applicationCommands(config.client_id), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
