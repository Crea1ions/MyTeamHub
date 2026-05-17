/**
 * LLM Proxy for MyTeamHub
 * 
 * Purpose: Lightweight Node.js proxy that routes chat requests directly to Mistral API
 * - Reads API key from request headers (sent from frontend localStorage)
 * - No dependency on Orchestrator for LLM calls
 * - Allows users to configure their own API keys via Settings
 * 
 * Flow:
 * Frontend Settings (localStorage) → API key in header
 *                  ↓
 * POST /api/chat with { message, apiKey, agent, ... }
 *                  ↓
 * Proxy validates & forwards to Mistral
 *                  ↓
 * Response → Frontend
 * 
 * Port: 3001 (separate from Frontend :3000, Orchestrator :8001)
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;
const DEFAULT_ARKE_LOCAL_TOKEN = 'arke-local-dev-token';

// Middleware
app.use(express.json({ limit: '10mb' }));
// Allow CORS from all origins (this is a local proxy, not production)
app.use(cors({
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'proxy-llm',
    timestamp: new Date().toISOString()
  });
});

/**
 * Direct chat endpoint
 * 
 * Request body:
 * {
 *   message: string,
 *   apiKey: string (from localStorage),
 *   agent?: string (default: 'collaborator'),
 *   temperature?: number (default: 0.7),
 *   context?: { editor_content, file_name, project_id, line_count },
 *   prompt?: string (custom agent prompt - overrides default if provided)
 * }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      apiKey,
      agent = 'collaborator',
      temperature = 0.7,
      context,
      prompt,
      session_id,
      share_editor_context = false,
    } = req.body;

    // Validation
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (agent !== 'arke' && (!apiKey || apiKey.trim() === '')) {
      return res.status(400).json({ 
        error: 'API key is required. Please configure it in Settings.',
        hint: 'Your API key should be set in the Settings page (myteamhub-api-config localStorage)'
      });
    }

    // Local Arke gateway path (no external LLM call)
    if (agent === 'arke') {
      const arkeBaseUrl = process.env.ARKE_BASE_URL || 'http://127.0.0.1:4777';
      const arkeToken = process.env.ARKE_MYTEAM_TOKEN || DEFAULT_ARKE_LOCAL_TOKEN;

      const arkePayload = {
        user_message: message,
        session_id: session_id || 'myth_default',
      };

      if (share_editor_context && context) {
        const filePath = context.file_name || 'unknown.txt';
        const ext = (filePath.split('.').pop() || '').toLowerCase();
        const languageByExt = {
          js: 'javascript',
          ts: 'typescript',
          py: 'python',
          rs: 'rust',
          md: 'markdown',
          json: 'json',
          toml: 'toml',
          yml: 'yaml',
          yaml: 'yaml',
        };

        arkePayload.metadata = {
          selection: context.editor_content || '',
          file_path: filePath,
          studio_folder_path: context.project_id || '',
          editor_language: languageByExt[ext] || 'text',
        };
      }

      try {
        const arkeResponse = await axios.post(
          `${arkeBaseUrl}/api/v1/chat`,
          arkePayload,
          {
            headers: {
              Authorization: `Bearer ${arkeToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const body = arkeResponse.data || {};
        return res.json({
          response: body.response || 'No response',
          agent: 'arke',
          model: 'arke-local',
          session_id: body.session_id,
          mode: body.mode,
          needs_workspace: Boolean(body.needs_workspace),
          workspace: body.workspace,
          tools_used: body.tools_used || [],
        });
      } catch (error) {
        const status = error.response?.status || 500;
        const details = error.response?.data?.error || error.message;

        // UX: For Arke local agent, prefer a chat response over transport-level 5xx
        // so users get actionable guidance instead of a generic "Request failed" toast.
        if (status === 401) {
          return res.json({
            response:
              'Token Arke invalide. Verifiez la configuration locale de la passerelle Arke/MyTeamHub.',
            agent: 'arke',
            model: 'arke-local',
            mode: 'ask',
            tools_used: [],
          });
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || /ECONNREFUSED/i.test(String(details))) {
          return res.json({
            response:
              'La passerelle Arke locale est indisponible (127.0.0.1:4777). Lancez Arke avec: python -m arke.cli myteam-api --host 127.0.0.1 --port 4777',
            agent: 'arke',
            model: 'arke-local',
            mode: 'ask',
            tools_used: [],
          });
        }

        return res.json({
          response: `Erreur passerelle Arke (${status}): ${details}`,
          agent: 'arke',
          model: 'arke-local',
          mode: 'ask',
          tools_used: [],
        });
      }
    }

    // Use custom prompt if provided, otherwise use default agent prompts
    let baseSystemPrompt;
    if (prompt) {
      baseSystemPrompt = prompt;
    } else {
      // Build system prompt based on agent name
      const agentPrompts = {
        'explorer': 'You are Explorer, a creative idea generator. Generate multiple unconventional interpretations. Expand the design space.',
        'critical_analyst': 'You are Critical Analyst. Analyze implications, identify inconsistencies, and challenge assumptions.',
        'deconstructor': 'You are Deconstructor. Identify weaknesses, failure modes, and how systems could break.',
        'stress_tester': 'You are Stress Tester. Analyze scalability, resource constraints, and real-world limitations.',
        'user': 'You are User. Interpret as a normal user, generate realistic scenarios, stay intuitive.',
      };
      baseSystemPrompt = agentPrompts[agent] || 'You are Collaborator, a senior architect. Transform concepts into structured systems. Prioritize clarity.';
    }

    // Inject editor context if provided and explicitly enabled
    const systemPrompt = (share_editor_context && context)
      ? `${baseSystemPrompt}\n\n## CURRENT EDITOR CONTEXT\n**Project**: ${context.project_id}\n**File**: ${context.file_name}\n**Lines**: ${context.line_count}\n\n### File Content:\n\`\`\`\n${context.editor_content}\n\`\`\``
      : baseSystemPrompt;

    // Build Mistral request
    const mistralRequest = {
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature,
      max_tokens: 4096
    };

    console.log(`[${new Date().toISOString()}] Chat request from agent: ${agent}`);

    // Call Mistral API
    const mistralResponse = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      mistralRequest,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // Increased from 30s to 120s to handle LLM processing time
      }
    );

    // Extract response
    const responseText = mistralResponse.data?.choices?.[0]?.message?.content || 'No response';

    res.json({
      response: responseText,
      agent,
      model: 'mistral-large-latest',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LLM Proxy error:', error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your Mistral API key in Settings.',
        details: 'The key you provided was rejected by Mistral API.'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        details: 'Mistral API rate limit reached.'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Cannot reach Mistral API. Check your internet connection.',
        details: 'Proxy is running but cannot connect to mistral.ai'
      });
    }

    // Generic error
    res.status(error.response?.status || 500).json({
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    available_endpoints: ['/health', '/api/chat']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║        LLM Proxy for MyTeamHub             ║
║        Running on port ${PORT}              ║
╚════════════════════════════════════════════╝

✅ Health:  http://localhost:${PORT}/health
✅ Chat:    http://localhost:${PORT}/api/chat (POST)

🔐 API Key: Sent from frontend localStorage
📝 Agents:  explorer, critical_analyst, deconstructor, stress_tester, user, collaborator
`);
});
