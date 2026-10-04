/* 🥞 Utilidades varias de Pancake Bot */

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const isUrl = (text) =>
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(text);

/* Duración legible: "2h 15m 4s" */
export function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

/* Tamaño legible: "12.4 MB" */
export function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(2)} ${units[i]}`;
}

/* GET JSON con timeout */
export async function fetchJson(url, options = {}, timeout = 25000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.json();
}

/* GET texto plano con timeout */
export async function fetchText(url, options = {}, timeout = 45000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return (await res.text()).trim();
}

/* GET buffer con timeout */
export async function fetchBuffer(url, options = {}, timeout = 90000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/* Intenta varias funciones en orden y devuelve la primera que funcione */
export async function tryAll(fns) {
  let lastError = null;
  for (const fn of fns) {
    try {
      const result = await fn();
      if (result !== null && result !== undefined && result !== '' && `${result}`.trim() !== '') return result;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Todos los métodos fallaron');
}

export default { sleep, pickRandom, isUrl, msToTime, formatSize, fetchJson, fetchText, fetchBuffer, tryAll };
