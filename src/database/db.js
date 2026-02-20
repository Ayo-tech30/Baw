import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/shadowgarden.db');

fs.ensureDirSync(path.dirname(DB_PATH));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT,
    bio TEXT DEFAULT '',
    age TEXT DEFAULT '',
    coins INTEGER DEFAULT 50000,
    bank INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    premium INTEGER DEFAULT 0,
    registered INTEGER DEFAULT 0,
    reg_name TEXT DEFAULT '',
    last_daily TEXT DEFAULT '',
    warnings INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    name TEXT,
    antilink INTEGER DEFAULT 0,
    antilink_action TEXT DEFAULT 'warn',
    antispam INTEGER DEFAULT 0,
    welcome INTEGER DEFAULT 0,
    welcome_msg TEXT DEFAULT '',
    leave INTEGER DEFAULT 0,
    leave_msg TEXT DEFAULT '',
    muted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT,
    group_jid TEXT,
    reason TEXT,
    warned_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_jid TEXT,
    word TEXT,
    UNIQUE(group_jid, word)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT,
    group_jid TEXT,
    message_count INTEGER DEFAULT 0,
    last_active TEXT DEFAULT (datetime('now')),
    UNIQUE(user_jid, group_jid)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT,
    item_name TEXT,
    quantity INTEGER DEFAULT 1,
    UNIQUE(user_jid, item_name)
  );

  CREATE TABLE IF NOT EXISTS afk (
    user_jid TEXT PRIMARY KEY,
    reason TEXT DEFAULT 'AFK',
    since TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sudo (
    jid TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS banned_users (
    jid TEXT PRIMARY KEY,
    reason TEXT,
    banned_at TEXT DEFAULT (datetime('now'))
  );
`);

// =================== USER FUNCTIONS ===================
export function getUser(jid) {
  let user = db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
  if (!user) {
    db.prepare('INSERT OR IGNORE INTO users (jid) VALUES (?)').run(jid);
    user = db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
  }
  return user;
}

export function updateUser(jid, data) {
  const keys = Object.keys(data);
  const set = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${set} WHERE jid = ?`).run(...Object.values(data), jid);
}

export function isRegistered(jid) {
  const user = getUser(jid);
  return user.registered === 1;
}

export function registerUser(jid, name) {
  getUser(jid);
  db.prepare('UPDATE users SET registered = 1, reg_name = ?, name = ? WHERE jid = ?').run(name, name, jid);
}

// =================== GROUP FUNCTIONS ===================
export function getGroup(jid) {
  let group = db.prepare('SELECT * FROM groups WHERE jid = ?').get(jid);
  if (!group) {
    db.prepare('INSERT OR IGNORE INTO groups (jid) VALUES (?)').run(jid);
    group = db.prepare('SELECT * FROM groups WHERE jid = ?').get(jid);
  }
  return group;
}

export function updateGroup(jid, data) {
  const keys = Object.keys(data);
  const set = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE groups SET ${set} WHERE jid = ?`).run(...Object.values(data), jid);
}

// =================== WARNINGS ===================
export function addWarning(userJid, groupJid, reason) {
  db.prepare('INSERT INTO warnings (user_jid, group_jid, reason) VALUES (?, ?, ?)').run(userJid, groupJid, reason);
  db.prepare('UPDATE users SET warnings = warnings + 1 WHERE jid = ?').run(userJid);
  return db.prepare('SELECT warnings FROM users WHERE jid = ?').get(userJid)?.warnings || 1;
}

export function resetWarnings(userJid, groupJid) {
  db.prepare('DELETE FROM warnings WHERE user_jid = ? AND group_jid = ?').run(userJid, groupJid);
  db.prepare('UPDATE users SET warnings = 0 WHERE jid = ?').run(userJid);
}

export function getWarnings(userJid, groupJid) {
  return db.prepare('SELECT * FROM warnings WHERE user_jid = ? AND group_jid = ?').all(userJid, groupJid);
}

// =================== BLACKLIST ===================
export function addBlacklist(groupJid, word) {
  db.prepare('INSERT OR IGNORE INTO blacklist (group_jid, word) VALUES (?, ?)').run(groupJid, word.toLowerCase());
}

export function removeBlacklist(groupJid, word) {
  db.prepare('DELETE FROM blacklist WHERE group_jid = ? AND word = ?').run(groupJid, word.toLowerCase());
}

export function getBlacklist(groupJid) {
  return db.prepare('SELECT word FROM blacklist WHERE group_jid = ?').all(groupJid).map(r => r.word);
}

// =================== ACTIVITY ===================
export function trackActivity(userJid, groupJid) {
  db.prepare(`
    INSERT INTO activity (user_jid, group_jid, message_count, last_active)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(user_jid, group_jid) DO UPDATE SET
      message_count = message_count + 1,
      last_active = datetime('now')
  `).run(userJid, groupJid);
}

export function getActivity(groupJid) {
  return db.prepare('SELECT * FROM activity WHERE group_jid = ? ORDER BY message_count DESC').all(groupJid);
}

// =================== INVENTORY ===================
export function addItem(userJid, itemName, qty = 1) {
  db.prepare(`
    INSERT INTO inventory (user_jid, item_name, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_jid, item_name) DO UPDATE SET quantity = quantity + ?
  `).run(userJid, itemName, qty, qty);
}

export function removeItem(userJid, itemName, qty = 1) {
  const item = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_name = ?').get(userJid, itemName);
  if (!item || item.quantity < qty) return false;
  if (item.quantity === qty) {
    db.prepare('DELETE FROM inventory WHERE user_jid = ? AND item_name = ?').run(userJid, itemName);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE user_jid = ? AND item_name = ?').run(qty, userJid, itemName);
  }
  return true;
}

export function getInventory(userJid) {
  return db.prepare('SELECT * FROM inventory WHERE user_jid = ?').all(userJid);
}

// =================== AFK ===================
export function setAfk(userJid, reason) {
  db.prepare('INSERT OR REPLACE INTO afk (user_jid, reason, since) VALUES (?, ?, datetime("now"))').run(userJid, reason);
}

export function removeAfk(userJid) {
  db.prepare('DELETE FROM afk WHERE user_jid = ?').run(userJid);
}

export function getAfk(userJid) {
  return db.prepare('SELECT * FROM afk WHERE user_jid = ?').get(userJid);
}

// =================== SUDO ===================
export function addSudo(jid) {
  db.prepare('INSERT OR IGNORE INTO sudo (jid) VALUES (?)').run(jid);
}

export function removeSudo(jid) {
  db.prepare('DELETE FROM sudo WHERE jid = ?').run(jid);
}

export function getSudoList() {
  return db.prepare('SELECT jid FROM sudo').all().map(r => r.jid);
}

export function isSudo(jid) {
  return !!db.prepare('SELECT jid FROM sudo WHERE jid = ?').get(jid);
}

// =================== BAN ===================
export function banUser(jid, reason = 'No reason') {
  db.prepare('INSERT OR REPLACE INTO banned_users (jid, reason) VALUES (?, ?)').run(jid, reason);
}

export function unbanUser(jid) {
  db.prepare('DELETE FROM banned_users WHERE jid = ?').run(jid);
}

export function isBanned(jid) {
  return !!db.prepare('SELECT jid FROM banned_users WHERE jid = ?').get(jid);
}

// =================== ECONOMY HELPERS ===================
export function getRichList(groupJid, participants) {
  if (!participants || participants.length === 0) return [];
  const placeholders = participants.map(() => '?').join(',');
  return db.prepare(`SELECT jid, reg_name, name, coins FROM users WHERE jid IN (${placeholders}) ORDER BY coins DESC LIMIT 10`).all(...participants);
}

export function getGlobalRichList() {
  return db.prepare('SELECT jid, reg_name, name, coins FROM users ORDER BY coins DESC LIMIT 10').all();
}

export default db;
