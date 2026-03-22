const { orchestrateMyTeam } = require('../services/orchestrator');

describe('orchestrateMyTeam (mock flow)', () => {
  test('returns success and a response using mock model', async () => {
    const res = await orchestrateMyTeam({ projectId: 'test', userMessage: 'Bonjour', model: 'mock' });
    expect(res).toHaveProperty('success', true);
    expect(res).toHaveProperty('response');
  }, 20000);
});
