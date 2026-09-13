const customCommandSchema = require('../models/custom-command-schema')

const DEFAULT_ALLOWED_MENTIONS = {
  parse: [],
}

class CustomCommands {
  // guildId-commandName: response
  _customCommands = new Map()

  constructor(commandHandler) {
    this._commandHandler = commandHandler
    this.loadCommands()
  }

  async loadCommands() {
    const results = await customCommandSchema.find({})

    for (const result of results) {
      const { _id, response } = result
      this._customCommands.set(_id, response)
    }
  }

  async create(guildId, commandName, description, response) {
    const _id = `${guildId}-${commandName}`

    this._customCommands.set(_id, response)

    this._commandHandler.slashCommands.create(
      commandName,
      description,
      [],
      guildId
    )

    await customCommandSchema.findOneAndUpdate(
      {
        _id,
      },
      {
        _id,
        response,
      },
      {
        upsert: true,
      }
    )
  }

  async delete(guildId, commandName) {
    const _id = `${guildId}-${commandName}`

    this._customCommands.delete(_id)

    this._commandHandler.slashCommands.delete(commandName, guildId)

    await customCommandSchema.deleteOne({ _id })
  }

  formatResponse(response) {
    if (typeof response === 'string') {
      return {
        content: response,
        allowedMentions: DEFAULT_ALLOWED_MENTIONS,
      }
    }

    return {
      ...response,
      allowedMentions: {
        ...DEFAULT_ALLOWED_MENTIONS,
        ...response.allowedMentions,
        parse: response.allowedMentions?.parse ?? [],
      },
    }
  }

  async run(commandName, message, interaction) {
    const guild = message ? message.guild : interaction.guild
    if (!guild) {
      return
    }

    const _id = `${guild.id}-${commandName}`
    const response = this._customCommands.get(_id)
    if (!response) {
      return
    }

    const usage = {
      guild,
      member: message ? message.member : interaction.member,
      user: message ? message.author : interaction.user,
      channel: message ? message.channel : interaction.channel,
      message,
      interaction,
    }

    const allowed = await this._commandHandler.runCustomCommandValidations(
      commandName,
      usage
    )
    if (!allowed) {
      return
    }

    const payload = this.formatResponse(response)

    if (message) message.channel.send(payload).catch(() => {})
    else if (interaction) interaction.reply(payload).catch(() => {})
  }
}

module.exports = CustomCommands
