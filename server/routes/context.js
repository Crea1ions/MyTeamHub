const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');

const BASE = '/root/myteam/data/projects';

// GET context
router.get('/:projectId', async (req, res) => {
  const file = path.join(BASE, req.params.projectId, 'context.md');

  try {
    const content = await fs.readFile(file, 'utf-8');
    res.send(content);
  } catch {
    res.status(404).send('');
  }
});

// UPDATE context
router.post('/:projectId', async (req, res) => {
  const file = path.join(BASE, req.params.projectId, 'context.md');

  await fs.writeFile(file, req.body.content || '');
  res.json({ success: true });
});

module.exports = router;
