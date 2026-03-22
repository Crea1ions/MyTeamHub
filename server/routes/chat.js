const router = require('express').Router();
const fs = require('fs').promises;
const nodePath = require('path');
const { isValidProjectId } = require('../utils/sanitize');

const { loadPrompt } = require('../services/promptLoader');
const { buildPrompt } = require('../services/chatBuilder');
const { callModel } = require('../services/callModel');
const { orchestrateMyTeam } = require('../services/orchestrator');

const { PROJECTS_BASE } = require('../config/paths');
const BASE = PROJECTS_BASE;

/**
 * POST /api/chat — Chat classique (mock ou réel)
 */
router.post('/', async (req, res) => {
  let { projectId, promptFile, message, model = 'mock' } = req.body;

  // UI should not use OpenClaw directly — map any 'openclaw' request to 'minimax'
  if (model === 'openclaw') model = 'minimax';

  // Basic validation: projectId and message always required
  if (!projectId || !message) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing parameters: projectId and message required'
    });
  }

  // Validate projectId format
  if (!isValidProjectId(projectId)) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid projectId' });
  }

  // Detect /myteam command at start of message and forward to orchestrator
  try {
    const trimmed = String(message).trim();
    if (trimmed.startsWith('/myteam')) {
      // extract command body after '/myteam'
      const commandBody = trimmed.replace(/^\/myteam\s*/, '').trim();
      if (!commandBody) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Empty /myteam command body'
        });
      }

      const result = await orchestrateMyTeam({
        projectId,
        userMessage: commandBody,
        model
      });

      return res.json({
        success: result.success,
        data: {
          message: result.response,
          model: model,
          historyCount: result.historyCount
        },
        error: null
      });
    }

    // Non-/myteam flow continues below

      // If not a /myteam command, require promptFile as before
      if (!promptFile) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'Missing parameters: promptFile required for chat'
        });
      }

      // 1. load prompt
    const prompt = await loadPrompt(promptFile);

    // 2. load context
    const contextPath = nodePath.join(BASE, projectId, 'context.md');
    let context = '';
    try {
      context = await fs.readFile(contextPath, 'utf-8');
    } catch {}

    // 3. Charger session
    const sessionId = 'default';
    const sessionPath = nodePath.join(BASE, projectId, 'sessions', `${sessionId}.json`);
    
    let session = { messages: [] };
    try {
      const raw = await fs.readFile(sessionPath, 'utf-8');
      session = JSON.parse(raw);
    } catch {}

    // 4. Ajouter message user
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // 5. Limiter history
    const history = session.messages.slice(-10);

    // 6. Construire prompt
    const fullPrompt = buildPrompt({ prompt, context, message, history });

    // 7. Réponse (mock ou réel)
    let responseText;
    
    if (model === 'mock') {
      responseText = `[mock] Réponse de l'agent à: "${message}"\n\n[Historique: ${history.length} messages]`;
    } else {
      // Appel réel au modèle
      responseText = await callModel({
        agent: promptFile.replace('.md', ''),
        promptFile,
        context,
        history,
        model
      });
    }
    
    // 8. Ajouter réponse assistant
    session.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    });

    // 9. Sauvegarder session
    await fs.mkdir(nodePath.dirname(sessionPath), { recursive: true });
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

    // 10. Retourner réponse
    return res.json({
      success: true,
      data: {
        message: responseText,
        model: model,
        usage: { tokens: 0 }
      },
      error: null
    });

  } catch (err) {
    console.error('[chat]', err.message);
    res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

/**
 * POST /api/chat/orchestrate — Orchestration multi-agents
 * Usage: /myteam project:vaultkeeper message
 */
router.post('/orchestrate', async (req, res) => {
  let { projectId, message, model = 'minimax' } = req.body;

  // Ensure orchestrations triggered from the UI use Minimax rather than OpenClaw
  if (model === 'openclaw') model = 'minimax';

  if (!projectId || !message) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing parameters: projectId, message required'
    });
  }

  try {
    // Limiter la taille du message
    const truncatedMessage = message.slice(0, 1500);
    
    const result = await orchestrateMyTeam({
      projectId,
      userMessage: truncatedMessage,
      model
    });

    return res.json({
      success: result.success,
      data: {
        message: result.response,
        model: model,
        historyCount: result.historyCount
      },
      error: null
    });

  } catch (err) {
    console.error('[orchestrate]', err.message);
    res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

module.exports = router;
