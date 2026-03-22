const request = require('supertest');
const express = require('express');

// Mock orchestrator to avoid filesystem/network effects
jest.mock('../services/orchestrator', () => ({
  orchestrateMyTeam: jest.fn()
}));

const { orchestrateMyTeam } = require('../services/orchestrator');

describe('/api/chat /myteam parsing', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // mount the router under /api/chat
    const chatRouter = require('../routes/chat');
    app.use('/api/chat', chatRouter);
    orchestrateMyTeam.mockReset();
  });

  test('forwards leading /myteam to orchestrator and returns result', async () => {
    orchestrateMyTeam.mockResolvedValue({ success: true, response: 'final-response', historyCount: 2 });

    const res = await request(app)
      .post('/api/chat')
      .send({ projectId: 'test', message: '/myteam create plan', model: 'mock' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('message', 'final-response');
    expect(orchestrateMyTeam).toHaveBeenCalledWith({ projectId: 'test', userMessage: 'create plan', model: 'mock' });
  });

  test('does not invoke orchestrator when /myteam not at start (returns 400 for missing promptFile)', async () => {
    orchestrateMyTeam.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/api/chat')
      .send({ projectId: 'test', message: 'please /myteam do something' });

    expect(res.status).toBe(400);
    expect(orchestrateMyTeam).not.toHaveBeenCalled();
  });

  test('empty /myteam body returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ projectId: 'test', message: '/myteam   ' });

    expect(res.status).toBe(400);
    expect(orchestrateMyTeam).not.toHaveBeenCalled();
  });
});
