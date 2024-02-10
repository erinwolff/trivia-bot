const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


// Function to handle slash commands incoming from Discord (interaction)
module.exports = function slashCommands(client) {
  let questionBank = [];

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'question') {
        if (questionBank.length === 0) {
            try {
                questionBank = await fetchQuestions();
            } catch (error) {
                await interaction.editReply('Oops, a glitch in the trivia matrix!  Try again later.');
                console.error("Error fetching questions:", error); 
                return; 
            }
        }
        handleQuestionCommand(interaction);
    }
  });

  const handleQuestionCommand = async (interaction) => {
    try {
      await interaction.deferReply(); // Acknowledge

      const { question, allAnswers, correctAnswer } = questionBank.pop();
      
      // Shuffle the answers 
      const shuffledAnswers = shuffleArray(allAnswers); // Use your existing shuffleArray function

      // Construct buttons
      const buttons = shuffledAnswers.map(answer =>
        new ButtonBuilder()
          .setCustomId(answer) // Store answer as the button ID 
          .setLabel(answer)
          .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.editReply({
        content: question,
        components: [row]
      });

      // Button Interaction Collector
      const collector = interaction.channel.createMessageComponentCollector({ time: 30000 });

      collector.on('collect', async i => {
        await i.deferUpdate();
        const chosenAnswer = i.customId;

        // Use the stored correctAnswer from your question object 
        if (correctAnswer === chosenAnswer) {
          await interaction.editReply({ content: 'You got it right!', components: [] });
        } else {
          await interaction.editReply({ content: `Nice try! The answer was ${correctAnswer}`, components: [] });
        }

        collector.stop(); // End the button listening 
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp(`Time\'s up! The answer was ${data[0].correctAnswer}.`);
        }
      });

    } catch (error) {
      console.error('Error fetching trivia:', error);
      await interaction.editReply('Oops, couldn\'t get a trivia question right now!');
    }
  };
}


async function fetchQuestions() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://the-trivia-api.com/v2/questions?limit=20'); // Adjust batch size 
    const data = await response.json();

    return data.map(questionItem => ({
      question: questionItem.question.text,
      allAnswers: shuffleArray([questionItem.correctAnswer, ...questionItem.incorrectAnswers]),
      correctAnswer: questionItem.correctAnswer
    }));
  } catch (error) {
    console.error('Error fetching question batch:', error);
  }
}

// Simple function to shuffle answer order
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


// need to implement a /startgame command which will take an optional categories input which will return 3 different categories. otherwise it will be all categories