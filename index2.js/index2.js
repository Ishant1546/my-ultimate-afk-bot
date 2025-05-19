const mineflayer = require('mineflayer');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./settings2.json', 'utf8'));

function createBot() {
  const bot = mineflayer.createBot({
    host: config.server.ip,
    port: config.server.port,
    username: config['bot-account'].username,
    password: config['bot-account'].password || undefined,
    auth: config['bot-account'].type,
    version: config.server.version
  });

  bot.on('spawn', () => {
    console.log(`[${config['bot-account'].username}] Joined the server`);
  });

  bot.on('end', () => {
    console.log(`[${config['bot-account'].username}] Disconnected. Reconnecting in ${config.utils['auto-reconnect-delay']}ms...`);
    if (config.utils['auto-reconnect']) {
      setTimeout(() => createBot(), config.utils['auto-reconnect-delay']);
    }
  });

  bot.on('error', err => {
    console.error(`[${config['bot-account'].username}] Error:`, err);
  });
}

createBot();
