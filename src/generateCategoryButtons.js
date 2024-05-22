const shuffleArray = require("./shuffleArray");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const constants = require("./constants");

// Function generates 3 Category buttons, shuffled from the allCategories container.
module.exports = async function generateCategoryButtons(interaction) {
  let randomCategories = shuffleArray(constants.allCategories).slice(0, 3);
  const row = new ActionRowBuilder();

  randomCategories.forEach((category) => {
    row.addComponents(
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
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("random") // A special ID for "random"
      .setLabel("Surprise me!")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: `Select a category to get started, ${interaction.user.username}!`,
    components: [row],
  });

  // Collect button click
  const collector = interaction.channel.createMessageComponentCollector();

  const finalSassyMessageIndex = constants.sassyMessages.length - 1;
  let clickCount = 0;

  return new Promise((resolve) => {
    collector.on("collect", async (i) => {
      const filter = (i) => i.user.id === interaction.user.id;
      if (!filter(i)) {
        const messageIndex =
          clickCount <= finalSassyMessageIndex
            ? clickCount
            : finalSassyMessageIndex;
        i.reply({
          content: constants.sassyMessages[messageIndex],
          ephemeral: true,
        });
        clickCount++;
        return;
      }

      try {
        await i.deferUpdate();
      } catch (err) {
        console.error("Failed to defer interaction:", err);
      }
      const chosenOption = i.customId;
      if (chosenOption === "random") {
        resolve("random"); // Special value to indicate "random" selection
      } else {
        resolve(chosenOption); // Resolve with the actual category ID
      }
      collector.stop();
    });
  });
};
