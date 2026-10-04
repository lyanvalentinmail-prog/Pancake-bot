import db from '#db';
import chalk from 'chalk';
import { getCachedMeta, setCachedMeta } from '#serialize';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async (sock, msg) => {
  try {
    if (!msg?.message) return;
    if (msg.fromMe && !msg.key.participant && msg.isBot) return;

    const sender = msg.sender;
    const from = msg.chat;
    const botJid = (sock.user?.id?.split(':')[0] || '') + '@s.whatsapp.net';
    const settings = await db.getSettings(botJid);

    const isOwner = sender === botJid || global.owner.map((num) => num + '@s.whatsapp.net').includes(sender);

    /* ─── Datos del grupo ─── */
    let groupMetadata = null;
    let groupName = '';
    if (msg.isGroup) {
      groupMetadata = getCachedMeta(msg.chat);
      if (!groupMetadata) {
        groupMetadata = await sock.groupMetadata(msg.chat).catch(() => null);
        if (groupMetadata) setCachedMeta(msg.chat, groupMetadata);
      }
      groupName = groupMetadata?.subject || '';
    }
    const participants = groupMetadata?.participants || [];
    const adminSet = new Set(
      participants
        .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
        .flatMap((p) => [p.id?.split('@')[0], p.lid?.split('@')[0], p.phoneNumber?.split('@')[0]].filter(Boolean))
    );
    const isBotAdmins = msg.isGroup ? adminSet.has(botJid.split('@')[0]) : false;
    const isAdmins = msg.isGroup ? adminSet.has(sender.split('@')[0]) : false;

    /* ─── Hooks "before" de los plugins ─── */
    for (const p of (global.cmdsExecute ?? [])) {
      if (p.type !== 'before') continue;
      try {
        if (await p.fn({ msg, sock, groupMetadata, participants, isAdmins, isBotAdmins, isOwner, __dirname: p.dirname })) continue;
      } catch (e) {
        console.error(chalk.gray(`[ 🥞 ] Error before-plugin ${p.key}: ${e.message}`));
      }
    }

    /* ─── Detección de prefijo ─── */
    const prefixArray = (Array.isArray(settings.prefijo) ? settings.prefijo : [settings.prefijo]).filter(Boolean);
    if (!prefixArray.length) prefixArray.push('#');
    const prefixRegex = new RegExp('^(' + prefixArray.map(esc).join('|') + ')');
    const match = prefixRegex.exec(msg.text || '');
    if (!match) return;

    const usedPrefix = match[0];
    let args = msg.text.slice(usedPrefix.length).trim().split(/ +/).filter(Boolean);
    const command = (args.shift() || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // quita tildes
    const text = args.join(' ');
    if (!command) return;

    /* ─── Ignorar mensajes de otros bots (evita bucles) ─── */
    if (msg.id.startsWith('3EB0') || (msg.id.startsWith('BAE5') && msg.id.length === 16) || (msg.id.startsWith('B24E') && msg.id.length === 20)) return;

    /* ─── Registro en consola ─── */
    const hora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    console.log(`
𝄢 · • —– ٠ ✤ ٠ —– • · · • —– ٠ ✤ ٠ —– • ·✧༄
❚ ▸ ${chalk.cyan('𝐁𝐎𝐓 ❱❱')} ${chalk.bgMagenta(chalk.white.italic(sock.user?.name || global.namebot))}
❚ ▸ ${chalk.cyan('𝐇𝐎𝐑𝐀𝐑𝐈𝐎 ❱❱')} ${chalk.black.bgWhite(hora)}
❚ ${chalk.magentaBright('°o.OO.o°°o.OO.o°°o.OO.o°')}
❚ ▸ ${chalk.green('𝐔𝐒𝐔𝐀𝐑𝐈𝐎 ❱❱')} ${chalk.white(msg.pushName)} / ${chalk.bgMagentaBright.bold(msg.isGroup ? 'Grupo' : 'Chat Private')}
❚ ▸ ${chalk.green('𝐂𝐎𝐌𝐀𝐍𝐃𝐎 ❱❱')} ${chalk.magentaBright(command)}
❚ ▸ ${chalk.green('𝐆𝐑𝐔𝐏𝐎 ❱❱')} ${chalk.white(groupName || '—')}
❚ ${chalk.magentaBright('°o.OO.o°°o.OO.o°°o.OO.o°')}
𝄢 · • —– ٠ ✤ ٠ —– • · · • —– ٠ ✤ ٠ —– • ·✧༄`.trim());

    /* ─── Estadísticas por chat/usuario ─── */
    const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const chatUser = await db.getChatUser(msg.chat, msg.sender);
    if (!chatUser.stats) chatUser.stats = {};
    if (!chatUser.stats[today]) chatUser.stats[today] = { msgs: 0, cmds: 0 };
    chatUser.stats[today].msgs++;
    await db.updateChatUser(msg.chat, msg.sender, 'stats', chatUser.stats);

    /* ─── Búsqueda del comando ─── */
    const cmdData = global.comandos.get(command);
    if (!cmdData) {
      await sock.readMessages([msg.key]);
      return msg.reply(`ꕤ El comando *${command}* no existe.\n✎ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    }

    if (cmdData.isOwner && !isOwner) {
      return msg.reply(`ꕤ El comando *${command}* no existe.\n✎ Usa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
    }
    if (cmdData.isAdmin && !isAdmins) return sock.reply(msg.chat, global.mess.admin, msg);
    if (cmdData.botAdmin && !isBotAdmins) return sock.reply(msg.chat, global.mess.botAdmin, msg);

    try {
      await sock.readMessages([msg.key]);

      const user = await db.getUser(msg.sender);
      user.usedcommands = (user.usedcommands || 0) + 1;
      user.exp = (user.exp || 0) + Math.floor(Math.random() * 100);
      user.name = msg.pushName;
      await db.updateUser(msg.sender, 'usedcommands', user.usedcommands);
      await db.updateUser(msg.sender, 'exp', user.exp);
      await db.updateUser(msg.sender, 'name', user.name);

      settings.commandsejecut = (settings.commandsejecut || 0) + 1;
      await db.updateSettings(botJid, 'commandsejecut', settings.commandsejecut);

      const statsUser = await db.getChatUser(msg.chat, msg.sender);
      if (statsUser?.stats?.[today]) {
        statsUser.stats[today].cmds++;
        await db.updateChatUser(msg.chat, msg.sender, 'stats', statsUser.stats);
      }

      await cmdData.run({
        msg, sock, args, command, usedPrefix, text,
        groupMetadata, participants, isAdmins, isBotAdmins, isOwner,
        __dirname: global.plugins[cmdData.pluginKey]?.dirname
      });
    } catch (error) {
      console.error(chalk.redBright(`[ 🥞 ] Error en comando ${command}:`), error);
      return msg.reply(`${global.msgglobal}\n> _${error?.message || error}_`);
    }
  } catch (e) {
    console.error(chalk.gray('[ 🥞 ] handler:'), e);
  }
};
