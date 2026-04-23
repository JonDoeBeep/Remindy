const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', 'reminders.db');
const db = new Database(DB_PATH);

// WAL is goat frfr no cap ong
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id      TEXT NOT NULL,
    channel_id    TEXT NOT NULL,
    message_id    TEXT,
    creator_id    TEXT NOT NULL,
    reminder_text TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    remind_at     INTEGER NOT NULL,
    fired         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reminder_subscribers (
    reminder_id   INTEGER NOT NULL,
    user_id       TEXT NOT NULL,
    PRIMARY KEY (reminder_id, user_id),
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reminders_message_id ON reminders(message_id);
  CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(fired, remind_at);
  CREATE INDEX IF NOT EXISTS idx_subscribers_user ON reminder_subscribers(user_id);
`);

const stmts = {
  insertReminder: db.prepare(`
    INSERT INTO reminders (guild_id, channel_id, creator_id, reminder_text, created_at, remind_at)
    VALUES (@guildId, @channelId, @creatorId, @reminderText, @createdAt, @remindAt)
  `),

  setMessageId: db.prepare(`
    UPDATE reminders SET message_id = @messageId WHERE id = @id
  `),

  addSubscriber: db.prepare(`
    INSERT OR IGNORE INTO reminder_subscribers (reminder_id, user_id) VALUES (@reminderId, @userId)
  `),

  removeSubscriber: db.prepare(`
    DELETE FROM reminder_subscribers WHERE reminder_id = @reminderId AND user_id = @userId
  `),

  getSubscribers: db.prepare(`
    SELECT user_id FROM reminder_subscribers WHERE reminder_id = @reminderId
  `),

  getReminderByMessageId: db.prepare(`
    SELECT * FROM reminders WHERE message_id = @messageId AND fired = 0
  `),

  getReminderById: db.prepare(`
    SELECT * FROM reminders WHERE id = @id
  `),

  getPendingReminders: db.prepare(`
    SELECT * FROM reminders WHERE fired = 0
  `),

  markFired: db.prepare(`
    UPDATE reminders SET fired = 1 WHERE id = @id
  `),

  getUserReminders: db.prepare(`
    SELECT r.* FROM reminders r
    INNER JOIN reminder_subscribers rs ON r.id = rs.reminder_id
    WHERE rs.user_id = @userId AND r.fired = 0
    ORDER BY r.remind_at ASC
  `),
};


function createReminder({ guildId, channelId, creatorId, reminderText, remindAt }) {
  const createdAt = Date.now();
  const info = stmts.insertReminder.run({ guildId, channelId, creatorId, reminderText, createdAt, remindAt });
  const reminder = stmts.getReminderById.get({ id: info.lastInsertRowid });
  stmts.addSubscriber.run({ reminderId: reminder.id, userId: creatorId });
  return reminder;
}

function setMessageId(id, messageId) {
  stmts.setMessageId.run({ id, messageId });
}

function addSubscriber(reminderId, userId) {
  stmts.addSubscriber.run({ reminderId, userId });
}

function removeSubscriber(reminderId, userId) {
  stmts.removeSubscriber.run({ reminderId, userId });
}

function getSubscribers(reminderId) {
  return stmts.getSubscribers.all({ reminderId }).map(row => row.user_id);
}

function getReminderByMessageId(messageId) {
  return stmts.getReminderByMessageId.get({ messageId });
}

function getPendingReminders() {
  return stmts.getPendingReminders.all();
}

function markFired(id) {
  stmts.markFired.run({ id });
}

function getUserReminders(userId) {
  return stmts.getUserReminders.all({ userId });
}

module.exports = {
  createReminder,
  setMessageId,
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  getReminderByMessageId,
  getPendingReminders,
  markFired,
  getUserReminders,
};
