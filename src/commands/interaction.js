import { sendInteractionGif, fetchGif, getBuffer } from '../utils.js';
import { config } from '../config.js';

const INTERACTIONS = config.interactionEndpoints;

const INTERACTION_TEXTS = {
  hug: '🤗 *{user}* hugged *{target}*!',
  kiss: '💋 *{user}* kissed *{target}*!',
  slap: '👋 *{user}* slapped *{target}*!',
  wave: '👋 *{user}* waved at *{target}*!',
  pat: '😊 *{user}* patted *{target}*!',
  dance: '💃 *{user}* is dancing!',
  sad: '😢 *{user}* is feeling sad...',
  smile: '😊 *{user}* smiled at *{target}*!',
  laugh: '😂 *{user}* laughed at *{target}*!',
  punch: '👊 *{user}* punched *{target}*!',
  kill: '💀 *{user}* killed *{target}*!',
  hit: '💥 *{user}* hit *{target}*!',
  fuck: '🔞 *{user}* yeeted *{target}*!',
  kidnap: '😱 *{user}* kidnapped *{target}*!',
  lick: '👅 *{user}* licked *{target}*!',
  bonk: '🔨 *{user}* bonked *{target}* on the head!',
  tickle: '😆 *{user}* tickled *{target}*!',
  shrug: '🤷 *{user}* shrugged!',
  wank: '💦 *{user}* yoted *{target}*!',
  jihad: '💥 *{user}* declared jihad on *{target}*!',
  crusade: '⚔️ *{user}* started a crusade against *{target}*!',
  cuddle: '🥰 *{user}* cuddled with *{target}*!',
  poke: '👉 *{user}* poked *{target}*!',
  bite: '😬 *{user}* bit *{target}*!',
  blush: '😳 *{user}* is blushing!',
  wink: '😉 *{user}* winked at *{target}*!',
  feed: '🍽️ *{user}* fed *{target}*!',
  stare: '👀 *{user}* is staring at *{target}*...',
  shoot: '🔫 *{user}* shot *{target}*!',
};

export async function handleInteraction(ctx) {
  const { command } = ctx;

  // Check if it's an interaction command
  if (!INTERACTIONS[command] && !INTERACTION_TEXTS[command]) return false;

  const endpoint = INTERACTIONS[command] || command;
  const actionText = INTERACTION_TEXTS[command] || `*{user}* used ${command} on *{target}*!`;

  await sendInteractionGif(ctx, endpoint, actionText);
  return true;
}
