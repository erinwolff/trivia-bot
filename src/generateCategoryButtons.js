const shuffleArray = require("./shuffleArray");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const constants = require("./constants");

// Function generates 3 Category buttons, shuffled from the allCategories container.
module.exports = async function generateCategoryButtons(interaction) {
  let randomCategories = shuffleArray(constants.allCategories).slice(0, 3);
  const row = new ActionRowBuilder();
  const finalSassyMessageIndex = constants.sassyMessages.length - 1;
  let clickCount = 0;

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
  const collector = await interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 150_000,
    filter: (i) => {
      if (!interaction.user || i.user.id !== interaction.user.id) {
        console.log("user mismatch at category button click");
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
    },
  });

  return new Promise((resolve) => {
    collector.on("collect", async (i) => {
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
