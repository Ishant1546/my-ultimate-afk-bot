const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');
const express = require('express');

const config1 = require('./settings.json');
const config2 = require('./settings2.json');

const app = express();
app.get('/', (req, res) => {
  res.send('Both AFK Bots are running');
});
app.listen(8000, () => {
  console.log('Status web server started on port 8000');
});

function createBot(config) {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;

   function sendRegister(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/register ${password} ${password}`);
         bot.once('chat', (username, message) => {
            if (message.includes('successfully registered') || message.includes('already registered')) {
               resolve();
            } else {
               reject(`Register failed: ${message}`);
            }
         });
      });
   }

   function sendLogin(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/login ${password}`);
         bot.once('chat', (username, message) => {
            if (message.includes('successfully logged in')) {
               resolve();
            } else {
               reject(`Login failed: ${message}`);
            }
         });
      });
   }

   bot.once('spawn', () => {
      console.log(`\x1b[33m[${config['bot-account']['username']}] Joined the server\x1b[0m`);

      if (config.utils['auto-auth'].enabled) {
         const password = config.utils['auto-auth'].password;
         sendRegister(password)
            .then(() => sendLogin(password))
            .catch(console.error);
      }

      if (config.utils['chat-messages'].enabled) {
         const messages = config.utils['chat-messages'].messages;
         if (config.utils['chat-messages'].repeat) {
            const delay = config.utils['chat-messages']['repeat-delay'];
            let i = 0;
            setInterval(() => {
               bot.chat(messages[i] || '');
               i = (i + 1) % messages.length;
            }, delay * 1000);
         } else {
            messages.forEach(msg => bot.chat(msg));
         }
      }

      if (config.position.enabled) {
         const { x, y, z } = config.position;
         console.log(`[${bot.username}] Moving to (${x}, ${y}, ${z})`);
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(x, y, z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', true);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });

   bot.on('goal_reached', () => {
      console.log(`[${bot.username}] Reached goal position.`);
   });

   bot.on('death', () => {
      console.log(`[${bot.username}] Died and respawned.`);
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         console.log(`[${bot.username}] Disconnected. Reconnecting in ${config.utils['auto-recconect-delay']}ms...`);
         setTimeout(() => createBot(config), config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', reason => {
      console.log(`[${bot.username}] Kicked: ${reason}`);
   });

   bot.on('error', err => {
      console.error(`[${bot.username}] Error: ${err.message}`);
   });
}

// Start both bots
createBot(config1);
createBot(config2);
