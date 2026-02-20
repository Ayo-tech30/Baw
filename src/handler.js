import { config } from './config.js';
import { getUser, getGroup, trackActivity, getAfk, removeAfk, getBlacklist, isBanned, isSudo } from './database/db.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

// Import all command modules
import { handleMain } from './commands/main.js';
import { handleAdmin } from './commands/admin.js';
import { handleEconomy } from './commands/economy.js';
import { handleGames } from './commands/games.js';
import { handleGamble } from './commands/gamble.js';
import { handleInteraction } from './commands/interaction.js';
import { handleFun } from './commands/fun.js';
import { handleDownloader } from './commands/downloader.js';
import { handleSearch } from './commands/search.js';
import { handleAI } from './commands/ai.js';
import { handleConverter } from './commands/converter.js';
import { handleAnime } from './commands/anime.js';
import { handleCards } from './commands/cards.js';

export async function handleMessage(sock, msg, store) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const senderNum = sender?.split('@')[0];
    const ownerJid = config.ownerNumber + '@s.whatsapp.net';
    const isOwner = senderNum === config.ownerNumber || sender === ownerJid;
    const isSudoUser = isSudo(sender) || isOwner;

    if (!sender) return;

    // Check if user is banned
    if (isBanned(sender) && !isOwner) return;

    // Get message text
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      '';

    const prefix = config.prefix;
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : '';
    const args = isCmd ? body.slice(prefix.length + command.length).trim().split(/\s+/).filter(Boolean) : [];
    const text = isCmd ? body.slice(prefix.length + command.length).trim() : body;

    // Get user info
    const user = getUser(sender);
    const pushName = msg.pushName || user.name || senderNum;

    // Group info
    let groupMeta = null;
    let isAdmin = false;
    let isBotAdmin = false;

    if (isGroup) {
      try {
        groupMeta = await sock.groupMetadata(from);
        const participants = groupMeta.participants;
        isAdmin = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender))?.admin != null;
        const botJid = sock.user?.id;
        isBotAdmin = participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(botJid))?.admin != null;
      } catch (e) {}

      // Track activity
      trackActivity(sender, from);

      // Anti-link check
      if (!isOwner && !isSudoUser && !isAdmin) {
        const grp = getGroup(from);
        if (grp.antilink === 1) {
          const hasLink = /https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[^\s]+/i.test(body) ||
                         /(https?:\/\/[^\s]+)/i.test(body);
          if (hasLink) {
            const action = grp.antilink_action || 'warn';
            if (action === 'kick' && isBotAdmin) {
              await sock.groupParticipantsUpdate(from, [sender], 'remove');
              await sock.sendMessage(from, { text: `🚫 @${senderNum} was kicked for sending links.`, mentions: [sender] });
            } else if (action === 'delete' && isBotAdmin) {
              await sock.sendMessage(from, { delete: msg.key });
              await sock.sendMessage(from, { text: `⚠️ @${senderNum}'s message was deleted for containing a link.`, mentions: [sender] });
            } else {
              await sock.sendMessage(from, { text: `⚠️ @${senderNum}, no links allowed in this group!`, mentions: [sender] });
            }
            if (action !== 'warn') return;
          }
        }

        // Anti-spam blacklist
        if (grp.antispam === 1 && body) {
          const bl = getBlacklist(from);
          const lower = body.toLowerCase();
          if (bl.some(w => lower.includes(w))) {
            if (isBotAdmin) await sock.sendMessage(from, { delete: msg.key });
            await sock.sendMessage(from, { text: `🚫 @${senderNum}, blacklisted word detected!`, mentions: [sender] });
            return;
          }
        }
      }

      // AFK return detection
      const afkData = getAfk(sender);
      if (afkData && isCmd) {
        removeAfk(sender);
        await sock.sendMessage(from, {
          text: `👋 Welcome back @${senderNum}! You were AFK: *${afkData.reason}*`,
          mentions: [sender]
        });
      }

      // Mention AFK users
      if (!isCmd && body) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const mentionedJid of mentioned) {
          const afk = getAfk(mentionedJid);
          if (afk) {
            const mNum = mentionedJid.split('@')[0];
            await sock.sendMessage(from, {
              text: `💤 @${mNum} is currently AFK: *${afk.reason}*`,
              mentions: [mentionedJid]
            });
          }
        }
      }
    }

    if (!isCmd) return;

    // Context object passed to all handlers
    const ctx = {
      sock,
      msg,
      from,
      sender,
      senderNum,
      isGroup,
      isAdmin,
      isBotAdmin,
      isOwner,
      isSudoUser,
      groupMeta,
      command,
      args,
      text,
      body,
      pushName,
      user,
      ownerJid,
      prefix,
      store,
      quotedMsg: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage,
      quotedParticipant: msg.message?.extendedTextMessage?.contextInfo?.participant,
      mentions: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    };

    // Route to appropriate handler
    const handled = await tryHandlers(ctx, [
      handleMain,
      handleAdmin,
      handleEconomy,
      handleGames,
      handleGamble,
      handleInteraction,
      handleFun,
      handleDownloader,
      handleSearch,
      handleAI,
      handleConverter,
      handleAnime,
      handleCards,
    ]);

    if (!handled) {
      // Unknown command - silent
    }

  } catch (err) {
    // Silent error
  }
}

async function tryHandlers(ctx, handlers) {
  for (const handler of handlers) {
    try {
      const result = await handler(ctx);
      if (result === true) return true;
    } catch (e) {}
  }
  return false;
}
