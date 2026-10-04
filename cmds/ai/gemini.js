import { fetchText, fetchJson, tryAll } from '#utils';

export default {
  command: ['gemini', 'bard'],
  category: 'ai',
  description: 'ʜᴀʙʟᴀ ᴄᴏɴ ɢᴇᴍɪɴɪ.',
  run: async ({ msg, sock, text }) => {
    const query = (text || '').trim();
    if (!query) {
      return msg.reply('✎ Escriba una *petición* para que *Gemini* le responda.');
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '✎ *Gemini* está procesando tu respuesta...' },
        { quoted: msg }
      );

      const response = await tryAll([
        async () => fetchText(`https://text.pollinations.ai/${encodeURIComponent(query)}?model=gemini`),
        async () => {
          const json = await fetchJson(
            `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`
          );
          return json?.data || null;
        }
      ]);

      await sock.sendMessage(msg.chat, { text: `${response}`.trim(), edit: key });
    } catch (e) {
      console.error(e);
      await msg.reply(global.msgglobal);
    }
  }
};
