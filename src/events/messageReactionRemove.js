const db = require('../database');
const { REACT_EMOJI } = require('../reminderManager');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(client, reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (err) {
        console.error('Failed to fetch partial reaction:', err.message);
        return;
      }
    }

    if (reaction.emoji.name !== REACT_EMOJI) return;

    const reminder = db.getReminderByMessageId(reaction.message.id);
    if (!reminder) return;

    if (user.id === reminder.creator_id) return;

    db.removeSubscriber(reminder.id, user.id);
    console.log(`User ${user.tag} unsubscribed from reminder #${reminder.id}`);
  },
};
