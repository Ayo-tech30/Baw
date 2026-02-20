// =====================================================
// SHADOW GARDEN BOT - CONFIGURATION
// =====================================================

export const config = {
  // ============ BOT OWNER(S) ============
  // Add your WhatsApp number (without +) here
  ownerNumber: '2349049460676',

  // Additional sudo numbers (can also use .sudo command)
  // Add more numbers here: '1234567890', '0987654321'
  sudoNumbers: [
    // '1234567890',
  ],

  // ============ BOT INFO ============
  botName: 'Delta',
  prefix: '.',
  botTag: 'Shadow Garden',

  // ============ STICKER INFO ============
  stickerName: 'Shadow',
  stickerAuthor: 'Sʜᴀᴅᴏᴡ  Gᴀʀᴅᴇɴ',

  // ============ ECONOMY ============
  startingCoins: 50000,
  dailyAmount: 5000,
  dailyCooldown: 86400000, // 24 hours in ms

  // ============ COMMUNITY LINK ============
  communityLink: 'https://chat.whatsapp.com/C58szhJGQ3EKlvFt1Hp57n',

  // ============ API KEYS (EDIT THESE) ============
  // Get free key from: https://openrouter.ai
  openrouterKey: 'YOUR_OPENROUTER_API_KEY',

  // Get from: https://rapidapi.com
  rapidApiKey: 'YOUR_RAPIDAPI_KEY',

  // Get from: https://api.nekos.best
  nekosBestBase: 'https://nekos.best/api/v2',

  // Get from: https://waifu.pics/docs
  waifuPicsBase: 'https://api.waifu.pics',

  // YouTube search - no key needed (uses youtube-sr)

  // Image search - Serp API (optional)
  serpApiKey: 'YOUR_SERP_API_KEY',

  // Pinterest (optional)
  pinterestCookies: '',

  // ============ INTERACTION GIFS ============
  // These are fetched from nekos.best
  interactionEndpoints: {
    hug: 'hug',
    kiss: 'kiss',
    slap: 'slap',
    wave: 'wave',
    pat: 'pat',
    dance: 'dance',
    sad: 'cry',
    smile: 'smile',
    laugh: 'laugh',
    punch: 'punch',
    kill: 'kick',
    hit: 'punch',
    fuck: 'yeet',
    kidnap: 'bully',
    lick: 'lick',
    bonk: 'bonk',
    tickle: 'tickle',
    shrug: 'shrug',
    wank: 'yeet',
    jihad: 'kick',
    crusade: 'punch',
    highfive: 'handshake',
    cuddle: 'cuddle',
    poke: 'poke',
    shoot: 'shoot',
    stare: 'stare',
    wink: 'wink',
    bite: 'bite',
    blush: 'blush',
    bored: 'bored',
    facepalm: 'facepalm',
    feed: 'feed',
    sleep: 'sleep',
    think: 'think',
    thumbsup: 'thumbsup',
    yawn: 'yawn',
  },

  // ============ SHOP ITEMS ============
  shopItems: [
    { name: 'Fishing Rod', price: 500, description: 'Use for .fish command, increases fish earnings' },
    { name: 'Shovel', price: 500, description: 'Use for .dig command, increases dig earnings' },
    { name: 'Premium Pass', price: 50000, description: 'Unlock premium features' },
    { name: 'Lucky Clover', price: 2000, description: 'Boosts gamble wins by 10%' },
    { name: 'VIP Badge', price: 10000, description: 'Exclusive VIP badge on profile' },
    { name: 'Daily Booster', price: 3000, description: 'Doubles daily reward once' },
    { name: 'Gem Finder', price: 5000, description: 'Find gems while digging' },
  ],
};

export default config;
