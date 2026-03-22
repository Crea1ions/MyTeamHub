function buildPrompt({ prompt, context, message, history = [] }) {
  const historyText = history
    .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join('\n\n');

  return `
(SYSTEM)
${prompt}

[CONTEXT]
${context}

[HISTORY]
${historyText}

[USER]
${message}
`;
}

module.exports = { buildPrompt };
