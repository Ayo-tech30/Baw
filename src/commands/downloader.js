import ytdl from 'ytdl-core';
import YouTubeSearch from 'youtube-sr';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';
import { getBuffer } from '../utils.js';

async function searchYT(query) {
  try {
    const results = await YouTubeSearch.default.search(query, { limit: 1, type: 'video' });
    return results[0] || null;
  } catch {
    return null;
  }
}

export async function handleDownloader(ctx) {
  const { sock, msg, from, command, args, text } = ctx;

  switch (command) {
    case 'play': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .play [song name or YouTube URL]' }, { quoted: msg });
        return true;
      }

      await sock.sendMessage(from, { text: `🔍 Searching for *${text}*...` }, { quoted: msg });

      try {
        let video;
        if (ytdl.validateURL(text)) {
          const info = await ytdl.getInfo(text);
          video = {
            id: info.videoDetails.videoId,
            title: info.videoDetails.title,
            durationFormatted: Math.floor(info.videoDetails.lengthSeconds / 60) + ':' + String(info.videoDetails.lengthSeconds % 60).padStart(2, '0'),
            channel: { name: info.videoDetails.author.name },
            views: info.videoDetails.viewCount,
            url: text,
            thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url,
          };
        } else {
          const result = await searchYT(text);
          if (!result) {
            await sock.sendMessage(from, { text: '❌ No results found!' }, { quoted: msg });
            return true;
          }
          video = result;
        }

        // Send song info with thumbnail
        const caption = `🎵 *${video.title}*\n\n🎤 Artist: *${video.channel?.name || 'Unknown'}*\n⏱️ Duration: *${video.durationFormatted}*\n👁️ Views: *${Number(video.views || 0).toLocaleString()}*\n\n⬇️ Downloading...`;

        if (video.thumbnail) {
          try {
            const thumbBuf = await getBuffer(video.thumbnail);
            await sock.sendMessage(from, { image: thumbBuf, caption }, { quoted: msg });
          } catch {
            await sock.sendMessage(from, { text: caption }, { quoted: msg });
          }
        } else {
          await sock.sendMessage(from, { text: caption }, { quoted: msg });
        }

        // Download audio
        const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;
        const audioPath = path.join(tmpdir(), `sg_audio_${Date.now()}.mp3`);

        try {
          // Try ytdl-core direct download
          await new Promise((resolve, reject) => {
            const stream = ytdl(videoUrl, {
              filter: 'audioonly',
              quality: 'highestaudio',
            });
            const fileStream = fs.createWriteStream(audioPath);
            stream.pipe(fileStream);
            stream.on('error', reject);
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
          });

          const audioBuffer = await fs.readFile(audioPath);
          await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            fileName: `${video.title.replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`,
          }, { quoted: msg });
          await fs.remove(audioPath);
        } catch (dlErr) {
          await sock.sendMessage(from, {
            text: `⚠️ Direct download failed. Here is the YouTube link:\nhttps://www.youtube.com/watch?v=${video.id}\n\nYou can download from: https://y2mate.com`,
          }, { quoted: msg });
        }

      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg });
      }
      return true;
    }

    case 'youtube':
    case 'yt': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .yt [YouTube URL or search query]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: `⬇️ Searching YouTube for: *${text}*` }, { quoted: msg });
      try {
        let videoUrl = text;
        if (!ytdl.validateURL(text)) {
          const result = await searchYT(text);
          if (!result) {
            await sock.sendMessage(from, { text: '❌ Not found!' }, { quoted: msg });
            return true;
          }
          videoUrl = `https://www.youtube.com/watch?v=${result.id}`;
          await sock.sendMessage(from, { text: `🔗 Found: *${result.title}*\n\nDownloading video...` }, { quoted: msg });
        }

        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // 360p mp4

        if (!format) {
          await sock.sendMessage(from, { text: `⚠️ Cannot download this video. Link: ${videoUrl}` }, { quoted: msg });
          return true;
        }

        const videoPath = path.join(tmpdir(), `sg_vid_${Date.now()}.mp4`);
        await new Promise((resolve, reject) => {
          const stream = ytdl(videoUrl, { format });
          const fileStream = fs.createWriteStream(videoPath);
          stream.pipe(fileStream);
          stream.on('error', reject);
          fileStream.on('finish', resolve);
        });

        const stat = await fs.stat(videoPath);
        if (stat.size > 64 * 1024 * 1024) {
          await sock.sendMessage(from, { text: `⚠️ Video too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). WhatsApp limit is 64MB.\n\n🔗 ${videoUrl}` }, { quoted: msg });
          await fs.remove(videoPath);
          return true;
        }

        const videoBuf = await fs.readFile(videoPath);
        await sock.sendMessage(from, {
          video: videoBuf,
          caption: `🎬 *${info.videoDetails.title}*`,
          mimetype: 'video/mp4',
        }, { quoted: msg });
        await fs.remove(videoPath);
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ YouTube download failed: ${e.message}` }, { quoted: msg });
      }
      return true;
    }

    case 'instagram':
    case 'ig': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .ig [Instagram URL]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '⬇️ Downloading from Instagram...' }, { quoted: msg });
      try {
        // Use instavdl API
        const res = await axios.get(`https://instavdl.com/api?url=${encodeURIComponent(text)}`, { timeout: 20000 });
        const downloadUrl = res.data?.url || res.data?.data?.[0]?.url;
        if (!downloadUrl) {
          await sock.sendMessage(from, { text: `⚠️ Could not extract video.\n💡 Try: https://snapinsta.app` }, { quoted: msg });
          return true;
        }
        const buf = await getBuffer(downloadUrl);
        await sock.sendMessage(from, { video: buf, caption: '📸 Downloaded from Instagram' }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `⚠️ Instagram download failed.\n💡 Try: https://snapinsta.app or https://igram.world` }, { quoted: msg });
      }
      return true;
    }

    case 'tiktok':
    case 'ttk': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .tiktok [TikTok URL]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '⬇️ Downloading from TikTok...' }, { quoted: msg });
      try {
        const res = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`, { timeout: 20000 });
        const data = res.data?.data;
        if (!data?.play) {
          await sock.sendMessage(from, { text: `⚠️ Could not extract video.\n💡 Try: https://snaptik.app` }, { quoted: msg });
          return true;
        }
        const buf = await getBuffer(data.play);
        await sock.sendMessage(from, {
          video: buf,
          caption: `🎵 *${data.title || 'TikTok Video'}*\n👤 @${data.author?.unique_id || 'unknown'}`,
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `⚠️ TikTok download failed.\n💡 Try: https://snaptik.app` }, { quoted: msg });
      }
      return true;
    }

    case 'twitter':
    case 'x': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .twitter [Tweet URL]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '⬇️ Downloading from Twitter/X...' }, { quoted: msg });
      try {
        const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(text)}`, { timeout: 20000 });
        await sock.sendMessage(from, { text: `⚠️ Twitter download may require API.\n💡 Try: https://twitsave.com\n\nLink: ${text}` }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `⚠️ Twitter download failed.\n💡 Try: https://twitsave.com` }, { quoted: msg });
      }
      return true;
    }

    case 'facebook':
    case 'fb': {
      if (!text) {
        await sock.sendMessage(from, { text: '❌ Usage: .fb [Facebook video URL]' }, { quoted: msg });
        return true;
      }
      await sock.sendMessage(from, { text: '⬇️ Downloading from Facebook...' }, { quoted: msg });
      try {
        await sock.sendMessage(from, { text: `⚠️ Facebook download requires API.\n💡 Try: https://fdown.net or https://fbdownloader.app\n\nLink: ${text}` }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text: `⚠️ Facebook download failed.\n💡 Try: https://fdown.net` }, { quoted: msg });
      }
      return true;
    }

    default:
      return false;
  }
}
