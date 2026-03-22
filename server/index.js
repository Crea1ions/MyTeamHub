const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();

app.use(express.json());

// Static UI files (served via Wireguard VPN)
app.use(express.static(path.join(__dirname, '../ui')));

// Redirect root to UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// API Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/context', require('./routes/context'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/proxy', require('./routes/proxy'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MyTeam Hub running on ${PORT}`);
  console.log(`UI available at: http://10.0.0.2:${PORT}/`);
});
