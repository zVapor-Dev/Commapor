const { PermissionFlagsBits } = require('discord.js')
const requiredPermissions = require('../../../models/required-permissions-schema')
const { sanitizePermissions } = require('../../../util/discord-allowlists')

const keys = Object.keys(PermissionFlagsBits)

const denyMisconfigured = (message, interaction) => {
  const text =
    'This command has an invalid permission configuration. Contact a server administrator.'

  if (message) message.reply(text)
  else if (interaction) interaction.reply(text)
}

module.exports = async (command, usage) => {
  const { permissions = [] } = command.commandObject
  const { guild, member, message, interaction } = usage

  if (!member) {
    return true
  }

  const document = await requiredPermissions.findById(
    `${guild.id}-${command.commandName}`
  )

  if (document) {
    const { valid, hasInvalid } = sanitizePermissions(document.permissions)

    if (hasInvalid && !valid.length) {
      denyMisconfigured(message, interaction)
      return false
    }

    for (const permission of valid) {
      if (!permissions.includes(permission)) {
        permissions.push(permission)
      }
    }
  }

  if (permissions.length) {
    const missingPermissions = []

    for (const permission of permissions) {
      if (!member.permissions.has(permission)) {
        const permissionName = keys.find(
          (key) =>
            key === permission ||
            PermissionFlagsBits[key] === permission ||
            String(PermissionFlagsBits[key]) === permission
        )
        missingPermissions.push(permissionName)
      }
    }

    if (missingPermissions.length) {
      const text = `You are missing the following permissions: "${missingPermissions.join(
        '", "'
      )}"`

      if (message) message.reply(text)
      else if (interaction) interaction.reply(text)

      return false
    }
  }

  return true
}
