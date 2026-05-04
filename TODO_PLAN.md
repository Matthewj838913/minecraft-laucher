# Implementation Plan: Minecraft Installation Feature

## Task
Make it so you can play Minecraft thru the launcher by adding Minecraft installation capability.

## Steps
1. [x] Add installMinecraft() function to download Minecraft Java Edition
2. [x] Update launchMinecraft() to handle missing Minecraft gracefully
3. [x] Add IPC handler for install-minecraft
4. [x] Update preload.js to expose installMinecraft API
5. [x] Update renderer.js to add install button in UI
6. [x] Test the installation and launch flow

## Files Edited
- launcher/main.js - Added installation logic and improved launch
- launcher/preload.js - Exposed new API
- launcher/renderer.js - Added install button handler
- launcher/index.html - Added Install button

## Completed Features
- Downloads Minecraft from Mojang servers
- Installs Java libraries automatically
- Downloads game assets
- Check Minecraft installation status
- Install button in UI
- Auto-install when trying to play without Minecraft
- Improved launch with native libraries extraction
- Better Java path detection
