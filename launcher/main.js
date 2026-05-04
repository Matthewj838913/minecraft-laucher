const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const http = require('http');
const crypto = require('crypto');
const fetch = require('node-fetch');

// IMPORTANT: Register your own Microsoft Azure app and replace this Client ID.
// Instructions: https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app
// Redirect URI must include http://localhost (any port)
const CLIENT_ID = '00000000402C8DB8';

let mainWindow;
let currentProfile = null;
let authCodeVerifier = null;

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
    icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

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

// ==================== AUTH HELPERS ====================

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function offlineUUID(username) {
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + username, 'utf8').digest();
  // Set version (0011) and variant (10) bits per RFC 4122
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    hash.toString('hex', 6, 8),
    hash.toString('hex', 8, 10),
    hash.toString('hex', 10, 16)
  ].join('-');
}

function crackedUUID(username) {
  // Generate a random UUID for cracked accounts
  const hash = crypto.createHash('md5').update(username + Date.now(), 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    hash.toString('hex', 6, 8),
    hash.toString('hex', 8, 10),
    hash.toString('hex', 10, 16)
  ].join('-');
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ==================== MICROSOFT OAUTH ====================

async function startMicrosoftAuth() {
  const { verifier, challenge } = generatePKCE();
  authCodeVerifier = verifier;

  // Create promise-based local server to capture OAuth callback
  const authResult = await new Promise(async (resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, {'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Authentication Failed</h1>
          <p>${error}: ${url.searchParams.get('error_description') || ''}</p>
          <p>You can close this window.</p>
          </body></html>
        `);
        server.close();
        reject(new Error(`Microsoft OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Authentication Successful</h1>
          <p>You can close this window and return to the launcher.</p>
          </body></html>
        `);
        server.close();
        resolve(code);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const redirectUri = `http://localhost:${port}`;

      const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?`
        + `client_id=${encodeURIComponent(CLIENT_ID)}`
        + `&response_type=code`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&scope=${encodeURIComponent('XboxLive.signin offline_access')}`
        + `&code_challenge=${encodeURIComponent(challenge)}`
        + `&code_challenge_method=S256`;

      shell.openExternal(authUrl);

      // Wait for timeout or code
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout'));
      }, 120000);
    });

    server.on('error', reject);
  });

  // Step 1: Exchange code for Microsoft access token
  const tokenResult = await getMicrosoftToken(authResult, authCodeVerifier);
  const msToken = tokenResult.access_token;

  // Step 2: Xbox Live authentication
  const xblResult = await xboxLiveAuth(msToken);
  const xblToken = xblResult.token;
  const userHash = xblResult.userHash;

  // Step 3: XSTS authorization
  const xstsResult = await xstsAuth(xblToken, userHash);
  const xstsToken = xstsResult.token;

  // Step 4: Minecraft authentication
  const mcToken = await mcAuth(xstsToken, userHash);

  // Step 5: Get Minecraft profile
  const mcProfileData = await mcProfile(mcToken);

  return {
    success: true,
    profile: {
      type: 'microsoft',
      uuid: mcProfileData.uuid,
      name: mcProfileData.name,
      accessToken: mcToken
    }
  };
}

async function getMicrosoftToken(code, verifier, redirectUri) {
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');
  params.append('code_verifier', verifier);
  params.append('scope', 'XboxLive.signin offline_access');

  const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to get Microsoft token');
  }
  return data;
}

// ... (rest of auth functions remain the same)

async function xboxLiveAuth(msAccessToken) {
  const response = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${msAccessToken}`
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    })
  });

  const data = await response.json();
  if (!response.ok || !data.Token) {
    throw new Error('Xbox Live authentication failed');
  }
  return { token: data.Token, userHash: data.DisplayClaims.xui[0].uhs };
}

async function xstsAuth(xblToken, userHash) {
  const response = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xblToken]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    })
  });

  const data = await response.json();
  if (!response.ok || !data.Token) {
    throw new Error('XSTS authorization failed');
  }
  return { token: data.Token, userHash: data.DisplayClaims.xui[0].uhs };
}

async function mcAuth(xstsToken, userHash) {
  const response = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken: `XBL3.0 x=${userHash};${xstsToken}` })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error('Minecraft authentication failed');
  }
  return data.access_token;
}

async function mcProfile(mcToken) {
  const response = await fetch('https://api.minecraftservices.com/minecraft/profile', {
    headers: { Authorization: `Bearer ${mcToken}` }
  });

  const data = await response.json();
  if (!response.ok || !data.id) {
    throw new Error('Failed to fetch Minecraft profile: ' + (data.errorMessage || response.statusText));
  }
  return { uuid: data.id, name: data.name, skins: data.skins, capes: data.capes };
}

// ==================== LAUNCH GAME ====================

async function findJava() {
  const javaPaths = [
    'java',
    process.platform === 'win32' ? 'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Java\\jre-1.8\\bin\\java.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Java\\jre-8\\bin\\java.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Java\\jre-1.8\\bin\\java.exe' : null,
    '/usr/bin/java',
    '/usr/lib/jvm/java-17-openjdk-amd64/bin/java',
    '/usr/lib/jvm/java-21-openjdk-amd64/bin/java',
    '/usr/lib/jvm/default/bin/java',
    '/opt/java/openjdk/bin/java'
  ].filter(p => p !== null);

  for (const p of javaPaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (e) {
      // Continue checking
    }
  }
  
  // Try to find Java using environment
  if (process.platform === 'win32') {
    const javaHome = process.env.JAVA_HOME;
    if (javaHome) {
      const javaExe = path.join(javaHome, 'bin', 'java.exe');
      if (fs.existsSync(javaExe)) {
        return javaExe;
      }
    }
  }
  
  return 'java'; // Fallback
}

async function launchMinecraft(profile) {
  // Find Java
  const javaPath = await findJava();

  // Find Minecraft directory
  const minecraftDirs = [
    path.join(app.getPath('appData'), '.minecraft'),
    path.join(app.getPath('home'), '.minecraft'),
    process.platform === 'win32' ? 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\.minecraft' : null
  ].filter(d => d !== null);

  let minecraftDir = null;
  for (const dir of minecraftDirs) {
    try {
      if (fs.existsSync(dir)) {
        minecraftDir = dir;
        break;
      }
    } catch (e) {
      // Continue checking
    }
  }

  if (!minecraftDir) {
    return { success: false, error: 'Minecraft directory not found. Please install Minecraft first.' };
  }

  const versionsDir = path.join(minecraftDir, 'versions');
  let versions = [];
  try {
    if (fs.existsSync(versionsDir)) {
      versions = fs.readdirSync(versionsDir).filter(f => {
        return fs.existsSync(path.join(versionsDir, f, `${f}.jar`));
      });
    }
  } catch (e) {
    // Ignore
  }

  if (versions.length === 0) {
    return { success: false, error: 'No Minecraft versions found. Please install Minecraft first.' };
  }

  // Use latest version or 1.21 if available
  let latestVersion = versions.sort().pop();
  if (versions.includes('1.21') || versions.includes('1.21.1') || versions.includes('1.21.2') || versions.includes('1.21.3')) {
    latestVersion = versions.find(v => v.startsWith('1.21')) || latestVersion;
  }
  
  const jarPath = path.join(versionsDir, latestVersion, `${latestVersion}.jar`);
  const jsonPath = path.join(versionsDir, latestVersion, `${latestVersion}.json`);

  if (!fs.existsSync(jarPath)) {
    return { success: false, error: `Minecraft JAR not found: ${jarPath}. Please reinstall Minecraft.` };
  }

  // Read version JSON for libraries
  let versionData = null;
  if (fs.existsSync(jsonPath)) {
    try {
      versionData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      // Ignore
    }
  }

  // Build classpath with libraries
  let classpath = jarPath;
  if (versionData && versionData.libraries) {
    const libsDir = path.join(minecraftDir, 'libraries');
    const classpathPaths = [];
    
    for (const lib of versionData.libraries) {
      if (lib.downloads && lib.downloads.artifact) {
        const libPath = path.join(libsDir, lib.downloads.artifact.path);
        if (fs.existsSync(libPath)) {
          classpathPaths.push(libPath);
        }
      }
    }
    
    classpath = classpath + path.delimiter + classpathPaths.join(path.delimiter);
  }

  // Native libraries directory
  const nativesDir = path.join(minecraftDir, 'natives', latestVersion);
  fs.ensureDirSync(nativesDir);

  // Extract natives if needed
  if (versionData && versionData.libraries) {
    const libsDir = path.join(minecraftDir, 'libraries');
    
    for (const lib of versionData.libraries) {
      if (lib.extract && lib.downloads && lib.downloads.artifact) {
        const libPath = path.join(libsDir, lib.downloads.artifact.path);
        if (fs.existsSync(libPath)) {
          const nativeName = path.basename(libPath);
          const targetPath = path.join(nativesDir, nativeName);
          if (!fs.existsSync(targetPath)) {
            try {
              fs.copyFileSync(libPath, targetPath);
            } catch (e) {
              console.log(`Failed to extract native: ${nativeName}`);
            }
          }
        }
      }
    }
  }

  // JVM arguments
  const jvmArgs = [
    '-Xmx2G',
    '-Xms1G',
    `-Djava.library.path=${nativesDir}`,
    `-Dminecraft.launcher.version=${latestVersion}`,
    '-Dminecraft.launcher.name=Minecraft Star Launcher'
  ];
  
  // Add mojang protocol fix
  jvmArgs.push('-Dlog4j.configurationFactory.reset=false=true');
  jvmArgs.push('-Dorg.lwjgl.system.BlackholeProvider');

  // Game arguments
  const gameArgs = [
    '--username', profile.name,
    '--uuid', profile.uuid,
    '--accessToken', profile.accessToken || 'offline_token',
    '--version', latestVersion,
    '--width', '1280',
    '--height', '720',
    '--fullscreen', 'false'
  ];

  try {
    const javaProcess = spawn(javaPath, [...jvmArgs, '-cp', classpath, 'net.minecraft.client.Main', ...gameArgs], {
      cwd: minecraftDir,
      detached: true,
      stdio: 'ignore'
    });

    javaProcess.unref();

    return { success: true, message: 'Minecraft launched' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==================== IPC HANDLERS ====================

ipcMain.handle('microsoft-login', async () => {
  try {
    return await startMicrosoftAuth();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('login', async (event, mode, credentials) => {
  try {
    if (mode === 'offline') {
      const username = credentials.username || '';
      if (!username || username.length < 2) {
        return { success: false, error: 'Invalid username' };
      }

      const uuid = offlineUUID(username);
      currentProfile = {
        type: 'offline',
        uuid: uuid,
        name: username,
        accessToken: 'offline_token'
      };

      return { success: true, profile: currentProfile };
    }

    if (mode === 'cracked') {
      const username = credentials.username || '';
      if (!username || username.length < 2) {
        return { success: false, error: 'Invalid username' };
      }

      // For cracked, we just accept any username and generate a random UUID
      const uuid = crackedUUID(username);
      const accessToken = randomToken();

      currentProfile = {
        type: 'cracked',
        uuid: uuid,
        name: username,
        accessToken: accessToken
      };

      return { success: true, profile: currentProfile };
    }

    return { success: false, error: 'Invalid login mode' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('launch-game', async (event, profile, mods) => {
  try {
    if (!profile || !profile.name || !profile.uuid) {
      return { success: false, error: 'No profile selected' };
    }

    return await launchMinecraft(profile);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-mods', async (event, modpack) => {
  // Stub for mod installation
  return { success: true, message: `${modpack} installed (stub)` };
});

// ==================== MINECRAFT INSTALLATION ====================

async function installMinecraft(version = '1.21') {
  // Determine Minecraft directory
  let minecraftDir;
  const appDataPath = app.getPath('appData');
  const homePath = app.getPath('home');
  
  const possibleDirs = [
    path.join(appDataPath, '.minecraft'),
    path.join(homePath, '.minecraft')
  ];
  
  if (process.platform === 'win32') {
    possibleDirs.push('C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\.minecraft');
  }
  
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      minecraftDir = dir;
      break;
    }
  }
  
  if (!minecraftDir) {
    minecraftDir = possibleDirs[0];
    fs.ensureDirSync(minecraftDir);
  }
  
  const versionsDir = path.join(minecraftDir, 'versions');
  const versionDir = path.join(versionsDir, version);
  const versionJar = path.join(versionDir, `${version}.jar`);
  const versionJson = path.join(versionDir, `${version}.json`);
  
  // Check if already installed
  if (fs.existsSync(versionJar)) {
    return { success: true, message: `Minecraft ${version} is already installed`, path: minecraftDir };
  }
  
  // Create directories
  fs.ensureDirSync(versionDir);
  fs.ensureDirSync(path.join(minecraftDir, 'libraries'));
  fs.ensureDirSync(path.join(minecraftDir, 'assets'));
  fs.ensureDirSync(path.join(minecraftDir, 'assets', 'indexes'));
  fs.ensureDirSync(path.join(minecraftDir, 'assets', 'objects'));
  
  try {
    // Download version JSON from Mojang
    const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
    const manifestRes = await fetch(manifestUrl);
    const manifest = await manifestRes.json();
    
    const versionInfo = manifest.versions.find(v => v.id === version);
    if (!versionInfo) {
      return { success: false, error: `Minecraft version ${version} not found` };
    }
    
    // Download version detail JSON
    const versionUrl = versionInfo.url;
    const versionRes = await fetch(versionUrl);
    const versionData = await versionRes.json();
    
    // Save version JSON
    fs.writeFileSync(versionJson, JSON.stringify(versionData, null, 2));
    
    // Download client JAR
    const clientUrl = versionData.downloads.client.url;
    const clientRes = await fetch(clientUrl);
    
    if (!clientRes.ok) {
      return { success: false, error: 'Failed to download Minecraft client' };
    }
    
    const clientBuffer = await clientRes.arrayBuffer();
    fs.writeFileSync(versionJar, Buffer.from(clientBuffer));
    
    // Download required libraries
    const libraries = versionData.libraries;
    const libsDir = path.join(minecraftDir, 'libraries');
    
    for (const lib of libraries) {
      if (lib.downloads && lib.downloads.artifact) {
        const libPath = path.join(libsDir, lib.downloads.artifact.path);
        const libDir = path.dirname(libPath);
        
        if (!fs.existsSync(libDir)) {
          fs.ensureDirSync(libDir);
        }
        
        if (!fs.existsSync(libPath)) {
          try {
            const libRes = await fetch(lib.downloads.artifact.url);
            if (libRes.ok) {
              const libBuffer = await libRes.arrayBuffer();
              fs.writeFileSync(libPath, Buffer.from(libBuffer));
            }
          } catch (e) {
            console.log(`Failed to download library: ${lib.name}`);
          }
        }
      }
    }
    
    // Download assets index
    if (versionData.assetIndex) {
      const assetsIndexUrl = versionData.assetIndex.url;
      const assetsIndexRes = await fetch(assetsIndexUrl);
      const assetsIndexData = await assetsIndexRes.json();
      
      fs.writeFileSync(path.join(minecraftDir, 'assets', 'indexes', `${version}.json`), JSON.stringify(assetsIndexData, null, 2));
      
      // Download assets
      const objectsDir = path.join(minecraftDir, 'assets', 'objects');
      for (const [hash, asset] of Object.entries(assetsIndexData.objects)) {
        const assetPath = path.join(objectsDir, hash.substring(0, 2), hash);
        if (!fs.existsSync(assetPath)) {
          try {
            fs.ensureDirSync(path.dirname(assetPath));
            const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;
            const assetRes = await fetch(assetUrl);
            if (assetRes.ok) {
            const assetBuffer = await assetRes.arrayBuffer();
              fs.writeFileSync(assetPath, Buffer.from(assetBuffer));
            }
          } catch (e) {
            console.log(`Failed to download asset: ${hash}`);
          }
        }
      }
    }
    
    return { success: true, message: `Minecraft ${version} installed successfully`, path: minecraftDir };
    
  } catch (err) {
    return { success: false, error: err.message };
  }
}

ipcMain.handle('install-minecraft', async (event, version) => {
  try {
    return await installMinecraft(version || '1.21');
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-minecraft', async () => {
  try {
    const appDataPath = app.getPath('appData');
    const homePath = app.getPath('home');
    
    const possibleDirs = [
      path.join(appDataPath, '.minecraft'),
      path.join(homePath, '.minecraft')
    ];
    
    if (process.platform === 'win32') {
      possibleDirs.push('C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\.minecraft');
    }
    
    let minecraftDir = null;
    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        minecraftDir = dir;
        break;
      }
    }
    
    if (!minecraftDir) {
      return { installed: false, versions: [] };
    }
    
    const versionsDir = path.join(minecraftDir, 'versions');
    let versions = [];
    
    if (fs.existsSync(versionsDir)) {
      versions = fs.readdirSync(versionsDir).filter(f => {
        return fs.existsSync(path.join(versionsDir, f, `${f}.jar`));
      });
    }
    
    return { installed: versions.length > 0, versions, path: minecraftDir };
  } catch (err) {
    return { installed: false, versions: [], error: err.message };
  }
});

ipcMain.handle('create-server', async (event, config) => {
  // Stub for server creation
  return { success: true, message: 'Server created', port: 25565 };
});

// ==================== AVAILABLE VERSIONS ====================

async function getAvailableVersions() {
  try {
    const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch version manifest');
    }
    const manifest = await response.json();

    // Get releases and snapshots, sort latest first
    const releases = manifest.versions
      .filter(v => v.type === 'release')
      .sort((a, b) => new Date(b.releaseTime) - new Date(a.releaseTime))
      .slice(0, 20); // Top 20 recent releases

    const snapshots = manifest.versions
      .filter(v => v.type === 'snapshot')
      .sort((a, b) => new Date(b.releaseTime) - new Date(a.releaseTime))
      .slice(0, 10); // Top 10 recent snapshots

    return {
      success: true,
      releases: releases.map(v => ({ id: v.id, releaseTime: v.releaseTime, type: v.type })),
      snapshots: snapshots.map(v => ({ id: v.id, releaseTime: v.releaseTime, type: v.type })),
      latest: releases[0]?.id || '1.21'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      fallback: [{ id: '1.21', type: 'release' }]
    };
  }
}

ipcMain.handle('get-available-versions', async () => {
  return await getAvailableVersions();
});
