# 🥞 Pancake Bot — WhatsApp MD

Bot de WhatsApp multifuncional basado en **Baileys oficial**, con conexión por **código QR** y **código de emparejamiento (pairing code)**. Ligero y pensado para correr en **Termux**.

<p align="center">
  <img src="./media/banner.png" width="300" alt="Pancake Bot">
</p>

---

## 🫧 Características

- Conexión por **codigo QR** (opción 1) y **código de 8 dígitos** (opción 2)
- Menú decorado y dinámico (`#menu`, `#help`, `#allmenu`)
- Comandos de **anime** (reacciones con GIF): `#peek`, `#espiar`
- Comandos de **IA gratuita** (sin API keys): `#chatgpt`, `#gemini`, `#imagine`
- Sistema de **plugins con recarga en caliente** (edita archivos en `cmds/` sin reiniciar)
- Base de datos **JSON** simple (`database.json`)
- Registro de comandos en consola con estilo
- Reconexión automática con *backoff* y limpieza de sesión corrupta

> **Importante:** usa siempre la librería oficial de Baileys (`npm i baileys`). Evita forks y "baileys mods".

---

## 🪷 Instalación en Termux

```bash
termux-setup-storage
```

```bash
apt update && apt upgrade && pkg install -y git nodejs
```

> Si aparece **(Y/I/N/O/D/Z) \[default=N\] ?** escribe **"y"** y pulsa **ENTER**.

```bash
git clone https://github.com/lyanvalentinmail-prog/Pancake-bot
```

```bash
cd Pancake-bot
```

```bash
npm install
```

```bash
npm start
```

### 🫘 Vinculación

Al iniciar por primera vez el bot preguntará el método de vinculación:

- **Opción 1 — Código QR:** escanea el QR desde WhatsApp → *Dispositivos vinculados* → *Vincular dispositivo*.
- **Opción 2 — Código de 8 dígitos (pairing):** ingresa tu número (ejemplo: `+57301******`) y coloca el código en WhatsApp → *Dispositivos vinculados* → *Vincular con número de teléfono*.

También puedes forzar el método directamente:

```bash
npm run qr      # Código QR
npm run code    # Código de emparejamiento
```

La sesión se guarda en `./Sessions/Owner` — **no la compartas con nadie**.

### 🪷 Mantener el bot activo en Termux

```bash
termux-wake-lock && npm i -g pm2 && pm2 start index.js && pm2 save && pm2 logs
```

> Detener: `pm2 stop index` · Iniciar: `pm2 start index` · Logs: `pm2 logs` · Eliminar: `pm2 delete index`

---

## 🫘 Configuración

Edita **`settings.js`**:

| Variable | Descripción |
| --- | --- |
| `global.owner` | Números de los dueños, ej: `['573001234567']` |
| `global.namebot` | Nombre del bot (aparece en el menú) |
| `global.my.web` | Web oficial (se muestra en el menú) |
| `global.my.ch` | JID del newsletter (opcional) |

- **Prefijos por defecto:** `#` `.` `/` `!` (se editan en `lib/system/database.js` → `defSets.prefijo`, o en `database.json` ya generado).
- **Banner del menú:** coloca una imagen en `media/banner.png` (o define una URL) y el menú se enviará con imagen + caption.

---

## 🫗 Comandos

| Comando | Descripción |
| --- | --- |
| `#menu` / `#help` / `#allmenu` | Lista de comandos decorada |
| `#ping` | Velocidad de respuesta del bot |
| `#infobot` | Estado, uptime y estadísticas |
| `#peek + <mention>` | Espía a alguien (GIF de anime) |
| `#chatgpt <texto>` | Habla con ChatGPT |
| `#gemini <texto>` | Habla con Gemini |
| `#imagine <descripción>` | Genera una imagen con IA |

## 🫐 Estructura

```
Pancake-bot/
├── index.js              # Arranque, QR/pairing, reconexión
├── handler.js            # Despachador de comandos
├── settings.js           # Configuración global
├── package.json
├── cmds/                 # Plugins (se cargan y recargan solos)
│   ├── info/             # menu.js, ping.js, infobot.js
│   ├── anime/            # peek.js
│   └── ai/               # chatgpt.js, gemini.js, imagine.js
├── lib/
│   ├── serialize.js      # Serialización de mensajes, caché de grupos
│   ├── utils.js          # Utilidades (fetch, tiempos, tamaños)
│   └── system/
│       ├── cmdsloader.js # Cargador de plugins con hot-reload
│       └── database.js   # Base de datos JSON
└── media/
    └── banner.png        # Banner del menú
```

Crear un comando nuevo es tan fácil como soltar un archivo `.js` en `cmds/<categoria>/`:

```js
export default {
  command: ['hola'],
  category: 'info',
  description: 'saluda.',
  run: async ({ msg }) => {
    await msg.reply('🥞 ¡Hola!');
  }
};
```

---

## ⚠️ Aviso

Este proyecto es con fines **educativos**. El uso indebido de bots en WhatsApp puede derivar en la suspensión del número. Úsalo bajo tu propia responsabilidad.

Distribuido bajo licencia **MIT**.
