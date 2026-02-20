import { getGroup } from '../database/db.js';

export async function handleGroupUpdate(sock, update) {
  const { id, participants, action } = update;
  const grp = getGroup(id);

  if (!grp) return;

  if (action === 'add' && grp.welcome === 1) {
    for (const participant of participants) {
      const num = participant.split('@')[0];
      const welcomeMsg = (grp.welcome_msg || 'Welcome to {group}, @{user}! 🎉')
        .replace('{user}', num)
        .replace('{group}', 'the group');

      try {
        const meta = await sock.groupMetadata(id);
        const finalMsg = welcomeMsg
          .replace('{group}', meta.subject)
          .replace('{count}', meta.participants.length);

        await sock.sendMessage(id, {
          text: finalMsg,
          mentions: [participant],
        });
      } catch (e) {
        await sock.sendMessage(id, {
          text: `🎉 Welcome @${num} to the group!`,
          mentions: [participant],
        });
      }
    }
  }

  if (action === 'remove' && grp.leave === 1) {
    for (const participant of participants) {
      const num = participant.split('@')[0];
      const leaveMsg = (grp.leave_msg || 'Goodbye @{user}! 👋 We will miss you.')
        .replace('{user}', num);

      try {
        await sock.sendMessage(id, {
          text: leaveMsg,
          mentions: [participant],
        });
      } catch (e) {}
    }
  }
}
