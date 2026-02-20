import { getRandom, getRandomInt, fetchGif, getBuffer } from '../utils.js';

const TRUTHS = [
  "What's the most embarrassing thing you've ever done?",
  "Who was your first crush?",
  "What's a secret you've never told anyone?",
  "What's the biggest lie you've ever told?",
  "Have you ever cheated on a test?",
  "What's your most embarrassing nickname?",
  "Have you ever stalked someone's social media?",
  "What's the weirdest dream you've ever had?",
  "What's your biggest fear?",
  "Have you ever broken someone's heart?",
  "What's the worst thing you've ever done for money?",
  "Do you have a secret talent no one knows about?",
  "Have you ever been caught doing something embarrassing?",
  "What's the most childish thing you still do?",
  "Have you ever lied to get out of trouble?",
];

const DARES = [
  "Send a voice message singing your favorite song!",
  "Change your profile photo to a funny face for 1 hour!",
  "Text your crush right now!",
  "Do 20 jumping jacks and prove it with a video!",
  "Say the alphabet backwards in 30 seconds!",
  "Post an embarrassing selfie as your status for 30 mins!",
  "Text your mom 'I love you' right now!",
  "Speak in a funny accent for the next 10 minutes!",
  "Send a cringe-worthy message to someone you haven't texted in a month!",
  "Let someone write a message on your behalf to anyone in your contacts!",
  "Put ice cubes in your socks for 1 minute!",
  "Do your best dance and send a video!",
  "Say 'I am a potato' every time you reply for the next 5 minutes!",
  "Let someone choose your profile photo for the next day!",
];

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything! 😂",
  "I told my wife she was drawing her eyebrows too high. She looked surprised! 😳",
  "What do you call a fake noodle? An impasta! 🍝",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "I'm reading a book about anti-gravity. It's impossible to put down! 📚",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them! ➕",
  "Why don't eggs tell jokes? They'd crack each other up! 🥚",
  "What do you call cheese that isn't yours? Nacho cheese! 🧀",
  "I would tell you a joke about paper, but it's tearable! 📄",
  "What do you call a sleeping dinosaur? A dino-snore! 🦕",
];

const WYR_QUESTIONS = [
  "Would you rather have the ability to fly or be invisible?",
  "Would you rather live without music or without TV?",
  "Would you rather be extremely rich and ugly or poor and beautiful?",
  "Would you rather know when you'll die or how you'll die?",
  "Would you rather have all traffic lights be green or never wait in a queue?",
  "Would you rather lose all your memories or never make new ones?",
  "Would you rather always be overdressed or underdressed?",
  "Would you rather have unlimited money or unlimited time?",
  "Would you rather be famous or be the best friend of someone famous?",
  "Would you rather speak all languages or play all instruments?",
];

export async function handleFun(ctx) {
  const { sock, msg, from, sender, senderNum, command, args, text, pushName, mentions } = ctx;

  switch (command) {
    case 'gay': {
      const target = mentions[0] ? `@${mentions[0].split('@')[0]}` : pushName;
      const percent = getRandomInt(1, 100);
      const bar = '🏳️‍🌈'.repeat(Math.ceil(percent / 10));
      await sock.sendMessage(from, {
        text: `🏳️‍🌈 *GAY METER*\n\n👤 User: *${target}*\n\n${bar}\n\n*${percent}% Gay!*`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'lesbian': {
      const target = mentions[0] ? `@${mentions[0].split('@')[0]}` : pushName;
      const percent = getRandomInt(1, 100);
      await sock.sendMessage(from, {
        text: `🌺 *LESBIAN METER*\n\n👤 User: *${target}*\n\n${'💗'.repeat(Math.ceil(percent / 10))}\n\n*${percent}% Lesbian!*`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'simp': {
      const target = mentions[0] ? `@${mentions[0].split('@')[0]}` : pushName;
      const percent = getRandomInt(1, 100);
      await sock.sendMessage(from, {
        text: `💘 *SIMP METER*\n\n👤 User: *${target}*\n\n${'💕'.repeat(Math.ceil(percent / 10))}\n\n*${percent}% Simp!*`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'match':
    case 'ship': {
      if (mentions.length < 2) {
        await sock.sendMessage(from, { text: '❌ Mention 2 users! .match @user1 @user2' }, { quoted: msg });
        return true;
      }
      const u1 = `@${mentions[0].split('@')[0]}`;
      const u2 = `@${mentions[1].split('@')[0]}`;
      const percent = getRandomInt(1, 100);
      const hearts = '❤️'.repeat(Math.ceil(percent / 10));
      await sock.sendMessage(from, {
        text: `💑 *COMPATIBILITY*\n\n${u1} + ${u2}\n\n${hearts}\n\n*${percent}% Compatible!*\n\n${percent >= 80 ? '💍 Perfect match!' : percent >= 60 ? '😍 Great pair!' : percent >= 40 ? '😊 Could work!' : '💔 Maybe not...'}`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'psize':
    case 'pp': {
      const target = mentions[0] ? `@${mentions[0].split('@')[0]}` : pushName;
      const size = getRandomInt(1, 30);
      const pp = '8' + '='.repeat(size) + 'D';
      await sock.sendMessage(from, {
        text: `📏 *PP SIZE*\n\n👤 ${target}\n\n${pp}\n\n*${size} inches* 😏`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'skill': {
      const skills = ['Gaming 🎮', 'Cooking 🍳', 'Dancing 💃', 'Singing 🎤', 'Drawing ✏️', 'Coding 💻', 'Fighting ⚔️', 'Flirting 😏', 'Lying 🤥', 'Eating 🍕'];
      const skill = getRandom(skills);
      const level = getRandomInt(1, 100);
      await sock.sendMessage(from, {
        text: `⚡ *YOUR SKILL*\n\n👤 ${pushName}\n\n🎯 Skill: *${skill}*\n📊 Level: *${level}/100*\n\n${level >= 80 ? '🔥 LEGENDARY!' : level >= 60 ? '✨ Expert!' : level >= 40 ? '📈 Getting there!' : '😅 Needs work...'}`,
      }, { quoted: msg });
      return true;
    }

    case 'character': {
      const chars = ['Naruto 🍥', 'Goku 💪', 'Luffy 🤠', 'Ichigo ⚔️', 'Sasuke 🌀', 'Zoro 🗡️', 'Levi 💀', 'Light 📓', 'Gojo ♾️', 'Itachi 👁️', 'Tanjiro 🌊', 'Zenitsu ⚡'];
      const char = getRandom(chars);
      await sock.sendMessage(from, {
        text: `🌟 *YOUR ANIME CHARACTER*\n\n👤 ${pushName}\n\n🎭 You are: *${char}*`,
      }, { quoted: msg });
      return true;
    }

    case 'duality': {
      const traits = [
        ['Smart 🧠', 'Dumb 😵'],
        ['Kind ❤️', 'Evil 😈'],
        ['Lazy 😴', 'Hard-working 💪'],
        ['Rich 💰', 'Broke 💸'],
        ['Confident 😎', 'Shy 😳'],
      ];
      const [trait1, trait2] = getRandom(traits);
      const split = getRandomInt(20, 80);
      await sock.sendMessage(from, {
        text: `☯️ *YOUR DUALITY*\n\n👤 ${pushName}\n\n${trait1}: *${split}%*\n${trait2}: *${100 - split}%*`,
      }, { quoted: msg });
      return true;
    }

    case 'gen': {
      const gens = ['Gen Z 📱', 'Millennial 💻', 'Gen X 🎸', 'Boomer 📰', 'Alpha 🤖'];
      await sock.sendMessage(from, {
        text: `📅 *YOUR GENERATION*\n\n👤 ${pushName}\n\n🌍 You give off: *${getRandom(gens)}* vibes!`,
      }, { quoted: msg });
      return true;
    }

    case 'pov': {
      const povs = [
        'Your vibe is main character energy 🌟',
        'You\'re the funny best friend 😂',
        'You\'re the mysterious one 🌙',
        'You\'re the villain of this story 😈',
        'You\'re the love interest 💕',
        'You\'re the background character 🤷',
        'You\'re the plot twist 😱',
      ];
      await sock.sendMessage(from, {
        text: `🎬 *YOUR POV*\n\n👤 ${pushName}\n\n${getRandom(povs)}`,
      }, { quoted: msg });
      return true;
    }

    case 'social': {
      const socials = ['Introvert 🏠', 'Extrovert 🎉', 'Ambivert ⚖️'];
      const level = getRandomInt(1, 100);
      await sock.sendMessage(from, {
        text: `🤝 *SOCIAL TYPE*\n\n👤 ${pushName}\n\n📊 ${getRandom(socials)}\nLevel: *${level}/100*`,
      }, { quoted: msg });
      return true;
    }

    case 'relation': {
      const relations = ['Soulmate 💞', 'Best Friend 🤝', 'Rival ⚔️', 'Secret Admirer 🌹', 'Mentor 👨‍🏫', 'Nemesis 😤'];
      const target = mentions[0] ? `@${mentions[0].split('@')[0]}` : 'the universe';
      await sock.sendMessage(from, {
        text: `💫 *RELATIONSHIP*\n\n👤 ${pushName} & ${target}\n\n🔗 You two are: *${getRandom(relations)}*!`,
        mentions: mentions,
      }, { quoted: msg });
      return true;
    }

    case 'wouldyourather':
    case 'wyr': {
      await sock.sendMessage(from, {
        text: `🤔 *WOULD YOU RATHER?*\n\n${getRandom(WYR_QUESTIONS)}\n\nReply with A or B!`,
      }, { quoted: msg });
      return true;
    }

    case 'joke': {
      await sock.sendMessage(from, {
        text: `😂 *JOKE TIME*\n\n${getRandom(JOKES)}`,
      }, { quoted: msg });
      return true;
    }

    case 'truth': {
      if (command === 'truth' && args[0] === 'or') return false; // handled by games
      await sock.sendMessage(from, {
        text: `💭 *TRUTH*\n\n${getRandom(TRUTHS)}`,
      }, { quoted: msg });
      return true;
    }

    case 'dare': {
      await sock.sendMessage(from, {
        text: `🎭 *DARE*\n\n${getRandom(DARES)}`,
      }, { quoted: msg });
      return true;
    }

    case 'td': {
      const isTruth = Math.random() > 0.5;
      await sock.sendMessage(from, {
        text: `🎲 *${isTruth ? 'TRUTH' : 'DARE'}*\n\n${isTruth ? getRandom(TRUTHS) : getRandom(DARES)}`,
      }, { quoted: msg });
      return true;
    }

    case 'uno': {
      const cards = ['🔴 Red 7', '🔵 Blue 4', '🟡 Yellow Skip', '🟢 Green Reverse', '🃏 Wild Card', '🃏 +4 Wild', '🔴 Red +2', '🔵 Blue 9'];
      await sock.sendMessage(from, {
        text: `🃏 *UNO*\n\n👤 ${pushName} draws a card...\n\n🎴 You got: *${getRandom(cards)}*\n\n*UNO!* 🎉`,
      }, { quoted: msg });
      return true;
    }

    default:
      return false;
  }
}
