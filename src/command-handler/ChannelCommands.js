const channelCommands = require('../models/channel-commands-schema')

class ChannelCommands {
  // `${guildId}-${commandName}`: [channelIds]
  _channelCommands = new Map()

  async action(action, guildId, commandName, channelId) {
    const _id = `${guildId}-${commandName}`

    const result = await channelCommands.findOneAndUpdate(
      {
        _id,
      },
      {
        _id,
        [action === 'add' ? '$addToSet' : '$pull']: {
          channels: channelId,
        },
      },
      {
        upsert: true,
        new: true,
      }
    )

    this._channelCommands.set(_id, result.channels)
    return result.channels
  }

  async add(guildId, commandName, channelId) {
    return await this.action('add', guildId, commandName, channelId)
  }

  async remove(guildId, commandName, channelId) {
    return await this.action('remove', guildId, commandName, channelId)
  }

  async getAvailableChannels(guildId, commandName) {
    const _id = `${guildId}-${commandName}`
    let channels = this._channelCommands.get(_id)

    if (!channels) {
      const results = await channelCommands.findById(_id)
      channels = results ? results.channels : []
      this._channelCommands.set(_id, channels)
    }

    return channels
  }
}

module.exports = ChannelCommands
