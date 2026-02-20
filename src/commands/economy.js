import { getUser, updateUser, isRegistered, registerUser, getInventory, addItem, removeItem, getRichList, getGlobalRichList } from '../database/db.js';
import { formatNumber, getRandomInt, getRandom } from '../utils.js';
import { config } from '../config.js';

const SHOP_ITEMS = config.shopItems;

export async function handleEconomy(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, groupMeta, isOwner, isGroup } = ctx;
  const user = getUser(sender);

  switch (command) {
    case 'register':
    case 'reg': {
      if (isRegistered(sender)) {
        await sock.sendMessage(from, { text: '✅ You are already registered!' }, { quoted: msg });
        return true;
      }
      const name = text || pushName || senderNum;
      registerUser(sender, name);
      updateUser(sender, { coins: config.startingCoins });
      await sock.sendMessage(from, {
        text: `🎉 *WELCOME TO SHADOW GARDEN!*\n\n👤 Name: *${name}*\n📱 Number: *+${senderNum}*\n💰 Coins: *${formatNumber(config.startingCoins)}*\n\nYou have been registered! Use *.profile* to view your stats.`,
      }, { quoted: msg });
      return true;
    }

    case 'profile':
    case 'p': {
      const target = ctx.mentions[0] ? getUser(ctx.mentions[0]) : user;
      const targetNum = ctx.mentions[0]?.split('@')[0] || senderNum;
      const inv = getInventory(ctx.mentions[0] || sender);
      const badge = target.coins >= 100000 ? '💎 VIP' : target.premium ? '⭐ Premium' : '👤 Member';

      await sock.sendMessage(from, {
        text: `┌──────────────────────❥
│ 👤 *PROFILE*
│
│ 📛 Name: *${target.reg_name || target.name || targetNum}*
│ 📱 Number: *+${targetNum}*
│ ${badge}
│
│ 💰 Wallet: *${formatNumber(target.coins)} coins*
│ 🏦 Bank: *${formatNumber(target.bank)} coins*
│ 💎 Gems: *${target.gems}*
│ ⚠️ Warnings: *${target.warnings}/3*
│
│ 📝 Bio: *${target.bio || 'No bio set'}*
│ 🎂 Age: *${target.age || 'Not set'}*
│ 🎒 Inventory: *${inv.length} items*
│ 📅 Joined: *${new Date(target.created_at).toDateString()}*
└──────────────────────❥`,
      }, { quoted: msg });
      return true;
    }

    case 'setname':
    case 'rename': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Provide a name!' }, { quoted: msg });
        return true;
      }
      updateUser(sender, { reg_name: text, name: text });
      await sock.sendMessage(from, { text: `✅ Name updated to *${text}*!` }, { quoted: msg });
      return true;
    }

    case 'bio': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Provide a bio!' }, { quoted: msg });
        return true;
      }
      updateUser(sender, { bio: text });
      await sock.sendMessage(from, { text: `✅ Bio updated!` }, { quoted: msg });
      return true;
    }

    case 'setage': {
      if (!args[0]) {
        await sock.sendMessage(from, { text: '❌ Provide your age!' }, { quoted: msg });
        return true;
      }
      updateUser(sender, { age: args[0] });
      await sock.sendMessage(from, { text: `✅ Age set to *${args[0]}*!` }, { quoted: msg });
      return true;
    }

    case 'moneybalance':
    case 'mbal': {
      await sock.sendMessage(from, {
        text: `💰 *WALLET BALANCE*\n\n👤 User: *+${senderNum}*\n💵 Coins: *${formatNumber(user.coins)}*\n\nUse *.deposit* to move coins to bank.`,
      }, { quoted: msg });
      return true;
    }

    case 'gems': {
      await sock.sendMessage(from, {
        text: `💎 *GEMS BALANCE*\n\n👤 User: *+${senderNum}*\n💎 Gems: *${user.gems}*`,
      }, { quoted: msg });
      return true;
    }

    case 'premiumbal':
    case 'pbal': {
      await sock.sendMessage(from, {
        text: `⭐ *PREMIUM BALANCE*\n\n👤 User: *+${senderNum}*\n✨ Premium: *${user.premium ? 'Active ✅' : 'Inactive ❌'}*`,
      }, { quoted: msg });
      return true;
    }

    case 'daily': {
      const lastDaily = user.last_daily ? new Date(user.last_daily).getTime() : 0;
      const now = Date.now();
      const cooldown = config.dailyCooldown;

      if (now - lastDaily < cooldown && !isOwner) {
        const remaining = cooldown - (now - lastDaily);
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        await sock.sendMessage(from, {
          text: `⏰ *Daily already claimed!*\n\nCome back in *${hours}h ${mins}m*`,
        }, { quoted: msg });
        return true;
      }

      const dailyBooster = (await import('../database/db.js')).getInventory(sender).find(i => i.item_name === 'Daily Booster');
      let amount = config.dailyAmount;
      if (dailyBooster) {
        amount *= 2;
        removeItem(sender, 'Daily Booster');
      }

      updateUser(sender, {
        coins: user.coins + amount,
        last_daily: new Date().toISOString(),
      });

      await sock.sendMessage(from, {
        text: `🎁 *DAILY REWARD*\n\n👤 +${senderNum}\n💰 You received: *${formatNumber(amount)} coins*${dailyBooster ? ' (2x booster!)' : ''}\n\n💵 New Balance: *${formatNumber(user.coins + amount)} coins*`,
      }, { quoted: msg });
      return true;
    }

    case 'withdraw':
    case 'wid': {
      const amount = isOwner ? parseInt(args[0]) : parseInt(args[0]);
      if (!amount || isNaN(amount) || amount <= 0) {
        await sock.sendMessage(from, { text: '❌ Usage: .withdraw [amount]' }, { quoted: msg });
        return true;
      }
      if (user.bank < amount && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Not enough in bank! Bank: *${formatNumber(user.bank)}*` }, { quoted: msg });
        return true;
      }
      updateUser(sender, {
        coins: user.coins + amount,
        bank: isOwner ? user.bank : user.bank - amount,
      });
      await sock.sendMessage(from, {
        text: `✅ *WITHDRAWAL*\n\n💵 Withdrawn: *${formatNumber(amount)} coins*\n💰 Wallet: *${formatNumber(user.coins + amount)}*\n🏦 Bank: *${formatNumber(isOwner ? user.bank : user.bank - amount)}*`,
      }, { quoted: msg });
      return true;
    }

    case 'deposit':
    case 'dep': {
      const amount = parseInt(args[0]);
      if (!amount || isNaN(amount) || amount <= 0) {
        await sock.sendMessage(from, { text: '❌ Usage: .deposit [amount]' }, { quoted: msg });
        return true;
      }
      // Owner can deposit any amount regardless of wallet
      if (!isOwner && user.coins < amount) {
        await sock.sendMessage(from, { text: `❌ Not enough coins! Wallet: *${formatNumber(user.coins)}*` }, { quoted: msg });
        return true;
      }
      updateUser(sender, {
        coins: isOwner ? user.coins : user.coins - amount,
        bank: user.bank + amount,
      });
      await sock.sendMessage(from, {
        text: `✅ *DEPOSIT*\n\n🏦 Deposited: *${formatNumber(amount)} coins*\n💰 Wallet: *${formatNumber(isOwner ? user.coins : user.coins - amount)}*\n🏦 Bank: *${formatNumber(user.bank + amount)}*`,
      }, { quoted: msg });
      return true;
    }

    case 'donate': {
      const target = ctx.mentions[0];
      const amount = parseInt(args[args.length - 1]);
      if (!target || !amount || isNaN(amount)) {
        await sock.sendMessage(from, { text: '❌ Usage: .donate @user [amount]' }, { quoted: msg });
        return true;
      }
      if (user.coins < amount && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Not enough coins!` }, { quoted: msg });
        return true;
      }
      const targetUser = getUser(target);
      updateUser(sender, { coins: isOwner ? user.coins : user.coins - amount });
      updateUser(target, { coins: targetUser.coins + amount });
      await sock.sendMessage(from, {
        text: `💝 *DONATION*\n\n📤 From: *+${senderNum}*\n📥 To: *@${target.split('@')[0]}*\n💰 Amount: *${formatNumber(amount)} coins*`,
        mentions: [sender, target],
      }, { quoted: msg });
      return true;
    }

    case 'lottery': {
      const cost = 1000;
      if (user.coins < cost && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Lottery costs *${cost} coins*! You have *${formatNumber(user.coins)}*` }, { quoted: msg });
        return true;
      }
      const win = Math.random() < 0.2; // 20% chance
      const prize = getRandomInt(5000, 50000);
      if (!isOwner) updateUser(sender, { coins: user.coins - cost + (win ? prize : 0) });
      await sock.sendMessage(from, {
        text: `🎰 *LOTTERY*\n\n🎟️ Ticket cost: *${cost} coins*\n\n${win ? `🎉 *YOU WON ${formatNumber(prize)} COINS!*` : '❌ *Better luck next time!*'}`,
      }, { quoted: msg });
      return true;
    }

    case 'richlist': {
      let participants = [];
      if (isGroup && groupMeta) {
        participants = groupMeta.participants.map(p => p.id);
      }
      const list = isGroup ? getRichList(from, participants) : getGlobalRichList();
      const lines = list.map((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} *+${u.jid.split('@')[0]}* — ${formatNumber(u.coins)} coins`;
      }).join('\n');
      await sock.sendMessage(from, {
        text: `🏆 *RICH LIST* ${isGroup ? '(Group)' : '(Global)'}\n\n${lines || 'No data yet'}`,
      }, { quoted: msg });
      return true;
    }

    case 'richlistglobal':
    case 'richlg': {
      const list = getGlobalRichList();
      const lines = list.map((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} *+${u.jid.split('@')[0]}* — ${formatNumber(u.coins)} coins`;
      }).join('\n');
      await sock.sendMessage(from, {
        text: `🌍 *GLOBAL RICH LIST*\n\n${lines || 'No data yet'}`,
      }, { quoted: msg });
      return true;
    }

    case 'leaderboard':
    case 'lb': {
      const list = getGlobalRichList();
      const lines = list.map((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} *+${u.jid.split('@')[0]}* — ${formatNumber(u.coins)} coins`;
      }).join('\n');
      await sock.sendMessage(from, {
        text: `🏆 *LEADERBOARD*\n\n${lines || 'No data yet'}`,
      }, { quoted: msg });
      return true;
    }

    case 'inventory':
    case 'inv': {
      const inv = getInventory(sender);
      if (!inv.length) {
        await sock.sendMessage(from, { text: '🎒 Your inventory is empty! Visit *.shop* to buy items.' }, { quoted: msg });
        return true;
      }
      const lines = inv.map((i, idx) => `${idx + 1}. *${i.item_name}* x${i.quantity}`).join('\n');
      await sock.sendMessage(from, {
        text: `🎒 *YOUR INVENTORY*\n\n${lines}`,
      }, { quoted: msg });
      return true;
    }

    case 'use': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .use [item name]' }, { quoted: msg });
        return true;
      }
      const inv = getInventory(sender);
      const item = inv.find(i => i.item_name.toLowerCase() === text.toLowerCase());
      if (!item) {
        await sock.sendMessage(from, { text: `❌ You don't have *${text}*!` }, { quoted: msg });
        return true;
      }
      removeItem(sender, item.item_name);
      const effects = {
        'Lucky Clover': '🍀 Lucky Clover activated! Your next gamble has a 10% boost!',
        'Daily Booster': '⚡ Daily Booster activated! Your next .daily gives 2x coins!',
        'Fishing Rod': '🎣 Fishing Rod equipped! .fish gives better rewards!',
        'Shovel': '⛏️ Shovel equipped! .dig gives better rewards!',
      };
      await sock.sendMessage(from, {
        text: `✅ Used *${item.item_name}*!\n\n${effects[item.item_name] || '✨ Item used!'}`,
      }, { quoted: msg });
      return true;
    }

    case 'sell': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .sell [item name]' }, { quoted: msg });
        return true;
      }
      const inv = getInventory(sender);
      const item = inv.find(i => i.item_name.toLowerCase() === text.toLowerCase());
      if (!item) {
        await sock.sendMessage(from, { text: `❌ You don't have *${text}*!` }, { quoted: msg });
        return true;
      }
      const shopItem = SHOP_ITEMS.find(s => s.name.toLowerCase() === text.toLowerCase());
      const sellPrice = shopItem ? Math.floor(shopItem.price * 0.5) : 100;
      removeItem(sender, item.item_name);
      updateUser(sender, { coins: user.coins + sellPrice });
      await sock.sendMessage(from, {
        text: `✅ Sold *${item.item_name}* for *${formatNumber(sellPrice)} coins*!`,
      }, { quoted: msg });
      return true;
    }

    case 'shop': {
      const lines = SHOP_ITEMS.map((i, idx) => `${idx + 1}. *${i.name}*\n   💰 ${formatNumber(i.price)} coins\n   📝 ${i.description}`).join('\n\n');
      await sock.sendMessage(from, {
        text: `🛒 *SHADOW GARDEN SHOP*\n\n${lines}\n\n💡 Use *.buy [item name]* to purchase`,
      }, { quoted: msg });
      return true;
    }

    case 'buy': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .buy [item name]' }, { quoted: msg });
        return true;
      }
      const shopItem = SHOP_ITEMS.find(i => i.name.toLowerCase() === text.toLowerCase());
      if (!shopItem) {
        await sock.sendMessage(from, { text: `❌ Item *${text}* not found in shop!` }, { quoted: msg });
        return true;
      }
      if (user.coins < shopItem.price && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Not enough coins! Need *${formatNumber(shopItem.price)}*, have *${formatNumber(user.coins)}*` }, { quoted: msg });
        return true;
      }
      if (!isOwner) updateUser(sender, { coins: user.coins - shopItem.price });
      addItem(sender, shopItem.name);
      await sock.sendMessage(from, {
        text: `✅ *PURCHASED!*\n\n🛍️ Item: *${shopItem.name}*\n💰 Cost: *${formatNumber(shopItem.price)} coins*\n💵 Remaining: *${formatNumber(isOwner ? user.coins : user.coins - shopItem.price)} coins*`,
      }, { quoted: msg });
      return true;
    }

    case 'dig': {
      const items = ['💎 Gem', '🪙 Old Coin', '🦴 Old Bone', '💍 Ring', '🗝️ Old Key', '🪨 Rock', '🌱 Seed', '🏺 Ancient Pot'];
      const found = getRandom(items);
      const isGood = found.includes('💎') || found.includes('💍') || found.includes('🪙');
      const coins = isGood ? getRandomInt(200, 1500) : getRandomInt(10, 100);
      updateUser(sender, { coins: user.coins + coins });
      if (found.includes('💎')) updateUser(sender, { gems: user.gems + 1 });
      await sock.sendMessage(from, {
        text: `⛏️ *DIGGING...*\n\n🌍 You dug in the ground and found...\n\n${found}!\n\n💰 +${coins} coins${found.includes('💎') ? '\n💎 +1 Gem!' : ''}`,
      }, { quoted: msg });
      return true;
    }

    case 'fish': {
      const catches = ['🐟 Small Fish', '🐠 Tropical Fish', '🐡 Blowfish', '🦑 Squid', '🦐 Shrimp', '🦞 Lobster', '🦀 Crab', '🐙 Octopus', '❌ Old Boot', '💦 Nothing'];
      const caught = getRandom(catches);
      const isGood = !caught.includes('❌') && !caught.includes('💦');
      const coins = isGood ? getRandomInt(100, 2000) : 0;
      if (coins > 0) updateUser(sender, { coins: user.coins + coins });
      await sock.sendMessage(from, {
        text: `🎣 *FISHING...*\n\n🌊 Casting the line...\n\nYou caught: ${caught}!\n\n${coins > 0 ? `💰 +${coins} coins` : '😅 No coins this time'}`,
      }, { quoted: msg });
      return true;
    }

    case 'beg': {
      const responses = [
        { text: 'A kind stranger gave you coins!', coins: getRandomInt(50, 500) },
        { text: 'You begged but nobody cared 😢', coins: 0 },
        { text: 'Someone threw you their spare change!', coins: getRandomInt(10, 200) },
        { text: 'A rich person donated to you!', coins: getRandomInt(500, 2000) },
        { text: 'You were ignored... 🥺', coins: 0 },
      ];
      const result = getRandom(responses);
      if (result.coins > 0) updateUser(sender, { coins: user.coins + result.coins });
      await sock.sendMessage(from, {
        text: `🙏 *BEGGING...*\n\n${result.text}\n\n${result.coins > 0 ? `💰 +${result.coins} coins` : '😢 Nothing earned'}`,
      }, { quoted: msg });
      return true;
    }

    case 'roast': {
      const roasts = [
        "You're the human equivalent of a participation trophy.",
        "I'd explain it to you but I don't have crayons.",
        "You have the brain of a pencil, and the beauty of an eraser.",
        "Your WiFi password is probably 'password123'.",
        "You're proof that even nature makes mistakes.",
        "I've seen better ideas come from a Magic 8-Ball.",
        "You're like a cloud - when you disappear, it's a beautiful day!",
        "I'd call you dim but that would be a compliment.",
      ];
      const target = ctx.mentions[0];
      const roast = getRandom(roasts);
      await sock.sendMessage(from, {
        text: `🔥 *ROASTED!*\n\n${target ? `@${target.split('@')[0]}` : pushName}: ${roast}`,
        mentions: target ? [target] : [],
      }, { quoted: msg });
      return true;
    }

    case 'gamble': {
      const bet = parseInt(args[0]);
      if (!bet || isNaN(bet) || bet <= 0) {
        await sock.sendMessage(from, { text: '❌ Usage: .gamble [amount]' }, { quoted: msg });
        return true;
      }
      if (user.coins < bet && !isOwner) {
        await sock.sendMessage(from, { text: `❌ Not enough coins! You have *${formatNumber(user.coins)}*` }, { quoted: msg });
        return true;
      }
      const win = Math.random() < 0.45;
      const prize = win ? Math.floor(bet * 1.8) : -bet;
      if (!isOwner) updateUser(sender, { coins: user.coins + prize });
      await sock.sendMessage(from, {
        text: `🎰 *GAMBLE*\n\n💰 Bet: *${formatNumber(bet)} coins*\n\n${win ? `🎉 *YOU WON ${formatNumber(prize)} coins!*` : `😢 *You lost ${formatNumber(bet)} coins!*`}\n\n💵 Balance: *${formatNumber(isOwner ? user.coins : user.coins + prize)} coins*`,
      }, { quoted: msg });
      return true;
    }

    default:
      return false;
  }
}
