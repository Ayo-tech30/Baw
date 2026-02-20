import { getGroup, updateGroup, addWarning, resetWarnings, getWarnings, addBlacklist, removeBlacklist, getBlacklist, getActivity, getUser } from '../database/db.js';
import { formatPhone, getRandom, formatNumber } from '../utils.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

function requireAdmin(ctx) {
  if (!ctx.isAdmin && !ctx.isOwner && !ctx.isSudoUser) return false;
  return true;
}

function requireBotAdmin(ctx) {
  if (!ctx.isBotAdmin) return false;
  return true;
}

export async function handleAdmin(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, groupMeta, isGroup, isAdmin, isBotAdmin, isOwner, isSudoUser, mentions } = ctx;

  if (!isGroup && !['purge'].includes(command)) {
    // some cmds need group
  }

  switch (command) {
    case 'kick': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ You need admin rights to use this!' }, { quoted: msg });
        return true;
      }
      if (!requireBotAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ I need to be admin to kick members!' }, { quoted: msg });
        return true;
      }
      const target = mentions[0] || (ctx.quotedParticipant);
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention or reply to a user to kick!' }, { quoted: msg });
        return true;
      }
      if (target === ctx.ownerJid || jidNormalizedUser(target) === jidNormalizedUser(ctx.ownerJid)) {
        await sock.sendMessage(from, { text: '❌ Cannot kick the bot owner!' }, { quoted: msg });
        return true;
      }
      try {
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        await sock.sendMessage(from, {
          text: `👢 *@${target.split('@')[0]}* has been kicked from the group!`,
          mentions: [target],
        });
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Failed to kick: ${e.message}` }, { quoted: msg });
      }
      return true;
    }

    case 'delete':
    case 'del': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ You need admin rights!' }, { quoted: msg });
        return true;
      }
      const quoted = msg.message?.extendedTextMessage?.contextInfo;
      if (!quoted?.stanzaId) {
        await sock.sendMessage(from, { text: '❌ Reply to a message to delete it!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: quoted.stanzaId,
          participant: quoted.participant,
        }
      });
      return true;
    }

    case 'antilink': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const sub = args[0]?.toLowerCase();
      if (sub === 'set') {
        const action = args[1]?.toLowerCase();
        if (!['warn', 'kick', 'delete'].includes(action)) {
          await sock.sendMessage(from, { text: '❌ Actions: warn, kick, delete' }, { quoted: msg });
          return true;
        }
        updateGroup(from, { antilink_action: action });
        await sock.sendMessage(from, { text: `✅ Antilink action set to *${action}*` }, { quoted: msg });
      } else if (sub === 'on') {
        updateGroup(from, { antilink: 1 });
        await sock.sendMessage(from, { text: '✅ Antilink is now *ON*' }, { quoted: msg });
      } else if (sub === 'off') {
        updateGroup(from, { antilink: 0 });
        await sock.sendMessage(from, { text: '✅ Antilink is now *OFF*' }, { quoted: msg });
      } else {
        const grp = getGroup(from);
        await sock.sendMessage(from, {
          text: `🔗 *ANTILINK STATUS*\n\nStatus: *${grp.antilink ? 'ON' : 'OFF'}*\nAction: *${grp.antilink_action || 'warn'}*\n\nUsage:\n.antilink on/off\n.antilink set [warn/kick/delete]`,
        }, { quoted: msg });
      }
      return true;
    }

    case 'warn': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const target = mentions[0] || ctx.quotedParticipant;
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user to warn!' }, { quoted: msg });
        return true;
      }
      const reason = mentions.length > 0 ? text.replace(/@\d+/g, '').trim() : args.slice(1).join(' ');
      const warnCount = addWarning(target, from, reason || 'No reason given');
      await sock.sendMessage(from, {
        text: `⚠️ *WARNING*\n\n👤 User: @${target.split('@')[0]}\n📝 Reason: ${reason || 'No reason'}\n🔢 Warnings: ${warnCount}/3\n\n${warnCount >= 3 ? '🚨 *3 warnings reached! Consider kicking.*' : ''}`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'resetwarn': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const target = mentions[0] || ctx.quotedParticipant;
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user!' }, { quoted: msg });
        return true;
      }
      resetWarnings(target, from);
      await sock.sendMessage(from, {
        text: `✅ Warnings reset for @${target.split('@')[0]}`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'groupinfo':
    case 'gi': {
      if (!isGroup) {
        await sock.sendMessage(from, { text: '❌ Group only!' }, { quoted: msg });
        return true;
      }
      const meta = groupMeta;
      const admins = meta.participants.filter(p => p.admin).map(p => `+${p.id.split('@')[0]}`).join('\n  ');
      await sock.sendMessage(from, {
        text: `┌─────────────────────❥
│ 📋 *GROUP INFO*
│
│ 📌 Name: *${meta.subject}*
│ 👥 Members: *${meta.participants.length}*
│ 👑 Owner: *+${meta.owner?.split('@')[0] || 'Unknown'}*
│ 📅 Created: *${new Date(meta.creation * 1000).toDateString()}*
│ 🛡️ Admins:
│   ${admins || 'None'}
│ 🔒 Restricted: *${meta.restrict ? 'Yes' : 'No'}*
└─────────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'groupstats':
    case 'gs': {
      if (!isGroup) return false;
      const activity = getActivity(from);
      const total = activity.reduce((sum, a) => sum + a.message_count, 0);
      await sock.sendMessage(from, {
        text: `┌─────────────────────❥
│ 📊 *GROUP STATS*
│ 👥 Group: *${groupMeta.subject}*
│ 💬 Total Messages: *${total}*
│ 👤 Active Users: *${activity.length}*
│ 🔝 Top User: *+${activity[0]?.user_jid?.split('@')[0] || 'None'}* (${activity[0]?.message_count || 0} msgs)
└─────────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'welcome': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const state = args[0]?.toLowerCase();
      if (state === 'on') {
        updateGroup(from, { welcome: 1 });
        await sock.sendMessage(from, { text: '✅ Welcome messages *ON*' }, { quoted: msg });
      } else if (state === 'off') {
        updateGroup(from, { welcome: 0 });
        await sock.sendMessage(from, { text: '✅ Welcome messages *OFF*' }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: 'Usage: .welcome on/off' }, { quoted: msg });
      }
      return true;
    }

    case 'setwelcome': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Provide a welcome message!\nVariables: {user} {group}' }, { quoted: msg });
        return true;
      }
      updateGroup(from, { welcome_msg: text });
      await sock.sendMessage(from, { text: `✅ Welcome message set!\n\n${text}` }, { quoted: msg });
      return true;
    }

    case 'leave': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      const state = args[0]?.toLowerCase();
      if (state === 'on') {
        updateGroup(from, { leave: 1 });
        await sock.sendMessage(from, { text: '✅ Leave messages *ON*' }, { quoted: msg });
      } else {
        updateGroup(from, { leave: 0 });
        await sock.sendMessage(from, { text: '✅ Leave messages *OFF*' }, { quoted: msg });
      }
      return true;
    }

    case 'setleave': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Provide a leave message!' }, { quoted: msg });
        return true;
      }
      updateGroup(from, { leave_msg: text });
      await sock.sendMessage(from, { text: `✅ Leave message set!\n\n${text}` }, { quoted: msg });
      return true;
    }

    case 'promote': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      if (!requireBotAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ I need admin to promote!' }, { quoted: msg });
        return true;
      }
      const target = mentions[0] || ctx.quotedParticipant;
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user!' }, { quoted: msg });
        return true;
      }
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, {
        text: `⬆️ @${target.split('@')[0]} has been *promoted* to admin!`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'demote': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      if (!requireBotAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ I need admin to demote!' }, { quoted: msg });
        return true;
      }
      const target = mentions[0] || ctx.quotedParticipant;
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a user!' }, { quoted: msg });
        return true;
      }
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, {
        text: `⬇️ @${target.split('@')[0]} has been *demoted*!`,
        mentions: [target],
      }, { quoted: msg });
      return true;
    }

    case 'mute': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      if (!requireBotAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ I need admin to mute group!' }, { quoted: msg });
        return true;
      }
      await sock.groupSettingUpdate(from, 'announcement');
      updateGroup(from, { muted: 1 });
      await sock.sendMessage(from, { text: '🔇 Group has been *muted*! Only admins can send messages.' }, { quoted: msg });
      return true;
    }

    case 'unmute': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      if (!requireBotAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ I need admin to unmute!' }, { quoted: msg });
        return true;
      }
      await sock.groupSettingUpdate(from, 'not_announcement');
      updateGroup(from, { muted: 0 });
      await sock.sendMessage(from, { text: '🔊 Group has been *unmuted*!' }, { quoted: msg });
      return true;
    }

    case 'open': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: '🔓 Group is now *OPEN*!' }, { quoted: msg });
      return true;
    }

    case 'close': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: '🔒 Group is now *CLOSED*!' }, { quoted: msg });
      return true;
    }

    case 'hidetag': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const participants = groupMeta.participants.map(p => p.id);
      const msgText = text || '📢 Hidden tag - all members notified';
      await sock.sendMessage(from, {
        text: msgText,
        mentions: participants,
      }, { quoted: msg });
      return true;
    }

    case 'tagall': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) {
        await sock.sendMessage(from, { text: '❌ Admin only!' }, { quoted: msg });
        return true;
      }
      const participants = groupMeta.participants.map(p => p.id);
      const lines = participants.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n');
      const announcement = text || '📢 Attention everyone!';

      await sock.sendMessage(from, {
        text: `╔══『 📢 *TAGALL* 』══╗\n\n${announcement}\n\n${lines}\n\n╚══『 🌸 *Shadow Garden* 』══╝`,
        mentions: participants,
      }, { quoted: msg });
      return true;
    }

    case 'activity': {
      if (!isGroup) return false;
      const activities = getActivity(from);
      if (!activities.length) {
        await sock.sendMessage(from, { text: '📊 No activity data yet!' }, { quoted: msg });
        return true;
      }
      const top10 = activities.slice(0, 10);
      const lines = top10.map((a, i) => `${i + 1}. +${a.user_jid.split('@')[0]} — *${a.message_count}* msgs`).join('\n');
      await sock.sendMessage(from, {
        text: `📊 *GROUP ACTIVITY*\n\n${lines}`,
      }, { quoted: msg });
      return true;
    }

    case 'active': {
      if (!isGroup) return false;
      const activities = getActivity(from);
      const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const active = activities.filter(a => new Date(a.last_active).getTime() > last7Days);
      const lines = active.slice(0, 15).map(a => `• +${a.user_jid.split('@')[0]}`).join('\n');
      await sock.sendMessage(from, {
        text: `✅ *ACTIVE MEMBERS* (last 7 days)\n\n${lines || 'No active members found'}`,
      }, { quoted: msg });
      return true;
    }

    case 'inactive': {
      if (!isGroup) return false;
      if (!groupMeta) return false;
      const activities = getActivity(from);
      const activeJids = new Set(activities.map(a => a.user_jid));
      const allMembers = groupMeta.participants.map(p => p.id);
      const inactive = allMembers.filter(j => !activeJids.has(j));
      const lines = inactive.slice(0, 15).map(j => `• +${j.split('@')[0]}`).join('\n');
      await sock.sendMessage(from, {
        text: `😴 *INACTIVE MEMBERS*\n\n${lines || 'All members are active!'}`,
      }, { quoted: msg });
      return true;
    }

    case 'antism':
    case 'antisp': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      const state = args[0]?.toLowerCase();
      if (state === 'on') {
        updateGroup(from, { antispam: 1 });
        await sock.sendMessage(from, { text: '✅ Anti-spam *ON*' }, { quoted: msg });
      } else {
        updateGroup(from, { antispam: 0 });
        await sock.sendMessage(from, { text: '✅ Anti-spam *OFF*' }, { quoted: msg });
      }
      return true;
    }

    case 'blacklist': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      const sub = args[0]?.toLowerCase();
      if (sub === 'add') {
        const word = args.slice(1).join(' ');
        if (!word) {
          await sock.sendMessage(from, { text: '❌ Provide a word!' }, { quoted: msg });
          return true;
        }
        addBlacklist(from, word);
        await sock.sendMessage(from, { text: `✅ *"${word}"* added to blacklist!` }, { quoted: msg });
      } else if (sub === 'remove') {
        const word = args.slice(1).join(' ');
        removeBlacklist(from, word);
        await sock.sendMessage(from, { text: `✅ *"${word}"* removed from blacklist!` }, { quoted: msg });
      } else if (sub === 'list') {
        const list = getBlacklist(from);
        await sock.sendMessage(from, {
          text: `🚫 *BLACKLISTED WORDS*\n\n${list.length ? list.map((w, i) => `${i + 1}. ${w}`).join('\n') : 'No words blacklisted'}`,
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: 'Usage:\n.blacklist add [word]\n.blacklist remove [word]\n.blacklist list' }, { quoted: msg });
      }
      return true;
    }

    case 'purge': {
      if (!isGroup) return false;
      if (!requireAdmin(ctx)) return true;
      // Note: WhatsApp doesn't support bulk delete officially, so we delete the quoted message
      const quoted = msg.message?.extendedTextMessage?.contextInfo;
      if (quoted?.stanzaId) {
        await sock.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: quoted.stanzaId,
            participant: quoted.participant,
          }
        });
        await sock.sendMessage(from, { text: '🗑️ Message purged!' }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: '❌ Reply to a message to purge it!' }, { quoted: msg });
      }
      return true;
    }

    default:
      return false;
  }
}
