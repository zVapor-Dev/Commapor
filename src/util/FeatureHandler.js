const path = require('path')

const getAllFiles = require('./get-all-files')
const { safeRequire } = require('./safe-path')

class FeatureHandler {
  constructor(instance, featuresDir, client) {
    this._featuresRoot = path.resolve(featuresDir)
    this.readFiles(instance, this._featuresRoot, client)
  }

  async readFiles(instance, featuresDir, client) {
    const files = getAllFiles(featuresDir, false, this._featuresRoot)

    for (const file of files) {
      const func = safeRequire(file, this._featuresRoot)
      if (func instanceof Function) {
        await func(instance, client)
      }
    }
  }
}

module.exports = FeatureHandler
