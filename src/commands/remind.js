const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const { parseTime } = require('../timeParser');
const { scheduleReminder, REACT_EMOJI } = require('../reminderManager');

async function handleRemind({ client, guildId, channelId, userId, timeString, reminderText, replyFn }) {
  // val stuff :D
  const parsed = parseTime(timeString);
  if (!parsed) {
    await replyFn({
      content: 'Can\'t parse that time. Try formats like `1d`, `2h30m`, `34 hours`, `1 week 2 days`. :D',
      ephemeral: true,
    });
    return;
  }

  if (!reminderText || reminderText.trim().length === 0) {
    await replyFn({
      content: 'You forgot to provide a reminder message! Example: `!remindme 1d check the laundry`',
      ephemeral: true,
    });
    return;
  }

  const remindAt = Date.now() + parsed.ms;
  const fireDate = new Date(remindAt);

  const reminder = db.createReminder({
    guildId,
    channelId,
    creatorId: userId,
    reminderText: reminderText.trim(),
    remindAt,
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Reminder Set')
    .setDescription(reminder.reminder_text)
    .addFields(
      { name: 'Fires in', value: parsed.humanReadable, inline: true },
      { name: 'At', value: `<t:${Math.floor(remindAt / 1000)}:F>`, inline: true },
    )
    .setFooter({ text: `React to get reminded too | ID: ${reminder.id}` })
    .setTimestamp(fireDate);

  const sent = await replyFn({ embeds: [embed], fetchReply: true });

  const messageId = sent.id || sent.id;
  db.setMessageId(reminder.id, messageId);

  try {
    await sent.react(REACT_EMOJI);
  } catch (err) {
    console.error('Failed to react to own message:', err.message);
  }

  scheduleReminder(client, { ...reminder, message_id: messageId });
}

module.exports = { handleRemind };
