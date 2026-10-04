import './settings.js';
import handler from '#handler';
import makeWASocket, { Browsers, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from 'baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readlineSync from 'readline-sync';
import { smsg, deleteCachedMeta } from '#serialize';
import cmdsLoader from '#cmdsloader';
import db from '#db';

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(` INFO `), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(` SUCCESS `), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(` WARNING `), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white.bold(` ERROR `), chalk.redBright(msg))
};

let phoneNumber = '';
let phoneInput = '';
const lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》';
const methodCodeQR = process.argv.includes('--qr');
const methodCode = process.argv.includes('code');

function normalizePhone(input) {
  let s = String(input).replace(/\D/g, '');
  if (!s) return '';
  if (s.startsWith('0')) s = s.replace(/^0+/, '');
  if (s.length === 10 && s.startsWith('3')) s = '57' + s;
  if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12) s = '521' + s.slice(2);
  if (s.startsWith('54') && !s.startsWith('549') && s.length >= 11) s = '549' + s.slice(2);
  return s;
}

console.log(chalk.magentaBright.bold(`
██████╗  █████╗ ███╗   ██╗ ██████╗ █████╗ ██╗  ██╗███████╗
██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔══██╗██║ ██╔╝██╔════╝
██████╔╝███████║██╔██╗ ██║██║     ███████║█████╔╝ █████╗
██╔═══╝ ██╔══██║██║╚██╗██║██║     ██╔══██║██╔═██╗ ██╔══╝
██║     ██║  ██║██║ ╚████║╚██████╗██║  ██║██║  ██╗███████╗
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
`));
console.log(chalk.cyan.bold('      🥞 Pᴀɴᴄᴀᴋᴇ Bᴏᴛ — Powered by Baileys\n'));

for (const dir of ['./Sessions/Owner', './lib/system/tmp']) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const msgStore = new Map();
const msgLimit = 500;

async function initDB() {
  try {
    db.initDB();
    log.info('Base de datos cargada correctamente.');
  } catch (e) {
    log.error(`La Base de datos no fué cargada. → ${e?.message || e}`);
  }
}

function clearSession() {
  try {
    const sessionDir = './Sessions/Owner';
    if (!fs.existsSync(sessionDir)) return;
    for (const file of fs.readdirSync(sessionDir)) {
      try { fs.unlinkSync(path.join(sessionDir, file)); } catch {}
    }
    log.warn('Sesión del principal eliminada — reiniciando para vincular de nuevo...');
  } catch (e) {
    log.error(`clearSession → ${e?.message || e}`);
  }
}

/* ═══ Selección del método de vinculación ═══ */
let opcion;
if (methodCodeQR) {
  opcion = '1';
} else if (methodCode) {
  opcion = '2';
  if (!phoneNumber) {
    console.log(chalk.bold.redBright(`\nPor favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright('Ejemplo: +57301******')}\n`));
    phoneInput = readlineSync.question(chalk.bold.magentaBright('---> '));
    phoneNumber = normalizePhone(phoneInput);
  }
} else if (!fs.existsSync('./Sessions/Owner/creds.json')) {
  opcion = readlineSync.question(`╭${lineM}
┊ ${chalk.magentaBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.magentaBright('┊')} ${chalk.magenta.bgMagenta.bold.white('METODO DE VINCULACION')}
┊ ${chalk.magentaBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.magentaBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.magentaBright('┊')} ${chalk.bold.cyanBright('COMO DESEA CONECTARSE?')}
┊ ${chalk.magentaBright('┊')} ${chalk.bold.redBright('=>  Opcion 1:')} ${chalk.greenBright('Codigo QR.')}
┊ ${chalk.magentaBright('┊')} ${chalk.bold.redBright('=>  Opcion 2:')} ${chalk.greenBright('Codigo de 8 digitos.')}
┊ ${chalk.magentaBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.magentaBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.magentaBright('┊')} ${chalk.italic.yellowBright('Escriba solo el numero de')}
┊ ${chalk.magentaBright('┊')} ${chalk.italic.yellowBright('la opcion para conectarse.')}
┊ ${chalk.magentaBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
╰${lineM}\n${chalk.bold.magentaBright('---> ')}`);
  while (!/^[1-2]$/.test(opcion)) {
    console.log(chalk.bold.redBright('No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.'));
    opcion = readlineSync.question('--> ');
  }
  if (opcion === '2') {
    console.log(chalk.bold.redBright(`\nPor favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright('Ejemplo: +57301******')}\n`));
    phoneInput = readlineSync.question(chalk.bold.magentaBright('---> '));
    phoneNumber = normalizePhone(phoneInput);
  }
}

let bootTime = Date.now();
let reconexion = 0;
let botReady = false;
let isRestarting = false;
const retriesLimit = 15;

export async function startBot() {
  if (isRestarting) return;
  isRestarting = true;
  bootTime = Date.now();

  const { state, saveCreds: saveCredsDB } = await useMultiFileAuthState('./Sessions/Owner');
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined, isLatest: false }));
  let saveCredsTimer = null;
  const saveCreds = () => { clearTimeout(saveCredsTimer); saveCredsTimer = setTimeout(saveCredsDB, 2000); };

  console.info = () => {};
  console.debug = () => {};

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Chrome'),
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: (jid) => jid.endsWith('@broadcast'),
    keepAliveIntervalMs: 25_000,
    getMessage: async (key) => msgStore.get(key.remoteJid + ':' + key.id)
  });

  global.sock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.sendText = (jid, text, quoted = '', options) => sock.sendMessage(jid, { text, ...options }, { quoted });
  sock.reply = (jid, text = '', quoted, options) => sock.sendMessage(jid, { text, ...options }, { quoted });
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    }
    return jid;
  };

  /* ═══ Código de emparejamiento (8 dígitos) ═══ */
  if (opcion === '2' && !state.creds.registered) {
    setTimeout(async () => {
      try {
        if (!state.creds.registered) {
          const pairing = await sock.requestPairingCode(phoneNumber);
          const codeBot = pairing?.match(/.{1,4}/g)?.join('-') || pairing;
          console.log(chalk.bold.white(chalk.bgMagenta(' Código de emparejamiento: ')), chalk.bold.white(chalk.bgWhite.black(` ${codeBot} `)));
        }
      } catch (err) {
        console.log(chalk.red('Error al generar código:'), err);
      }
    }, 3000);
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!botReady) return;
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg?.message && msg?.key?.id) {
        const sid = msg.key.remoteJid + ':' + msg.key.id;
        msgStore.set(sid, msg.message);
        if (msgStore.size > msgLimit) msgStore.delete(msgStore.keys().next().value);
      }
      try {
        if (!msg?.message || msg.key?.remoteJid === 'status@broadcast') continue;
        if ((msg.messageTimestamp * 1000) < bootTime - 15_000) continue;
        if (msg.message.ephemeralMessage) msg.message = msg.message.ephemeralMessage.message;
        const m = await smsg(sock, msg);
        if (typeof handler === 'function') handler(sock, m, messages).catch((err) => console.error('[ 🥞 ] Main Owner »', err?.message));
      } catch (err) {
        console.error('Error:', err);
      }
    }
  });

  sock.ev.on('group-participants.update', ({ id }) => { deleteCachedMeta(id); });
  sock.ev.on('groups.update', (updates) => { for (const update of updates) deleteCachedMeta(update.id); });

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    if ((qr != 0 && qr != undefined) || methodCodeQR) {
      if (opcion == '1' || methodCodeQR) {
        console.log(chalk.green.bold('[ 🥞 ] Escanea este código QR'));
        qrcode.generate(qr, { small: true });
      }
    }
    if (connection === 'open') {
      bootTime = Date.now();
      reconexion = 0;
      isRestarting = false;
      const userName = sock.user.name || 'Desconocido';
      log.success(`Conectado a: ${userName}`);
      if (!botReady) botReady = true;
    }
    if (isNewLogin) log.info('Nuevo dispositivo detectado');
    if (receivedPendingNotifications === true) {
      log.warn('Por favor espere aproximadamente 1 minuto...');
      sock.ev.flush();
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      if ([DisconnectReason.loggedOut, DisconnectReason.forbidden, DisconnectReason.multideviceMismatch].includes(reason)) {
        log.warn(`Principal desvinculado (${reason}) — limpiando sesión y reiniciando...`);
        botReady = false;
        isRestarting = false;
        clearSession();
        process.exit(1);
      }
      if (reason === DisconnectReason.connectionReplaced) {
        log.warn('Conexión reemplazada — cerrá la otra sesión antes de reconectar.');
        isRestarting = false;
        return;
      }
      reconexion++;
      if (reconexion > retriesLimit) {
        log.error(`Demasiados reintentos (${retriesLimit}) — sesión posiblemente corrupta, limpiando...`);
        botReady = false;
        reconexion = 0;
        isRestarting = false;
        clearSession();
        process.exit(1);
      }
      const delay = Math.min(3000 * reconexion, 30000);
      const reasonMessages = {
        [DisconnectReason.connectionLost]: 'Se perdió la conexión al servidor, intentando reconectar...',
        [DisconnectReason.connectionClosed]: 'Conexión cerrada, intentando reconectarse...',
        [DisconnectReason.restartRequired]: 'Es necesario reiniciar...',
        [DisconnectReason.timedOut]: 'Tiempo de conexión agotado, intentando reconectarse...',
        [DisconnectReason.badSession]: 'Sesión inválida, limpiando y reconectando...'
      };
      log.warn(reasonMessages[reason] || `Desconexión (${reason}), reconectando en ${delay / 1000}s...`);
      isRestarting = false;
      setTimeout(startBot, delay);
    }
  });
}

(async () => {
  await initDB();
  await cmdsLoader();
  await startBot();
})();

process.on('uncaughtException', (err) => console.error(chalk.gray(`[ 🥞 ] uncaughtException: ${err?.message || err}`)));
process.on('unhandledRejection', (err) => console.error(chalk.gray(`[ 🥞 ] unhandledRejection: ${err?.message || err}`)));
