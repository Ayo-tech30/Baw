import axios from 'axios';
import { getBuffer } from '../utils.js';
import { getGroup, updateGroup } from '../database/db.js';

async function fetchNekosBest(category) {
  try {
    const res = await axios.get(`https://nekos.best/api/v2/${category}`, { timeout: 10000 });
    return res.data?.results?.[0]?.url || null;
  } catch {
    return null;
  }
}

async function fetchWaifuPics(type, category) {
  try {
    const res = await axios.get(`https://api.waifu.pics/${type}/${category}`, { timeout: 10000 });
    return res.data?.url || null;
  } catch {
    return null;
  }
}

async function sendAnimeImage(ctx, url, caption) {
  const { sock, msg, from } = ctx;
  if (!url) {
    await sock.sendMessage(from, { text: '❌ Failed to fetch image. Try again!' }, { quoted: msg });
    return;
  }
  try {
    const buf = await getBuffer(url);
    await sock.sendMessage(from, { image: buf, caption }, { quoted: msg });
  } catch {
    await sock.sendMessage(from, { text: `🌸 Image: ${url}` }, { quoted: msg });
  }
}

export async function handleAnime(ctx) {
  const { sock, msg, from, command, args, isGroup, isAdmin, isOwner, isSudoUser } = ctx;

  // Check NSFW settings for groups
  const isNsfwCommand = ['milf', 'ass', 'hentai', 'oral', 'ecchi', 'paizuri', 'ero', 'ehentai', 'nhentai'].includes(command);

  if (isNsfwCommand && isGroup) {
    const grp = getGroup(from);
    if (!grp.nsfw_enabled) {
      await sock.sendMessage(from, { text: '🔞 NSFW is disabled in this group!\n\nAdmins can enable with: *.nsfw on*' }, { quoted: msg });
      return true;
    }
  }

  switch (command) {
    // ======= NSFW toggle =======
    case 'nude':
    case 'nsfw': {
      if (!isGroup) {
        await sock.sendMessage(from, { text: '❌ Group only command!' }, { quoted: msg });
        return true;
      }
      if (!isAdmin && !isOwner && !isSudoUser) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const state = args[0]?.toLowerCase();
      if (state === 'on') {
        updateGroup(from, { nsfw_enabled: 1 });
        await sock.sendMessage(from, { text: '🔞 NSFW *ENABLED* in this group!' }, { quoted: msg });
      } else if (state === 'off') {
        updateGroup(from, { nsfw_enabled: 0 });
        await sock.sendMessage(from, { text: '✅ NSFW *DISABLED* in this group!' }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: 'Usage: .nsfw on/off' }, { quoted: msg });
      }
      return true;
    }

    // ======= SFW =======
    case 'waifu': {
      const url = await fetchWaifuPics('sfw', 'waifu');
      await sendAnimeImage(ctx, url, '🌸 *Waifu!*');
      return true;
    }

    case 'neko': {
      const url = await fetchWaifuPics('sfw', 'neko');
      await sendAnimeImage(ctx, url, '🐱 *Neko!*');
      return true;
    }

    case 'maid': {
      const url = await fetchWaifuPics('sfw', 'uniform');
      await sendAnimeImage(ctx, url, '💙 *Maid!*');
      return true;
    }

    case 'oppai': {
      const url = await fetchNekosBest('smile');
      await sendAnimeImage(ctx, url, '🌸 *Oppai!*');
      return true;
    }

    case 'selfies': {
      const url = await fetchNekosBest('selfies');
      await sendAnimeImage(ctx, url, '🤳 *Selfie!*');
      return true;
    }

    case 'uniform': {
      const url = await fetchWaifuPics('sfw', 'uniform');
      await sendAnimeImage(ctx, url, '🎓 *Uniform!*');
      return true;
    }

    case 'mori-calliope': {
      const url = await fetchWaifuPics('sfw', 'waifu');
      await sendAnimeImage(ctx, url, '💀 *Mori Calliope!*');
      return true;
    }

    case 'raiden-shogun': {
      const url = await fetchWaifuPics('sfw', 'waifu');
      await sendAnimeImage(ctx, url, '⚡ *Raiden Shogun!*');
      return true;
    }

    case 'kamisato-ayaka': {
      const url = await fetchWaifuPics('sfw', 'waifu');
      await sendAnimeImage(ctx, url, '❄️ *Kamisato Ayaka!*');
      return true;
    }

    // ======= NSFW =======
    case 'milf': {
      const url = await fetchWaifuPics('nsfw', 'milf');
      await sendAnimeImage(ctx, url, '🔞 *Milf!*');
      return true;
    }

    case 'ass': {
      const url = await fetchWaifuPics('nsfw', 'ass');
      await sendAnimeImage(ctx, url, '🔞 *Ass!*');
      return true;
    }

    case 'hentai': {
      const url = await fetchWaifuPics('nsfw', 'hentai');
      await sendAnimeImage(ctx, url, '🔞 *Hentai!*');
      return true;
    }

    case 'oral': {
      const url = await fetchWaifuPics('nsfw', 'oral');
      await sendAnimeImage(ctx, url, '🔞');
      return true;
    }

    case 'ecchi': {
      const url = await fetchWaifuPics('nsfw', 'ecchi');
      await sendAnimeImage(ctx, url, '🔞 *Ecchi!*');
      return true;
    }

    case 'paizuri': {
      const url = await fetchWaifuPics('nsfw', 'paizuri');
      await sendAnimeImage(ctx, url, '🔞');
      return true;
    }

    case 'ero': {
      const url = await fetchWaifuPics('nsfw', 'ero');
      await sendAnimeImage(ctx, url, '🔞');
      return true;
    }

    case 'ehentai': {
      await sock.sendMessage(from, {
        text: '🔞 *E-Hentai*\n\n🔗 https://e-hentai.org',
      }, { quoted: msg });
      return true;
    }

    case 'nhentai': {
      await sock.sendMessage(from, {
        text: '🔞 *NHentai*\n\n🔗 https://nhentai.net',
      }, { quoted: msg });
      return true;
    }

    default:
      return false;
  }
}
