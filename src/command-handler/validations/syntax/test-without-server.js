module.exports = (command) => {
  const { instance, commandName, commandObject } = command;

  if (commandObject.testOnly !== true || instance.testServers.length) {
    return;
  }

  throw new Error(`Command "${commandName}" is test-only but no test servers were provided.`)
};
