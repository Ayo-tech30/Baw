import axios from 'axios';
import { getBuffer } from '../utils.js';
import { config } from '../config.js';

async function fetchWaifu(category = 'waifu', nsfw = false) {
  try {
    const type = nsfw ? 'nsfw' : 'sfw';
    const res = await axios.get(`https://api.waifu.pics/${type}/${category}`, { timeout: 10000 });
    return res.data?.url || null;
  } catch {
    return null;
  }
}

async function searchLyrics(query) {
  try {
    const res = await axios.get(`https://some-random-api.com/others/lyrics?title=${encodeURIComponent(query)}`, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function handleSearch(ctx) {
  const { sock, msg, from, command, args, text } = ctx;

  switch (command) {
    case 'waifu': {
      await sock.sendMessage(from, { text: '🌸 Fetching waifu...' }, { quoted: msg });
      const url = await fetchWaifu('waifu');
      if (!url) {
        await sock.sendMessage(from, { text: '❌ Failed to fetch waifu!' }, { quoted: msg });
        return true;
      }
      try {
        const buf = await getBuffer(url);
        await sock.sendMessage(from, { image: buf, caption: '🌸 *Your Waifu!*' }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `🌸 Waifu: ${url}` }, { quoted: msg });
      }
      return true;
    }

    case 'wallpaper': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .wallpaper [search term]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `🖼️ Searching wallpapers for: *${text}*...` }, { quoted: msg });
      try {
        // Use Unsplash API (no key needed for basic search)
        const res = await axios.get(`https://source.unsplash.com/1920x1080/?${encodeURIComponent(text)}`, {
          maxRedirects: 5,
          responseType: 'arraybuffer',
          timeout: 20000,
        });
        const buf = Buffer.from(res.data);
        await sock.sendMessage(from, { image: buf, caption: `🖼️ *Wallpaper: ${text}*` }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `❌ Wallpaper search failed. Try: https://unsplash.com/s/photos/${encodeURIComponent(text)}` }, { quoted: msg });
      }
      return true;
    }

    case 'image': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .image [search term]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `🔍 Searching images for: *${text}*...` }, { quoted: msg });
      try {
        const res = await axios.get(`https://source.unsplash.com/800x600/?${encodeURIComponent(text)}`, {
          maxRedirects: 5,
          responseType: 'arraybuffer',
          timeout: 20000,
        });
        const buf = Buffer.from(res.data);
        await sock.sendMessage(from, { image: buf, caption: `🔍 *Search: ${text}*` }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `❌ Image search failed for *${text}*` }, { quoted: msg });
      }
      return true;
    }

    case 'lyrics': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .lyrics [song name]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `🎵 Searching lyrics for: *${text}*...` }, { quoted: msg });
      const result = await searchLyrics(text);
      if (!result?.lyrics) {
        await sock.sendMessage(from, { text: `❌ Lyrics not found for *${text}*\n\n💡 Try: https://genius.com` }, { quoted: msg });
        return true;
      }
      const lyrics = result.lyrics.substring(0, 3000);
      await sock.sendMessage(from, {
        text: `🎵 *${result.title}* - ${result.author}\n\n${lyrics}${result.lyrics.length > 3000 ? '\n\n... (truncated)' : ''}`,
      }, { quoted: msg });
      return true;
    }

    case 'sauce':
    case 'reverseimg': {
      const quoted = ctx.quotedMsg;
      if (!quoted?.imageMessage) {
        await sock.sendMessage(from, { text: '❌ Reply to an image to search for sauce!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🔍 Searching sauce...\n\n💡 For accurate results, use: https://saucenao.com or https://iqdb.org' }, { quoted: msg });
      return true;
    }

    case 'pinterest':
    case 'pint': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .pinterest [search term]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `📌 Searching Pinterest for: *${text}*...` }, { quoted: msg });
      try {
        // Pinterest API alternative - use a scraper or fallback
        const res = await axios.get(`https://source.unsplash.com/600x600/?${encodeURIComponent(text)}`, {
          maxRedirects: 5,
          responseType: 'arraybuffer',
          timeout: 20000,
        });
        const buf = Buffer.from(res.data);
        await sock.sendMessage(from, {
          image: buf,
          caption: `📌 *Pinterest: ${text}*\n\n🔗 More results: https://pinterest.com/search/pins/?q=${encodeURIComponent(text)}`,
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `📌 Pinterest: https://pinterest.com/search/pins/?q=${encodeURIComponent(text)}` }, { quoted: msg });
      }
      return true;
    }

    default:
      return false;
  }
}
