import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n?.toString() || '0';
}

export function formatPhone(jid) {
  return jid?.split('@')[0] || jid;
}

export function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export async function downloadFile(url, ext = 'tmp') {
  const tmpPath = path.join(tmpdir(), `sg_${Date.now()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  await fs.writeFile(tmpPath, Buffer.from(response.data));
  return tmpPath;
}

export async function getBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return Buffer.from(response.data);
}

export async function urlToBuffer(url) {
  return getBuffer(url);
}

export async function fetchGif(endpoint) {
  try {
    const res = await axios.get(`https://nekos.best/api/v2/${endpoint}`, { timeout: 10000 });
    return res.data?.results?.[0]?.url || null;
  } catch {
    // fallback gifs from tenor
    const fallbacks = {
      hug: 'https://media.tenor.com/images/9f9c7e80a0c03ef23b1dde9b1bd59e8e/tenor.gif',
      kiss: 'https://media.tenor.com/images/b6b45ba2e2c3fb8ed48aadd63c60cc71/tenor.gif',
      slap: 'https://media.tenor.com/images/1a74b0f2d52f2d5f5e2d5c2b1a1b1b1b/tenor.gif',
      pat: 'https://media.tenor.com/images/9f9c7e80a0c03ef23b1dde9b1bd59e8e/tenor.gif',
      wave: 'https://media.tenor.com/images/9f9c7e80a0c03ef23b1dde9b1bd59e8e/tenor.gif',
    };
    return fallbacks[endpoint] || null;
  }
}

export async function imageToSticker(sock, from, imgBuffer, stickerName, stickerAuthor) {
  try {
    await sock.sendMessage(from, {
      sticker: imgBuffer,
      stickerName,
      stickerAuthor,
    });
    return true;
  } catch {
    return false;
  }
}

export async function gifToSticker(sock, from, gifUrl, stickerName, stickerAuthor) {
  try {
    const buf = await getBuffer(gifUrl);
    await sock.sendMessage(from, {
      sticker: buf,
      stickerName,
      stickerAuthor,
      isAnimated: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function react(sock, msg, emoji) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key }
    });
  } catch {}
}

export function mention(jid) {
  return `@${jid.split('@')[0]}`;
}

export const emojis = {
  success: '✅',
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  money: '💰',
  gem: '💎',
  star: '⭐',
  fire: '🔥',
  crown: '👑',
  swords: '⚔️',
  shield: '🛡️',
  dice: '🎲',
  cards: '🃏',
  trophy: '🏆',
  heart: '❤️',
  music: '🎵',
  video: '🎬',
  image: '🖼️',
  robot: '🤖',
  flower: '🌸',
  moon: '🌙',
  sun: '☀️',
};

// Send interaction gif
export async function sendInteractionGif(ctx, endpoint, actionText) {
  const { sock, from, sender, senderNum, mentions, args, msg } = ctx;
  let targetName = 'everyone';
  let targetJid = null;

  if (mentions.length > 0) {
    targetJid = mentions[0];
    targetName = `@${targetJid.split('@')[0]}`;
  } else if (args.length > 0) {
    targetName = args.join(' ');
  }

  const gifUrl = await fetchGif(endpoint);
  const caption = `*${actionText.replace('{user}', `@${senderNum}`).replace('{target}', targetName)}*`;

  if (gifUrl) {
    try {
      const buf = await getBuffer(gifUrl);
      await sock.sendMessage(from, {
        video: buf,
        gifPlayback: true,
        caption,
        mentions: targetJid ? [sender, targetJid] : [sender],
      });
    } catch {
      await sock.sendMessage(from, { text: caption, mentions: targetJid ? [sender, targetJid] : [sender] });
    }
  } else {
    await sock.sendMessage(from, { text: caption, mentions: targetJid ? [sender, targetJid] : [sender] });
  }
}
