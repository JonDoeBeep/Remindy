const db = require('../database');
const { REACT_EMOJI } = require('../reminderManager');

module.exports = {
  name: 'messageReactionAdd',
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

    db.addSubscriber(reminder.id, user.id);
    console.log(`User ${user.tag} subscribed to reminder #${reminder.id}`);
  },
};
