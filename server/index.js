const express = require('express');
const nodePath = require('path');
require('dotenv').config();
const app = express();

app.use(express.json());

// API auth middleware (protect /api/*). See server/middleware/auth.js
const apiAuth = require('./middleware/auth');
app.use('/api', apiAuth);

// Static UI files (served via Wireguard VPN)
app.use(express.static(nodePath.join(__dirname, '../ui')));

// Redirect root to UI
app.get('/', (req, res) => {
  res.sendFile(nodePath.join(__dirname, '../ui/index.html'));
});

// API Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/context', require('./routes/context'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/proxy', require('./routes/proxy'));

const PORT = process.env.PORT || 3001;
// Allow overriding the bind host for CI or non-wireguard environments
const HOST = process.env.HOST || '10.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`MyTeam Hub running on ${HOST}:${PORT}`);
  if (HOST === '10.0.0.1') {
    console.log(`UI available on WireGuard at: http://${HOST}:${PORT}/`);
  } else {
    console.log(`UI available at: http://${HOST}:${PORT}/`);
  }
});
