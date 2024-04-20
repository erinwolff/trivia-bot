const config = require('../config.json');
const Discord = require('discord.js');

function round(number, decimalPlaces) {
  const factor = 10 ** decimalPlaces;
  return Math.round(number * factor) / factor;
}

async function fetchMessages(channel, limit = 100, beforeMessageId = null) {
  let collectedMessages = new Discord.Collection();
  let iterations = 0;
  const maxIterations = Math.ceil(limit / 100); // How many times we'll need to fetch

  while (iterations < maxIterations) {
    const options = { limit: 100 };
    if (beforeMessageId) {
      options.before = beforeMessageId;
    }

    const messages = await channel.messages.fetch(options);
    collectedMessages = collectedMessages.concat(messages);

    iterations++;
    beforeMessageId = messages.lastKey(); // Update for the next fetch

    // If we've retrieved all the messages needed, exit the loop
    if (collectedMessages.size >= limit) {
      break;
    }
  }

  return collectedMessages;
}

// Function to fetch questions to be stored in the questionBank & used for Random/"Surprise Me!" button selection
module.exports = async function generateLeaderboard(client, interaction) {
  const userScores = {};
  const triviaBotId = config.client_id; // Replace '...' with the actual ID of your Trivia Bot
  const channel = interaction.channel; // Replace '...' with the actual ID of your channel

  try {

    const messages = await fetchMessages(channel, 1000); // Fetch recent messages

    for (const data of messages) {
      const message = data[1];

      if (message.author.id !== triviaBotId) continue; // Check if it's not the trivia bot
      let username = ''


      if (message.content.includes('Correct!')) {
        username = message.content.split(' ')[1];
        if (username === 'bu') continue;
        if (username === "🎉") continue;
        if (!userScores[username]) {
          userScores[username] = { correct: 0, total: 0 };
        }
        userScores[username]['correct']++;
      } else if (message.content.includes('Nice try,')) {
        username = message.content.split(' ')[2];
        username = username.slice(0, -1);
        if (username === 'bu') continue;
        if (username === "🎉") continue;
        if (!userScores[username]) {
          userScores[username] = { correct: 0, total: 0 };
        }
      } else continue;

      userScores[username]['total']++;

    }

    // Build the stats message
    let statsMessage = "Trivia Stats ~\n";
    for (const [username, scores] of Object.entries(userScores)) { // Using Object.entries()
      const accuracy = scores['total'] ? round(scores['correct'] / scores['total'] * 100, 1) : 0;
      statsMessage += `- ${username}: ${scores['correct']} /${scores['total']} (${accuracy}%)\n`;
    }

    return statsMessage;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}
