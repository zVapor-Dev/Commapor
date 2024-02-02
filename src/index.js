const mongoose = require("mongoose");
const chalk = require("chalk");
const CommandHandler = require("./command-handler/CommandHandler");
const Cooldowns = require("./util/Cooldowns");

class Commapor {
  constructor({
    client,
    mongoUri,
    commandsDir,
    testServers = [],
    botOwners = [],
    cooldownConfig = {},
  }) {
    if (!client) throw new Error("Client is a required parameter.");

    this._testServers = testServers;
    this._botOwners = botOwners;
    this._cooldowns = new Cooldowns({
      instance: this,
      ...cooldownConfig,
    });

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

  get botOwners() {
    return this._botOwners;
  }

  get cooldowns() {
    return this._cooldowns;
  }

  connectToMongo(mongoUri) {
    mongoose.connection.on("connected", () => {
      console.log(chalk`{red [Commapor]} {green Connected to MongoDB}`);
    });
    mongoose.connect(mongoUri);
  }
}

module.exports = Commapor;
