const fs = require('fs')
const path = require('path')

const isJavaScriptFile = (filePath) =>
  path.extname(filePath).toLowerCase() === '.js'

const resolveContainedPath = (inputPath, allowedRoot) => {
  if (!inputPath || !allowedRoot) {
    throw new Error('Path and allowed root are required.')
  }

  const resolvedRoot = fs.realpathSync(path.resolve(allowedRoot))
  const resolvedPath = path.resolve(inputPath)
  const realPath = fs.realpathSync(resolvedPath)

  if (realPath !== resolvedRoot && !realPath.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Path escapes allowed root: ${inputPath}`)
  }

  return realPath
}

const safeRequire = (filePath, allowedRoot) => {
  const safePath = resolveContainedPath(filePath, allowedRoot)

  if (!isJavaScriptFile(safePath)) {
    throw new Error(`Only .js modules can be loaded: ${filePath}`)
  }

  return require(safePath)
}

module.exports = {
  isJavaScriptFile,
  resolveContainedPath,
  safeRequire,
}
