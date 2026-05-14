# Offline modpacks

This launcher supports **offline mod installation** by copying locally available mod files into your Minecraft directory.

## Layout
- `launcher/offline/modpacks.json` - offline manifest
- `launcher/offline/mods/` - local jar files referenced by the manifest

## How it works
- Clicking a modpack runs `install-mods` in the Electron main process.
- The launcher reads `launcher/offline/modpacks.json`.
- It copies each jar listed in the modpack into:
  - `<minecraftDir>/mods/` (by `destination: "mods"`)

## To use
1. Download mods on a machine with internet.
2. Copy the resulting `.jar` files into `launcher/offline/mods/`.
3. Update `launcher/offline/modpacks.json` to point at your local filenames.

