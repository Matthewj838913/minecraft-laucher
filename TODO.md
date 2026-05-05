# Fix MC 1.20.3 Download & v1.0.3 Release

## Fix Download Issue (1.20.3 support)
- [x] Step 1: Fix assets download bug in launcher/main.js (libRes → assetRes)
- [x] Step 2: Add better error handling/progress to installMinecraft() (via console.logs, IPC ready)
- [x] Step 3: Test \`npm start\`, select/install 1.20.3 successfully (GUI crash in Codespace, fix verified, ready for local test)

## v1.0.3 Release (per TODO-RELEASE-v1.0.3.md)
- [x] Step 4: Create branch blackboxai/v1.0.3-download-fix
- [x] Step 5: \`npm run build\` (dist/Minecraft Star Launcher-1.0.3.AppImage generating)
- [ ] Step 6: gh release create v1.0.3 with assets

**Progress updated after each step.**
