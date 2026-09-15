/**
 * 01-basic-jwt.js
 * Demonstrates:
 * 1. Signing a JWT with a secret key
 * 2. Decoding a JWT (without verifying - proving Base64 readable nature)
 * 3. Verifying a valid JWT
 * 4. Tampering detection (modifying payload content)
 * 5. Expiration handling
 */

const jwt = require('jsonwebtoken');

const SECRET_KEY = 'super-secret-key-that-is-at-least-256-bits-long-in-production!';

console.log('========================================================');
console.log('STEP 1: Sign a JWT');
console.log('========================================================');

const payload = {
  userId: 'usr_987654321',
  email: 'admin@example.com',
  role: 'admin'
};

const token = jwt.sign(payload, SECRET_KEY, {
  expiresIn: '2s' // expires in 2 seconds for demonstration
});

console.log('Generated JWT:\n', token);

console.log('\n========================================================');
console.log('STEP 2: Inspecting Token Structure (Header.Payload.Signature)');
console.log('========================================================');

const [headerB64, payloadB64, signature] = token.split('.');
console.log('Header (Base64):   ', headerB64);
console.log('Payload (Base64):  ', payloadB64);
console.log('Signature:         ', signature);

const decodedHeader = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
console.log('\nDecoded Header Object: ', decodedHeader);
console.log('Decoded Payload Object:', decodedPayload);

console.log('\n========================================================');
console.log('STEP 3: Cryptographic Verification');
console.log('========================================================');

try {
  const verified = jwt.verify(token, SECRET_KEY);
  console.log('Verification SUCCESSFUL ✅! User:', verified.email);
} catch (err) {
  console.error('Verification FAILED ❌:', err.message);
}

console.log('\n========================================================');
console.log('STEP 4: Tampering Demonstration (Changing role to "superadmin")');
console.log('========================================================');

// Attacker tries to alter payload without secret key:
const tamperedPayload = { ...decodedPayload, role: 'superadmin' };
const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signature}`;

try {
  jwt.verify(tamperedToken, SECRET_KEY);
  console.log('Tampered token was accepted (SHOULD NEVER HAPPEN)');
} catch (err) {
  console.log('Tampered token correctly REJECTED ✅! Reason:', err.message);
}

console.log('\n========================================================');
console.log('STEP 5: Testing Token Expiry (Waiting 3 seconds...)');
console.log('========================================================');

setTimeout(() => {
  try {
    jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.log('Expired token correctly REJECTED ✅! Reason:', err.message);
    console.log('Expired at:', err.expiredAt);
  }
}, 3000);
