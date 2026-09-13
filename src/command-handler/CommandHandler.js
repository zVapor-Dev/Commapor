const path = require('path')

const getAllFiles = require('../util/get-all-files')
const { safeRequire } = require('../util/safe-path')
const Command = require('./Command')
const SlashCommands = require('./SlashCommands')
const { cooldownTypes } = require('../util/Cooldowns')
const ChannelCommands = require('./ChannelCommands')
const CustomCommands = require('./CustomCommands')
const DisabledCommands = require('./DisabledCommands')
const PrefixHandler = require('./PrefixHandler')

const DEFAULT_COMMANDS_ROOT = path.join(__dirname, 'commands')
const DEFAULT_VALIDATIONS_ROOT = path.join(__dirname, 'validations')

class CommandHandler {
  // <commandName, instance of the Command class>
  _commands = new Map()
  _validations = []
  _customCommandValidations = [
    require('./validations/runtime/guild-only'),
    require('./validations/runtime/disabled-commands'),
    require('./validations/runtime/channel-command'),
  ]
  _channelCommands = new ChannelCommands()
  _customCommands = new CustomCommands(this)
  _disabledCommands = new DisabledCommands()
  _prefixes = new PrefixHandler()

  constructor(instance, commandsDir, client) {
    this._instance = instance
    this._commandsDir = path.resolve(commandsDir)
    this._commandsRoot = this._commandsDir
    this._slashCommands = new SlashCommands(client)
    this._client = client

    this._validations = [
      ...this.getValidations(
        path.join(DEFAULT_VALIDATIONS_ROOT, 'runtime'),
        DEFAULT_VALIDATIONS_ROOT
      ),
      ...this.getValidations(
        instance.validations?.runtime,
        instance.validations?.runtime
      ),
    ]

    this.readFiles()
  }

  get commands() {
    return this._commands
  }

  get channelCommands() {
    return this._channelCommands
  }

  get slashCommands() {
    return this._slashCommands
  }

  get customCommands() {
    return this._customCommands
  }

  get disabledCommands() {
    return this._disabledCommands
  }

  get prefixHandler() {
    return this._prefixes
  }

  async readFiles() {
    const defaultCommands = getAllFiles(
      DEFAULT_COMMANDS_ROOT,
      false,
      DEFAULT_COMMANDS_ROOT
    )
    const files = getAllFiles(this._commandsDir, false, this._commandsRoot)
    const validations = [
      ...this.getValidations(
        path.join(DEFAULT_VALIDATIONS_ROOT, 'syntax'),
        DEFAULT_VALIDATIONS_ROOT
      ),
      ...this.getValidations(
        this._instance.validations?.syntax,
        this._instance.validations?.syntax
      ),
    ]

    for (const [file, allowedRoot] of [
      ...defaultCommands.map((file) => [file, DEFAULT_COMMANDS_ROOT]),
      ...files.map((file) => [file, this._commandsRoot]),
    ]) {
      await this.loadCommandFile(file, allowedRoot, validations)
    }
  }

  async loadCommandFile(file, allowedRoot, validations) {
    const commandObject = safeRequire(file, allowedRoot)
    const commandName = path.basename(file, path.extname(file))
    const command = new Command(this._instance, commandName, commandObject)

    const {
      description,
      type,
      testOnly,
      delete: del,
      aliases = [],
      init = () => {},
    } = commandObject

    if (
      del ||
      this._instance.disabledDefaultCommands.includes(commandName.toLowerCase())
    ) {
      if (type === 'SLASH' || type === 'BOTH') {
        if (testOnly) {
          for (const guildId of this._instance.testServers) {
            this._slashCommands.delete(command.commandName, guildId)
          }
        } else {
          this._slashCommands.delete(command.commandName)
        }
      }

      return
    }

    for (const validation of validations) {
      validation(command)
    }

    await init(this._client, this._instance)

    const names = [command.commandName, ...aliases]

    for (const name of names) {
      this._commands.set(name, command)
    }

    if (type === 'SLASH' || type === 'BOTH') {
      const options =
        commandObject.options || this._slashCommands.createOptions(commandObject)

      if (testOnly) {
        for (const guildId of this._instance.testServers) {
          this._slashCommands.create(
            command.commandName,
            description,
            options,
            guildId
          )
        }
      } else {
        this._slashCommands.create(command.commandName, description, options)
      }
    }
  }

  async runCustomCommandValidations(commandName, usage) {
    const pseudoCommand = {
      commandName: commandName.toLowerCase(),
      instance: this._instance,
      commandObject: {
        guildOnly: true,
      },
    }

    for (const validation of this._customCommandValidations) {
      if (!(await validation(pseudoCommand, usage))) {
        return false
      }
    }

    return true
  }

  async runCommand(command, args, message, interaction) {
    const { callback, type, cooldowns } = command.commandObject

    if (message && type === 'SLASH') {
      return
    }

    const guild = message ? message.guild : interaction.guild
    const member = message ? message.member : interaction.member
    const user = message ? message.author : interaction.user
    const channel = message ? message.channel : interaction.channel

    const usage = {
      instance: command.instance,
      message,
      interaction,
      args,
      text: args.join(' '),
      guild,
      member,
      user,
      channel,
    }

    for (const validation of this._validations) {
      if (!(await validation(command, usage, this._prefixes.get(guild?.id)))) {
        return
      }
    }

    if (cooldowns) {
      let cooldownType

      for (const type of cooldownTypes) {
        if (cooldowns[type]) {
          cooldownType = type
          break
        }
      }

      const cooldownUsage = {
        cooldownType,
        userId: user.id,
        actionId: `command_${command.commandName}`,
        guildId: guild?.id,
        duration: cooldowns[cooldownType],
        errorMessage: cooldowns.errorMessage,
      }

      const result = this._instance.cooldowns.canRunAction(cooldownUsage)

      if (typeof result === 'string') {
        return result
      }

      await this._instance.cooldowns.start(cooldownUsage)

      usage.cancelCooldown = () => {
        this._instance.cooldowns.cancelCooldown(cooldownUsage)
      }

      usage.updateCooldown = (expires) => {
        this._instance.cooldowns.updateCooldown(cooldownUsage, expires)
      }
    }

    return await callback(usage)
  }

  getValidations(folder, allowedRoot) {
    if (!folder) {
      return []
    }

    const root = allowedRoot || folder
    const validations = getAllFiles(folder, false, root).map((filePath) =>
      safeRequire(filePath, root)
    )

    return validations
  }
}

module.exports = CommandHandler
