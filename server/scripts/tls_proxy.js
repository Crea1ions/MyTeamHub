#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 18789;
const LISTEN_PORT = process.env.TLS_PROXY_PORT ? parseInt(process.env.TLS_PROXY_PORT, 10) : 3443;

const keyPath = path.join(__dirname, '..', 'ssl', 'key.pem');
const certPath = path.join(__dirname, '..', 'ssl', 'cert.pem');
// debug: print paths and existence to help diagnose environment issues
console.log('cwd=', process.cwd());
console.log('__dirname=', __dirname);
console.log('keyPath=', keyPath);
console.log('certPath=', certPath);
console.log('exists key=', fs.existsSync(keyPath), 'exists cert=', fs.existsSync(certPath));
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('TLS cert/key not found. Generate with openssl before starting.');
  console.error('Expected:', keyPath, certPath);
  process.exit(1);
}

const server = https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, (req, res) => {
  // Simple HTTP -> HTTP proxy for non-upgrade requests
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: `${BACKEND_HOST}:${BACKEND_PORT}` }),
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', (err) => {
    res.statusCode = 502;
    res.end('proxy error: ' + err.message);
  });
  req.pipe(proxyReq, { end: true });
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (clientWs) => {
    const target = `ws://${BACKEND_HOST}:${BACKEND_PORT}${req.url}`;
    const backendWs = new WebSocket(target, { headers: req.headers });

    // Wire events once backend is open
    backendWs.on('open', () => {
      clientWs.on('message', (msg) => { try { backendWs.send(msg); } catch (e) {} });
      backendWs.on('message', (msg) => { try { clientWs.send(msg); } catch (e) {} });

      clientWs.on('close', (code, reason) => { try { backendWs.close(code, reason); } catch (e) {} });
      backendWs.on('close', (code, reason) => { try { clientWs.close(code, reason); } catch (e) {} });

      clientWs.on('error', () => { try { backendWs.terminate(); } catch (e) {} });
      backendWs.on('error', () => { try { clientWs.terminate(); } catch (e) {} });
    });

    backendWs.on('error', (err) => {
      try { clientWs.close(1011, 'backend error'); } catch (e) {}
    });
  });
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
  console.log(`TLS proxy listening on https://localhost:${LISTEN_PORT} -> http://${BACKEND_HOST}:${BACKEND_PORT}`);
});

process.on('SIGINT', () => { server.close(() => process.exit(0)); });
