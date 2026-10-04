import db from '#db';
import os from 'os';
import { msToTime, formatSize } from '#utils';

export default {
  command: ['infobot', 'estado', 'status'],
  category: 'info',
  description: 'ɪɴꜰᴏʀᴍᴀᴄɪóɴ ʏ ᴇsᴛᴀᴅᴏ ᴅᴇʟ ʙᴏᴛ.',
  run: async ({ msg, sock }) => {
    try {
      const botId = (sock.user?.id.split(':')[0] || '') + '@s.whatsapp.net';
      const settings = await db.getSettings(botId);
      const users = (await db.getUser()) || [];
      const totalCommands = global.comandos?.size || 0;
      const uptime = msToTime(process.uptime() * 1000);
      const ram = formatSize(process.memoryUsage().rss);

      const info = `❏ *${settings.namebot2 || 'Pancake Bot'}* — Estado

✎ *Uptime:* ${uptime}
✎ *Comandos cargados:* ${totalCommands}
✎ *Comandos ejecutados:* ${settings.commandsejecut || 0}
✎ *Usuarios registrados:* ${users.length}
✎ *Plataforma:* ${os.platform()} (${os.arch()})
✎ *Node.js:* ${process.version}
✎ *RAM utilizada:* ${ram}

> ${global.dev}`;

      await msg.reply(info);
    } catch (e) {
      console.error(e);
      await msg.reply(global.msgglobal);
    }
  }
};
