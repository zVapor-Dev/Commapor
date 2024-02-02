const chalk = require("chalk");

const cooldownDurations = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
  w: 60 * 60 * 24 * 7,
};

const cooldownTypes = ["perUser", "perUserPerGuild", "perGuild", "global"];

class Cooldowns {
  // perUser:
  // <`${userId}-${actionId}`: expires>
  // perUsePerGuild:
  // <`${userId}-${guildId}-${actionId}`: expires>
  // perGuild:
  // <`${guildId}-${actionId}`: expires>
  // global:
  // <action: expires>
  _cooldowns = new Map();

  constructor({
    instance,
    errorMessage = "Please wait {TIME} before doing that again.",
    botOwnersBypass = false,
    dbRequired = 300, // 5 minutes
  }) {
    this._instance = instance;
    this._errorMessage = errorMessage;
    this._botOwnersBypass = botOwnersBypass;
    this._dbRequired = dbRequired;

    // TODO: Load all of the cooldowns from the database
  }

  verifyCooldown(duration) {
    if (typeof duration === "number") {
      return duration;
    }

    const split = duration.split(" ");

    if (split.length !== 2) {
      throw new Error(
        `Duration "${duration}" is an invalid duration. Please use "10 m", "15 s" etc.`
      );
    }

    const quantity = +split[0];
    const type = split[1].toLowerCase();

    if (!cooldownDurations[type]) {
      throw new Error(
        `Unknown duration type "${type}". Please use one of the following: ${Object.keys(
          cooldownDurations
        )}`
      );
    }

    if (quantity <= 0) {
      throw new Error(
        `Invalid quantity of "${quantity}". Please use a value greater than 0.`
      );
    }

    return quantity * cooldownDurations[type];
  }

  getKey(cooldownType, userId, actionId, guildId) {
    const isPerUser = cooldownType === cooldownTypes[0];
    const isPerUserPerGuild = cooldownType === cooldownTypes[1];
    const isPerGuild = cooldownType === cooldownTypes[2];
    const isGlobal = cooldownType === cooldownTypes[3];

    if ((isPerUserPerGuild || isPerGuild) && !guildId) {
      throw new Error(
        chalk`{red [Commapor]} {green Invalid cooldown type "${cooldownType}". Action was used outside of a guild.}`
      );
    }

    if (isPerUser) {
      return `${userId}-${actionId}`;
    }

    if (isPerUserPerGuild) {
      return `${userId}-${guildId}-${actionId}`;
    }

    if (isPerGuild) {
      return `${guildId}-${actionId}`;
    }

    if (isGlobal) {
      return actionId;
    }
  }

  canBypass(userId) {
    return this._botOwnersBypass && this._instance.botOwners.includes(userId);
  }

  start({ cooldownType, userId, actionId, guildId = "", duration }) {
    if (this.canBypass(userId)) {
      return;
    }

    if (!cooldownTypes.includes(cooldownType)) {
      throw new Error(
        chalk`{red [Commapor]} {green Invalid cooldown type "${cooldownType}". Please use one of the following: ${cooldownTypes.join(
          ", "
        )}}`
      );
    }

    const seconds = this.verifyCooldown(duration);

    if (seconds >= this._dbRequired) {
      // TODO: Save the cooldown to the database
    }

    const key = this.getKey(cooldownType, userId, actionId, guildId);

    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + seconds);

    this._cooldowns.set(key, expires);

    console.log(this._cooldowns);
  }

  canRunAction({
    cooldownType,
    userId,
    actionId,
    guildId = "",
    errorMessage = this._errorMessage,
  }) {
    if (this.canBypass(userId)) {
      return true;
    }

    const key = this.getKey(cooldownType, userId, actionId, guildId);
    const expires = this._cooldowns.get(key);

    if (!expires) {
      return true;
    }

    const now = new Date();
    if (now > expires) {
      this._cooldowns.delete(key);
      return true;
    }

    const secondsDiff = (expires.getTime() - now.getTime()) / 1000;
    const w = Math.floor(secondsDiff / (60 * 60 * 24 * 7));
    const d = Math.floor(secondsDiff / (3600 * 24));
    const h = Math.floor((secondsDiff % (3600 * 24)) / 3600);
    const m = Math.floor((secondsDiff % 3600) / 60);
    const s = Math.floor(secondsDiff % 60);

    let time = "";
    if (w > 0) time += `${w}w `;
    if (d > 0) time += `${d}d `;
    if (h > 0) time += `${h}h `;
    if (m > 0) time += `${m}m `;
    time += `${s}s`;

    return errorMessage.replace("{TIME}", time);
  }
}

module.exports = Cooldowns;
module.exports.cooldownTypes = cooldownTypes;
