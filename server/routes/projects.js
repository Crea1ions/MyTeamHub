const router = require('express').Router();
const fs = require('fs').promises;
const nodePath = require('path');
const { isValidProjectId } = require('../utils/sanitize');

const { PROJECTS_BASE: BASE } = require('../config/paths');

// CREATE
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'name required' });

  const id = name.toLowerCase().replace(/\s+/g, '-');
  if (!isValidProjectId(id)) {
    return res.status(400).json({ error: 'Invalid project name resulting id' });
  }
  const dir = nodePath.join(BASE, id);

  await fs.mkdir(dir, { recursive: true });

  // init context
  await fs.writeFile(nodePath.join(dir, 'context.md'), '');

  res.json({ id, name });
});

// LIST
router.get('/', async (req, res) => {
  try {
    const entries = await fs.readdir(BASE, { withFileTypes: true });
    const projects = entries
      .filter(e => e.isDirectory())
      .map(e => ({ id: e.name, name: e.name }));
    res.json(projects);
  } catch {
    res.json([]);
  }
});

// GET one
router.get('/:id', async (req, res) => {
  const dir = nodePath.join(BASE, req.params.id);
  if (!isValidProjectId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
  try {
    await fs.access(dir);
    res.json({ id: req.params.id });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

module.exports = router;
