import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { formatUptime } from '../utils.js';
import { startTime } from '../index.js';
import { addSudo, removeSudo, getSudoList, banUser, unbanUser, isBanned } from '../database/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MENU_TEXT = `
👋🏻⃝⃘̉̉̉━⋆─⋆──❂
┊ ┊ ┊ ┊ ┊
┊ ┊ ✫ ˚㋛ ⋆｡ ❀
┊ ☠︎︎
✧ Hey {user}𓂃✍︎𝄞
╰────────────────❂
┏━━━━━━━━━━━━━❥❥❥
┃ ✦ Sʜᴀᴅᴏᴡ  Gᴀʀᴅᴇɴ ✦
┗━━━━━━━━━━━━━❥❥❥

┏━━━━━━━━━━━━━❥❥❥
┃ ɴᴀᴍᴇ - Delta
┃ ᴄʀᴇᴀᴛᴏʀ - ꨄ︎ 𝙆𝙔𝙉𝙓 ꨄ︎
┃ ᴘʀᴇꜰɪx - [ . ]
┗━━━━━━━━━━━━━❥❥❥

┏━「 📋 ᴍᴀɪɴ 」
┃ .menu | .ping | .website
┃ .community | .afk | .help
┃ .info | .uptime
┗━━━━━━━━━━━━━❥❥❥

┏━「 ⚙️ ᴀᴅᴍɪɴ 」
┃ .kick .delete .antilink
┃ .warn .resetwarn .groupinfo
┃ .welcome .setwelcome .leave
┃ .setleave .promote .demote
┃ .mute .unmute .hidetag
┃ .tagall .activity .active
┃ .inactive .open .close
┃ .antism .blacklist .groupstats
┗━━━━━━━━━━━━━❥❥❥

┏━「 💰 ᴇᴄᴏɴᴏᴍʏ 」
┃ .mbal .gems .pbal .daily
┃ .withdraw .deposit .donate
┃ .lottery .richlist .register
┃ .profile .bio .shop .inventory
┃ .dig .fish .beg .roast .gamble
┗━━━━━━━━━━━━━❥❥❥

┏━「 🎴 ᴄᴀʀᴅꜱ 」
┃ .collection .deck .card
┃ .cardinfo .cardshop .claim
┃ .auction .stardust .vs
┗━━━━━━━━━━━━━❥❥❥

┏━「 🎮 ɢᴀᴍᴇꜱ 」
┃ .ttt .chess .akinator .gg
┃ .c4 .wcg .startbattle
┃ .truth .dare .uno
┗━━━━━━━━━━━━━❥❥❥

┏━「 🎲 ɢᴀᴍʙʟᴇ 」
┃ .slots .dice .casino .cf
┃ .doublebet .roulette .horse
┃ .spin wheel
┗━━━━━━━━━━━━━❥❥❥

┏━「 👤 ɪɴᴛᴇʀᴀᴄᴛɪᴏɴ 」
┃ .hug .kiss .slap .wave .pat
┃ .dance .sad .laugh .punch
┃ .kill .lick .bonk .tickle
┃ .fuck .kidnap .jihad .crusade
┗━━━━━━━━━━━━━❥❥❥

┏━「 🎉 ꜰᴜɴ 」
┃ .gay .lesbian .simp .match
┃ .ship .psize .skill .joke
┃ .truth .dare .wyr .uno
┗━━━━━━━━━━━━━❥❥❥

┏━「 📲 ᴅᴏᴡɴʟᴏᴀᴅᴇʀꜱ 」
┃ .ig .tiktok .yt .twitter
┃ .fb .play
┗━━━━━━━━━━━━━❥❥❥

┏━「 🔍 ꜱᴇᴀʀᴄʜ 」
┃ .pinterest .sauce .wallpaper
┃ .image .lyrics .waifu
┗━━━━━━━━━━━━━❥❥❥

┏━「 🤖 ᴀɪ 」
┃ .ai .gpt .generate .enhance
┃ .translate .transcribe
┗━━━━━━━━━━━━━❥❥❥

┏━「 🔄 ᴄᴏɴᴠᴇʀᴛᴇʀ 」
┃ .sticker .take .toimg .tovid
┗━━━━━━━━━━━━━❥❥❥

┏━「 🌸 ᴀɴɪᴍᴇ 」
┃ .waifu .neko .maid .oppai
┃ .nsfw .milf .hentai .ecchi
┗━━━━━━━━━━━━━❥❥❥
`;

export async function handleMain(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, isOwner, isSudoUser } = ctx;

  switch (command) {
    case 'menu':
    case 'help': {
      const menuText = MENU_TEXT.replace('{user}', pushName);
      const imgPath = path.join(__dirname, '../../assets/delta.jpg');
      if (await fs.pathExists(imgPath)) {
        await sock.sendMessage(from, {
          image: fs.readFileSync(imgPath),
          caption: menuText,
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
      }
      return true;
    }

    case 'ping': {
      const start = Date.now();
      await sock.sendMessage(from, { text: '🏓 Pinging...' }, { quoted: msg });
      const latency = Date.now() - start;
      await sock.sendMessage(from, {
        text: `┌─────────────────❥
│ 🏓 *PONG!*
│ 📡 Speed: *${latency}ms*
│ 🌐 Status: *Online*
└─────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'uptime': {
      const up = formatUptime(Date.now() - startTime);
      await sock.sendMessage(from, {
        text: `┌─────────────────❥
│ ⏱️ *BOT UPTIME*
│ ╰─ *${up}*
│ 🌸 Shadow Garden • Delta
└─────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'website': {
      await sock.sendMessage(from, {
        text: `🌐 *Shadow Garden Website*\n\n🚧 *Coming Soon...*\n\nStay tuned! Our website is currently under development. 💫`,
      }, { quoted: msg });
      return true;
    }

    case 'community': {
      await sock.sendMessage(from, {
        text: `🌸 *Shadow Garden Community*\n\nJoin our WhatsApp community!\n\n${config.communityLink}\n\n✨ Meet new friends, play games, and have fun!`,
      }, { quoted: msg });
      return true;
    }

    case 'info': {
      await sock.sendMessage(from, {
        text: `┌─────────────────────❥
│ 🌸 *DELTA BOT INFO*
│
│ 🤖 Name: *Delta*
│ 👑 Creator: *ꨄ︎ KYNX ꨄ︎*
│ 🏡 Family: *Shadow Garden*
│ ⌨️ Prefix: *[ . ]*
│ 🌐 Version: *1.0.0*
│ 💻 Platform: *WhatsApp*
│ 📚 Library: *Baileys*
└─────────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'afk': {
      const { setAfk } = await import('../database/db.js');
      const reason = text || 'AFK';
      setAfk(sender, reason);
      await sock.sendMessage(from, {
        text: `😴 *@${senderNum}* is now AFK\n📝 Reason: *${reason}*`,
        mentions: [sender],
      }, { quoted: msg });
      return true;
    }

    // Owner-only commands
    case 'join': {
      if (!isOwner && !isSudoUser) {
        await sock.sendMessage(from, { text: '❌ Only the owner can use this command!' });
        return true;
      }
      const link = args[0];
      if (!link) {
        await sock.sendMessage(from, { text: '❌ Usage: .join <group link>' });
        return true;
      }
      try {
        const code = link.split('chat.whatsapp.com/')[1]?.replace('https://', '').replace('http://', '') || link.split('/').pop();
        await sock.groupAcceptInvite(code);
        await sock.sendMessage(from, { text: '✅ Successfully joined the group!' });
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Failed to join: ${e.message}` });
      }
      return true;
    }

    case 'exit': {
      if (!isOwner && !isSudoUser) {
        await sock.sendMessage(from, { text: '❌ Only the owner can use this command!' });
        return true;
      }
      if (!ctx.isGroup) {
        await sock.sendMessage(from, { text: '❌ This command is for groups only!' });
        return true;
      }
      await sock.sendMessage(from, { text: '👋 Leaving group. Goodbye!' });
      await sock.groupLeave(from);
      return true;
    }

    case 'ban': {
      if (!isOwner && !isSudoUser) return true;
      const target = ctx.mentions[0] || (args[0]?.includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user to ban! .ban @user' });
        return true;
      }
      banUser(target, args.slice(1).join(' ') || 'No reason');
      await sock.sendMessage(from, {
        text: `🚫 @${target.split('@')[0]} has been *banned* from using the bot!`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'unban': {
      if (!isOwner && !isSudoUser) return true;
      const target = ctx.mentions[0] || (args[0]?.replace('@', '') + '@s.whatsapp.net');
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user to unban!' });
        return true;
      }
      unbanUser(target);
      await sock.sendMessage(from, {
        text: `✅ @${target.split('@')[0]} has been *unbanned*!`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'sudo': {
      if (!isOwner) {
        await sock.sendMessage(from, { text: '❌ Only the owner can add sudo users!' });
        return true;
      }
      const subCmd = args[0]?.toLowerCase();
      if (subCmd === 'add') {
        const target = ctx.mentions[0] || (args[1]?.replace('@', '') + '@s.whatsapp.net');
        addSudo(target);
        await sock.sendMessage(from, {
          text: `✅ @${target.split('@')[0]} added to sudo list!`,
          mentions: [target],
        });
      } else if (subCmd === 'remove') {
        const target = ctx.mentions[0] || (args[1]?.replace('@', '') + '@s.whatsapp.net');
        removeSudo(target);
        await sock.sendMessage(from, {
          text: `✅ @${target.split('@')[0]} removed from sudo list!`,
          mentions: [target],
        });
      } else if (subCmd === 'list') {
        const list = getSudoList();
        const formatted = list.map(j => `• +${j.split('@')[0]}`).join('\n');
        await sock.sendMessage(from, { text: `👑 *SUDO LIST*\n\n${formatted || 'No sudo users'}` });
      }
      return true;
    }

    default:
      return false;
  }
}
