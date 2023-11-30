const path = require("path");
const getAllFiles = require("../util/get-all-files");
const { Client, Events, Message } = require("discord.js");
const Command = require("./Command");

class CommandHandler {
  // <commandName, instance of the command class>
  commands = new Map();

  constructor(commandsDir, client) {
    this.commandsDir = commandsDir;
    this.readFiles();
    this.messageListener(client);
  }

  readFiles() {
    const files = getAllFiles(this.commandsDir);
    const validations = this.getValidations("syntax");

    for (const file of files) {
      const commandObject = require(file);

      let commandName = file.split(/[/\\]/);
      commandName = commandName.pop();
      commandName = commandName.split(".")[0];

      const command = new Command(commandName, commandObject);

      for (const validation of validations) {
        validation(command);
      }

      this.commands.set(command.commandName, command);
    }
  }

  /**
   *
   * @param {Client} client
   */
  messageListener(client) {
    const validations = this.getValidations("run-time");
    const prefix = "!";

    client.on(
      Events.MessageCreate,
      /**
       *
       * @param {Message} message
       */
      (message) => {
        const { content } = message;

        if (!content.startsWith(prefix)) return;

        const args = content.split(/\s+/);
        const commandName = args.shift().substring(prefix.length).toLowerCase();

        const command = this.commands.get(commandName);
        if (!command) return;

        const usage = { message, args, text: args.join(" ") };

        for (const validation of validations) {
          if (!validation(command, usage, prefix)) {
            return;
          }
        }

        const { callback } = command.commandObject;
        callback(usage);
      }
    );
  }

  getValidations(folder) {
    const validations = getAllFiles(
      path.join(__dirname, `./validations/${folder}`)
    ).map((filePath) => require(filePath));

    return validations;
  }
}

module.exports = CommandHandler;
