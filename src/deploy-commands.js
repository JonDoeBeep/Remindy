const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder that will DM you when the time is up.')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('When to remind you (e.g. 1d, 2h30m, 34 hours, 1 week)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('What to remind you about')
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('myreminders')
    .setDescription('List your pending reminders (created and subscribed).')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash command(s)...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log(`Successfully registered ${data.length} slash command(s).`);
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();
