/**
 * Simple API auth middleware.
 * - In production: requires `Authorization: Bearer <API_TOKEN>` or header `x-api-key`.
 * - In non-production: if `API_TOKEN` is not set, middleware allows requests but logs a warning (developer fallback).
 */
module.exports = function apiAuth(req, res, next) {
  // Accept several possible env names for the API token (backwards compatibility)
  const token = process.env.API_TOKEN || process.env.OPENCLAW_TOKEN || process.env.OPENCLAW_API_KEY;
  const env = process.env.NODE_ENV || 'development';

  // If no token configured, allow in non-production with a warning
  if (!token) {
    if (env === 'production') {
      return res.status(503).json({ success: false, error: 'API auth not configured' });
    }
    console.warn('[auth] API_TOKEN not set — allowing requests in non-production');
    return next();
  }

  const authHeader = req.get('authorization') || '';
  const apiKeyHeader = req.get('x-api-key') || '';

  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const presented = bearer || apiKeyHeader;

  // Allow unauthenticated read-only UI requests for projects/context to keep the control UI functional
  const unauthAllowed = (req.method === 'GET') && (
    req.path.startsWith('/projects') || req.path.startsWith('/context') || req.originalUrl.startsWith('/api/projects') || req.originalUrl.startsWith('/api/context')
  );

  // Allow UI to call the internal OpenClaw proxy in non-production without a token
  const isProxyOpenClaw = req.method === 'POST' && (req.path === '/api/proxy/openclaw' || req.originalUrl.startsWith('/api/proxy/openclaw'));
  const allowProxyNoAuth = (env !== 'production') && isProxyOpenClaw;

  // Allow UI to call the main chat endpoint in non-production without a token
  const isChatPost = req.method === 'POST' && (req.path === '/api/chat' || req.originalUrl.startsWith('/api/chat'));
  const allowChatNoAuth = (env !== 'production') && isChatPost;

  if ((!presented || presented !== token) && !unauthAllowed && !allowProxyNoAuth && !allowChatNoAuth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return next();
};
