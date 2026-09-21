import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '..', '.env') });

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error('[env] faltam variaveis DISCORD_ no .env');
  process.exit(1);
}

// BLINDAGEM: erro nenhum derruba mais o bot
process.on('unhandledRejection', (e) => console.error('[unhandled]', e?.message || e));
process.on('uncaughtException', (e) => console.error('[uncaught]', e?.message || e));

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('MintPass esta vivo?')
].map(c => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.on('error', (e) => console.error('[client error]', e?.message || e));

client.once('clientReady', () => console.log('[bot] online como ' + client.user.tag));

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;
  try {
    if (i.commandName === 'ping') {
      await i.reply('🏓 pong · MintPass Engine v1 · community-engine');
      console.log('[bot] /ping respondido para ' + i.user.username);
    }
  } catch (e) {
    // Interacao expirada? Loga e segue o jogo, sem crash
    console.error('[interaction] nao consegui responder (' + (e?.code || '') + '): ' + (e?.message || e));
  }
});

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands });
console.log('[bot] /ping registrado no guild');

await client.login(DISCORD_TOKEN);
