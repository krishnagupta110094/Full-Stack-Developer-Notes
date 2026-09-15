/**
 * 02-mongoose-presave-hook.js
 * 
 * Demonstrates:
 * Simulation of Mongoose schema pre-save hook behavior:
 * - Hashing upon user creation.
 * - Skipping hashing when only updating non-password fields (e.g. name).
 * - Proper hashing when password is intentionally changed.
 */

const bcrypt = require('bcryptjs');

// Mock User Document simulating Mongoose Document behavior
class MockUserDocument {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this._modifiedPaths = new Set(Object.keys(data));
  }

  isModified(path) {
    return this._modifiedPaths.has(path);
  }

  markModified(path) {
    this._modifiedPaths.add(path);
  }

  // Simulating Mongoose pre('save') hook
  async save() {
    console.log(`\n[HOOK] Saving user '${this.email}'...`);
    
    // 🔥 CRITICAL PATTERN: Only hash if password was modified!
    if (this.isModified('password')) {
      console.log('[HOOK] Password modified/created -> Generating salt and hashing...');
      this.password = await bcrypt.hash(this.password, 10);
      this._modifiedPaths.delete('password');
    } else {
      console.log('[HOOK] Password unchanged -> SKIPPING re-hashing ✅');
    }

    console.log(`[DB] Document saved! Current password in DB: ${this.password}`);
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

async function runSimulation() {
  console.log('===============================================================');
  console.log('STEP 1: User Registration (Initial Save)');
  console.log('===============================================================');
  const user = new MockUserDocument({
    name: 'Krishna Gupta',
    email: 'krishna@example.com',
    password: 'OriginalPassword123'
  });
  await user.save();

  console.log('\n===============================================================');
  console.log('STEP 2: Updating Only User Name (Non-Password Field)');
  console.log('===============================================================');
  user.name = 'Krishna G.';
  user.markModified('name');
  await user.save();

  // Test password verification still works
  const worksAfterNameUpdate = await user.comparePassword('OriginalPassword123');
  console.log('Can user still login with original password?', worksAfterNameUpdate ? 'YES ✅' : 'NO (LOCKED OUT) ❌');

  console.log('\n===============================================================');
  console.log('STEP 3: Explicit Password Change');
  console.log('===============================================================');
  user.password = 'NewSuperPassword@2026';
  user.markModified('password');
  await user.save();

  const worksWithNew = await user.comparePassword('NewSuperPassword@2026');
  const worksWithOld = await user.comparePassword('OriginalPassword123');
  console.log('Login with NEW password:', worksWithNew ? 'SUCCESS ✅' : 'FAILED ❌');
  console.log('Login with OLD password:', worksWithOld ? 'SUCCESS ❌' : 'REJECTED AS EXPECTED ✅');
}

runSimulation().catch(console.error);
