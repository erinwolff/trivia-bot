const config = require('./config.json');
const Discord = require('discord.js');
const { ActivityType } = require('discord.js');
const errorHandlers = require('./src/error.js');
const slashCommands = require('./src/slashCommands.js');

async function triviaBot() {
  const client = new Discord.Client({
    intents: [
      'Guilds',           // Allows the bot to receive information about the guilds (servers) it is in
      'GuildMessages',    // Allows the bot to receive messages in a guild
      'MessageContent',   // Allows the bot to receive message content
    ]
  });

  // success message once client is logged in
  client.on('ready', (c) => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('trivia-bot is online and ready to rumble!');

    // Set custom message and presence status
    try {
      client.user.setPresence({
        activities: [{ name: `Studying Wikipedia`, type: ActivityType.Custom }], // Activity types: Competing, Custom, Listening, Playing, Streaming, Watching
        status: 'online',
      });
      console.log('Activity set successfully');
    } catch (error) {
      console.error('Error setting activity:', error);
    }
  });

  // Function to handle slash commands incoming from Discord (interaction)
  slashCommands(client);


  // Error handling 
  errorHandlers();


  client.login(config.token);

}
triviaBot();