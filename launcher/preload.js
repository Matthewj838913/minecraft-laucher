const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (mode, credentials) => ipcRenderer.invoke('login', mode, credentials),
  installMods: (modpack) => ipcRenderer.invoke('install-mods', modpack),
  createServer: (config) => ipcRenderer.invoke('create-server', config),
  launchGame: (profile, mods) => ipcRenderer.invoke('launch-game', profile, mods)
});

