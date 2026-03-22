// Base directory for project data. Prefer env var for portability.
const nodePath = require('path');
const PROJECTS_BASE = process.env.PROJECTS_BASE || nodePath.join(__dirname, '..', '..', 'data', 'projects');

module.exports = {
  PROJECTS_BASE
};
