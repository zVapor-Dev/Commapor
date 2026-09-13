const { PermissionFlagsBits } = require('discord.js')

const PERMISSION_KEYS = Object.keys(PermissionFlagsBits)
const SNOWFLAKE_PATTERN = /^\d{17,20}$/

const isValidPermission = (permission) => {
  if (typeof permission !== 'string') {
    return false
  }

  return PERMISSION_KEYS.some(
    (key) =>
      key === permission ||
      PermissionFlagsBits[key] === permission ||
      String(PermissionFlagsBits[key]) === permission
  )
}

const sanitizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    return { valid: [], hasInvalid: true }
  }

  const valid = []
  let hasInvalid = false

  for (const permission of permissions) {
    if (isValidPermission(permission)) {
      valid.push(permission)
    } else {
      hasInvalid = true
    }
  }

  return { valid, hasInvalid }
}

const isValidSnowflake = (id) =>
  typeof id === 'string' && SNOWFLAKE_PATTERN.test(id)

const sanitizeRoleIds = (roleIds) => {
  if (!Array.isArray(roleIds)) {
    return { valid: [], hasInvalid: true }
  }

  const valid = []
  let hasInvalid = false

  for (const roleId of roleIds) {
    if (isValidSnowflake(roleId)) {
      valid.push(roleId)
    } else {
      hasInvalid = true
    }
  }

  return { valid, hasInvalid }
}

module.exports = {
  PERMISSION_KEYS,
  isValidPermission,
  sanitizePermissions,
  isValidSnowflake,
  sanitizeRoleIds,
}
