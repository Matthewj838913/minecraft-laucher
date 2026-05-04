const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../launcher/website-dist')));

const modsData = require('../launcher/data/mods.json');

// Helper: Generate offline UUID
function offlineUUID(username) {
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + username, 'utf8').digest();
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

// Helper: Generate cracked UUID
function crackedUUID(username) {
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

// Helper: Generate random token
function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// API Routes
app.get('/api/mods', (req, res) => {
  res.json(modsData);
});

app.post('/api/auth', (req, res) => {
  const { mode, username, password } = req.body;

  if (mode === 'offline') {
    if (!username || username.length < 2) {
      return res.json({ success: false, error: 'Invalid username' });
    }
    const uuid = offlineUUID(username);
    return res.json({
      success: true,
      token: 'offline_token',
      profile: { type: 'offline', uuid, name: username }
    });
  }

  if (mode === 'cracked') {
    if (!username || username.length < 2) {
      return res.json({ success: false, error: 'Invalid username' });
    }
    // For cracked, accept any username/password and generate fake tokens
    const uuid = crackedUUID(username);
    const token = randomToken();
    return res.json({
      success: true,
      token: token,
      profile: { type: 'cracked', uuid, name: username }
    });
  }

  if (mode === 'microsoft') {
    // Microsoft auth requires OAuth flow - handled by client
    return res.json({ success: false, error: 'Microsoft auth must be done via OAuth' });
  }

  // Default/mock
  res.json({ success: true, token: 'mock-token', profile: req.body });
});

app.get('/api/modpacks/:name', (req, res) => {
  const modpack = modsData.modpacks[req.params.name];
  res.json(modpack || { error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

module.exports = app;
