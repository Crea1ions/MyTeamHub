const { loadPrompt } = require('../services/promptLoader');

describe('promptLoader', () => {
  test('rejects path traversal filenames', async () => {
    await expect(loadPrompt('../secret.md')).rejects.toThrow('Invalid prompt filename');
  });
});
