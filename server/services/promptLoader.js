const fs = require('fs').promises;
const path = require('path');

const PROMPT_DIR = '/root/myteam/data/prompts';

async function loadPrompt(filename) {
  // Étape 2 — Sécuriser path traversal
  if (filename.includes('..')) {
    throw new Error('Invalid prompt filename');
  }
  
  const file = path.join(PROMPT_DIR, filename);
  return fs.readFile(file, 'utf-8');
}

module.exports = { loadPrompt };
