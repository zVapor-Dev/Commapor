const path = require("path");
const chalk = require("chalk");
const { Client, CommandInteraction, Message } = require("discord.js");

const getAllFiles = require("../util/get-all-files");
const Command = require("./Command");
const SlashCommands = require("./SlashCommands");
const { cooldownTypes } = require("../util/Cooldowns");

class CommandHandler {
  // <commandName, instance of the Command class>
  _commands = new Map();
  _validations = this.getValidations("run-time");
  _prefix = "!";

  /**
   *
   * @param {*} instance
   * @param {*} commandsDir
   * @param {Client} client
   */
  constructor(instance, commandsDir, client) {
    this._instance = instance;
    this._commandsDir = commandsDir;
    this._slashCommands = new SlashCommands(client);
    this._client = client;

    this.readFiles();
    this.messageListener(client);
    this.interactionListener(client);
  }

  async readFiles() {
    const files = getAllFiles(this._commandsDir);
    const validations = this.getValidations("syntax");

    for (let file of files) {
      const commandObject = require(file);

      let commandName = file.split(/[/\\]/);
      commandName = commandName.pop();
      commandName = commandName.split(".")[0];

      const command = new Command(this._instance, commandName, commandObject);

      const {
        description,
        type,
        testOnly,
        delete: del,
        aliases = [],
        init = () => {},
      } = commandObject;

      if (del) {
        if (type === "SLASH" || type === "BOTH") {
          if (testOnly) {
            for (const guildId of this._instance.testServers) {
              this._slashCommands.delete(command.commandName, guildId);
            }
          } else {
            this._slashCommands.delete(command.commandName);
          }
        }

        return;
      }

      for (const validation of validations) {
        validation(command);
      }

      await init(this._client, this._instance);

      const names = [command.commandName, ...aliases];

      for (const name of names) {
        this._commands.set(name, command);
        console.log(
          chalk`{red [Commapor]} {green Loaded command/alias} {cyan ${name}}`
        );
      }

      if (type === "SLASH" || type === "BOTH") {
        const options =
          commandObject.options ||
          this._slashCommands.createOptions(commandObject);

        if (testOnly) {
          for (const guildId of this._instance.testServers) {
            this._slashCommands.create(
              command.commandName,
              description,
              options,
              guildId
            );
          }
        } else {
          this._slashCommands.create(command.commandName, description, options);
        }
      }
    }
  }
  /**
   *
   * @param {Command} command
   * @param {*} args
   * @param {Message} message
   * @param {CommandInteraction} interaction
   * @returns
   */
  async runCommand(command, args, message, interaction) {
    const { callback, type, cooldowns } = command.commandObject;

    if (message && type === "SLASH") {
      return;
    }

    const guild = message ? message.guild : interaction.guild;
    const member = message ? message.member : interaction.member;
    const user = message ? message.author : interaction.user;

    const usage = {
      message,
      interaction,
      args,
      text: args.join(" "),
      guild,
      member,
      user,
    };

    for (const validation of this._validations) {
      if (!validation(command, usage, this._prefix)) {
        console.log("Validation failed");
        return;
      }
    }

    if (cooldowns) {
      let cooldownType;

      for (const type of cooldownTypes) {
        if (cooldowns[type]) {
          cooldownType = type;
          break;
        }
      }

      const cooldownUsage = {
        cooldownType,
        userId: user.id,
        actionId: `command_${command.commandName}`,
        guildId: guild?.id,
        duration: cooldowns[cooldownType],
        errorMessage: cooldowns.errorMessage,
      };

      const result = this._instance.cooldowns.canRunAction(cooldownUsage);

      if (typeof result === "string") {
        return result;
      }

      this._instance.cooldowns.start(cooldownUsage);
    }

    return await callback(usage);
  }
  /**
   *
   * @param {Client} client
   */
  messageListener(client) {
    client.on(
      "messageCreate",
      /**
       *
       * @param {Message} message
       * @returns
       */
      async (message) => {
        const { content } = message;

        if (!content.startsWith(this._prefix)) {
          return;
        }

        const args = content.split(/\s+/);
        const commandName = args
          .shift()
          .substring(this._prefix.length)
          .toLowerCase();

        const command = this._commands.get(commandName);
        if (!command) {
          return;
        }

        const { reply, deferReply } = command.commandObject;

        if (deferReply) {
          message.channel.sendTyping().catch(() => {});
        }

        const response = await this.runCommand(command, args, message).catch(
          (err) => console.log(err)
        );
        if (!response) {
          return;
        }

        if (reply) {
          message.reply(response).catch(() => {});
        } else {
          message.channel.send(response).catch(() => {});
        }
      }
    );
  }
  /**
   *
   * @param {Client} client
   */
  interactionListener(client) {
    client.on(
      "interactionCreate",
      /**
       *
       * @param {CommandInteraction} interaction
       * @returns
       */
      async (interaction) => {
        if (!interaction.isCommand()) {
          return;
        }

        const args = interaction.options.data.map(({ value }) => {
          return String(value);
        });

        const command = this._commands.get(interaction.commandName);
        if (!command) {
          return;
        }

        const { deferReply } = command.commandObject;

        if (deferReply) {
          await interaction.deferReply({
            ephemeral: deferReply === "ephemeral",
          });
        }

        const response = await this.runCommand(
          command,
          args,
          null,
          interaction
        );
        if (!response) {
          return;
        }

        if (deferReply) {
          interaction.editReply(response).catch(() => {});
        } else {
          interaction.reply(response).catch(() => {});
        }
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
