const db = require('./database');
const { formatDuration } = require('./timeParser');

// setTimeout max is 24.8 days (2^31 - 1 ms), for longer just chain lol
const MAX_TIMEOUT = 2_147_483_647;

const activeTimers = new Map();

async function fireReminder(client, reminder) {
  activeTimers.delete(reminder.id);
  db.markFired(reminder.id);

  const subscribers = db.getSubscribers(reminder.id);
  if (subscribers.length === 0) return;

  const mentions = subscribers.map(id => `<@${id}>`).join(' ');
  const elapsed = formatDuration(Date.now() - reminder.created_at);

  const channelMessage = [
    `Reminder! ${mentions}`,
    `> ${reminder.reminder_text}`,
    `_Set ${elapsed} ago by <@${reminder.creator_id}>_`,
  ].join('\n');

  try {
    const channel = await client.channels.fetch(reminder.channel_id);
    if (channel) {
      await channel.send(channelMessage);
    }
  } catch (err) {
    console.error(`Failed to send channel reminder for #${reminder.id}:`, err.message);
  }

  for (const userId of subscribers) {
    try {
      const user = await client.users.fetch(userId);
      await user.send([
        `**Reminder!**`,
        `> ${reminder.reminder_text}`,
        `_Set ${elapsed} ago in <#${reminder.channel_id}>_`,
      ].join('\n'));
    } catch (err) {
      console.error(`Failed to DM user ${userId} for reminder #${reminder.id}:`, err.message);
    }
  }
}

function scheduleReminder(client, reminder) {
  const delay = reminder.remind_at - Date.now();

  if (delay <= 0) {
    fireReminder(client, reminder);
    return;
  }

  const actualDelay = Math.min(delay, MAX_TIMEOUT);

  const timeoutId = setTimeout(() => {
    if (delay > MAX_TIMEOUT) {
      scheduleReminder(client, reminder);
    } else {
      fireReminder(client, reminder);
    }
  }, actualDelay);

  activeTimers.set(reminder.id, timeoutId);
}

function scheduleAll(client) {
  const pending = db.getPendingReminders();
  let restored = 0;
  let firedImmediately = 0;

  for (const reminder of pending) {
    if (reminder.remind_at <= Date.now()) {
      fireReminder(client, reminder);
      firedImmediately++;
    } else {
      scheduleReminder(client, reminder);
      restored++;
    }
  }

  console.log(`Restored ${restored} pending reminder(s), fired ${firedImmediately} overdue reminder(s).`);
}

function cancelReminder(reminderId) {
  const timeoutId = activeTimers.get(reminderId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeTimers.delete(reminderId);
  }
  db.markFired(reminderId);
}

module.exports = { scheduleReminder, scheduleAll, cancelReminder, fireReminder };
