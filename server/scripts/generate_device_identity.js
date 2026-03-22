const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const crypto = require('crypto');

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function makeDevice() {
  const keypair = nacl.sign.keyPair();
  const publicKey = Buffer.from(keypair.publicKey);
  const privateKey = Buffer.from(keypair.secretKey);
  const publicKeyB64 = base64url(publicKey);
  const privateKeyB64 = base64url(privateKey);
  const deviceId = sha256Hex(publicKey);
  const createdAtMs = Date.now();
  return { version: 1, deviceId, publicKey: publicKeyB64, privateKey: privateKeyB64, createdAtMs };
}

function writeDevice(filePath) {
  const device = makeDevice();
  fs.writeFileSync(filePath, JSON.stringify(device, null, 2), { mode: 0o600 });
  console.log('Wrote device identity to', filePath);
  return device;
}

if (require.main === module) {
  const out = path.join(__dirname, '..', '.openclaw_device.json');
  writeDevice(out);
}

module.exports = { makeDevice, writeDevice };
