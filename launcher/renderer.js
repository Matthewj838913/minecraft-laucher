// Renderer script for Star Launcher UI
const { electronAPI } = window;

let currentProfile = null;
let minecraftInstalled = false;
let installedVersions = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Check Minecraft installation status
  try {
    const mcStatus = await electronAPI.checkMinecraft();
    minecraftInstalled = mcStatus.installed;
    installedVersions = mcStatus.versions || [];
    
    if (minecraftInstalled) {
      console.log('Minecraft installed versions:', installedVersions);
    }
  } catch (e) {
    console.log('Could not check Minecraft status');
  }

  // Particles.js starry background
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 100, density: { enable: true, value_area: 800 } },
        color: { value: ['#ffffff', '#ffd700', '#00bfff', '#ff69b4'] },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: true },
        size: { value: 2, random: true },
        line_linked: { enable: false },
        move: { enable: true, speed: 0.5, direction: 'none', random: true }
      },
      interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
        modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
      },
      retina_detect: true
    });
  }

  // Tab switching
  const tabs = {
    microsoft: document.getElementById('tab-microsoft'),
    offline: document.getElementById('tab-offline'),
    cracked: document.getElementById('tab-cracked')
  };
  const panels = {
    microsoft: document.getElementById('panel-microsoft'),
    offline: document.getElementById('panel-offline'),
    cracked: document.getElementById('panel-cracked')
  };

  function switchTab(active) {
    Object.keys(tabs).forEach(key => {
      if (key === active) {
        tabs[key].classList.remove('text-white/60', 'hover:text-white');
        tabs[key].classList.add('bg-white/20', 'text-white');
        panels[key].classList.remove('hidden');
      } else {
        tabs[key].classList.add('text-white/60', 'hover:text-white');
        tabs[key].classList.remove('bg-white/20', 'text-white');
        panels[key].classList.add('hidden');
      }
    });
  }

  tabs.microsoft.addEventListener('click', () => switchTab('microsoft'));
  tabs.offline.addEventListener('click', () => switchTab('offline'));
  tabs.cracked.addEventListener('click', () => switchTab('cracked'));

  // Profile display elements
  const profileDisplay = document.getElementById('profileDisplay');
  const profileName = document.getElementById('profileName');
  const profileType = document.getElementById('profileType');
  const profileUuid = document.getElementById('profileUuid');
  const profileAvatar = document.getElementById('profileAvatar');
  const playBtn = document.getElementById('playBtn');

  function updateProfile(profile) {
    currentProfile = profile;
    profileDisplay.classList.remove('hidden');
    profileName.textContent = profile.name;
    profileType.textContent = profile.type === 'microsoft' ? 'Microsoft Account' : profile.type === 'offline' ? 'Offline Account' : 'Cracked Account';
    profileUuid.textContent = profile.uuid || '';
    profileAvatar.textContent = profile.name.charAt(0).toUpperCase();
    playBtn.disabled = false;

    // Color code the avatar based on account type
    profileAvatar.className = 'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ' +
      (profile.type === 'microsoft' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
       profile.type === 'offline' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
       'bg-gradient-to-br from-purple-500 to-pink-700');
  }

  function clearProfile() {
    currentProfile = null;
    profileDisplay.classList.add('hidden');
    playBtn.disabled = true;
  }

  document.getElementById('logoutBtn').addEventListener('click', clearProfile);

  // Microsoft Login
  document.getElementById('msLoginBtn').addEventListener('click', async () => {
    const btn = document.getElementById('msLoginBtn');
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    try {
      const result = await electronAPI.microsoftLogin();
      if (result.success) {
        updateProfile(result.profile);
        alert('Logged in as ' + result.profile.name);
      } else {
        alert('Microsoft login failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Microsoft login error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M0 0h9.5v9.5H0zM10.5 0H20v9.5h-9.5zM0 10.5h9.5V20H0zM10.5 10.5H20V20h-9.5z"/></svg> Login with Microsoft`;
    }
  });

  // Offline Login
  document.getElementById('offlineLoginBtn').addEventListener('click', async () => {
    const username = document.getElementById('offlineUsername').value.trim();
    if (!username) {
      alert('Please enter a username');
      return;
    }
    const result = await electronAPI.login('offline', { username });
    if (result.success) {
      updateProfile(result.profile);
      alert('Playing offline as ' + result.profile.name);
    } else {
      alert('Login failed: ' + (result.error || 'Unknown error'));
    }
  });

  // Cracked Login
  document.getElementById('crackedLoginBtn').addEventListener('click', async () => {
    const username = document.getElementById('crackedUsername').value.trim();
    const password = document.getElementById('crackedPassword').value;
    if (!username) {
      alert('Please enter a username');
      return;
    }
    const result = await electronAPI.login('cracked', { username, password });
    if (result.success) {
      updateProfile(result.profile);
      alert('Logged in as ' + result.profile.name);
    } else {
      alert('Login failed: ' + (result.error || 'Unknown error'));
    }
  });

  // Install Minecraft button handler
  async function handleInstallMinecraft() {
    const installBtn = document.getElementById('installMcBtn');
    const statusEl = document.getElementById('mcStatus');
    
    if (installBtn) {
      installBtn.disabled = true;
      installBtn.textContent = 'Installing...';
      
      try {
        const result = await electronAPI.installMinecraft('1.21');
        if (result.success) {
          statusEl.textContent = result.message;
          statusEl.className = 'text-xs text-center mt-2 text-green-400';
          minecraftInstalled = true;
          
          // Re-check versions
          const mcStatus = await electronAPI.checkMinecraft();
          installedVersions = mcStatus.versions || [];
          
          // Enable play button if profile exists
          if (currentProfile) {
            playBtn.disabled = false;
          }
        } else {
          statusEl.textContent = 'Error: ' + result.error;
          statusEl.className = 'text-xs text-center mt-2 text-red-400';
        }
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.className = 'text-xs text-center mt-2 text-red-400';
      } finally {
        installBtn.disabled = false;
        installBtn.textContent = 'Install Minecraft 1.21';
      }
    }
  }

  // Play button - check if Minecraft is installed first
  playBtn.addEventListener('click', async () => {
    if (!currentProfile) return;
    
    if (!minecraftInstalled) {
      // Ask user if they want to install Minecraft
      const wantsToInstall = confirm('Minecraft is not installed. Would you like to install Minecraft 1.21?');
      if (wantsToInstall) {
        await handleInstallMinecraft();
      }
      return;
    }
    
    const result = await electronAPI.launchGame(currentProfile, []);
    if (result.success) {
      alert('Launching Minecraft...');
    } else {
      alert('Launch failed: ' + (result.error || 'Unknown error'));
    }
  });

  // Install button
  const installBtn = document.getElementById('installMcBtn');
  if (installBtn) {
    installBtn.addEventListener('click', handleInstallMinecraft);
  }

  // Mod buttons
  document.querySelectorAll('.mod-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const modpack = btn.dataset.mod;
      const status = document.getElementById('modStatus');
      status.textContent = `Installing ${modpack}...`;
      status.className = 'text-xs text-center mt-2 text-white/60';
      const result = await electronAPI.installMods(modpack);
      status.textContent = result.success ? `${modpack} installed!` : 'Failed: ' + (result.error || '');
      status.className = 'text-xs text-center mt-2 ' + (result.success ? 'text-green-400' : 'text-red-400');
    });
  });

  // New server
  document.getElementById('newServer').addEventListener('click', async () => {
    const result = await electronAPI.createServer({ version: '1.21', memory: '2G' });
    const status = document.getElementById('serverStatus');
    if (result.success) {
      status.textContent = `Server running on port ${result.port} (PID: ${result.pid})`;
      status.className = 'text-xs text-center mt-2 text-green-400';
    } else {
      status.textContent = 'Failed: ' + (result.error || '');
      status.className = 'text-xs text-center mt-2 text-red-400';
    }
  });
});

