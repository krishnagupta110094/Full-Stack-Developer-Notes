/**
 * 02-token-version.js
 * 
 * Demonstrates:
 * How to solve the Stateless JWT Re-login / Revocation problem using `tokenVersion`.
 * Scenario:
 * 1. User logs in -> gets Token #1 (tokenVersion: 0).
 * 2. User accesses a protected route with Token #1 -> SUCCESS.
 * 3. User logs in again from a new device -> DB tokenVersion becomes 1 -> receives Token #2 (tokenVersion: 1).
 * 4. User tries to access protected route using the OLD Token #1 -> REJECTED (Session expired).
 * 5. User accesses protected route using NEW Token #2 -> SUCCESS.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'sample-production-secret-12345';

// Mock Database
const mockUserDatabase = {
  id: 'user_101',
  email: 'admin@gmail.com',
  role: 'admin',
  tokenVersion: 0 // Track token generation cycle
};

// Simulated Login Function
function loginUser(email) {
  console.log(`\n[AUTH] User '${email}' requested login...`);
  
  // Increment tokenVersion to invalidate all existing sessions
  mockUserDatabase.tokenVersion += 1;
  
  const token = jwt.sign(
    {
      id: mockUserDatabase.id,
      email: mockUserDatabase.email,
      role: mockUserDatabase.role,
      tokenVersion: mockUserDatabase.tokenVersion
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log(`[AUTH] Login successful! New token generated with tokenVersion = ${mockUserDatabase.tokenVersion}`);
  return token;
}

// Simulated Auth Middleware
function authMiddleware(token) {
  try {
    // 1. Verify cryptographic signature & expiry
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Query database for user's current tokenVersion
    const userInDb = mockUserDatabase;

    // 3. Match versions
    if (decoded.tokenVersion !== userInDb.tokenVersion) {
      return {
        status: 401,
        success: false,
        message: `Session invalid! Token version (${decoded.tokenVersion}) does not match DB version (${userInDb.tokenVersion}). User logged in elsewhere or session was revoked.`
      };
    }

    return {
      status: 200,
      success: true,
      user: decoded
    };
  } catch (err) {
    return {
      status: 401,
      success: false,
      message: `JWT Error: ${err.message}`
    };
  }
}

// ==========================================
// SIMULATION
// ==========================================

console.log('========================================================');
console.log('STEP 1: Initial Login (Device 1)');
console.log('========================================================');
const oldToken = loginUser('admin@gmail.com');

console.log('\n--> Testing protected access with Token #1:');
const res1 = authMiddleware(oldToken);
console.log(`Result: HTTP ${res1.status} - Access Granted? ${res1.success} ✅`);

console.log('\n========================================================');
console.log('STEP 2: New Login (Device 2 / Re-login without logout)');
console.log('========================================================');
const newToken = loginUser('admin@gmail.com');

console.log('\n--> Testing protected access with OLD Token #1 (Manually sent in Header):');
const res2 = authMiddleware(oldToken);
console.log(`Result: HTTP ${res2.status} - Access Granted? ${res2.success} ❌`);
console.log(`Server Explanation: "${res2.message}"`);

console.log('\n--> Testing protected access with NEW Token #2:');
const res3 = authMiddleware(newToken);
console.log(`Result: HTTP ${res3.status} - Access Granted? ${res3.success} ✅`);
