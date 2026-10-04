import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.json');

let database = {
  users: {},
  chats: {},
  chat_users: {},
  settings: {}
};

try {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    if (data.trim()) database = { ...database, ...JSON.parse(data) };
  }
} catch (error) {
  console.error('Error al cargar la base de datos:', error);
}

/* ─── Valores por defecto ─── */
export const defUser = {
  name: '',
  exp: 0,
  level: 0,
  usedcommands: 0
};

export const defChat = {
  bannedGrupo: 0,
  adminonly: 0,
  welcome: 0
};

export const defChatUser = {
  stats: {}
};

export const defSets = {
  prefijo: ['#', '.', '/', '!'],
  commandsejecut: 0,
  type: 'Owner',
  link: 'https://github.com/lyanvalentinmail-prog/Pancake-bot',
  banner: '',
  namebot: 'Pancake Bot',
  namebot2: 'Pancake Bot',
  web: 'https://github.com/lyanvalentinmail-prog/Pancake-bot',
  owner: ''
};

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2), 'utf8');
  } catch (error) {
    console.error('Error al guardar la base de datos:', error);
  }
}

export function initDB() {
  saveDatabase();
}

export function getUser(id) {
  if (!id) return Object.values(database.users);
  if (!database.users[id]) {
    database.users[id] = { ...defUser, id };
    saveDatabase();
  }
  return database.users[id];
}

export function updateUser(id, field, val) {
  if (!database.users[id]) getUser(id);
  if (typeof field === 'object' && field !== null) Object.assign(database.users[id], field);
  else database.users[id][field] = val;
  saveDatabase();
  return true;
}

export function getChat(id) {
  if (!id) return Object.values(database.chats);
  if (!database.chats[id]) {
    database.chats[id] = { ...defChat, id };
    saveDatabase();
  }
  return database.chats[id];
}

export function updateChat(id, field, val) {
  if (!database.chats[id]) getChat(id);
  if (typeof field === 'object' && field !== null) Object.assign(database.chats[id], field);
  else database.chats[id][field] = val;
  saveDatabase();
  return true;
}

export function getChatUser(chatId, userId) {
  if (!chatId) return Object.values(database.chat_users);
  if (!userId) return Object.values(database.chat_users).filter((cu) => cu.chat_id === chatId);
  const key = `${chatId}:${userId}`;
  if (!database.chat_users[key]) {
    database.chat_users[key] = { ...defChatUser, chat_id: chatId, user_id: userId };
    saveDatabase();
  }
  return database.chat_users[key];
}

export function updateChatUser(chatId, userId, field, val) {
  const key = `${chatId}:${userId}`;
  if (!database.chat_users[key]) getChatUser(chatId, userId);
  if (typeof field === 'object' && field !== null) Object.assign(database.chat_users[key], field);
  else database.chat_users[key][field] = val;
  saveDatabase();
  return true;
}

export function getSettings(id) {
  if (!database.settings[id]) {
    database.settings[id] = { ...defSets, id };
    saveDatabase();
  }
  return database.settings[id];
}

export function updateSettings(id, field, val) {
  if (!database.settings[id]) getSettings(id);
  if (typeof field === 'object' && field !== null) Object.assign(database.settings[id], field);
  else database.settings[id][field] = val;
  saveDatabase();
  return true;
}

export default {
  initDB,
  getUser,
  updateUser,
  getChat,
  updateChat,
  getChatUser,
  updateChatUser,
  getSettings,
  updateSettings,
  db: database
};
