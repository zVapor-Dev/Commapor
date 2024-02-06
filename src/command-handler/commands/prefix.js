const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  description: 'Sets the prefix for this server',

  minArgs: 1,
  syntaxError: 'Correct syntax: {PREFIX}prefix {ARGS}',
  expectedArgs: '<prefix>',

  type: 'BOTH',
  testOnly: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.Administrator],

  callback: ({ instance, guild, text: prefix }) => {
    instance.commandHandler.prefixHandler.set(guild.id, prefix)

    return `Set "${prefix}" as the command prefix for this server.`
  },
}
