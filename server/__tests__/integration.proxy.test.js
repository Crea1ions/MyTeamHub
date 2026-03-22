const { spawn, execFile } = require('child_process');
const path = require('path');

const TLS_PROXY = path.join(__dirname, '..', 'scripts', 'tls_proxy.js');
const PROXY_WS_TEST = path.join(__dirname, '..', 'scripts', 'proxy_ws_test.js');

function waitForOutput(child, match, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('timeout waiting for output: ' + match)), timeout);
    const onData = (b) => {
      const s = String(b);
      if (s.includes(match)) {
        clearTimeout(to);
        child.stdout.removeListener('data', onData);
        resolve(s);
      }
    };
    child.stdout.on('data', onData);
    child.on('error', (err) => { clearTimeout(to); reject(err); });
    child.on('exit', (code) => { if (code !== 0) { clearTimeout(to); reject(new Error('process exited during wait: ' + code)); } });
  });
}

describe('integration: tls proxy + openclaw handshake', () => {
  jest.setTimeout(120000);

  const HAS_OPENCLAW = !!process.env.OPENCLAW_TOKEN;

  if (!HAS_OPENCLAW) {
    console.warn('Skipping integration.proxy.test: OPENCLAW_TOKEN not set in environment. Set OPENCLAW_TOKEN to run this integration test.');
    describe.skip('integration: tls proxy + openclaw handshake (skipped)', () => {
      test('skipped because OPENCLAW_TOKEN is not set', () => {});
    });
  } else {
    describe('integration: tls proxy + openclaw handshake', () => {
      jest.setTimeout(120000);

  test('handshake and chat.send via tls_proxy', async () => {
    let proxyProc = null;
    let spawned = false;

    try {
      // try to spawn tls_proxy; if address in use, assume already running
      proxyProc = spawn(process.execPath, [TLS_PROXY], { cwd: path.join(__dirname, '..'), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
      spawned = true;
      // wait for listening message
      await waitForOutput(proxyProc, 'TLS proxy listening', 10000);
    } catch (e) {
      // If starting failed because port in use, fallback to assuming existing proxy
      spawned = false;
      if (proxyProc) {
        try { proxyProc.kill(); } catch (er) {}
      }
    }

    // Run the proxy_ws_test against the TLS proxy endpoint and wait for local signature verification output
    await new Promise((resolve, reject) => {
      const env = Object.assign({}, process.env, { OPENCLAW_URL: 'https://localhost:3443/v1/chat', NODE_TLS_REJECT_UNAUTHORIZED: '0' });
      const child = spawn(process.execPath, [PROXY_WS_TEST], { cwd: path.join(__dirname, '..'), env, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      const to = setTimeout(() => {
        child.kill();
        reject(new Error('timeout waiting for proxy_ws_test output'));
      }, 60000);

      child.stdout.on('data', (b) => {
        stdout += String(b);
        if (stdout.includes('local signature verification: true')) {
          clearTimeout(to);
          resolve({ stdout, stderr });
        }
      });
      child.stderr.on('data', (b) => { stderr += String(b); });
      child.on('error', (err) => { clearTimeout(to); reject(err); });
      child.on('exit', (code) => {
        // if exited before we saw the verification, treat as failure
        if (!stdout.includes('local signature verification: true')) {
          clearTimeout(to);
          return reject(new Error('proxy_ws_test exited early: ' + code + '\n' + stdout + '\n' + stderr));
        }
      });
    });
    }

    // cleanup
    if (spawned && proxyProc) {
      try { proxyProc.kill(); } catch (e) {}
    }
  });
});
