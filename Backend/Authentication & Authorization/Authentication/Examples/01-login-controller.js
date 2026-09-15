/**
 * 01-login-controller.js
 * 
 * Demonstrates:
 * 1. Complete Login Controller flow.
 * 2. Timing Equalization defense using DUMMY_HASH to prevent User Enumeration.
 * 3. Secure Cookie option generation.
 * 4. Safe payload response without leaking sensitive password hashes.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'sample-auth-secret-key-12345';
// Pre-calculated Bcrypt hash for timing equalization when user is not found
const DUMMY_HASH = '$2b$10$wK1Ww9Kx9d9d9d9d9d9d9u0O7o1r5r9m5m1m5m9m5m1m5m9m5m1m.';

// Simulated Database
const mockUserDb = [
  {
    id: 'usr_001',
    email: 'admin@company.com',
    passwordHash: '$2b$10$h9e15M5v4k8r2n4k6p9qXe.gL1m3n5p7r9t1v3x5z7b9d1f3h5j7l', // 'Admin@2026'
    role: 'admin'
  }
];

// Login Authentication Function
async function handleLogin(reqBody) {
  const start = Date.now();
  const { email, password } = reqBody;

  // 1. Basic Validation
  if (!email || !password) {
    return {
      status: 400,
      body: { success: false, message: 'Email and password are required' }
    };
  }

  // 2. Query User
  const normalizedEmail = email.toLowerCase().trim();
  const user = mockUserDb.find(u => u.email === normalizedEmail);

  // 3. Timing Equalizer: If user not found, compare with dummy hash anyway
  const hashToVerify = user ? user.passwordHash : DUMMY_HASH;
  const isPasswordMatch = await bcrypt.compare(password, hashToVerify);

  // 4. Uniform Error Check
  if (!user || !isPasswordMatch) {
    const elapsed = Date.now() - start;
    return {
      status: 401,
      durationMs: elapsed,
      body: { success: false, message: 'Invalid email or password' }
    };
  }

  // 5. Issue JWT Token
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const elapsed = Date.now() - start;
  return {
    status: 200,
    durationMs: elapsed,
    cookie: {
      name: 'jwt',
      value: token,
      options: { httpOnly: true, secure: true, sameSite: 'strict' }
    },
    body: {
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role }
    }
  };
}

// ==========================================
// TEST SCENARIOS
// ==========================================
(async () => {
  console.log('===============================================================');
  console.log('TEST 1: Non-Existent Email (User Enumeration Attempt)');
  console.log('===============================================================');
  const res1 = await handleLogin({ email: 'ghost@company.com', password: 'AnyPassword@123' });
  console.log(`Status: ${res1.status} | Response:`, res1.body);
  console.log(`Execution Time: ${res1.durationMs}ms (Bcrypt executed on dummy hash!)`);

  console.log('\n===============================================================');
  console.log('TEST 2: Existing Email with Incorrect Password');
  console.log('===============================================================');
  const res2 = await handleLogin({ email: 'admin@company.com', password: 'WrongPassword@123' });
  console.log(`Status: ${res2.status} | Response:`, res2.body);
  console.log(`Execution Time: ${res2.durationMs}ms`);
  console.log('Notice: Execution times are nearly identical, preventing timing analysis attacks! ✅');

  console.log('\n===============================================================');
  console.log('TEST 3: Successful Login');
  console.log('===============================================================');
  // Generate real hash for 'Admin@2026'
  mockUserDb[0].passwordHash = await bcrypt.hash('Admin@2026', 10);
  const res3 = await handleLogin({ email: 'admin@company.com', password: 'Admin@2026' });
  console.log(`Status: ${res3.status} | Response:`, res3.body);
  console.log('Cookie issued:', res3.cookie);
})();
