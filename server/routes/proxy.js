const router = require('express').Router();
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const crypto = require('crypto');

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * POST /api/proxy/openclaw
 * Proxy vers OpenClaw (appelle directement le endpoint interne)
 */
router.post('/openclaw', async (req, res) => {
  const { message, model = 'minimax-m2.5' } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameter: message required'
    });
  }

  try {
    // Appeler OpenClaw via l'API interne (admin)
    // Utilise le token depuis les variables d'environnement
    const openclawToken = process.env.OPENCLAW_TOKEN;
    if (!openclawToken) {
      console.error('[proxy/openclaw] OPENCLAW_TOKEN not set');
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Server misconfiguration: OPENCLAW_TOKEN not set'
      });
    }
    
    // Use WebSocket RPC to talk to the gateway (same protocol used by the UI)
    // Derive WS URL from OPENCLAW_URL or fallback to ws://127.0.0.1:18789
    const openclawUrl = process.env.OPENCLAW_URL || '';
    let wsUrl;
    try {
      if (openclawUrl) {
        const u = new URL(openclawUrl);
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = u.toString();
      }
    } catch (e) {
      wsUrl = undefined;
    }
    wsUrl = wsUrl || `ws://127.0.0.1:18789`;

    // Simple id generator
    const makeId = () => `${Date.now().toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`;

    await new Promise((resolve, reject) => {
      // Act as a backend service client: do NOT send an Origin header or device identity
      const headers = { Authorization: `Bearer ${openclawToken}` };
      const ws = new WebSocket(wsUrl, { headers });
      let closed = false;

      const cleanup = () => {
        if (!closed) ws.close();
        closed = true;
      };

      const waitFor = (id, timeoutMs = 30000) => new Promise((resolveWait, rejectWait) => {
        const t = setTimeout(() => rejectWait(new Error('timeout waiting response')), timeoutMs);
        const onMsg = (msg) => {
          try {
            const j = JSON.parse(msg);
            if (j && j.id === id) {
              clearTimeout(t);
              ws.removeListener('message', onMsg);
              resolveWait(j);
            }
          } catch (e) {}
        };
        ws.on('message', onMsg);
      });

      ws.on('open', async () => {
        try {
          // Send a connect request (authenticate) as a backend service client
          const connectId = makeId();
          const connectPayload = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              version: '1.0.0',
              platform: 'node',
              mode: 'backend',
              instanceId: makeId()
            },
            role: 'operator',
            scopes: ['operator.admin','operator.approvals','operator.pairing','operator.write'],
            // Provide the token via the `auth` object (the UI uses `auth` not `authToken`)
            auth: { token: openclawToken },
            // no device identity for backend service
            caps: ['tool-events'],
            userAgent: 'myteam-proxy/1.0.0',
            locale: 'en'
          };
          const connectReq = { type: 'req', id: connectId, method: 'connect', params: connectPayload };
          try { console.log('[proxy/openclaw] SENDING CONNECT PAYLOAD', JSON.stringify(connectPayload)); } catch(e) { console.log('[proxy/openclaw] SENDING CONNECT PAYLOAD'); }

          ws.send(JSON.stringify(connectReq));
          // wait for a direct response to our connect request
          let connectRes = null;
          try {
            connectRes = await waitFor(connectId, 10000);
            console.log('[proxy/openclaw] connectRes', JSON.stringify(connectRes));
            if (!connectRes.ok) {
              cleanup();
              return reject(new Error(connectRes.error?.message || 'connect failed'));
            }
          } catch (e) {
            cleanup();
            return reject(new Error('connect no response: ' + (e && e.message)));
          }

          // Send chat.send request
          const reqId = makeId();
          const chatParams = { sessionKey: 'default', message: message, deliver: false, idempotencyKey: reqId };
          const req = { type: 'req', id: reqId, method: 'chat.send', params: chatParams };
          ws.send(JSON.stringify(req));

          const chatRes = await waitFor(reqId, 60000);
          console.log('[proxy/openclaw] chatRes', JSON.stringify(chatRes));
          // chatRes may be ok:false with error details
          if (!chatRes.ok) {
            console.error('[proxy/openclaw] chatRes error', chatRes.error);
            cleanup();
            return reject(new Error(chatRes.error?.message || 'chat.send failed'));
          }

          // Extract assistant message content if present
          const payload = chatRes.payload || chatRes;
          let reply = null;
          // payload may contain run/result or message; try common shapes
          if (payload?.message) reply = payload.message;
          else if (payload?.result) reply = payload.result;
          else reply = payload;

          cleanup();
          return resolve(reply);
        } catch (e) {
          console.error('[proxy/openclaw] ws open handler exception', e && (e.stack || e.message || e));
          cleanup();
          return reject(e);
        }
      });

      ws.on('error', (err) => {
        console.error('[proxy/openclaw] ws error event', err && (err.stack || err.message || err));
        cleanup();
        reject(err);
      });
    }).then((reply) => {
      // Successful reply from gateway
      const formatted = typeof reply === 'string' ? reply : JSON.stringify(reply);
      return res.json({ success: true, data: { message: formatted, model }, error: null });
    }).catch((err) => {
      console.error('[proxy/openclaw] ws error', err && err.message);
      return res.status(502).json({ success: false, data: null, error: String(err && err.message ? err.message : err) });
    });

  } catch (err) {
    console.error('[proxy/openclaw]', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

module.exports = router;
