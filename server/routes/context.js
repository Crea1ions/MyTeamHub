const router = require('express').Router();
const fs = require('fs').promises;
const nodePath = require('path');
const { isValidProjectId } = require('../utils/sanitize');

const { PROJECTS_BASE: BASE } = require('../config/paths');

// GET context
router.get('/:projectId', async (req, res) => {
  if (!isValidProjectId(req.params.projectId)) return res.status(400).send('');
  const file = nodePath.join(BASE, req.params.projectId, 'context.md');

  try {
    const content = await fs.readFile(file, 'utf-8');
    res.send(content);
  } catch {
    res.status(404).send('');
  }
});

// UPDATE context
router.post('/:projectId', async (req, res) => {
  if (!isValidProjectId(req.params.projectId)) return res.status(400).json({ success: false });
  const file = nodePath.join(BASE, req.params.projectId, 'context.md');

  await fs.writeFile(file, req.body.content || '');
  res.json({ success: true });
});

module.exports = router;
