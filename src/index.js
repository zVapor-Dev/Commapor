const mongoose = require("mongoose");
const chalk = require("chalk");
const CommandHandler = require("./command-handler/CommandHandler");

class Commapor {
  constructor({ client, mongoUri, commandsDir }) {
    if (!client) throw new Error("Client is a required parameter.");

    if (mongoUri) {
      this.connectToMongo(mongoUri);
    }

    if (commandsDir) {
      new CommandHandler(commandsDir, client);
    }
  }

  connectToMongo(mongoUri) {
    mongoose.connection.on("connected", () => {
      console.log(chalk`{red [Commapor]} {green Connected to MongoDB}`);
    });
    mongoose.connect(mongoUri);
  }
}

module.exports = Commapor;
