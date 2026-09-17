/**
 * 03-redis-blacklist.js
 * 
 * Demonstrates:
 * High-performance Token Blacklisting (Simulating Redis In-Memory Store with TTL).
 * Scenario:
 * 1. User logs in -> gets Token.
 * 2. User logs out -> Server puts token in Blacklist with remaining TTL.
 * 3. User tries to reuse the logged-out token before expiry -> Middleware rejects it via fast cache lookup.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'redis-blacklist-demo-secret';

// Simulated In-Memory Redis Store with TTL
class MockRedisClient {
  constructor() {
    this.store = new Map();
  }

  async set(key, value, mode, ttlSeconds) {
    const expireAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expireAt });
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expireAt) {
      this.store.delete(key); // TTL expired naturally
      return null;
    }
    return item.value;
  }
}

const redis = new MockRedisClient();

// Simulated Login
function login(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '10s' });
}

// Simulated Logout (Blacklists token in Redis)
async function logout(token) {
  const decoded = jwt.decode(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const remainingTtl = decoded.exp - nowInSeconds;

  if (remainingTtl > 0) {
    await redis.set(`blacklist:${token}`, 'revoked', 'EX', remainingTtl);
    console.log(`[LOGOUT] Token added to Redis Blacklist with TTL of ${remainingTtl}s.`);
  }
}

// Simulated Auth Middleware
async function protectedRouteMiddleware(token) {
  try {
    // 1. JWT Signature & Expiry Check
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Redis Blacklist Check (1-2ms lookup in RAM)
    const isRevoked = await redis.get(`blacklist:${token}`);
    if (isRevoked) {
      return {
        status: 401,
        message: 'Token has been revoked/blacklisted. Please login again. ❌'
      };
    }

    return {
      status: 200,
      message: `Access granted to user: ${decoded.userId} ✅`
    };
  } catch (err) {
    return {
      status: 401,
      message: `Authentication error: ${err.message}`
    };
  }
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  console.log('========================================================');
  console.log('STEP 1: User logs in & accesses resource');
  console.log('========================================================');
  const token = login('usr_krishna_123');
  console.log('Generated Token (Valid for 10s):', token.slice(0, 35) + '...');

  let check = await protectedRouteMiddleware(token);
  console.log('Before Logout Check:', check);

  console.log('\n========================================================');
  console.log('STEP 2: User logs out');
  console.log('========================================================');
  await logout(token);

  console.log('\n========================================================');
  console.log('STEP 3: User attempts to use old token again');
  console.log('========================================================');
  check = await protectedRouteMiddleware(token);
  console.log('After Logout Check:', check);
})();
