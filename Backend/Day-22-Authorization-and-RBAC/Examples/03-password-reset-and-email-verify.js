/**
 * 03-password-reset-and-email-verify.js
 * 
 * Demonstrates:
 * 1. Secure Password Reset Workflow using high-entropy crypto tokens.
 * 2. Storing SHA-256 hash of the reset token in the database (defense-in-depth).
 * 3. Email Verification Workflow: sending token, confirming, and updating status.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Mock Database
const mockUser = {
  id: 'usr_505',
  email: 'developer@example.com',
  passwordHash: '',
  isEmailVerified: false,
  emailVerificationToken: null,
  emailVerificationExpires: null,
  passwordResetToken: null,
  passwordResetExpires: null
};

// ==========================================
// 1. EMAIL VERIFICATION WORKFLOW
// ==========================================

function sendVerificationEmail(user) {
  // Generate random 32-byte opaque token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Save SHA-256 hash in DB with 24h expiration
  user.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  console.log(`[EMAIL] Verification link sent: https://app.com/verify-email?token=${rawToken}`);
  return rawToken;
}

function verifyEmail(incomingToken) {
  // Hash incoming token to match with DB
  const hashedToken = crypto.createHash('sha256').update(incomingToken).digest('hex');

  if (mockUser.emailVerificationToken !== hashedToken) {
    return { status: 400, message: 'Invalid verification token ❌' };
  }

  if (Date.now() > mockUser.emailVerificationExpires) {
    return { status: 400, message: 'Verification token has expired ❌' };
  }

  // Mark verified and clear token
  mockUser.isEmailVerified = true;
  mockUser.emailVerificationToken = null;
  mockUser.emailVerificationExpires = null;

  return { status: 200, message: 'Email verified successfully! ✅' };
}

// ==========================================
// 2. PASSWORD RESET WORKFLOW
// ==========================================

function forgotPassword(email) {
  if (mockUser.email !== email.toLowerCase().trim()) {
    return { status: 200, message: 'If an account exists, a reset email was sent.' };
  }

  // Generate 32-byte raw crypto token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Save hashed version in DB with 10-minute expiry
  mockUser.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  mockUser.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  console.log(`[EMAIL] Password reset link sent: https://app.com/reset-password?token=${rawToken}`);
  return rawToken;
}

async function resetPassword(incomingToken, newPassword) {
  // Hash incoming raw token to query DB
  const hashedToken = crypto.createHash('sha256').update(incomingToken).digest('hex');

  if (mockUser.passwordResetToken !== hashedToken) {
    return { status: 400, message: 'Invalid reset token ❌' };
  }

  if (Date.now() > mockUser.passwordResetExpires) {
    return { status: 400, message: 'Reset token has expired ❌' };
  }

  // Hash new password and update user
  mockUser.passwordHash = await bcrypt.hash(newPassword, 10);
  // Invalidate reset token immediately (single-use)
  mockUser.passwordResetToken = null;
  mockUser.passwordResetExpires = null;

  return { status: 200, message: 'Password reset successful! You can now log in with the new password. ✅' };
}

// ==========================================
// SIMULATION
// ==========================================
(async () => {
  console.log('===============================================================');
  console.log('TEST 1: EMAIL VERIFICATION');
  console.log('===============================================================');
  const verifyToken = sendVerificationEmail(mockUser);
  console.log('User status before verification:', mockUser.isEmailVerified);

  const verifyResult = verifyEmail(verifyToken);
  console.log('Verification Result:', verifyResult);
  console.log('User status after verification: ', mockUser.isEmailVerified);

  console.log('\n===============================================================');
  console.log('TEST 2: PASSWORD RESET');
  console.log('===============================================================');
  // Initial password
  mockUser.passwordHash = await bcrypt.hash('OldSecretPass@123', 10);

  const resetToken = forgotPassword('developer@example.com');
  const resetResult = await resetPassword(resetToken, 'BrandNewSuperPassword@2026');
  console.log('Reset Result:', resetResult);

  // Verification
  const isNewPassValid = await bcrypt.compare('BrandNewSuperPassword@2026', mockUser.passwordHash);
  console.log('Can user login with new password?', isNewPassValid ? 'YES ✅' : 'NO ❌');
})();
