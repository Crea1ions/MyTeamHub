const fs = require('fs').promises;
const nodePath = require('path');

// prompts directory relative to repo data folder
const PROMPT_DIR = process.env.PROMPT_DIR || nodePath.join(__dirname, '..', '..', 'data', 'prompts');

async function loadPrompt(filename) {
  // Étape 2 — Sécuriser path traversal
  if (filename.includes('..')) {
    throw new Error('Invalid prompt filename');
  }
  
  const file = nodePath.join(PROMPT_DIR, filename);
  return fs.readFile(file, 'utf-8');
}

module.exports = { loadPrompt };
