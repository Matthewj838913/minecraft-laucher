# Authentication Implementation Plan

## Information Gathered
- `launcher/index.html` loads from empty `website-dist/` directory — UI is broken
- `launcher/renderer.js` has login logic but isn't loaded by current `index.html`
- Auth in `main.js` is fully mocked with fake UUIDs and tokens
- No real Microsoft OAuth, no standard offline UUID generation, no cracked token logic
- Electron app uses `ipcMain`/`ipcRenderer` with `contextBridge`

## Files to Edit

### 1. `launcher/index.html`
- Rewrite to load `styles.css` and `renderer.js` directly
- Add DOM structure: auth mode tabs, inputs for each mode, profile display, play button

### 2. `launcher/renderer.js`
- Add tabbed auth UI: Microsoft | Offline | Cracked
- Microsoft: "Login with Microsoft" button triggers OAuth flow
- Offline: Username input + login button, generates offline UUID
- Cracked: Username + Password inputs + login button
- Display logged-in profile (name, UUID, type)
- Play button passes stored profile to `launchGame`

### 3. `launcher/preload.js`
- Add `microsoftLogin` IPC channel
- Keep existing `login`, `launchGame`, `installMods`, `createServer`

### 4. `launcher/main.js`
- **Microsoft flow**: Implement full OAuth device code or redirect flow
  1. Open browser / use local redirect server
  2. Exchange code for Microsoft token
  3. Xbox Live authenticate
  4. XSTS authorize
  5. Minecraft authenticate
  6. Fetch Minecraft profile (UUID + username)
- **Offline flow**: Generate deterministic UUID from `OfflinePlayer:<username>` using MD5 (Minecraft standard)
- **Cracked flow**: Accept username/password, generate random fake access token and deterministic UUID
- Store active profile globally for `launch-game` handler
- Update `launch-game` to pass real `--username`, `--uuid`, `--accessToken`

### 5. `package.json`
- Add `node-fetch@2` for HTTP requests in main process (CommonJS compatible)

### 6. `backend/server.js`
- Update `/api/auth` to support three modes: microsoft, offline, cracked

## Follow-up Steps
- Run `npm install` to add `node-fetch`
- Test launcher with `npm run dev`
- Verify Microsoft OAuth app registration is documented for users

