import { fetchJson, tryAll } from '#utils';

/* GIFs de "espiar" con varias fuentes (fallbacks) */
async function getPeekGif() {
  return tryAll([
    async () => {
      const json = await fetchJson('https://api.otakugifs.xyz/gif?reaction=peek&format=gif');
      return json?.url || null;
    },
    async () => {
      const json = await fetchJson('https://nekos.best/api/v2/lurk');
      return json?.results?.[0]?.url || null;
    }
  ]);
}

export default {
  command: ['peek', 'espiar'],
  category: 'anime',
  usage: '<mention>',
  description: 'ᴇsᴘɪᴀʀ ᴀ ᴀʟɢᴜɪᴇɴ.',
  run: async ({ msg, sock, usedPrefix, command }) => {
    try {
      const who = msg.mentionedJid?.[0] || msg.quoted?.sender;
      if (!who) {
        return msg.reply(
          `✎ Etiqueta a la persona que quieres espiar.\n> Ejemplo: *${usedPrefix + command}* + <mention>`
        );
      }

      await msg.react('🫣').catch(() => {});
      const gif = await getPeekGif();
      if (!gif) return msg.reply(global.msgglobal);

      const caption = `@${msg.sender.split('@')[0]} está espiando a @${who.split('@')[0]} ૮₍ ˃̵͈᷄ . ฅ ₎ა`;

      await sock.sendMessage(
        msg.chat,
        { video: { url: gif }, gifPlayback: true, caption, mentions: [msg.sender, who] },
        { quoted: msg }
      );
    } catch (e) {
      console.error(e);
      await msg.reply(global.msgglobal);
    }
  }
};
