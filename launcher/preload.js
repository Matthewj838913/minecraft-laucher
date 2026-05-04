const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (mode, credentials) => ipcRenderer.invoke('login', mode, credentials),
  microsoftLogin: () => ipcRenderer.invoke('microsoft-login'),
  installMods: (modpack) => ipcRenderer.invoke('install-mods', modpack),
  createServer: (config) => ipcRenderer.invoke('create-server', config),
  launchGame: (profile, mods) => ipcRenderer.invoke('launch-game', profile, mods),
  installMinecraft: (version) => ipcRenderer.invoke('install-minecraft', version),
  checkMinecraft: () => ipcRenderer.invoke('check-minecraft')
});

