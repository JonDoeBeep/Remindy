const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const { formatDuration } = require('../timeParser');

async function handleMyReminders({ userId, replyFn }) {
  const reminders = db.getUserReminders(userId);

  if (reminders.length === 0) {
    await replyFn({
      content: 'You have no pending reminders :)',
      ephemeral: true,
    });
    return;
  }

  const lines = reminders.map((r, i) => {
    const firesIn = formatDuration(r.remind_at - Date.now());
    const isCreator = r.creator_id === userId;
    const origin = isCreator ? 'you created' : `subscribed via reaction`;
    return `**${i + 1}.** ${r.reminder_text}\n   Fires <t:${Math.floor(r.remind_at / 1000)}:R>, _${origin}_ at <#${r.channel_id}>`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`Your Pending Reminders`)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `${reminders.length} reminder(s)` })
    .setTimestamp();

  await replyFn({ embeds: [embed], ephemeral: true });
}

module.exports = { handleMyReminders };
