# 🌸 Shadow Garden Bot — Delta

A feature-rich WhatsApp bot built with Baileys.

---

## ⚡ Quick Setup

### 1. Prerequisites
```bash
# Install Node.js 18+
# Install FFmpeg (required for stickers/video):
# Ubuntu/Debian:
sudo apt install ffmpeg
# Windows: https://ffmpeg.org/download.html
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Your Image
Place `delta.jpg` in the `assets/` folder for the menu image.

### 4. Configure the Bot
Edit `src/config.js`:

```js
// REQUIRED - Your WhatsApp number (no + sign)
ownerNumber: '2349049460676',

// OPTIONAL - Add more numbers that can use owner commands
sudoNumbers: [
  // '1234567890',
],

// OPTIONAL - For .ai .gpt commands (free at https://openrouter.ai)
openrouterKey: 'YOUR_OPENROUTER_API_KEY',
```

### 5. Start the Bot
```bash
npm start
```

### 6. Pair Your Phone
1. Enter your WhatsApp number when prompted
2. Open WhatsApp → Settings → Linked Devices → Link a Device
3. Select "Link with phone number"
4. Enter the 8-digit pairing code shown in console
5. WhatsApp will send a notification on Chrome, Ubuntu to confirm

---

## 🔧 What You Need to Edit

| Setting | Location | Required |
|---------|----------|----------|
| `ownerNumber` | `src/config.js` | ✅ YES |
| `openrouterKey` | `src/config.js` | For AI commands |
| `assets/delta.jpg` | `assets/` folder | For menu image |

---

## 👑 Owner Commands
- `.ban @user` — Ban a user from using the bot
- `.unban @user` — Unban a user
- `.sudo add @user` — Give someone sudo (admin-like) access
- `.sudo remove @user` — Remove sudo
- `.sudo list` — List all sudo users
- `.join <link>` — Add bot to a group
- `.exit` — Remove bot from group

---

## 📁 Project Structure
```
shadowgarden-bot/
├── src/
│   ├── index.js          # Bot entry point
│   ├── handler.js        # Message router
│   ├── config.js         # Configuration (EDIT THIS)
│   ├── utils.js          # Utilities
│   ├── database/
│   │   └── db.js         # SQLite database
│   ├── commands/
│   │   ├── main.js       # .menu .ping etc
│   │   ├── admin.js      # Admin commands
│   │   ├── economy.js    # Economy system
│   │   ├── games.js      # Games
│   │   ├── gamble.js     # Gambling
│   │   ├── interaction.js # Anime GIF interactions
│   │   ├── fun.js        # Fun commands
│   │   ├── downloader.js # YouTube, TikTok etc
│   │   ├── search.js     # Search commands
│   │   ├── ai.js         # AI commands
│   │   ├── converter.js  # Sticker converter
│   │   ├── anime.js      # Anime images
│   │   └── cards.js      # Card collection
│   └── events/
│       └── groupUpdate.js # Welcome/leave events
├── assets/
│   └── delta.jpg         # Menu image (ADD THIS)
├── data/                 # Auto-created - stores DB and auth
└── package.json
```

---

## 💡 API Keys (All Optional)

| Feature | API | Get Key |
|---------|-----|---------|
| .ai / .gpt | OpenRouter | https://openrouter.ai (FREE) |
| .generate | Pollinations.ai | No key needed! |
| .translate | Google Translate | No key needed! |
| .play | youtube-sr | No key needed! |

---

## ⚠️ Troubleshooting

**Bot disconnects?** — The bot auto-reconnects silently. No panic.

**Stickers not working?** — Install FFmpeg: `sudo apt install ffmpeg`

**AI not working?** — Add OpenRouter API key in `src/config.js`

**Pairing code failed?** — Delete `data/auth` folder and restart

**Bot not admin in group?** — Some commands require bot to be admin. Promote the bot.
