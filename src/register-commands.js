const { REST, Routes } = require('discord.js');
const config = require("../config.json");

// Define your slash commands
const commands = [
  {
    name: "question",
    description: "Get a random trivia question!",
  }
  // Add other commands as needed
];

// Set up REST for deploying commands
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.client_id, config.guild_id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();