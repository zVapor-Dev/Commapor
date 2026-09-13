const fs = require('fs')
const path = require('path')

const { isJavaScriptFile, resolveContainedPath } = require('./safe-path')

const getAllFiles = (dirPath, foldersOnly = false, allowedRoot = dirPath) => {
  const safeDir = resolveContainedPath(dirPath, allowedRoot)

  const files = fs.readdirSync(safeDir, {
    withFileTypes: true,
  })
  let filesFound = []

  for (const file of files) {
    const fileName = path.join(safeDir, file.name)

    if (file.isDirectory()) {
      if (foldersOnly) {
        filesFound.push(fileName)
      } else {
        filesFound = [
          ...filesFound,
          ...getAllFiles(fileName, false, allowedRoot),
        ]
      }
      continue
    }

    if (!foldersOnly && isJavaScriptFile(fileName)) {
      filesFound.push(fileName)
    }
  }

  return filesFound
}

module.exports = getAllFiles
