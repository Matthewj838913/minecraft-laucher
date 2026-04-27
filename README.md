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

## 📥 Downloads (v1.0.2)
Latest release: [GitHub Releases](https://github.com/Matthewj838913/minecraft-laucher/releases/latest)

- **Windows**: [Minecraft-Star-Launcher-Windows-portable-1.0.2.zip](https://github.com/Matthewj838913/minecraft-laucher/releases/download/v1.0.2/Minecraft-Star-Launcher-Windows-portable-1.0.2.zip) (Portable .exe - extract & run)
  - Double-click `win-unpacked/Minecraft Star Launcher.exe` to launch.
  - NSIS installer available on Windows build.
- **Linux**: [Minecraft Star Launcher-1.0.1.AppImage](https://github.com/Matthewj838913/minecraft-laucher/releases/download/v1.0.1/Minecraft-Star-Launcher-1.0.1.AppImage)
- **macOS**: .dmg (coming soon)

**Linux Run**: `chmod +x 'Minecraft Star Launcher-1.0.1.AppImage' && ./'Minecraft Star Launcher-1.0.1.AppImage'`
**Dev Verify**: `npm run start`

## 🛠️ Quick Start (Source)
1. Clone repo: `git clone https://github.com/Matthewj838913/minecraft-laucher`
2. `cd minecraft-laucher`
3. `npm install` (runs postinstall for website/backend)
4. Backend: `npm run backend` (optional API, localhost:3001)
5. Website: `cd website && npm run build:launcher` (if needed)
6. Launcher: `npm start` (dev)
7. Build: `npm run build`

## 🚀 Roadmap
See [TODO.md](./TODO.md) & [TODO-RELEASE.md](./TODO-RELEASE.md)

## 📄 License
MIT
