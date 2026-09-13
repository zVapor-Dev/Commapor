const requiredRoles = require('../../../models/required-roles-schema')
const { sanitizeRoleIds } = require('../../../util/discord-allowlists')

const denyMisconfigured = (message, interaction) => {
  const text =
    'This command has an invalid role configuration. Contact a server administrator.'

  if (message) message.reply(text)
  else if (interaction) interaction.reply(text)
}

module.exports = async (command, usage) => {
  const { guild, member, message, interaction } = usage

  if (!member) {
    return true
  }

  const _id = `${guild.id}-${command.commandName}`
  const document = await requiredRoles.findById(_id)

  if (document) {
    const { valid } = sanitizeRoleIds(document.roles)

    if (!valid.length) {
      denyMisconfigured(message, interaction)
      return false
    }

    for (const roleId of valid) {
      if (member.roles.cache.has(roleId)) {
        return true
      }
    }

    const reply = {
      content: `You need one of these roles: ${valid.map(
        (roleId) => `<@&${roleId}>`
      )}`,
      allowedMentions: {
        parse: [],
        roles: [],
      },
    }

    if (message) message.reply(reply)
    else if (interaction) interaction.reply(reply)

    return false
  }

  return true
}
