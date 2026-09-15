/**
 * session-auth.js
 * 
 * Demonstrates:
 * Stateful Session-Based Architecture:
 * 1. User login & credential verification.
 * 2. Session ID generation (high-entropy random identifier).
 * 3. Server-side session storage (simulating Redis/in-memory store).
 * 4. Cookie flags simulation (HttpOnly, Secure, SameSite).
 * 5. Instant session revocation (deleting session key on logout).
 */

const crypto = require('crypto');

// Simulated Server-Side Session Store (e.g., Redis)
const sessionStore = new Map();

// Mock User Database
const mockUser = { id: 'usr_101', email: 'user@example.com' };

// 1. LOGIN: Generates Session ID and stores user state on server
function login(email) {
  console.log(`\n[AUTH] Logging in user: ${email}...`);

  // Generate high-entropy, cryptographically secure session ID
  const sessionId = 'sess_' + crypto.randomBytes(24).toString('hex');

  // Store session state in server memory (Redis)
  sessionStore.set(sessionId, {
    userId: mockUser.id,
    email: mockUser.email,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });

  console.log(`[AUTH] Session created in server store: ${sessionId}`);

  // Simulating response with secure cookie headers
  return {
    sessionId,
    cookieConfig: {
      httpOnly: true,  // Mitigates XSS (JavaScript cannot access cookie)
      secure: true,    // HTTPS only
      sameSite: 'Strict' // Mitigates CSRF
    }
  };
}

// 2. AUTH MIDDLEWARE: Resolves Session ID from server store
function authenticateSession(sessionId) {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return { status: 401, error: 'Unauthorized: Invalid or expired session.' };
  }

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return { status: 401, error: 'Unauthorized: Session has expired.' };
  }

  return { status: 200, user: { id: session.userId, email: session.email } };
}

// 3. LOGOUT: Instant Revocation (Deletes key from server store)
function logout(sessionId) {
  console.log(`\n[AUTH] Logging out session: ${sessionId}...`);
  const deleted = sessionStore.delete(sessionId);
  console.log(`[AUTH] Session deleted from server store: ${deleted ? 'SUCCESS ✅' : 'NOT FOUND ❌'}`);
}

// ==========================================
// SIMULATION
// ==========================================
console.log('===============================================================');
console.log('STATEFUL SESSION AUTHENTICATION SIMULATION');
console.log('===============================================================');

// Step 1: User logs in
const sessionData = login('user@example.com');
console.log('Cookie Configuration sent to client:', sessionData.cookieConfig);

// Step 2: User requests protected endpoint with Session ID
console.log('\n--> Accessing protected route with active session:');
const check1 = authenticateSession(sessionData.sessionId);
console.log('Protected Route Response:', check1);

// Step 3: User or Admin logs out (Instant Revocation)
logout(sessionData.sessionId);

// Step 4: User attempts to use old Session ID again
console.log('\n--> Accessing protected route with revoked session:');
const check2 = authenticateSession(sessionData.sessionId);
console.log('Protected Route Response:', check2);
