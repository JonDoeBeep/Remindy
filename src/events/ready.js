const { scheduleAll } = require('../reminderManager');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);

    scheduleAll(client);
  },
};
