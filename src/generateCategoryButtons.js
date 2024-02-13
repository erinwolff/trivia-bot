const shuffleArray = require('./shuffleArray');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// API Category Query Parameters
const allCategories = [
  "Music",
  "Sport_and_Leisure",
  "Film_and_TV",
  "Arts_and_Literature",
  "History",
  "Society_and_Culture",
  "Science",
  "Geography",
  "Food_and_Drink",
  "General_Knowledge"
];


// Function generates 3 Category buttons, shuffled from the allCategories container. 
module.exports = async function generateCategoryButtons(interaction) {
  let randomCategories = shuffleArray(allCategories).slice(0, 3);
  const row = new ActionRowBuilder();

  randomCategories.forEach(category => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(category)
        .setLabel((category === 'General_Knowledge') ? 'General Knowledge' : category.replace('_and_', ' & '))
        .setStyle(ButtonStyle.Primary)
    );
  });
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('random')  // A special ID for "random"
      .setLabel('Surprise me!')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: 'Select a category to get started!',
    components: [row]
  });

  // Collect button click
  const collector = interaction.channel.createMessageComponentCollector();

  return new Promise((resolve) => {
    collector.on('collect', async i => {
      await i.deferUpdate();

      const chosenOption = i.customId;

      if (chosenOption === 'random') {
        resolve('random'); // Special value to indicate "random" selection
      } else {
        resolve(chosenOption); // Resolve with the actual category ID
      }
      collector.stop();
    });
  });
}
