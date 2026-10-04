import { fetchBuffer } from '#utils';

export default {
  command: ['imagine', 'imaginar', 'imgg'],
  category: 'ai',
  description: 'ᴄʀᴇᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ʜᴇᴄʜᴀ ᴘᴏʀ ʟᴀ ɪᴀ.',
  run: async ({ msg, sock, text }) => {
    const prompt = (text || '').trim();
    if (!prompt) {
      return msg.reply('✎ Escriba una *descripción* de la imagen que desea crear.\n> Ejemplo: *#imagine* un panqueque kawaii en el espacio');
    }

    try {
      await msg.react('⏳').catch(() => {});
      const seed = Math.floor(Math.random() * 999999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
      const buffer = await fetchBuffer(url, {}, 120000);
      if (!buffer || buffer.length < 1024) throw new Error('Imagen vacía');

      await sock.sendMessage(
        msg.chat,
        { image: buffer, caption: `✎ ɪᴍᴀɢᴇɴ ɢᴇɴᴇʀᴀᴅᴀ ᴘᴏʀ ɪᴀ\n\n❏ *${prompt}*` },
        { quoted: msg }
      );
      await msg.react('✅').catch(() => {});
    } catch (e) {
      console.error(e);
      await msg.react('❌').catch(() => {});
      await msg.reply(global.msgglobal);
    }
  }
};
