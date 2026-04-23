const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');

const readyEvent = require('./events/ready');
const messageCreateEvent = require('./events/messageCreate');
const interactionCreateEvent = require('./events/interactionCreate');
const messageReactionAddEvent = require('./events/messageReactionAdd');
const messageReactionRemoveEvent = require('./events/messageReactionRemove');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

function registerEvent(event) {
  const method = event.once ? 'once' : 'on';
  if (event.name === 'ready') {
    client[method](event.name, (...args) => event.execute(client, ...args));
  } else if (event.name === 'messageReactionAdd' || event.name === 'messageReactionRemove') {
    client[method](event.name, (...args) => event.execute(client, ...args));
  } else {
    client[method](event.name, (...args) => event.execute(client, ...args));
  }
}

registerEvent(readyEvent);
registerEvent(messageCreateEvent);
registerEvent(interactionCreateEvent);
registerEvent(messageReactionAddEvent);
registerEvent(messageReactionRemoveEvent);

process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  client.destroy();
  process.exit(0);
});

client.login(config.token);
