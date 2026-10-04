import db from '#db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── Decoración por categoría (estilo del menú) ─── */
const categoryMeta = {
  anime: {
    kaomoji: '≽ ^⎚ ˕ ⎚^ ≼',
    titulo: '𝐀𝗇𝗂𝗆𝖾',
    desc: '✐ ᴄᴏᴍᴀɴᴅᴏs ᴅᴇ ʀᴇᴀᴄᴄɪᴏɴᴇs ᴅᴇ ᴀɴɪᴍᴇ.',
    icono: '૮₍ ˃̵͈᷄ . ฅ ₎ა',
    deco: '── ˚. ᵎᵎ  ۠'
  },
  ai: {
    kaomoji: '≽(˵◝ ⩊  ◜˵ マ≼',
    titulo: '𝐈𝐀',
    desc: '✎ ʜᴀʙʟᴀ ᴄᴏɴ ɪɴᴛᴇʟɪɢᴇɴᴄɪᴀ ᴀʀᴛɪꜰɪᴄɪᴀʟ',
    icono: '₍ᐢ.  ̫.ᐢ₎',
    deco: '✎'
  },
  info: {
    kaomoji: '୧(˶˃ ᵕ ˂˶)୨',
    titulo: '𝐈𝐧fo',
    desc: '✎ ɪɴꜰᴏʀᴍᴀᴄɪóɴ ʏ ᴇsᴛᴀᴅᴏ ᴅᴇʟ ʙᴏᴛ.',
    icono: '⟡',
    deco: '✎'
  },
  owner: {
    kaomoji: '(≧◡≦) ♡',
    titulo: '𝐎wner',
    desc: '✎ ᴄᴏᴍᴀɴᴅᴏs ᴇxᴄʟᴜsɪᴠᴏs ᴅᴇʟ ᴄʀᴇᴀᴅᴏʀ.',
    icono: '❖',
    deco: '✎'
  }
};
const categoryOrder = ['anime', 'ai', 'info', 'owner'];

const SEPARADOR = 'ᅟᅟ︶͜︶͜︶ᅟᅟ﹙ ❀﹚ᅟᅟ︶͜︶͜︶';

export default {
  command: ['menu', 'help', 'allmenu'],
  category: 'info',
  description: 'ɴᴜᴇsᴛʀᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs.',
  run: async ({ msg, sock, args, usedPrefix: prefix }) => {
    try {
      const botId = (sock.user?.id.split(':')[0] || '') + '@s.whatsapp.net';
      const settings = await db.getSettings(botId);

      const namebot2 = settings.namebot2 || global.namebot || 'Pancake Bot';
      const tipo = settings.type || 'Owner';
      const link = settings.link || global.my?.web || '';
      const web = settings.web || global.my?.web || '';
      const developer = global.owner.length
        ? global.owner.map((num) => `+${num}`).join(', ')
        : 'Sin definir (edita settings.js)';
      const mentions = global.owner.map((num) => num + '@s.whatsapp.net');

      /* ─── Agrupa comandos por categoría (sin duplicar alias) ─── */
      const seen = new Set();
      const categories = {};
      for (const [name, data] of global.comandos) {
        if (seen.has(data.pluginKey)) continue;
        seen.add(data.pluginKey);
        const cat = (data.category || 'otros').toLowerCase();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ name, ...data });
      }

      let menu = `─── ׁ ׅ  𝐇ᴏʟᴀ!, sᴏʏ ${namebot2} (*${tipo}*) . 𐔌՞ ܸ.ˬ.ܸ՞𐦯

✎ ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ʟᴏs ᴄᴏᴍᴀɴᴅᴏs

︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵ ᅟິᅟᅟ︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵

༉‧₊˚. │ 𝐄nlace ❚❙  ⋆˚꩜｡
⸺  ${link}

༉‧₊˚. │𝐃eveloper ❚❙  ⋆˚꩜｡
⸺  ${developer}

ᅟᅟ︶͜︶͜︶ᅟᅟ֪ᅟ֪ᅟᅟ︶͜︶͜︶

> ᴄᴏɴᴇᴄᴛᴀᴛᴇ ᴄᴏᴍᴏ sᴜʙ-ʙᴏᴛ ᴇɴ ɴᴜᴇsᴛʀᴀ ᴡᴇʙ ᴏғɪᴄɪᴀʟ ✎ ${web}
`;

      const orderedCats = [
        ...categoryOrder.filter((c) => categories[c]),
        ...Object.keys(categories).filter((c) => !categoryOrder.includes(c))
      ];

      let idx = 0;
      for (const cat of orderedCats) {
        const meta = categoryMeta[cat] || {
          kaomoji: '(˶ᵔᵕᵔ˶)',
          titulo: cat.charAt(0).toUpperCase() + cat.slice(1),
          desc: `✎ ᴄᴏᴍᴀɴᴅᴏs ᴅᴇ ${cat}.`,
          icono: '❀',
          deco: '✎'
        };
        const bullet = idx === 0 ? '-' : '•';

        menu += `\n${bullet}  ${meta.kaomoji} *\`${meta.titulo}\`*  ᰨᰍ    *;*\n`;
        menu += `> ${meta.desc}\n\n`;

        for (const cmd of categories[cat]) {
          const line = `${prefix}${cmd.name}${cmd.usage ? ` + ${cmd.usage}` : ''}`;
          menu += ` ❀  ${meta.icono}    ݁  ${line}\n`;
          if (cmd.description) menu += `> ${meta.deco} ${cmd.description}\n`;
        }

        if (idx < orderedCats.length - 1) menu += `\n${SEPARADOR}\n`;
        idx++;
      }

      /* ─── Banner: local (media/) o URL configurada ─── */
      let bannerContent = null;
      for (const name of ['banner.png', 'banner.jpg', 'banner.jpeg']) {
        const localPath = path.resolve(__dirname, '../../media', name);
        if (fs.existsSync(localPath)) {
          bannerContent = fs.readFileSync(localPath);
          break;
        }
      }
      if (!bannerContent && settings.banner) bannerContent = { url: settings.banner };

      if (bannerContent) {
        return await sock.sendMessage(
          msg.chat,
          { image: bannerContent, caption: menu.trim(), mentions },
          { quoted: msg }
        );
      }

      return await sock.sendMessage(msg.chat, { text: menu.trim(), mentions }, { quoted: msg });
    } catch (e) {
      console.error(e);
      await msg.reply(global.msgglobal);
    }
  }
};
