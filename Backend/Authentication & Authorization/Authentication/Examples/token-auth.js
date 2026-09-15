/**
 * token-auth.js
 * 
 * Demonstrates:
 * Stateless Token-Based Architecture (JWT):
 * 1. Issuing a short-lived Access Token (15 mins) and long-lived Refresh Token (7 days).
 * 2. Anatomy of JWT (Header.Payload.Signature).
 * 3. Local cryptographic verification across distributed microservices (Zero DB lookups).
 * 4. Refreshing an expired Access Token using the valid Refresh Token.
 */

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = 'microservice-access-secret-key';
const REFRESH_SECRET = 'secure-refresh-secret-key';

// Mock Refresh Token Database Store (Refresh tokens are tracked statefully)
const refreshTokenDatabase = new Set();

// 1. ISSUE TOKENS (Upon successful login)
function issueTokens(userId, role) {
  // Short-lived Access Token (15 seconds for simulation purposes)
  const accessToken = jwt.sign(
    { sub: userId, role: role },
    ACCESS_SECRET,
    { expiresIn: '3s' } // 3s demo
  );

  // Long-lived Refresh Token (7 days)
  const refreshToken = jwt.sign(
    { sub: userId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  refreshTokenDatabase.add(refreshToken);
  return { accessToken, refreshToken };
}

// 2. MICROSERVICE LOCAL VERIFICATION (Stateless - Zero DB queries)
function verifyAccessToken(accessToken) {
  try {
    const decoded = jwt.verify(accessToken, ACCESS_SECRET);
    return { status: 200, valid: true, user: decoded };
  } catch (err) {
    return { status: 401, valid: false, error: err.message };
  }
}

// 3. REFRESH TOKEN ROTATION: Get new Access Token
function refreshAccessToken(refreshToken) {
  if (!refreshTokenDatabase.has(refreshToken)) {
    return { status: 403, error: 'Invalid or revoked refresh token.' };
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    // Issue new short-lived access token
    const newAccessToken = jwt.sign(
      { sub: decoded.sub, role: 'user' },
      ACCESS_SECRET,
      { expiresIn: '3s' }
    );
    return { status: 200, accessToken: newAccessToken };
  } catch (err) {
    return { status: 403, error: 'Expired refresh token. Please login again.' };
  }
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  console.log('===============================================================');
  console.log('STATELESS TOKEN AUTHENTICATION (JWT) SIMULATION');
  console.log('===============================================================');

  // Step 1: Login and issue dual tokens
  const tokens = issueTokens('usr_202', 'admin');
  console.log('1. Access Token (Short-lived): ', tokens.accessToken.slice(0, 35) + '...');
  console.log('   Refresh Token (Long-lived): ', tokens.refreshToken.slice(0, 35) + '...');

  // Step 2: Microservice verifies token locally
  console.log('\n2. Microservice verifies Access Token locally (No DB Query):');
  const verify1 = verifyAccessToken(tokens.accessToken);
  console.log('   Verification Result:', verify1);

  // Step 3: Wait for Access Token to expire
  console.log('\n3. Waiting 4 seconds for Access Token to expire...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  const verifyExpired = verifyAccessToken(tokens.accessToken);
  console.log('   Verification Result (Expired):', verifyExpired);

  // Step 4: Use Refresh Token to obtain a new Access Token
  console.log('\n4. Using Refresh Token to get a fresh Access Token:');
  const refreshed = refreshAccessToken(tokens.refreshToken);
  console.log('   Refresh Response:', refreshed);

  // Step 5: Test new Access Token
  const verifyNew = verifyAccessToken(refreshed.accessToken);
  console.log('   New Token Verification:', verifyNew);
})();
