import { fileURLToPath } from 'url';
import { watchFile, unwatchFile } from 'fs';

/* 🥞 ═══ Configuración global de Pancake Bot ═══ */

// ▸ Números de los dueños del bot (con código de país, sin '+' ni espacios).
//   Ejemplo: ['573001234567']
global.owner = [];

// ▸ Identidad del bot
global.namebot = 'Pancake Bot';
global.dev = `ʙᴜɪʟᴛ ʙʏ ᴘᴀɴᴄᴀᴋᴇ ʙᴏᴛ 🥞`;

// ▸ Mensajes globales
global.msgglobal = '✿⸝꙳.˖ Ocurrió un problema, contacte al creador.';
global.mess = {
  owner: '(∩´͈ ᴖ `͈∩ ྀི) Este comando solo puede ser ejecutado por el Creador del Bot.',
  admin: '٩ʕ◕౪◕ʔو Este comando solo puede ser ejecutado por los Administradores del Grupo.',
  botAdmin: '(𓂂꜆◕⩊◕꜀𓂂) Este comando solo puede ser ejecutado si el Bot es Administrador del Grupo.'
};

// ▸ Enlaces del proyecto (se muestran en el menú)
global.my = {
  ch: '', // JID del newsletter oficial (opcional), ej: '120363000000000000@newsletter'
  web: 'https://github.com/lyanvalentinmail-prog/Pancake-bot'
};

// ▸ Recarga en caliente de este archivo
let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  import(`${file}?update=${Date.now()}`);
});
