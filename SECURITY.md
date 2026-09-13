# Security

This document describes trust boundaries and security-relevant behavior in Commapor.

## Trust boundaries

### MongoDB

Commapor stores guild configuration in MongoDB, including:

- Required permissions and roles per command
- Disabled commands
- Channel restrictions
- Custom command responses
- Prefixes and cooldowns

**Anyone with write access to the MongoDB database can change bot behavior**, including relaxing or tightening command restrictions. Commapor validates stored permission names against Discord `PermissionFlagsBits` and role IDs against snowflake format before enforcing them. Malformed documents fail closed (the command is denied) rather than being treated as unrestricted.

Deleting a configuration document removes that restriction. For example, deleting a required-roles document means the command no longer requires roles. Restrict MongoDB credentials, network access, and backups accordingly.

### Command, event, feature, and validation directories

Commapor dynamically loads JavaScript modules from configured directories:

- `commandsDir`
- `featuresDir`
- `events.dir`
- `validations.syntax` and `validations.runtime`

Only `*.js` files are loaded. Paths are resolved with `path.resolve` and checked with `realpath` so symlinks or `..` segments cannot escape the configured root directory.

Treat these directories as **trusted code**, equivalent to application source. Do not point them at world-writable or untrusted paths.

## Custom commands

Custom commands are stored in MongoDB and are **not** full Commapor command modules. They intentionally skip syntax validation, owner-only checks, permission/role requirements defined on built-in commands, and cooldown configuration.

Custom commands still run a reduced runtime validation set:

- Guild-only
- Disabled-command checks
- Channel restrictions

Custom command responses default to `allowedMentions: { parse: [] }` to avoid unintended mass mentions.

## Admin configuration commands

Built-in configuration commands (`prefix`, `togglecommand`, `requiredpermissions`, `requiredroles`, `channelcommand`, `customcommand`, `delcustomcmd`) require the Discord **Administrator** permission unless overridden in the command module.

## Reporting issues

Please report security issues privately to the maintainer listed in [README.md](README.md).
