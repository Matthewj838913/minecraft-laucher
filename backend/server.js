const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../launcher/website-dist')));

const modsData = require('../launcher/data/mods.json');

// API Routes
app.get('/api/mods', (req, res) => {
  res.json(modsData);
});

app.post('/api/auth', (req, res) => {
  // Mock auth
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
