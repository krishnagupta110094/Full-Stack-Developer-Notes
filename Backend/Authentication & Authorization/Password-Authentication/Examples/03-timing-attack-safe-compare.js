/**
 * 03-timing-attack-safe-compare.js
 * 
 * Demonstrates:
 * 1. Vulnerability of standard string equality (===) due to short-circuit evaluation.
 * 2. Constant-time comparison using Node.js crypto.timingSafeEqual.
 */

const crypto = require('crypto');

// Vulnerable string equality (Exits on first mismatch)
function vulnerableStringCompare(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false; // SHORT-CIRCUIT: Returns immediately, leaking timing information
    }
  }
  return true;
}

// Constant-time comparison (Bitwise XOR over the entire buffer)
function timingSafeCompare(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  // Cryptographically secure: takes the exact same number of CPU cycles regardless of matches
  return crypto.timingSafeEqual(bufA, bufB);
}

console.log('===============================================================');
console.log('CONSTANT-TIME COMPARISON DEMONSTRATION');
console.log('===============================================================');

const tokenSecret = 'a4f9b2c8e1d743a9b1c2d3e4f5a6b7c8';
const testGuessWrongFirstChar = 'x4f9b2c8e1d743a9b1c2d3e4f5a6b7c8';
const testGuessWrongLastChar  = 'a4f9b2c8e1d743a9b1c2d3e4f5a6b7c9';
const testGuessCorrect        = 'a4f9b2c8e1d743a9b1c2d3e4f5a6b7c8';

console.log('Vulnerable compare (Wrong first char):', vulnerableStringCompare(tokenSecret, testGuessWrongFirstChar));
console.log('Vulnerable compare (Wrong last char): ', vulnerableStringCompare(tokenSecret, testGuessWrongLastChar));

console.log('Timing-safe compare (Wrong first char):', timingSafeCompare(tokenSecret, testGuessWrongFirstChar));
console.log('Timing-safe compare (Wrong last char): ', timingSafeCompare(tokenSecret, testGuessWrongLastChar));
console.log('Timing-safe compare (Correct match):    ', timingSafeCompare(tokenSecret, testGuessCorrect));
console.log('\n[INFO] In Bcrypt, bcrypt.compare internally enforces constant-time comparison.');
