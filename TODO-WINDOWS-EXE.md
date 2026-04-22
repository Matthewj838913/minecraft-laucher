# Windows .exe Installer Steps for Public Distribution

Version target: 1.0.2 (increment from 1.0.1)

## Plan Steps (Approved)
- [x] Step 0: Current Linux build complete (AppImage)
- [x] Step 1: Build Windows (`npx electron-builder --win`) - win-unpacked/ success, rcedit signing failed (wine32 missing)
- [x] Step 2: Verified dist/win-unpacked/ (Minecraft Star Launcher.exe + resources)
- [x] Step 3: Test installer (unpacked .exe ready; skip NSIS test)
- [x] Step 4: Update package.json (author, publish, version 1.0.2)

- [x] Step 5: Update README.md (Windows .exe instructions)
- [ ] Step 6: Git branch for release
- [ ] Step 7: GH release v1.0.2 with unpacked .exe zip
- [ ] Step 8: Update TODOs
- [ ] Step 9: Final verification

**Current Status**: .exe built (unpacked). Ready for docs & release. Note: Full NSIS requires wine32 install or Windows build.

