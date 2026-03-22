const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const crypto = require('crypto');

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789/v1/chat';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || process.env.OPENCLAW_API_KEY;

function wsUrlFrom(url) {
  try {
    const u = new URL(url);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return u.toString();
  } catch (e) {
    return 'ws://127.0.0.1:18789';
  }
}

function makeId() { return `${Date.now().toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`; }

async function run() {
  if (!OPENCLAW_TOKEN) {
    console.error('OPENCLAW_TOKEN not set in env');
    process.exit(2);
  }

  const wsUrl = wsUrlFrom(OPENCLAW_URL);
  const origin = (() => { try { const u = new URL(wsUrl); u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:'; return u.origin; } catch { return undefined; } })();
  const headers = { Authorization: `Bearer ${OPENCLAW_TOKEN}` };
  if (origin) headers.Origin = origin;

  const devPath = path.join(__dirname, '..', '.openclaw_device.json');
  let device = null;
  try { if (fs.existsSync(devPath)) device = JSON.parse(fs.readFileSync(devPath, 'utf8')); } catch (e) { console.warn('failed to read device file', e && e.message); }

  const ws = new WebSocket(wsUrl, { headers });

  const pendingById = new Map();
  let lastEvent = null;

  function waitForId(id, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { pendingById.delete(id); reject(new Error('timeout')); }, timeoutMs);
      pendingById.set(id, (msg) => { clearTimeout(t); resolve(msg); });
    });
  }

  function waitForEvent(name, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { ws.removeListener('message', onmsg); reject(new Error('timeout waiting for event ' + name)); }, timeoutMs);
      const onmsg = (raw) => {
        try {
          const j = JSON.parse(raw);
          if (j && j.type === 'event' && j.event === name) {
            clearTimeout(t);
            ws.removeListener('message', onmsg);
            resolve(j);
          }
        } catch (e) {}
      };
      ws.on('message', onmsg);
    });
  }

  ws.on('open', async () => {
    try {
      console.log('[test] ws open');
      const connectId = makeId();
      const connectPayload = {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'openclaw-control-ui', version: '1.0.0', platform: 'node', mode: 'webchat', instanceId: makeId() },
        role: 'operator',
        scopes: ['operator.admin','operator.approvals','operator.pairing'],
        auth: { token: OPENCLAW_TOKEN },
        caps: ['tool-events'],
        userAgent: 'myteam-proxy-test/1.0.0',
        locale: 'en'
      };

      const connectReq = { type: 'req', id: connectId, method: 'connect', params: connectPayload };
      console.log('[test] SENDING initial connect (no device) ->', JSON.stringify(connectPayload));
      ws.send(JSON.stringify(connectReq));

      // Listen for messages
      ws.on('message', (raw) => {
        try {
          const j = JSON.parse(raw);
          lastEvent = j;
          if (j && j.id && pendingById.has(j.id)) {
            const cb = pendingById.get(j.id);
            pendingById.delete(j.id);
            cb(j);
          }
          // dump events
          if (j && j.type === 'event') console.log('[test][event]', j.event, j.payload || '');
          else if (j && j.type === 'res') console.log('[test][res]', j.id, j.ok, j.error || '');
          else console.log('[test][msg]', j);
        } catch (e) { console.log('[test] raw message', String(raw).slice(0,200)); }
      });

      // wait for connect.challenge event
      let challenge = null;
      try {
        const ev = await waitForEvent('connect.challenge', 10000);
        challenge = ev.payload && ev.payload.nonce;
        console.log('[test] received challenge nonce', challenge);
      } catch (e) {
        console.warn('[test] no challenge event received:', e.message);
      }

      if (!challenge) {
        // maybe we have a direct res on connect
        try {
          const res = await waitForId(connectId, 3000);
          console.log('[test] connect response', res);
          if (!res.ok) throw new Error('connect failed: ' + JSON.stringify(res.error));
        } catch (e) {
          console.error('[test] connect failed or no challenge:', e.message);
          ws.close();
          process.exit(1);
        }
      }

      // sign challenge and resend connect with device
      if (challenge && device) {
        const signedAt = Date.now();
        const clientId = connectPayload.client.id;
        const clientMode = connectPayload.client.mode;
        const role = connectPayload.role;
        const scopes = (connectPayload.scopes || []).join(',');
        const tokenField = OPENCLAW_TOKEN || '';
        const vmParts = ['v2', device.deviceId, clientId, clientMode, role, scopes, String(signedAt), tokenField, challenge];
        const vmString = vmParts.join('|');
        const secret = Buffer.from(device.privateKey.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const sig = nacl.sign.detached(Buffer.from(vmString, 'utf8'), secret);
        const sigB64 = base64url(sig);
        // verify signature locally before sending
        const pubBuf = Buffer.from(device.publicKey.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const sigBuf = Buffer.from(sig);
        const verified = nacl.sign.detached.verify(Buffer.from(vmString, 'utf8'), sigBuf, new Uint8Array(pubBuf));
        console.log('[test] local signature verification:', verified);
        const deviceObj = { id: device.deviceId, publicKey: device.publicKey, signature: sigB64, signedAt, nonce: challenge };

        const connectReq2 = { type: 'req', id: connectId, method: 'connect', params: { ...connectPayload, device: deviceObj } };
        console.log('[test] SENDING connect response with device', deviceObj);
        ws.send(JSON.stringify(connectReq2));

        // wait for either connect.* event or response
        try {
          const res = await waitForId(connectId, 10000).catch(() => null);
          const evt = await (async () => {
            try { return (await waitForEvent('connect.success',10000)); } catch(e) { return null; }
          })();
          console.log('[test] post-device response', { res, evt, lastEvent });
          if ((res && res.ok === false) || (evt && evt.event && evt.event.endsWith('.error'))) {
            console.error('[test] connect rejected', res && res.error, evt);
            ws.close();
            process.exit(1);
          }
        } catch (e) {
          console.error('[test] waiting for connect ack failed', e.message);
          ws.close();
          process.exit(1);
        }
      }

      // send chat.send
      const reqId = makeId();
      const chatParams = { sessionKey: 'default', message: 'hello from proxy test', deliver: false, idempotencyKey: reqId };
      const chatReq = { type: 'req', id: reqId, method: 'chat.send', params: chatParams };
      console.log('[test] SENDING chat.send', chatParams);
      ws.send(JSON.stringify(chatReq));
      try {
        const chatRes = await waitForId(reqId, 60000);
        console.log('[test] chatRes', JSON.stringify(chatRes, null, 2));
        ws.close();
        process.exit(chatRes && chatRes.ok ? 0 : 2);
      } catch (e) {
        console.error('[test] chat.send timeout or error', e.message);
        ws.close();
        process.exit(2);
      }

    } catch (e) {
      console.error('[test] open handler error', e && e.stack || e);
      ws.close();
      process.exit(2);
    }
  });

  ws.on('error', (err) => { console.error('[test] ws error', err && err.message); });
}

run().catch((e)=>{ console.error('fatal', e && e.stack || e); process.exit(2); });
