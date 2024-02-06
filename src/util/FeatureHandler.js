const getAllFiles = require('./get-all-files')

class FeatureHandler {
  constructor(instance, featuresDir, client) {
    this.readFiles(instance, featuresDir, client)
  }

  async readFiles(instance, featuresDir, client) {
    const files = getAllFiles(featuresDir)

    for (const file of files) {
      const func = require(file)
      if (func instanceof Function) {
        await func(instance, client)
      }
    }
  }
}

module.exports = FeatureHandler
