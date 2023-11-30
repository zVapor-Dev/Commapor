class SlashCommands {
  constructor(client) {
    this._client = client;
  }

  async getCommands(guildId) {
    let commands;
    if (guildId) {
      const guild = await this._client.guilds.fetch(guildId);
      commands = await guild.commands;
    } else {
      commands = await this._client.application.commands;
    }

    await commands.fetch();
    return commands;
  }

  async create(name, description, options, guildId) {
    const commands = await this.getCommands(guildId);

    const existingCommand = commands.cache.find((cmd) => cmd.name === name);
    if (existingCommand) {
      // TODO: Update command
      console.log(`Ignoring command ${name} because it already exists`);
      return;
    }

    await commands.create({ name, description, options });
  }

  async delete(commandName, guildId) {
    const commands = await this.getCommands(guildId);

    const existingCommand = commands.cache.find(
      (cmd) => cmd.name === commandName
    );
    if (!existingCommand) {
      console.log(`Ignoring command ${commandName} because it does not exist`);
      return;
    }

    await existingCommand.delete();
  }
}

module.exports = SlashCommands;
