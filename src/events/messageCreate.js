const { handleRemind } = require('../commands/remind');
const { handleMyReminders } = require('../commands/myreminders');
const { findTimeBoundary } = require('../timeParser');

const PREFIXES = ['!remindme', '!remind'];

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    const lower = content.toLowerCase();

    if (lower === '!myreminders' || lower === '!reminders') {
      await handleMyReminders({
        userId: message.author.id,
        replyFn: (opts) => message.reply(opts),
      });
      return;
    }

    let matchedPrefix = null;
    for (const prefix of PREFIXES) {
      if (lower.startsWith(prefix + ' ') || lower === prefix) {
        matchedPrefix = prefix;
        break;
      }
    }

    if (!matchedPrefix) return;

    const argsString = content.slice(matchedPrefix.length).trim();
    if (!argsString) {
      await message.reply('Usage: `!remindme <time> <message>`\nExamples: `!remindme 1d check stuff`, `!remind 2h30m start event`');
      return;
    }

    const tokens = argsString.split(/\s+/);
    const timeBoundary = findTimeBoundary(tokens);

    if (timeBoundary === 0) {
      await message.reply('Can\'t parse a time from your message! Try formats like `1d`, `2h30m`, `34 hours`, `1 week`.');
      return;
    }

    const timeString = tokens.slice(0, timeBoundary).join(' ');
    const reminderText = tokens.slice(timeBoundary).join(' ');

    await handleRemind({
      client,
      guildId: message.guild.id,
      channelId: message.channel.id,
      userId: message.author.id,
      timeString,
      reminderText,
      replyFn: (opts) => message.reply(opts),
    });
  },
};
