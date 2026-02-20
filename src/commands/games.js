import { getRandom, getRandomInt } from '../utils.js';

// Simple in-memory game states
const tttGames = new Map();
const c4Games = new Map();
const wcgGames = new Map();
const battleGames = new Map();

export async function handleGames(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, mentions } = ctx;

  switch (command) {
    case 'tictactoe':
    case 'ttt': {
      const target = mentions[0];
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a player to challenge! .ttt @user' }, { quoted: msg });
        return true;
      }
      if (target === sender) {
        await sock.sendMessage(from, { text: "❌ You can't play with yourself!" }, { quoted: msg });
        return true;
      }

      const gameId = `${from}_ttt`;
      const board = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
      tttGames.set(gameId, {
        board,
        players: [sender, target],
        symbols: ['❌', '⭕'],
        turn: 0,
      });

      const boardStr = `${board[0]}${board[1]}${board[2]}\n${board[3]}${board[4]}${board[5]}\n${board[6]}${board[7]}${board[8]}`;
      await sock.sendMessage(from, {
        text: `🎮 *TIC TAC TOE*\n\n@${senderNum} (❌) vs @${target.split('@')[0]} (⭕)\n\n${boardStr}\n\n*@${senderNum}'s turn!*\nReply with a number (1-9)`,
        mentions: [sender, target],
      }, { quoted: msg });

      // Simple listener for next move
      return true;
    }

    case 'chess': {
      await sock.sendMessage(from, {
        text: `♟️ *CHESS*\n\n🚧 Chess is coming soon!\n\nFor now, challenge someone on:\n🌐 https://lichess.org or https://chess.com\n\nThen share the game link here!`,
      }, { quoted: msg });
      return true;
    }

    case 'akinator':
    case 'aki': {
      await sock.sendMessage(from, {
        text: `🧞 *AKINATOR*\n\n🎮 Play Akinator online:\n🌐 https://en.akinator.com\n\nThink of a character and let Akinator guess it!`,
      }, { quoted: msg });
      return true;
    }

    case 'greekgod':
    case 'gg': {
      const gods = [
        { name: 'Zeus ⚡', power: 'King of Gods, Lightning' },
        { name: 'Poseidon 🌊', power: 'God of the Sea' },
        { name: 'Ares ⚔️', power: 'God of War' },
        { name: 'Athena 🦉', power: 'Goddess of Wisdom' },
        { name: 'Apollo ☀️', power: 'God of the Sun' },
        { name: 'Artemis 🌙', power: 'Goddess of the Moon' },
        { name: 'Hades 💀', power: 'God of the Underworld' },
        { name: 'Hermes 🪽', power: 'Messenger of Gods' },
        { name: 'Aphrodite 💕', power: 'Goddess of Love' },
        { name: 'Hephaestus 🔨', power: 'God of Fire' },
      ];
      const god = getRandom(gods);
      await sock.sendMessage(from, {
        text: `⚡ *YOUR GREEK GOD*\n\n👤 *${pushName}*\n\n🏛️ God: *${god.name}*\n💫 Power: *${god.power}*`,
      }, { quoted: msg });
      return true;
    }

    case 'connectfour':
    case 'c4': {
      const target = mentions[0];
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a player! .c4 @user' }, { quoted: msg });
        return true;
      }
      const board = Array(6).fill(null).map(() => Array(7).fill('⬜'));
      const boardStr = board.map(row => row.join('')).join('\n') + '\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
      await sock.sendMessage(from, {
        text: `🔴🟡 *CONNECT FOUR*\n\n@${senderNum} (🔴) vs @${target.split('@')[0]} (🟡)\n\n${boardStr}\n\n*@${senderNum}'s turn!*\nReply with column (1-7)`,
        mentions: [sender, target],
      }, { quoted: msg });
      return true;
    }

    case 'wordchain':
    case 'wcg': {
      const starters = ['Apple', 'Elephant', 'Tiger', 'Robot', 'Thunder', 'Dragon', 'Magic', 'Night', 'Gold', 'River'];
      const word = getRandom(starters);
      wcgGames.set(from, { lastWord: word, used: new Set([word.toLowerCase()]) });
      await sock.sendMessage(from, {
        text: `📝 *WORD CHAIN GAME*\n\nRules: Each word must start with the last letter of the previous word!\n\nI start: *${word}*\n\nYour turn! (must start with *"${word.slice(-1).toUpperCase()}"*)`,
      }, { quoted: msg });
      return true;
    }

    case 'startbattle': {
      const target = mentions[0];
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a player to battle! .startbattle @user' }, { quoted: msg });
        return true;
      }
      const p1hp = getRandomInt(80, 100);
      const p2hp = getRandomInt(80, 100);
      const attacks = ['Fireball 🔥', 'Ice Blast ❄️', 'Thunder ⚡', 'Shadow Strike 🌑', 'Wind Slash 🌪️', 'Dragon Punch 🐉'];
      const p1atk = getRandom(attacks);
      const p2atk = getRandom(attacks);
      const p1dmg = getRandomInt(20, 50);
      const p2dmg = getRandomInt(20, 50);
      const p1remaining = Math.max(0, p1hp - p2dmg);
      const p2remaining = Math.max(0, p2hp - p1dmg);
      const winner = p1remaining > p2remaining ? `@${senderNum}` : `@${target.split('@')[0]}`;

      await sock.sendMessage(from, {
        text: `⚔️ *BATTLE!*\n\n🧙 @${senderNum} (❤️ ${p1hp} HP)\nvs\n🧙 @${target.split('@')[0]} (❤️ ${p2hp} HP)\n\n📜 *Round 1:*\n@${senderNum} uses *${p1atk}*! (-${p1dmg} dmg)\n@${target.split('@')[0]} uses *${p2atk}*! (-${p2dmg} dmg)\n\n❤️ @${senderNum}: ${p1remaining} HP\n❤️ @${target.split('@')[0]}: ${p2remaining} HP\n\n🏆 *Winner: ${winner}!*`,
        mentions: [sender, target],
      }, { quoted: msg });
      return true;
    }

    case 'truth':
    case 'dare': {
      // Handle "truth or dare" command
      if (command === 'truth' && text?.toLowerCase().startsWith('or dare')) {
        const choices = ['truth', 'dare'];
        const choice = getRandom(choices);
        await sock.sendMessage(from, {
          text: `🎭 *TRUTH OR DARE*\n\n@${senderNum} chose: *${choice.toUpperCase()}!*`,
          mentions: [sender],
        }, { quoted: msg });
        return true;
      }
      return false; // pass to fun handler
    }

    default:
      return false;
  }
}
