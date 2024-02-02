module.exports = (command) => {
  const { commandName, commandObject } = command;
  const { deferReply } = commandObject;

  if (
    deferReply &&
    typeof deferReply !== "boolean" &&
    deferReply !== "ephemeral"
  ) {
    throw new Error(
      `Command "${commandName}" does not valid value for "deferReply". Please use a boolean value or the string "ephemeral".`
    );
  }
};
