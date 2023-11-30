const mongoose = require("mongoose");
const chalk = require("chalk");
const CommandHandler = require("./command-handler/CommandHandler");

class Commapor {
  constructor({ client, mongoUri, commandsDir, testServers = [] }) {
    if (!client) throw new Error("Client is a required parameter.");

    this._testServers = testServers;

    if (mongoUri) {
      this.connectToMongo(mongoUri);
    }

    if (commandsDir) {
      new CommandHandler(this, commandsDir, client);
    }
  }

  get testServers() {
    return this._testServers;
  }

  connectToMongo(mongoUri) {
    mongoose.connection.on("connected", () => {
      console.log(chalk`{red [Commapor]} {green Connected to MongoDB}`);
    });
    mongoose.connect(mongoUri);
  }
}

module.exports = Commapor;
