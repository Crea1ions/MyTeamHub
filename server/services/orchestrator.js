const fs = require('fs').promises;
const nodePath = require('path');
const { callModel } = require('./callModel');

const { PROJECTS_BASE: BASE } = require('../config/paths');

/**
 * Orchestre les agents MyTeamHub en séquence
 * Pattern: Rêveur → Ingénieur → Diablotin → Artisan (synthèse)
 */
async function orchestrateMyTeam({ projectId, userMessage, model = 'openclaw' }) {
  const steps = ['reveur', 'ingenieur', 'diablotin'];
  let currentMessage = userMessage;

  // Charger la session existante
  const sessionPath = nodePath.join(BASE, projectId, 'sessions', 'default.json');
  let session = { messages: [] };

  try {
    const raw = await fs.readFile(sessionPath, 'utf-8');
    session = JSON.parse(raw);
  } catch {
    // Session inexistante
  }

  // Charger le contexte du projet
  const contextPath = nodePath.join(BASE, projectId, 'context.md');
  let context = '';
  try {
    context = await fs.readFile(contextPath, 'utf-8');
  } catch {}

  // Limiter l'historique à 10 messages
  const history = session.messages.slice(-10);

  // Orchestration en ping-pong
  for (const agent of steps) {
    console.log(`[orchestrate] Calling ${agent}...`);
    
    const response = await callModel({
      agent,
      promptFile: `${agent}.md`,
      context,
      history,
      model
    });

    // Ajouter à l'historique
    session.messages.push({
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    });
    
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // Passer la réponse au prochain agent
    currentMessage = response;
  }

  // Synthèse finale via Artisan
  console.log(`[orchestrate] Calling artisan for final synthesis...`);
  
  const finalResponse = await callModel({
    agent: 'artisan',
    promptFile: 'artisan.md',
    context,
    history: session.messages,
    model
  });

  session.messages.push({
    role: 'assistant',
    content: finalResponse,
    timestamp: new Date().toISOString()
  });

  // Sauvegarder la session
  await fs.mkdir(nodePath.dirname(sessionPath), { recursive: true });
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  console.log('[orchestrate] Final response:', finalResponse?.slice(0, 100));

  return {
    success: true,
    response: finalResponse,
    historyCount: session.messages.length
  };
}

module.exports = { orchestrateMyTeam };
