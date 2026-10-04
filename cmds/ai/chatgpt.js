import { fetchText, fetchJson, tryAll } from '#utils';

export default {
  command: ['chatgpt', 'gpt', 'ia'],
  category: 'ai',
  description: 'ʜᴀʙʟᴀ ᴄᴏɴ ᴄʜᴀᴛɢᴘᴛ.',
  run: async ({ msg, sock, text }) => {
    const query = (text || '').trim();
    if (!query) {
      return msg.reply('✎ Escriba una *petición* para que *ChatGPT* le responda.');
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '✎ *ChatGPT* está procesando tu respuesta...' },
        { quoted: msg }
      );

      const response = await tryAll([
        async () => fetchText(`https://text.pollinations.ai/${encodeURIComponent(query)}?model=openai`),
        async () => {
          const json = await fetchJson(
            `https://api.siputzx.my.id/api/ai/gpt3?prompt=eres%20un%20asistente%20amigable&message=${encodeURIComponent(query)}`
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
