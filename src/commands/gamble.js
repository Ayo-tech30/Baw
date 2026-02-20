import { getUser, updateUser } from '../database/db.js';
import { getRandom, getRandomInt, formatNumber } from '../utils.js';
import { config } from '../config.js';

export async function handleGamble(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, isOwner } = ctx;
  const user = getUser(sender);

  switch (command) {
    case 'slots': {
      const cost = parseInt(args[0]) || 100;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins* to play slots! You have *${formatNumber(user.coins)}*` }, { quoted: msg });
        return true;
      }
      const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🔔', '🍇', '🍀'];
      const s1 = getRandom(symbols), s2 = getRandom(symbols), s3 = getRandom(symbols);
      let win = 0;
      if (s1 === s2 && s2 === s3) {
        win = s1 === '💎' ? cost * 10 : s1 === '⭐' ? cost * 7 : cost * 5;
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        win = Math.floor(cost * 1.5);
      }
      if (!isOwner) updateUser(sender, { coins: user.coins - cost + win });
      await sock.sendMessage(from, {
        text: `🎰 *SLOTS*\n\n┌─────────┐\n│ ${s1} │ ${s2} │ ${s3} │\n└─────────┘\n\n${win > 0 ? `🎉 *YOU WON ${formatNumber(win)} coins!*` : '😢 *Better luck next time!*'}\n\n💰 Balance: *${formatNumber(isOwner ? user.coins : user.coins - cost + win)}*`,
      }, { quoted: msg });
      return true;
    }

    case 'dice': {
      const cost = parseInt(args[0]) || 100;
      const guess = parseInt(args[1]);
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      const rolled = getRandomInt(1, 6);
      const dices = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const win = guess === rolled ? Math.floor(cost * 5) : 0;
      if (!isOwner) updateUser(sender, { coins: user.coins - cost + win });
      await sock.sendMessage(from, {
        text: `🎲 *DICE ROLL*\n\n${dices[rolled - 1]} Rolled: *${rolled}*\n${guess ? `🎯 Your guess: *${guess}*\n\n${win > 0 ? '🎉 *CORRECT! You won ' + formatNumber(win) + ' coins!*' : '❌ *Wrong! Lost ' + formatNumber(cost) + '*'}` : `\n${rolled > 3 ? '⬆️ High roll!' : '⬇️ Low roll!'}`}`,
      }, { quoted: msg });
      return true;
    }

    case 'casino': {
      const cost = parseInt(args[0]) || 500;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      const games = ['Blackjack 🃏', 'Poker 🎴', 'Roulette 🎡', 'Baccarat 🎰'];
      const game = getRandom(games);
      const win = Math.random() < 0.4;
      const prize = win ? Math.floor(cost * 2.5) : -cost;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      await sock.sendMessage(from, {
        text: `🎰 *CASINO - ${game}*\n\n💰 Bet: *${formatNumber(cost)}*\n\n${win ? `🎉 *YOU WON ${formatNumber(prize)} coins!*` : `😢 *Lost ${formatNumber(cost)} coins!*`}\n\n💵 Balance: *${formatNumber(isOwner ? user.coins : user.coins + prize)}*`,
      }, { quoted: msg });
      return true;
    }

    case 'coinflip':
    case 'cf': {
      const cost = parseInt(args[0]) || 100;
      const guess = args[1]?.toLowerCase();
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      if (!guess || !['heads', 'tails', 'h', 't'].includes(guess)) {
        await sock.sendMessage(from, { text: '❌ Usage: .cf [amount] [heads/tails]' }, { quoted: msg });
        return true;
      }
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const playerGuess = ['h', 'heads'].includes(guess) ? 'heads' : 'tails';
      const win = result === playerGuess;
      if (!isOwner) updateUser(sender, { coins: user.coins + (win ? cost : -cost) });
      await sock.sendMessage(from, {
        text: `🪙 *COIN FLIP*\n\n${result === 'heads' ? '👑 HEADS' : '💰 TAILS'}\n\nYour guess: *${playerGuess}*\n\n${win ? `🎉 *CORRECT! +${formatNumber(cost)} coins*` : `❌ *Wrong! -${formatNumber(cost)} coins*`}`,
      }, { quoted: msg });
      return true;
    }

    case 'doublebet':
    case 'db': {
      const cost = parseInt(args[0]) || 100;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      const win = Math.random() < 0.45;
      const prize = win ? cost * 2 : -cost;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      await sock.sendMessage(from, {
        text: `🎯 *DOUBLE BET*\n\n💰 Bet: *${formatNumber(cost)}*\n🎰 Possible win: *${formatNumber(cost * 2)}*\n\n${win ? `🎉 *DOUBLED! +${formatNumber(cost * 2)} coins*` : `😢 *Lost ${formatNumber(cost)} coins*`}`,
      }, { quoted: msg });
      return true;
    }

    case 'doublepayout':
    case 'dp': {
      const cost = parseInt(args[0]) || 200;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      const win = Math.random() < 0.3; // lower chance, higher payout
      const prize = win ? cost * 4 : -cost;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      await sock.sendMessage(from, {
        text: `💰 *DOUBLE PAYOUT*\n\n💰 Bet: *${formatNumber(cost)}*\n🎯 Possible win: *${formatNumber(cost * 4)}* (4x!)\n\n${win ? `🎉 *4X PAYOUT! +${formatNumber(cost * 4)} coins*` : `😢 *Lost ${formatNumber(cost)} coins*`}`,
      }, { quoted: msg });
      return true;
    }

    case 'roulette': {
      const cost = parseInt(args[0]) || 100;
      const color = args[1]?.toLowerCase();
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      if (!color || !['red', 'black', 'green'].includes(color)) {
        await sock.sendMessage(from, { text: '❌ Usage: .roulette [amount] [red/black/green]' }, { quoted: msg });
        return true;
      }
      const r = Math.random();
      const result = r < 0.025 ? 'green' : r < 0.5125 ? 'red' : 'black';
      const resultEmoji = result === 'red' ? '🔴' : result === 'black' ? '⚫' : '🟢';
      const win = result === color;
      const multiplier = color === 'green' ? 14 : 2;
      const prize = win ? Math.floor(cost * multiplier) : -cost;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      await sock.sendMessage(from, {
        text: `🎡 *ROULETTE*\n\n${resultEmoji} Ball landed on: *${result.toUpperCase()}*\n\nYour bet: *${color}* | ${cost} coins\n\n${win ? `🎉 *WON ${formatNumber(prize)} coins!* (${multiplier}x)` : `😢 *Lost ${formatNumber(cost)} coins*`}`,
      }, { quoted: msg });
      return true;
    }

    case 'horse': {
      const cost = parseInt(args[0]) || 200;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
        return true;
      }
      const horses = ['🐴 Thunder', '🐎 Lightning', '🐴 Shadow', '🐎 Storm'];
      const picked = parseInt(args[1]) || getRandomInt(1, 4);
      const winner = getRandomInt(1, 4);
      const win = picked === winner;
      const prize = win ? Math.floor(cost * 4) : -cost;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      const raceResult = horses.map((h, i) => `${i + 1}. ${h} ${i + 1 === winner ? '🏆' : ''}`).join('\n');
      await sock.sendMessage(from, {
        text: `🏇 *HORSE RACE*\n\nResults:\n${raceResult}\n\nYou bet on horse *${picked}*\nWinner: *${horses[winner - 1]}*\n\n${win ? `🎉 *WON ${formatNumber(prize)} coins!*` : `😢 *Lost ${formatNumber(cost)} coins*`}`,
      }, { quoted: msg });
      return true;
    }

    case 'spin':
    case 'spinwheel': {
      if (text?.toLowerCase()?.includes('wheel') || command === 'spinwheel') {
        const cost = parseInt(args[1]) || parseInt(args[0]) || 100;
        if (user.coins < cost && !isOwner) {
          await sock.sendMessage(from, { text: `❌ Need *${cost} coins*!` }, { quoted: msg });
          return true;
        }
        const outcomes = [
          { emoji: '💎', label: 'JACKPOT', multiplier: 10 },
          { emoji: '⭐', label: 'BIG WIN', multiplier: 5 },
          { emoji: '🍒', label: 'WIN', multiplier: 2 },
          { emoji: '🍋', label: 'SMALL WIN', multiplier: 1.5 },
          { emoji: '❌', label: 'LOSE', multiplier: 0 },
          { emoji: '❌', label: 'LOSE', multiplier: 0 },
          { emoji: '❌', label: 'LOSE', multiplier: 0 },
        ];
        const result = getRandom(outcomes);
        const prize = Math.floor(cost * result.multiplier) - cost;
        if (!isOwner) updateUser(sender, { coins: user.coins + prize });
        await sock.sendMessage(from, {
          text: `🎡 *SPIN WHEEL*\n\n${result.emoji} *${result.label}!*\n\n💰 Bet: ${formatNumber(cost)}\n${result.multiplier > 0 ? `🎉 Won: *${formatNumber(Math.floor(cost * result.multiplier))} coins*` : `😢 Lost: *${formatNumber(cost)} coins*`}`,
        }, { quoted: msg });
        return true;
      }
      return false;
    }

    default:
      return false;
  }
}
