// Renderer script for star launcher UI
const { electronAPI } = window;

document.addEventListener('DOMContentLoaded', () => {
  // Particles.js starry background
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

  // Login
  const loginBtn = document.getElementById('loginBtn');
  const username = document.getElementById('username');
  const authMode = document.getElementById('authMode');
  const playBtn = document.getElementById('playBtn');

  loginBtn.addEventListener('click', async () => {
    const result = await electronAPI.login(authMode.value, { username: username.value });
    if (result.success) {
      playBtn.disabled = false;
      playBtn.classList.add('hover:animate-pulse');
      alert('Logged in as ' + result.profile.name);
    }
  });

  // Mod buttons
  document.querySelectorAll('.mod-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const modpack = btn.dataset.mod;
      const status = document.getElementById('modStatus');
      status.textContent = `Installing ${modpack}...`;
      const result = await electronAPI.installMods(modpack);
      status.textContent = result.success ? `${modpack} installed!` : 'Failed';
      status.classList.add(result.success ? 'text-green-400' : 'text-red-400');
    });
  });

  // New server
  document.getElementById('newServer').addEventListener('click', async () => {
    const result = await electronAPI.createServer({ version: '1.21', memory: '2G' });
    const status = document.getElementById('serverStatus');
    if (result.success) {
      status.textContent = `Server running on port ${result.port} (PID: ${result.pid})`;
      status.classList.add('text-green-400');
    }
  });

  // Play button
  playBtn.addEventListener('click', async () => {
    const result = await electronAPI.launchGame(
      { name: username.value, token: 'temp' },
      ['lunar'] // Installed mods
    );
    if (result.success) {
      alert('Launching Minecraft...');
    }
  });
});

