const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');

const BASE = '/root/myteam/data/projects';

// CREATE
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'name required' });

  const id = name.toLowerCase().replace(/\s+/g, '-');
  const dir = path.join(BASE, id);

  await fs.mkdir(dir, { recursive: true });

  // init context
  await fs.writeFile(path.join(dir, 'context.md'), '');

  res.json({ id, name });
});

// LIST
router.get('/', async (req, res) => {
  try {
    const entries = await fs.readdir(BASE, { withFileTypes: true });
    const projects = entries
      .filter(e => e.isDirectory())
      .map(e => ({ id: e.name }));
    res.json(projects);
  } catch {
    res.json([]);
  }
});

// GET one
router.get('/:id', async (req, res) => {
  const dir = path.join(BASE, req.params.id);
  try {
    await fs.access(dir);
    res.json({ id: req.params.id });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

module.exports = router;
