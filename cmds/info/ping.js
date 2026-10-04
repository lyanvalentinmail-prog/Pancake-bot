import db from '#db';

export default {
  command: ['ping', 'p'],
  category: 'info',
  description: 'ᴠᴇʟᴏᴄɪᴅᴀᴅ ᴅᴇ ʀᴇsᴘᴜᴇsᴛᴀ ᴅᴇʟ ʙᴏᴛ.',
  run: async ({ msg, sock }) => {
    const start = Date.now();
    const botId = (sock.user?.id.split(':')[0] || '') + '@s.whatsapp.net';
    const { namebot } = await db.getSettings(botId);
    const sent = await sock.sendMessage(msg.chat, { text: '`❏ ¡Pong!`' + `\n> *${namebot}*` }, { quoted: msg });
    const latency = Date.now() - start;

    await sock.sendMessage(
      msg.chat,
      { text: `✿ *Pong!*\n> Tiempo ⴵ ${latency}ms`, edit: sent.key },
      { quoted: msg }
    );
  }
};
