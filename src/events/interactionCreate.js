const { MessageFlags } = require('discord.js');
const { handleRemind } = require('../commands/remind');
const { handleMyReminders } = require('../commands/myreminders');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(client, interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'remind') {
      const timeString = interaction.options.getString('time');
      const reminderText = interaction.options.getString('message');

      await handleRemind({
        client,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        timeString,
        reminderText,
        replyFn: (opts) => {
          if (opts.ephemeral) {
            delete opts.ephemeral;
            opts.flags = MessageFlags.Ephemeral;
          }
          return interaction.reply({ ...opts, fetchReply: true });
        },
      });
    } else if (interaction.commandName === 'myreminders') {
      await handleMyReminders({
        userId: interaction.user.id,
        replyFn: (opts) => {
          if (opts.ephemeral) {
            delete opts.ephemeral;
            opts.flags = MessageFlags.Ephemeral;
          }
          return interaction.reply(opts);
        },
      });
    }
  },
};
