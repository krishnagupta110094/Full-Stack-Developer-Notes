/**
 * password-hashing.js
 * 
 * Demonstrates:
 * 1. Generating password hashes using Bcrypt with a cost factor.
 * 2. Why identical passwords generate completely different hashes (Salting).
 * 3. Bcrypt internal structure breakdown ($2b$cost$salt$hash).
 * 4. Password verification using bcrypt.compare().
 */

const bcrypt = require('bcryptjs');

async function demonstratePasswordHashing() {
  const plainPassword = 'Password@123';
  const saltRounds = 12; // Cost factor (2^12 = 4,096 rounds)

  console.log('===============================================================');
  console.log('1. SALTING DEMONSTRATION: Same Password, Different Hashes');
  console.log('===============================================================');

  const hashA = await bcrypt.hash(plainPassword, saltRounds);
  const hashB = await bcrypt.hash(plainPassword, saltRounds);

  console.log('Plaintext Password:     ', plainPassword);
  console.log('Computed Hash A:        ', hashA);
  console.log('Computed Hash B:        ', hashB);
  console.log('Are both hashes identical?', hashA === hashB ? 'YES (VULNERABLE)' : 'NO (SECURE - Salt worked! ✅)');

  console.log('\n===============================================================');
  console.log('2. BCRYPT STRING ANATOMY BREAKDOWN');
  console.log('===============================================================');
  const parts = hashA.split('$');
  console.log('Algorithm Identifier:   ', `$${parts[1]}$`);
  console.log('Cost Factor:            ', parts[2], `(2^${parts[2]} = ${Math.pow(2, parseInt(parts[2]))} iterations)`);
  console.log('Embedded Salt (22 chars):', parts[3].slice(0, 22));
  console.log('Embedded Hash (31 chars):', parts[3].slice(22));

  console.log('\n===============================================================');
  console.log('3. PASSWORD VERIFICATION WITH BCRYPT.COMPARE()');
  console.log('===============================================================');
  const correctMatch = await bcrypt.compare('Password@123', hashA);
  const incorrectMatch = await bcrypt.compare('WrongPassword@456', hashA);

  console.log('Comparing correct password:  ', correctMatch ? 'VALID (true) ✅' : 'INVALID (false) ❌');
  console.log('Comparing incorrect password:', incorrectMatch ? 'VALID (true) ❌' : 'REJECTED (false) ✅');
}

demonstratePasswordHashing().catch(console.error);
