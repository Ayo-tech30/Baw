import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  jidNormalizedUser,
  delay,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { handleMessage } from './handler.js';
import { addSudo, getSudoList } from './database/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Silent logger - no reconnecting spam
const logger = pino({ level: 'silent' });

const store = makeInMemoryStore({ logger });
store.readFromFile('./data/baileys_store.json');
setInterval(() => store.writeToFile('./data/baileys_store.json'), 10_000);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((res) => rl.question(text, res));

// Initialize sudo numbers from config
const ownerJid = config.ownerNumber + '@s.whatsapp.net';
addSudo(ownerJid);
for (const num of config.sudoNumbers) {
  addSudo(num + '@s.whatsapp.net');
}

let sock;
let startTime = Date.now();
export { startTime };

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./data/auth');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['Chrome', 'Ubuntu', '124.0.6367.208'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return { conversation: 'hello' };
    },
  });

  store.bind(sock.ev);

  // Pairing code if not registered
  if (!sock.authState.creds.registered) {
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│   🌸  SHADOW GARDEN BOT - DELTA  🌸   │');
    console.log('└─────────────────────────────────────┘');
    console.log('\nEnter your WhatsApp number (with country code, no +):');
    const phoneNumber = (await question('➜ Number: ')).trim().replace(/[^0-9]/g, '');

    await delay(2000);
    let code;
    try {
      code = await sock.requestPairingCode(phoneNumber);
    } catch (e) {
      console.log('❌ Failed to get pairing code. Try again.');
      process.exit(1);
    }

    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
    console.log('\n┌─────────────────────────────────────┐');
    console.log(`│   PAIRING CODE:  ${formatted.padEnd(20)} │`);
    console.log('└─────────────────────────────────────┘');
    console.log('\n📱 Open WhatsApp → Settings → Linked Devices → Link a Device');
    console.log('📲 Select "Link with phone number" and enter the code above');
    console.log('🔔 WhatsApp will send a notification to confirm pairing on Chrome, Ubuntu\n');
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️  Logged out. Delete data/auth folder and restart.');
        process.exit(1);
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log('⚠️  Connection replaced by another session.');
        process.exit(1);
      } else if (shouldReconnect) {
        // Silent reconnect - no spam
        setTimeout(() => connectToWhatsApp(), 3000);
      }
    } else if (connection === 'open') {
      startTime = Date.now();
      const botNum = sock.user?.id?.split(':')[0];
      console.log('\n┌─────────────────────────────────────────────┐');
      console.log('│  ✅  SHADOW GARDEN BOT CONNECTED SUCCESSFULLY │');
      console.log(`│  📱  Bot Number: ${botNum?.padEnd(27) || ''}│`);
      console.log(`│  👑  Owner: ${config.ownerNumber.padEnd(31)}│`);
      console.log(`│  🤖  Bot: ${config.botName.padEnd(34)}│`);
      console.log('└─────────────────────────────────────────────┘\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      try {
        await handleMessage(sock, msg, store);
      } catch (err) {
        // Silent error handling
      }
    }
  });

  // Group participant updates for welcome/leave
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { handleGroupUpdate } = await import('./events/groupUpdate.js');
      await handleGroupUpdate(sock, update);
    } catch (e) {}
  });

  return sock;
}

export { sock };
export function getSock() { return sock; }

connectToWhatsApp().catch(console.error);
