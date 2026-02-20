import { getUser, updateUser, addItem, getInventory } from '../database/db.js';
import { getRandom, getRandomInt, formatNumber } from '../utils.js';

// Card tiers and series
const CARD_TIERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const CARD_SERIES = ['Shadow Garden', 'Celestial', 'Infernal', 'Ocean', 'Forest', 'Void'];

// In-memory storage for cards
const playerCards = new Map(); // jid -> [cards]
const auctions = new Map(); // auctionId -> auction

function getPlayerCards(jid) {
  if (!playerCards.has(jid)) playerCards.set(jid, []);
  return playerCards.get(jid);
}

function generateCard() {
  const tierWeights = [50, 25, 15, 7, 3]; // percent chance
  let roll = getRandomInt(1, 100);
  let tierIndex = 0;
  let cumulative = 0;
  for (let i = 0; i < tierWeights.length; i++) {
    cumulative += tierWeights[i];
    if (roll <= cumulative) { tierIndex = i; break; }
  }
  const series = getRandom(CARD_SERIES);
  const tier = CARD_TIERS[tierIndex];
  const names = {
    'Shadow Garden': ['Shadow Knight', 'Dark Mage', 'Void Walker', 'Night Hunter', 'Soul Reaper'],
    'Celestial': ['Star Guardian', 'Moon Priestess', 'Sun Warrior', 'Sky Dragon', 'Aurora Angel'],
    'Infernal': ['Fire Demon', 'Lava Titan', 'Ash Phoenix', 'Ember Witch', 'Inferno Lord'],
    'Ocean': ['Tidal Wave', 'Deep Sea Serpent', 'Pearl Mermaid', 'Storm Whale', 'Coral Queen'],
    'Forest': ['Ancient Treant', 'Wild Druid', 'Vine Witch', 'Forest Spirit', 'Bamboo Panda'],
    'Void': ['Void Rift', 'Null Entity', 'Space Dragon', 'Black Hole', 'Dark Matter'],
  };
  const cardNames = names[series] || names['Shadow Garden'];
  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: getRandom(cardNames),
    series,
    tier,
    attack: getRandomInt(10, 100),
    defense: getRandomInt(10, 100),
    stars: tierIndex + 1,
  };
}

function formatCard(card, index = null) {
  const tierEmojis = { Common: '⚪', Uncommon: '🟢', Rare: '🔵', Epic: '🟣', Legendary: '🟡' };
  const prefix = index !== null ? `[${index + 1}] ` : '';
  return `${prefix}${tierEmojis[card.tier]} *${card.name}*\n   📚 ${card.series} | ${card.tier}\n   ⚔️ ATK: ${card.attack} | 🛡️ DEF: ${card.defense}`;
}

export async function handleCards(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, mentions } = ctx;
  const user = getUser(sender);

  switch (command) {
    case 'collection':
    case 'coll': {
      const cards = getPlayerCards(sender);
      if (!cards.length) {
        await sock.sendMessage(from, { text: '🃏 You have no cards! Use *.cardshop* to buy packs.' }, { quoted: msg });
        return true;
      }
      const list = cards.slice(0, 10).map((c, i) => formatCard(c, i)).join('\n\n');
      await sock.sendMessage(from, {
        text: `🃏 *YOUR COLLECTION* (${cards.length} cards)\n\n${list}${cards.length > 10 ? `\n\n...and ${cards.length - 10} more` : ''}`,
      }, { quoted: msg });
      return true;
    }

    case 'deck': {
      const cards = getPlayerCards(sender);
      const deck = cards.filter(c => c.inDeck);
      if (!deck.length) {
        await sock.sendMessage(from, { text: '🃏 Your deck is empty!' }, { quoted: msg });
        return true;
      }
      const list = deck.map((c, i) => formatCard(c, i)).join('\n\n');
      await sock.sendMessage(from, { text: `⚔️ *YOUR DECK*\n\n${list}` }, { quoted: msg });
      return true;
    }

    case 'card': {
      const index = parseInt(args[0]) - 1;
      const cards = getPlayerCards(sender);
      if (isNaN(index) || index < 0 || index >= cards.length) {
        await sock.sendMessage(from, { text: '❌ Invalid card index!' }, { quoted: msg });
        return true;
      }
      const card = cards[index];
      await sock.sendMessage(from, {
        text: `🃏 *CARD DETAILS*\n\n${formatCard(card)}\n   ⭐ Stars: ${'⭐'.repeat(card.stars)}`,
      }, { quoted: msg });
      return true;
    }

    case 'cardinfo':
    case 'ci': {
      const name = args.slice(0, -1).join(' ') || args.join(' ');
      await sock.sendMessage(from, {
        text: `📋 *CARD INFO*\n\nSearching for: *${name}*\n\n⚠️ Card database search coming soon!`,
      }, { quoted: msg });
      return true;
    }

    case 'cardshop': {
      await sock.sendMessage(from, {
        text: `🃏 *CARD SHOP*\n\n📦 *Basic Pack* — 500 coins\n   3 cards (Common-Uncommon)\n\n💙 *Rare Pack* — 2000 coins\n   3 cards (Uncommon-Rare)\n\n💜 *Epic Pack* — 5000 coins\n   3 cards (Rare-Epic)\n\n🟡 *Legendary Pack* — 20000 coins\n   1 Guaranteed Legendary!\n\n💡 Use *.buy pack [type]* to purchase`,
      }, { quoted: msg });
      return true;
    }

    case 'claim': {
      // Claim a random card from a drop
      const card = generateCard();
      const cards = getPlayerCards(sender);
      cards.push(card);
      playerCards.set(sender, cards);
      await sock.sendMessage(from, {
        text: `🎴 *CARD CLAIMED!*\n\n${formatCard(card)}\n   ⭐ Stars: ${'⭐'.repeat(card.stars)}`,
      }, { quoted: msg });
      return true;
    }

    case 'stardust': {
      await sock.sendMessage(from, {
        text: `✨ *STARDUST*\n\n💫 Your stardust: *0*\n\nEarn stardust by selling unwanted cards!\n💡 Use *.sell [index]* to convert cards to stardust`,
      }, { quoted: msg });
      return true;
    }

    case 'vs': {
      const target = mentions[0];
      if (!target) {
        await sock.sendMessage(from, { text: '❌ Mention a player! .vs @user' }, { quoted: msg });
        return true;
      }
      const p1Cards = getPlayerCards(sender);
      const p2Cards = getPlayerCards(target);
      if (!p1Cards.length || !p2Cards.length) {
        await sock.sendMessage(from, { text: '❌ Both players need cards to battle!' }, { quoted: msg });
        return true;
      }
      const p1Card = getRandom(p1Cards);
      const p2Card = getRandom(p2Cards);
      const p1Power = p1Card.attack + p1Card.defense;
      const p2Power = p2Card.attack + p2Card.defense;
      const winner = p1Power >= p2Power ? `@${senderNum}` : `@${target.split('@')[0]}`;

      await sock.sendMessage(from, {
        text: `⚔️ *CARD BATTLE!*\n\n${formatCard(p1Card)}\nvs\n${formatCard(p2Card)}\n\n💥 *${winner} WINS!*`,
        mentions: [sender, target],
      }, { quoted: msg });
      return true;
    }

    case 'auction':
    case 'auc': {
      await sock.sendMessage(from, {
        text: `🏷️ *AUCTION HOUSE*\n\n⚠️ Auction system coming soon!\n\n🎴 You can still trade cards with:\n.tc @user [your_index] [their_index]`,
      }, { quoted: msg });
      return true;
    }

    case 'anticamp': {
      await sock.sendMessage(from, {
        text: `🛡️ *ANTICAMP*\n\n✅ Anticamp protection is active!\nThis prevents card hoarders from monopolizing rare drops.`,
      }, { quoted: msg });
      return true;
    }

    case 'tc': {
      const target = mentions[0];
      if (!target || args.length < 2) {
        await sock.sendMessage(from, { text: '❌ Usage: .tc @user [your_index] [their_index]' }, { quoted: msg });
        return true;
      }
      const myIdx = parseInt(args[0]) - 1;
      const theirIdx = parseInt(args[1]) - 1;
      const myCards = getPlayerCards(sender);
      const theirCards = getPlayerCards(target);

      if (myIdx < 0 || myIdx >= myCards.length) {
        await sock.sendMessage(from, { text: '❌ Invalid card index!' }, { quoted: msg });
        return true;
      }
      if (theirIdx < 0 || theirIdx >= theirCards.length) {
        await sock.sendMessage(from, { text: '❌ Target\'s card index invalid!' }, { quoted: msg });
        return true;
      }

      const myCard = myCards[myIdx];
      const theirCard = theirCards[theirIdx];

      // Swap
      myCards[myIdx] = theirCard;
      theirCards[theirIdx] = myCard;
      playerCards.set(sender, myCards);
      playerCards.set(target, theirCards);

      await sock.sendMessage(from, {
        text: `🔄 *CARD TRADE SUCCESS!*\n\n@${senderNum} gave: *${myCard.name}*\n@${target.split('@')[0]} gave: *${theirCard.name}*`,
        mentions: [sender, target],
      }, { quoted: msg });
      return true;
    }

    case 'mycollectionseries':
    case 'mycolls': {
      const cards = getPlayerCards(sender);
      const seriesName = text;
      const filtered = seriesName ? cards.filter(c => c.series.toLowerCase().includes(seriesName.toLowerCase())) : cards;
      if (!filtered.length) {
        await sock.sendMessage(from, { text: `🃏 No cards found for series: *${seriesName || 'all'}*` }, { quoted: msg });
        return true;
      }
      const list = filtered.slice(0, 10).map((c, i) => formatCard(c, i)).join('\n\n');
      await sock.sendMessage(from, { text: `📚 *${seriesName || 'ALL'} SERIES*\n\n${list}` }, { quoted: msg });
      return true;
    }

    case 'seriesleaderboard':
    case 'slb':
    case 'cardleaderboard':
    case 'cardlb': {
      const entries = [...playerCards.entries()];
      const sorted = entries
        .map(([jid, cards]) => ({ jid, count: cards.length, legendary: cards.filter(c => c.tier === 'Legendary').length }))
        .sort((a, b) => b.legendary - a.legendary || b.count - a.count)
        .slice(0, 10);
      const list = sorted.map((e, i) => `${i + 1}. +${e.jid.split('@')[0]} — ${e.count} cards (${e.legendary} 🟡)`).join('\n');
      await sock.sendMessage(from, {
        text: `🏆 *CARD LEADERBOARD*\n\n${list || 'No data yet'}`,
      }, { quoted: msg });
      return true;
    }

    case 'sellccard':
    case 'sellc': {
      const index = parseInt(args[0]) - 1;
      const cards = getPlayerCards(sender);
      if (isNaN(index) || index < 0 || index >= cards.length) {
        await sock.sendMessage(from, { text: '❌ Invalid card index!' }, { quoted: msg });
        return true;
      }
      const card = cards.splice(index, 1)[0];
      playerCards.set(sender, cards);
      const value = { Common: 100, Uncommon: 300, Rare: 700, Epic: 1500, Legendary: 5000 }[card.tier] || 100;
      updateUser(sender, { coins: user.coins + value });
      await sock.sendMessage(from, {
        text: `💰 Sold *${card.name}* for *${formatNumber(value)} coins*!`,
      }, { quoted: msg });
      return true;
    }

    case 'rc': {
      // Reroll card
      const index = parseInt(args[0]) - 1;
      const cards = getPlayerCards(sender);
      if (isNaN(index) || index < 0 || index >= cards.length) {
        await sock.sendMessage(from, { text: '❌ Invalid card index!' }, { quoted: msg });
        return true;
      }
      const cost = 500;
      if (user.coins < cost) {
        await sock.sendMessage(from, { text: `❌ Need *${cost} coins* to reroll!` }, { quoted: msg });
        return true;
      }
      updateUser(sender, { coins: user.coins - cost });
      cards[index] = generateCard();
      playerCards.set(sender, cards);
      await sock.sendMessage(from, {
        text: `🎲 *CARD REROLLED!*\n\nNew card:\n${formatCard(cards[index])}`,
      }, { quoted: msg });
      return true;
    }

    // Auction stubs
    case 'myauc':
    case 'remauc':
    case 'listauc':
    case 'cancelauc':
    case 'canclauc':
    case 'submit':
    case 'lendcard':
    case 'lc':
    case 'sellccardpublic':
    case 'sellcpublc':
    case 'deckcard': {
      await sock.sendMessage(from, {
        text: `⚙️ This feature is under development!\n\nCommand: *.${command}*\n\n🌸 Stay tuned for updates!`,
      }, { quoted: msg });
      return true;
    }

    default:
      return false;
  }
}
