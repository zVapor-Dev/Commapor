const { test, describe } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const getAllFiles = require('../src/util/get-all-files')
const {
  isJavaScriptFile,
  resolveContainedPath,
} = require('../src/util/safe-path')
const {
  isValidPermission,
  sanitizePermissions,
  isValidSnowflake,
  sanitizeRoleIds,
} = require('../src/util/discord-allowlists')
const { PermissionFlagsBits } = require('discord.js')

describe('safe-path', () => {
  test('isJavaScriptFile accepts only .js files', () => {
    assert.equal(isJavaScriptFile('/tmp/command.js'), true)
    assert.equal(isJavaScriptFile('/tmp/command.json'), false)
  })

  test('resolveContainedPath rejects paths outside the root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commapor-root-'))
    const inside = path.join(root, 'inside.js')
    fs.writeFileSync(inside, 'module.exports = {}')

    assert.equal(resolveContainedPath(inside, root), fs.realpathSync(inside))

    const outside = path.join(os.tmpdir(), 'commapor-outside.js')
    fs.writeFileSync(outside, 'module.exports = {}')

    assert.throws(() => resolveContainedPath(outside, root))
  })
})

describe('get-all-files', () => {
  test('returns only .js files using path.join semantics', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commapor-files-'))
    fs.writeFileSync(path.join(root, 'a.js'), 'module.exports = {}')
    fs.writeFileSync(path.join(root, 'b.txt'), 'not js')
    fs.mkdirSync(path.join(root, 'nested'))
    fs.writeFileSync(path.join(root, 'nested', 'c.js'), 'module.exports = {}')

    const files = getAllFiles(root, false, root).sort()
    assert.deepEqual(
      files.map((file) => path.basename(file)).sort(),
      ['a.js', 'c.js']
    )
  })
})

describe('discord-allowlists', () => {
  test('validates permissions and snowflakes', () => {
    assert.equal(isValidPermission('Administrator'), true)
    assert.equal(isValidPermission('NotARealPermission'), false)
    assert.equal(isValidSnowflake('123456789012345678'), true)
    assert.equal(isValidSnowflake('abc'), false)
  })

  test('sanitizePermissions fails closed on malformed arrays', () => {
    const result = sanitizePermissions(['Administrator', 'FakePermission'])
    assert.deepEqual(result.valid, ['Administrator'])
    assert.equal(result.hasInvalid, true)
  })

  test('sanitizeRoleIds rejects invalid role ids', () => {
    const result = sanitizeRoleIds(['123456789012345678', 'bad'])
    assert.deepEqual(result.valid, ['123456789012345678'])
    assert.equal(result.hasInvalid, true)
    assert.equal(sanitizeRoleIds('not-an-array').valid.length, 0)
  })

  test('accepts PermissionFlagsBits values', () => {
    assert.equal(isValidPermission(String(PermissionFlagsBits.Administrator)), true)
  })
})
