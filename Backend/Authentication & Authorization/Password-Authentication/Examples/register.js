/**
 * register.js
 * 
 * Demonstrates:
 * Complete user registration pipeline:
 * 1. Payload validation (required fields and password length).
 * 2. Duplicate user prevention.
 * 3. Hashing password with Bcrypt before persistence.
 * 4. Storing the user and returning a sanitized object WITHOUT passwordHash.
 */

const bcrypt = require('bcryptjs');

// Mock in-memory database
const database = [];

async function registerUser(payload) {
  const { name, email, password } = payload;

  // 1. Validation
  if (!name || !email || !password) {
    return { status: 400, error: 'All fields (name, email, password) are required.' };
  }

  if (password.length < 8) {
    return { status: 400, error: 'Password must be at least 8 characters long.' };
  }

  // 2. Check for duplicate account
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = database.find(u => u.email === normalizedEmail);

  if (existingUser) {
    return { status: 409, error: 'User with this email already exists.' };
  }

  // 3. Hash the password (Cost factor = 12)
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 4. Store user in database
  const newUser = {
    id: `usr_${database.length + 1}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash, // Stored safely
    createdAt: new Date().toISOString()
  };

  database.push(newUser);

  // 5. Return sanitized response (Crucial: never return passwordHash)
  return {
    status: 201,
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  };
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  console.log('===============================================================');
  console.log('REGISTRATION PIPELINE TEST');
  console.log('===============================================================');

  // Attempt 1: Successful registration
  const res1 = await registerUser({
    name: 'Krishna Gupta',
    email: 'krishna@example.com',
    password: 'SecurePassword@2026'
  });
  console.log('1. Registration Attempt (Valid):', res1);

  // Attempt 2: Duplicate registration
  const res2 = await registerUser({
    name: 'Krishna Gupta',
    email: 'krishna@example.com',
    password: 'AnotherPassword@123'
  });
  console.log('\n2. Registration Attempt (Duplicate):', res2);

  // Attempt 3: Weak password (< 8 chars)
  const res3 = await registerUser({
    name: 'Amit Sharma',
    email: 'amit@example.com',
    password: 'short'
  });
  console.log('\n3. Registration Attempt (Too Short):', res3);

  console.log('\nDatabase Record Check (passwordHash stored, not plaintext):');
  console.log(database[0]);
})();
