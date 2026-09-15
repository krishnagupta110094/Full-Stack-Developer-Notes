/**
 * change-password.js
 * 
 * Demonstrates:
 * The complete Authenticated Password Change pipeline:
 * 1. Authenticated user requests a password update with currentPassword & newPassword.
 * 2. Verification of currentPassword using bcrypt.compare().
 * 3. Validation of newPassword (length, distinct from currentPassword).
 * 4. Hashing of newPassword with Bcrypt and updating database.
 * 5. Testing login with new password and verification of old password revocation.
 */

const bcrypt = require('bcryptjs');

// Mock user in database
const user = {
  id: 'usr_1',
  email: 'krishna@example.com',
  passwordHash: ''
};

async function changePassword(userId, currentPassword, newPassword) {
  // 1. Validation
  if (!currentPassword || !newPassword) {
    return { status: 400, error: 'Both current password and new password are required.' };
  }

  if (newPassword.length < 8) {
    return { status: 400, error: 'New password must be at least 8 characters long.' };
  }

  if (currentPassword === newPassword) {
    return { status: 400, error: 'New password cannot be identical to the current password.' };
  }

  // 2. Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return { status: 401, error: 'Invalid current password.' };
  }

  // 3. Hash new password
  const saltRounds = 12;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);

  return {
    status: 200,
    message: 'Password changed successfully. Please re-login with your new credentials.'
  };
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  // Initialize user with original password
  const originalPass = 'OldSecret@2025';
  user.passwordHash = await bcrypt.hash(originalPass, 12);

  console.log('===============================================================');
  console.log('CHANGE PASSWORD PIPELINE TEST');
  console.log('===============================================================');

  // Attempt 1: Wrong current password
  console.log('1. Attempt with incorrect current password:');
  const res1 = await changePassword('usr_1', 'WrongCurrentPass', 'BrandNewPass@2026');
  console.log(res1);

  // Attempt 2: Correct current password, but new password same as old
  console.log('\n2. Attempt setting new password identical to old:');
  const res2 = await changePassword('usr_1', originalPass, originalPass);
  console.log(res2);

  // Attempt 3: Valid password change
  console.log('\n3. Valid password change attempt:');
  const res3 = await changePassword('usr_1', originalPass, 'BrandNewPass@2026');
  console.log(res3);

  // Verification
  console.log('\n4. Verifying new password against database hash:');
  const loginWithNew = await bcrypt.compare('BrandNewPass@2026', user.passwordHash);
  const loginWithOld = await bcrypt.compare(originalPass, user.passwordHash);
  console.log('Login with NEW password:', loginWithNew ? 'ACCEPTED ✅' : 'REJECTED ❌');
  console.log('Login with OLD password:', loginWithOld ? 'ACCEPTED ❌' : 'REJECTED AS EXPECTED ✅');
})();
