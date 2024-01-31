module.exports = (command) => {
  const { instance, commandName, commandObject } = command;

  if (commandObject.ownerOnly !== true || instance.botOwners.length) {
    return;
  }

  throw new Error(
    `Command "${commandName}" is owner-only but no owners were provided.`
  );
};
