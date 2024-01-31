module.exports = (command, usage) => {
  const { instance, commandObject } = command;
  const { ownerOnly } = commandObject;
  const { botOwners } = instance;
  const { user, message, interaction } = usage;

  if (ownerOnly === true && !botOwners.includes(user.id)) {
    const text = "Only the bot owner can use this command";

    if (message) message.reply(text);
    else if (interaction) interaction.reply({ content: text });

    return false;
  }
};
