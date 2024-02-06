const { Schema, model, models } = require('mongoose')

const channelCommandSchema = new Schema({
  // guildId-commandName
  _id: {
    type: String,
    required: true,
  },
  channels: {
    type: [String],
    required: true,
  },
})

const name = 'channel-commands'
module.exports = models[name] || model(name, channelCommandSchema)
