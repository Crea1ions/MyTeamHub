require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs').promises;
const nodePath = require('path');
const { buildPrompt } = require('./chatBuilder');

const PROMPT_DIR = process.env.PROMPT_DIR || nodePath.join(__dirname, '..', '..', 'data', 'prompts');

/**
 * Appelle un modèle IA (Mock, MiniMax, ou OpenClaw)
 */
async function callModel({ agent, promptFile, context, history = [], model = 'mock' }) {
  // Mode mock - retourne une réponse simulée
  if (model === 'mock') {
    return `[mock:${agent}] Réponse simulée pour ${agent}`;
  }

  // Charger le prompt de l'agent
  const promptPath = nodePath.join(PROMPT_DIR, promptFile);
  let promptContent;
  
  try {
    promptContent = await fs.readFile(promptPath, 'utf-8');
  } catch (e) {
    console.warn(`[callModel] Prompt not found: ${promptFile}, using agent name`);
    promptContent = `Tu es l'agent ${agent}.`;
  }

  // Construire le prompt complet
  const fullPrompt = buildPrompt({ prompt: promptContent, context, message: '', history });

  // Limiter la taille du message
  const truncatedPrompt = fullPrompt.slice(0, 4000);

  try {
    if (model === 'minimax' || model.startsWith('minimax')) {
      // Appel MiniMax via API Anthropic-compatible
      return await callMinimax(truncatedPrompt, model);
    } else if (model === 'openclaw') {
      // Appel OpenClaw local
      return await callOpenClawProxy(truncatedPrompt);
    }
  } catch (e) {
    console.warn(`[callModel] ${agent} failed:`, e.message);
    return `[fallback] Réponse simulée pour ${agent}: ${e.message}`;
  }
}

/**
 * Appelle MiniMax via API Anthropic-compatible
 * https://api.minimax.io/anthropic
 */
async function callMinimax(prompt, modelName = 'MiniMax-M2.5') {
  const apiKey = process.env.MINIMAX_API_KEY;
  
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const client = new Anthropic({
    apiKey: apiKey,
    baseURL: 'https://api.minimax.io/anthropic'
  });

  const message = await client.messages.create({
    model: modelName,
    max_tokens: 512,
    temperature: 1.0,
    system: 'Tu es un assistant utile. Réponds en français.',
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }]
      }
    ]
  });

  // Extraire le texte de la réponse
  const textBlock = message.content.find(block => block.type === 'text');
  const thinkingBlock = message.content.find(block => block.type === 'thinking');
  
  if (thinkingBlock) {
    console.log(`[MiniMax] Thinking: ${thinkingBlock.thinking?.slice(0, 100)}...`);
  }
  
  return textBlock?.text || '[empty response]';
}

/**
 * Appelle OpenClaw local (proxy)
 */
async function callOpenClawProxy(prompt) {
  const token = process.env.OPENCLAW_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.post('http://localhost:3001/api/proxy/openclaw', {
    message: prompt,
    model: 'minimax-m2.5'
  }, {
    timeout: 60000,
    headers
  });

  return response.data?.data?.message || '[empty response]';
}

module.exports = { callModel };
