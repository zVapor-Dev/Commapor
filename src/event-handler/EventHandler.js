const { InteractionType } = require('discord.js')
const path = require('path')

const getAllFiles = require('../util/get-all-files')
const { safeRequire } = require('../util/safe-path')

const DEFAULT_EVENTS_ROOT = path.join(__dirname, 'events')

class EventHandler {
  // <eventName, array of [function, dynamic validation functions]>
  _eventCallbacks = new Map()

  constructor(instance, events, client) {
    this._instance = instance
    this._eventsDir = events?.dir ? path.resolve(events.dir) : null
    this._eventsRoot = this._eventsDir
    this._client = client

    delete events.dir
    this._events = events

    this._builtInEvents = {
      interactionCreate: {
        isButton: (interaction) => interaction.isButton(),
        isCommand: (interaction) =>
          interaction.type === InteractionType.ApplicationCommand ||
          interaction.type === InteractionType.ApplicationCommandAutocomplete,
      },
      messageCreate: {
        isHuman: (message) => !message.author.bot,
      },
    }

    this.readFiles()
    this.registerEvents()
  }

  async readFiles() {
    const defaultEvents = getAllFiles(DEFAULT_EVENTS_ROOT, true, DEFAULT_EVENTS_ROOT)
    const folders = this._eventsDir
      ? getAllFiles(this._eventsDir, true, this._eventsRoot)
      : []

    for (const folderPath of [...defaultEvents, ...folders]) {
      const event = path.basename(folderPath)
      const allowedRoot = folderPath.startsWith(DEFAULT_EVENTS_ROOT)
        ? DEFAULT_EVENTS_ROOT
        : this._eventsRoot
      const files = getAllFiles(folderPath, false, allowedRoot)

      const functions = this._eventCallbacks.get(event) || []

      for (const file of files) {
        const isBuiltIn = !this._eventsDir || !folderPath.startsWith(this._eventsDir)
        const func = safeRequire(file, allowedRoot)
        const result = [func]

        const split = file.split(event)[1].split(/[\/\\]/g)
        const methodName = split[split.length - 2]

        if (
          isBuiltIn &&
          this._builtInEvents[event] &&
          this._builtInEvents[event][methodName]
        ) {
          result.push(this._builtInEvents[event][methodName])
        } else if (this._events[event] && this._events[event][methodName]) {
          result.push(this._events[event][methodName])
        }

        functions.push(result)
      }

      this._eventCallbacks.set(event, functions)
    }
  }

  registerEvents() {
    const instance = this._instance

    for (const eventName of this._eventCallbacks.keys()) {
      const functions = this._eventCallbacks.get(eventName)

      this._client.on(eventName, async function () {
        for (const [func, dynamicValidation] of functions) {
          if (dynamicValidation && !(await dynamicValidation(...arguments))) {
            continue
          }

          func(...arguments, instance)
        }
      })
    }
  }
}

module.exports = EventHandler
