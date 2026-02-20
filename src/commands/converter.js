import { config } from '../config.js';
import { getBuffer } from '../utils.js';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execAsync = promisify(exec);

export async function handleConverter(ctx) {
  const { sock, msg, from, command, args, text, quotedMsg } = ctx;
  const stickerName = config.stickerName;
  const stickerAuthor = config.stickerAuthor;

  switch (command) {
    case 'sticker':
    case 's': {
      // Check for quoted image/video/sticker
      const hasMedia = quotedMsg?.imageMessage || quotedMsg?.videoMessage || quotedMsg?.stickerMessage || 
                       msg.message?.imageMessage || msg.message?.videoMessage;

      if (!hasMedia) {
        await sock.sendMessage(from, { text: '❌ Send or reply to an image/video/gif to make a sticker!' }, { quoted: msg });
        return true;
      }

      await sock.sendMessage(from, { text: '⏳ Creating sticker...' }, { quoted: msg });
      try {
        const mediaMsg = quotedMsg?.imageMessage || quotedMsg?.videoMessage || quotedMsg?.stickerMessage ||
                        msg.message?.imageMessage || msg.message?.videoMessage;

        const isVideo = !!(quotedMsg?.videoMessage || msg.message?.videoMessage);
        const stream = await sock.downloadMediaMessage(quotedMsg ? { message: quotedMsg, key: msg.key } : msg);
        const buf = Buffer.from(stream);

        if (isVideo) {
          // Convert video to animated sticker
          const inputPath = path.join(tmpdir(), `sg_in_${Date.now()}.mp4`);
          const outputPath = path.join(tmpdir(), `sg_out_${Date.now()}.webp`);
          await fs.writeFile(inputPath, buf);

          try {
            await execAsync(`ffmpeg -i "${inputPath}" -vcodec libwebp -filter:v fps=fps=15 -lossless 0 -compression_level 3 -q:v 70 -loop 0 -preset picture -an -vsync 0 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -t 00:00:06 "${outputPath}"`, { timeout: 30000 });
            const webpBuf = await fs.readFile(outputPath);
            await sock.sendMessage(from, {
              sticker: webpBuf,
              stickerName,
              stickerAuthor,
              isAnimated: true,
            });
          } catch {
            await sock.sendMessage(from, { text: '❌ Video sticker conversion failed! Make sure ffmpeg is installed.' }, { quoted: msg });
          } finally {
            await fs.remove(inputPath).catch(() => {});
            await fs.remove(outputPath).catch(() => {});
          }
        } else {
          // Convert image to sticker using sharp
          const outputPath = path.join(tmpdir(), `sg_sticker_${Date.now()}.webp`);
          await sharp(buf)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80 })
            .toFile(outputPath);

          const webpBuf = await fs.readFile(outputPath);
          await sock.sendMessage(from, {
            sticker: webpBuf,
            stickerName,
            stickerAuthor,
          });
          await fs.remove(outputPath).catch(() => {});
        }
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Sticker creation failed: ${e.message}` }, { quoted: msg });
      }
      return true;
    }

    case 'take': {
      // Set sticker name/author from a sticker
      const quotedSticker = quotedMsg?.stickerMessage;
      if (!quotedSticker) {
        await sock.sendMessage(from, { text: '❌ Reply to a sticker with: .take [name], [author]' }, { quoted: msg });
        return true;
      }
      const parts = text.split(',');
      const name = parts[0]?.trim() || stickerName;
      const author = parts[1]?.trim() || stickerAuthor;

      try {
        const stream = await sock.downloadMediaMessage({ message: quotedMsg, key: msg.key });
        const buf = Buffer.from(stream);
        await sock.sendMessage(from, {
          sticker: buf,
          stickerName: name,
          stickerAuthor: author,
        });
      } catch {
        await sock.sendMessage(from, { text: '❌ Failed to retag sticker!' }, { quoted: msg });
      }
      return true;
    }

    case 'toimg':
    case 'turnimg': {
      const quotedSticker = quotedMsg?.stickerMessage;
      if (!quotedSticker) {
        await sock.sendMessage(from, { text: '❌ Reply to a sticker with .toimg!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🔄 Converting to image...' }, { quoted: msg });
      try {
        const stream = await sock.downloadMediaMessage({ message: quotedMsg, key: msg.key });
        const buf = Buffer.from(stream);

        const pngBuf = await sharp(buf).png().toBuffer();
        await sock.sendMessage(from, { image: pngBuf, caption: '🖼️ Converted!' }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Conversion failed: ${e.message}` }, { quoted: msg });
      }
      return true;
    }

    case 'tovid':
    case 'turnvid': {
      const quotedSticker = quotedMsg?.stickerMessage;
      if (!quotedSticker) {
        await sock.sendMessage(from, { text: '❌ Reply to an animated sticker!' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '🔄 Converting to video...' }, { quoted: msg });
      try {
        const stream = await sock.downloadMediaMessage({ message: quotedMsg, key: msg.key });
        const buf = Buffer.from(stream);

        const inputPath = path.join(tmpdir(), `sg_in_${Date.now()}.webp`);
        const outputPath = path.join(tmpdir(), `sg_out_${Date.now()}.mp4`);
        await fs.writeFile(inputPath, buf);

        await execAsync(`ffmpeg -i "${inputPath}" "${outputPath}"`, { timeout: 30000 });
        const vidBuf = await fs.readFile(outputPath);

        await sock.sendMessage(from, {
          video: vidBuf,
          gifPlayback: true,
          caption: '🎬 Converted!',
        }, { quoted: msg });

        await fs.remove(inputPath).catch(() => {});
        await fs.remove(outputPath).catch(() => {});
      } catch {
        await sock.sendMessage(from, { text: '❌ Conversion failed! Make sure ffmpeg is installed.' }, { quoted: msg });
      }
      return true;
    }

    case 'rotate': {
      const quotedImage = quotedMsg?.imageMessage || msg.message?.imageMessage;
      if (!quotedImage) {
        await sock.sendMessage(from, { text: '❌ Reply to an image to rotate it! Usage: .rotate [90/180/270]' }, { quoted: msg });
        return true;
      }
      const degrees = parseInt(args[0]) || 90;
      await sock.sendMessage(from, { text: `🔄 Rotating ${degrees}°...` }, { quoted: msg });
      try {
        const stream = await sock.downloadMediaMessage(quotedMsg ? { message: quotedMsg, key: msg.key } : msg);
        const buf = Buffer.from(stream);

        const rotated = await sharp(buf).rotate(degrees).jpeg().toBuffer();
        await sock.sendMessage(from, { image: rotated, caption: `🔄 Rotated ${degrees}°` }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: '❌ Rotation failed!' }, { quoted: msg });
      }
      return true;
    }

    default:
      return false;
  }
}
