module.exports = (command, usage) => {
  const { guildOnly, testOnly } = command.commandObject;

  const { guild, message, interaction } = usage;

  if (testOnly === true && guildOnly === true) {
    const text =
      "You cannot have a command that is both test only and guild only";

    if (message) message.reply(text);
    else if (interaction) interaction.reply({ content: text });

    return false;
  }

  if (guildOnly === true && !guild) {
    const text = "This command is only available in servers";

    if (message) message.reply(text);
    else if (interaction) interaction.reply({ content: text });

    return false;
  }

  return true;
};
