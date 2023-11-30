const CommandHandler = require("./command-handler/CommandHandler");

class Commapor {
  constructor({ client, commandsDir }) {
    if (!client) throw new Error("Client is a required parameter.");

    if (commandsDir) {
      new CommandHandler(commandsDir, client);
    }
  }
}

module.exports = Commapor;
