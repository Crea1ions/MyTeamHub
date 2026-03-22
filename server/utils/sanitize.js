// Simple project ID validation/sanitization helpers
function isValidProjectId(id) {
  if (typeof id !== 'string') return false;
  // allow lowercase letters, numbers, hyphen and underscore, 1-64 chars
  return /^[a-z0-9_-]{1,64}$/.test(id);
}

module.exports = { isValidProjectId };
