const {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} = require('discord.js')
const requiredPermissions = require('../../models/required-permissions-schema')

const clearAllPermissions = 'Clear All Permissions'

module.exports = {
  description: 'Sets what commands require what permissions',

  type: 'SLASH',
  testOnly: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.Administrator],

  options: [
    {
      name: 'command',
      description: 'The command to set permissions to',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: 'permission',
      description: 'The permission to set for the command',
      type: ApplicationCommandOptionType.String,
      required: false,
      autocomplete: true,
    },
  ],

  autocomplete: (_, command, arg) => {
    if (arg === 'command') {
      return [...command.instance.commandHandler.commands.keys()]
    } else if (arg === 'permission') {
      return [clearAllPermissions, ...Object.keys(PermissionFlagsBits)]
    }
  },

  callback: async ({ instance, guild, args }) => {
    const [commandName, permission] = args

    const command = instance.commandHandler.commands.get(commandName)
    if (!command) {
      return `The command "${commandName}" does not exist.`
    }

    const _id = `${guild.id}-${command.commandName}`

    if (!permission) {
      const document = await requiredPermissions.findById(_id)

      const permissions =
        document && document.permissions?.length
          ? document.permissions.join(', ')
          : 'None.'

      return `Here are the permissions for "${commandName}": ${permissions}`
    }

    if (permission === clearAllPermissions) {
      await requiredPermissions.deleteOne({ _id })

      return `The command "${commandName}" no longer requires any permissions.`
    }

    const alreadyExists = await requiredPermissions.findOne({
      _id,
      permissions: {
        $in: [permission],
      },
    })

    if (alreadyExists) {
      await requiredPermissions.findOneAndUpdate(
        {
          _id,
        },
        {
          _id,
          $pull: {
            permissions: permission,
          },
        }
      )

      return `The command "${commandName}" no longer requires the permission "${permission}"`
    }

    await requiredPermissions.findOneAndUpdate(
      {
        _id,
      },
      {
        _id,
        $addToSet: {
          permissions: permission,
        },
      },
      {
        upsert: true,
      }
    )

    return `The command "${commandName}" now requires the permission "${permission}"`
  },
}
