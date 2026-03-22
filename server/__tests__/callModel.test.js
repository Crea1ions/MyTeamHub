const { callModel } = require('../services/callModel');

describe('callModel (mock)', () => {
  test('returns mock response for agent', async () => {
    const res = await callModel({
      agent: 'artisan',
      promptFile: 'artisan.md',
      model: 'mock'
    });

    expect(typeof res).toBe('string');
    expect(res).toMatch(/\[mock:artisan\]/);
  });
});
