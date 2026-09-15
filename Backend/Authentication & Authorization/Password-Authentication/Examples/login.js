/**
 * login.js
 * 
 * Demonstrates:
 * Complete user login pipeline:
 * 1. Finding user by identifier.
 * 2. Password verification using bcrypt.compare().
 * 3. Uniform error responses ("Invalid credentials") preventing account enumeration.
 * 4. Successful authenticated session response.
 */

const bcrypt = require('bcryptjs');

// Mock database pre-populated with a hashed user
const database = [
  {
    id: 'usr_1',
    name: 'Krishna Gupta',
    email: 'krishna@example.com',
    // Pre-calculated hash for 'SecurePassword@2026' with 12 salt rounds
    passwordHash: '$2b$12$e8bQhX9g.Y8K5mUo0v5uNeWJ2qZ1m4r7t9v1x3z5b7d9f1h3j5l7n'
  }
];

async function loginUser(credentials) {
  const { email, password } = credentials;

  // 1. Validation
  if (!email || !password) {
    return { status: 400, error: 'Email and password are required.' };
  }

  // 2. Locate user
  const normalizedEmail = email.toLowerCase().trim();
  const user = database.find(u => u.email === normalizedEmail);

  // 3. User existence check (Consistent 401 response)
  if (!user) {
    return { status: 401, error: 'Invalid credentials' };
  }

  // 4. Cryptographic comparison
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return { status: 401, error: 'Invalid credentials' };
  }

  // 5. Authentication successful
  return {
    status: 200,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  // Initialize mock hash properly
  database[0].passwordHash = await bcrypt.hash('SecurePassword@2026', 12);

  console.log('===============================================================');
  console.log('LOGIN PIPELINE TEST');
  console.log('===============================================================');

  // Case 1: Incorrect email
  const res1 = await loginUser({
    email: 'nonexistent@example.com',
    password: 'AnyPassword@123'
  });
  console.log('1. Unknown Email Attempt:       ', res1);

  // Case 2: Correct email, incorrect password
  const res2 = await loginUser({
    email: 'krishna@example.com',
    password: 'WrongPassword@999'
  });
  console.log('2. Incorrect Password Attempt:  ', res2);

  // Case 3: Correct credentials
  const res3 = await loginUser({
    email: 'krishna@example.com',
    password: 'SecurePassword@2026'
  });
  console.log('3. Valid Credentials Attempt:   ', res3);

  console.log('\n[Security Note]: Both Case 1 and Case 2 return the identical error:');
  console.log('                 "Invalid credentials", defending against account enumeration.');
})();
