import { downloadContentFromMessage, getContentType, extractMessageContent, jidDecode } from 'baileys';

/* ═══ Caché de metadatos de grupos ═══ */
const metaCache = new Map();
const metaTTL = 5 * 60 * 1000;

export function getCachedMeta(groupJid) {
  const c = metaCache.get(groupJid);
  if (!c) return null;
  if (Date.now() - c.t > metaTTL) { metaCache.delete(groupJid); return null; }
  return c.v;
}

export function setCachedMeta(groupJid, metadata) {
  if (metadata) metaCache.set(groupJid, { v: metadata, t: Date.now() });
}

export function deleteCachedMeta(groupJid) {
  metaCache.delete(groupJid);
}

/* ═══ Utilidades JID ═══ */
export function normalizeJid(raw) {
  if (!raw) return raw;
  if (/:\d+@/gi.test(raw)) {
    const decoded = jidDecode(raw) || {};
    return (decoded.user && decoded.server && decoded.user + '@' + decoded.server) || raw;
  }
  return raw;
}

// Resuelve un @lid a su número de teléfono (@s.whatsapp.net) de la mejor forma posible.
async function pnForLid(sock, jid, groupMetadata) {
  if (!jid || !jid.endsWith('@lid')) return jid;
  const base = jid.split('@')[0];
  // 1) Buscar en los participantes del grupo
  if (groupMetadata?.participants) {
    for (const p of groupMetadata.participants) {
      if (p.lid?.split('@')[0] === base && p.id) return p.id;
      if (p.id?.split('@')[0] === base && p.phoneNumber) return p.phoneNumber;
    }
  }
  // 2) Store interno de mapeo LID → PN de Baileys
  try {
    const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid);
    if (pn) return pn.includes('@') ? pn : pn + '@s.whatsapp.net';
  } catch {}
  return jid;
}

/* ═══ Buffer desde URL ═══ */
export async function getBuffer(url, options = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/* ═══ Serializador principal ═══ */
export async function smsg(sock, msg) {
  if (!sock.decodeJid) {
    sock.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {};
        return (decoded.user && decoded.server && decoded.user + '@' + decoded.server) || jid;
      }
      return jid;
    };
  }
  if (!sock.reply) {
    sock.reply = (jid, text = '', quoted, options) =>
      sock.sendMessage(jid, { text, ...options }, { quoted });
  }
  if (!msg) return msg;

  let groupMeta = null;
  if (msg.key) {
    msg.id = msg.key.id;
    msg.chat = msg.key.remoteJid;
    msg.fromMe = msg.key.fromMe;
    msg.isBot =
      ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some((a) => msg.id.startsWith(a) && [12, 16, 20, 22, 40].includes(msg.id.length)) ||
      /(.)\1{5,}|[^a-zA-Z0-9]/.test(msg.id) || false;
    msg.isGroup = msg.chat?.endsWith('@g.us') ?? false;
    if (!msg.isGroup && msg.chat?.endsWith('@lid')) {
      msg.chat = await pnForLid(sock, msg.chat, null);
    }
    if (msg.isGroup) groupMeta = getCachedMeta(msg.chat);
    const rawSender = (msg.fromMe && sock.user.id) || msg.key?.participant || msg.key?.remoteJid || '';
    msg.sender = await pnForLid(sock, sock.decodeJid(normalizeJid(rawSender)), groupMeta);
  }
  msg.pushName = msg.pushName || 'Sin nombre';

  if (msg.message) {
    msg.type = getContentType(msg.message) || Object.keys(msg.message)[0];
    msg.content = /viewOnceMessage|viewOnceMessageV2Extension|editedMessage|ephemeralMessage/i.test(msg.type)
      ? msg.message[msg.type].message[getContentType(msg.message[msg.type].message)]
      : extractMessageContent(msg.message[msg.type]) || msg.message[msg.type];

    msg.body =
      msg.message?.conversation ||
      msg.content?.text || msg.content?.conversation || msg.content?.caption ||
      msg.content?.selectedButtonId || msg.content?.singleSelectReply?.selectedRowId ||
      msg.content?.selectedId || msg.content?.contentText || msg.content?.selectedDisplayText ||
      msg.content?.title || msg.content?.name || '';

    msg.text =
      msg.content?.text || msg.content?.caption || msg.message?.conversation ||
      msg.content?.contentText || msg.content?.selectedDisplayText || msg.content?.title || '';

    const rawMentioned = msg.content?.contextInfo?.mentionedJid ?? [];
    msg.mentionedJid = [];
    for (const raw of rawMentioned) {
      const norm = normalizeJid(raw);
      msg.mentionedJid.push(norm?.endsWith('@lid') ? await pnForLid(sock, norm, groupMeta) : norm);
    }

    msg.isMedia = !!msg.content?.mimetype || !!msg.content?.thumbnailDirectPath;
    msg.mimetype = msg.content?.mimetype || '';
    msg.expiration = msg.content?.contextInfo?.expiration || 0;
    msg.timestamp =
      (typeof msg.messageTimestamp === 'number'
        ? msg.messageTimestamp
        : msg.messageTimestamp?.low || msg.messageTimestamp?.high) * 1000;

    /* ─── Mensaje citado ─── */
    msg.quoted = msg.content?.contextInfo?.quotedMessage ? {} : null;
    if (msg.quoted) {
      const qInfo = msg.content.contextInfo;
      msg.quoted.message = extractMessageContent(qInfo.quotedMessage);
      msg.quoted.type = getContentType(msg.quoted.message) || Object.keys(msg.quoted.message)[0];
      msg.quoted.content = extractMessageContent(msg.quoted.message[msg.quoted.type]) || msg.quoted.message[msg.quoted.type];
      msg.quoted.id = qInfo.stanzaId;
      msg.quoted.chat = qInfo.remoteJid || msg.chat;
      const rawQP = qInfo?.participant ?? '';
      msg.quoted.sender = await pnForLid(sock, sock.decodeJid(normalizeJid(rawQP)), groupMeta);
      msg.quoted.fromMe = msg.quoted.sender === sock.decodeJid(sock.user.id);
      msg.quoted.text =
        msg.quoted.content?.text || msg.quoted.content?.caption || msg.quoted.content?.conversation ||
        msg.quoted.content?.contentText || msg.quoted.content?.selectedDisplayText || msg.quoted.content?.title || '';
      msg.quoted.mimetype = msg.quoted.content?.mimetype || '';
      msg.quoted.msg = msg.quoted.content;

      msg.quoted.download = async () => {
        const mime = msg.quoted.content?.mimetype || '';
        const messageType = (msg.quoted.type || mime.split('/')[0] || '').replace(/Message/gi, '');
        if (!messageType) throw new Error('El mensaje citado no contiene medios');
        const stream = await downloadContentFromMessage(msg.quoted.content, messageType);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
      };
    }

    msg.download = async () => {
      const mime = msg.content?.mimetype || '';
      const messageType = (msg.type || mime.split('/')[0] || '').replace(/Message/gi, '');
      if (!messageType || !mime) throw new Error('El mensaje no contiene medios');
      const stream = await downloadContentFromMessage(msg.content, messageType);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks);
    };
  }

  /* ─── Helpers de respuesta ─── */
  msg.reply = async (text) =>
    sock.sendMessage(msg.chat, { text: String(text ?? ''), ...{} }, { quoted: msg });

  msg.react = async (emoji) =>
    sock.sendMessage(msg.chat, { react: { text: emoji, key: msg.key } });

  return msg;
}
