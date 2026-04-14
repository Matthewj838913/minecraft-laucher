# Minecraft Star Launcher 🚀

A cosmic, star-inspired Minecraft launcher supporting **offline, online, and cracked modes**, full mod integration from top launchers like Lunar Client, Badlion, Feather, etc. (via manifests/Modrinth/CurseForge), one-click **server creation/hosting**, and an integrated **website** for mods/users.

## ✨ Features
- **Auth Modes**: Online (Mojang/Microsoft), Offline (local profiles), Cracked (any username).
- **Mods**: Auto-download/install modpacks from Lunar Client, Badlion, etc. + Fabric/Forge/Quilt support.
- **Servers**: Create/host local Java servers, LAN/multiplayer setup.
- **UI**: Starry night theme with animations (twinkling stars, nebula gradients).
- **Website**: Browse/download mods, accounts, launcher updates.
- Cross-platform: Windows/macOS/Linux.

## 🛠️ Tech Stack
- **Desktop App**: Electron + React/TailwindCSS.
- **Backend**: Node.js/Express.
- **Website**: React.
- Minecraft Java Edition (bundled Java check).

## 📦 Quick Start
1. Clone repo: `git clone <repo>`
2. `cd minecraft-launcher`
3. `npm install` (runs postinstall for website/backend)
4. Backend: `npm run backend` (optional API)
5. Website: `cd website && npm run build:launcher`
6. Launcher: `npm start` (dev)
7. Build app: `npm run build`

## 🚀 Roadmap
See [TODO.md](./TODO.md)

## 📄 License
MIT

