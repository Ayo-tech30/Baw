import axios from 'axios';
import { config } from '../config.js';
import { getBuffer } from '../utils.js';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';

async function askAI(prompt, system = 'You are Delta, a helpful WhatsApp bot from Shadow Garden.') {
  try {
    // Using OpenRouter (free tier available)
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    }, {
      headers: {
        'Authorization': `Bearer ${config.openrouterKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    return res.data?.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

export async function handleAI(ctx) {
  const { sock, msg, from, command, args, text } = ctx;

  switch (command) {
    case 'ai':
    case 'copilot':
    case 'gpt':
    case 'perplexity': {
      if (!text) {
        await sock.sendMessage(from, { text: `❌ Usage: .${command} [your question]` }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🤖 Thinking...' }, { quoted: msg });

      if (config.openrouterKey === 'YOUR_OPENROUTER_API_KEY') {
        await sock.sendMessage(from, {
          text: `⚠️ *AI is not configured!*\n\nThe bot owner needs to set up an API key.\n\n📝 Edit *src/config.js* and add your *OpenRouter API key*.\nGet it free at: https://openrouter.ai`,
        }, { quoted: msg });
        return true;
      }

      const response = await askAI(text);
      if (!response) {
        await sock.sendMessage(from, { text: '❌ AI failed to respond. Check your API key.' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, {
        text: `🤖 *Delta AI*\n\n${response}`,
      }, { quoted: msg });
      return true;
    }

    case 'translate':
    case 'tt': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .translate [language] [text]\nExample: .translate spanish Hello world' }, { quoted: msg });
        return true;
      }
      const lang = args[0];
      const toTranslate = args.slice(1).join(' ');
      if (!toTranslate) {
        await sock.sendMessage(from, { text: '❌ Provide text to translate!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🌐 Translating...' }, { quoted: msg });
      try {
        const res = await axios.get(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(toTranslate)}`,
          { timeout: 10000 }
        );
        const translated = res.data?.[0]?.map(t => t?.[0]).filter(Boolean).join('') || 'Translation failed';
        await sock.sendMessage(from, {
          text: `🌐 *TRANSLATION*\n\n📝 Original: *${toTranslate}*\n🌍 Language: *${lang}*\n✨ Translated: *${translated}*`,
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: '❌ Translation failed!' }, { quoted: msg });
      }
      return true;
    }

    case 'generate':
    case 'imagine': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .generate [image description]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `🎨 Generating image: *${text}*...\n\n⏳ This may take a moment...` }, { quoted: msg });
      try {
        // Use Pollinations.ai (free, no key needed)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=512&height=512&nologo=true`;
        const buf = await getBuffer(imageUrl);
        await sock.sendMessage(from, {
          image: buf,
          caption: `🎨 *Generated Image*\n\n📝 Prompt: ${text}`,
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: '❌ Image generation failed! Try again.' }, { quoted: msg });
      }
      return true;
    }

    case 'enhance':
    case 'upscale': {
      const quoted = ctx.quotedMsg;
      if (!quoted?.imageMessage) {
        await sock.sendMessage(from, { text: '❌ Reply to an image to enhance/upscale it!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🔍 Enhancing image...' }, { quoted: msg });
      try {
        const stream = await ctx.sock.downloadMediaMessage(msg);
        const buf = Buffer.from(stream);
        // Basic enhancement message since upscaling requires paid APIs
        await sock.sendMessage(from, {
          text: '⚠️ Image upscaling requires a paid API.\n\n💡 Free alternatives:\n• https://upscayl.org (desktop app)\n• https://imgupscaler.com (online)\n• https://waifu2x.booru.pics (anime)',
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: '❌ Enhancement failed!' }, { quoted: msg });
      }
      return true;
    }

    case 'transcribe':
    case 'tb': {
      const quoted = ctx.quotedMsg;
      if (!quoted?.audioMessage && !quoted?.videoMessage) {
        await sock.sendMessage(from, { text: '❌ Reply to a voice note or video to transcribe!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🎤 Transcribing...\n\n⚠️ Transcription requires Whisper API.\n\n💡 Set up OpenAI API key in config for this feature.' }, { quoted: msg });
      return true;
    }

    default:
      return false;
  }
}
