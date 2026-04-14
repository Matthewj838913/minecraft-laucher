const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a1a',
    icon: path.join(__dirname, '../assets/icon.png') // Add later
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Dev tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for launcher features
ipcMain.handle('login', async (event, mode, credentials) => {
  if (mode === 'online') {
    // TODO: Real MSAL auth
    return { success: true, profile: { name: credentials.username, uuid: 'online-uuid', token: 'ms-token' } };
  } else if (mode === 'offline') {
    return { success: true, profile: { name: credentials.username, uuid: 'offline-uuid', token: null } };
  } else { // cracked
    return { success: true, profile: { name: credentials.username, uuid: 'cracked-uuid', token: 'cracked' } };
  }
});

ipcMain.handle('install-mods', async (event, modpack) => {
  try {
    const fs = require('fs-extra');
    const axios = require('axios');
    const path = require('path');
const modsData = require('../data/mods.json');
    const mcDir = path.join(app.getPath('userData'), '.minecraft/mods');
    await fs.ensureDir(mcDir);
    
    const modpack = modsData.modpacks[modpack];
    if (modpack.files) {
      for (const fileUrl of modpack.files) {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(mcDir, fileName);
        const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
        await fs.writeFile(filePath, response.data);
      }
    }
    console.log(`Installed ${modpack.name}`);
    return { success: true, mods: modpack.files };
  } catch (error) {
    console.error('Mod install failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-server', async (event, config) => {
  const fs = require('fs-extra');
  const path = require('path');
  const serversDir = path.join(__dirname, 'servers');
  await fs.ensureDir(serversDir);
  
  const serverJar = path.join(serversDir, `server-${config.version || '1.21'}.jar`);
  if (!fs.existsSync(serverJar)) {
    // Download vanilla server jar (placeholder URLs, replace with real)
    const versionManifest = 'https://piston-meta.mojang.com/v1/packages/...'; // Real: launchermeta URL
    console.log('Download server jar...');
  }
  
  const server = spawn('java', [
    '-Xmx2G', '-Xms1G',
    '-jar', serverJar,
    'nogui'
  ], { 
    cwd: serversDir,
    stdio: 'pipe'
  });
  
  server.stdout.on('data', data => console.log(`Server: ${data}`));
  server.stderr.on('data', data => console.error(`Server ERR: ${data}`));
  
  return { success: true, port: 25565, pid: server.pid, dir: serversDir };
});

ipcMain.handle('launch-game', async (event, profile, mods) => {
  // Launch Minecraft Java with args (requires Java path detection)
  const mcArgs = [
    '-Xmx4G', '-Xms2G',
    `-Djava.library.path=${path.join(app.getPath('userData'), 'runtime')}`,
    '-cp', 'minecraft.jar', // Placeholder
    'net.minecraft.client.main.Main',
    '--username', profile.name,
    '--version', '1.21',
    '--accessToken', profile.token || 'cracked',
    '--gameDir', path.join(app.getPath('userData'), '.minecraft')
  ];
  const javaPath = 'java'; // Auto-detect later
  const mcProcess = spawn(javaPath, mcArgs);
  return { success: true, pid: mcProcess.pid };
});

// Menu
const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { role: 'quit', label: 'Exit Launcher' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' }
    ]
  },
  {
    label: 'Mods',
    submenu: [
      { label: 'Lunar Client', click: () => mainWindow.webContents.send('install-modpack', 'lunar') },
      { label: 'Badlion Client', click: () => mainWindow.webContents.send('install-modpack', 'badlion') }
    ]
  },
  {
    label: 'Servers',
    submenu: [
      { label: 'New Server', click: () => mainWindow.webContents.send('show-servers') }
    ]
  }
]);
Menu.setApplicationMenu(menu);

