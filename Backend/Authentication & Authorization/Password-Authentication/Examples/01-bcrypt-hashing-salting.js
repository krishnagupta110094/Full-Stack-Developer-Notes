/**
 * 01-bcrypt-hashing-salting.js
 * 
 * Demonstrates:
 * 1. Why two identical passwords generate completely different hashes (Salting).
 * 2. How cost factor impacts hashing execution time.
 * 3. Bcrypt internal string decomposition ($2b$cost$salt$hash).
 * 4. Password verification using bcrypt.compare.
 */

const bcrypt = require('bcryptjs');

async function demonstrateSaltingAndHashing() {
  const plainPassword = 'MySecretPassword@2026';

  console.log('===============================================================');
  console.log('1. SALTING DEMONSTRATION: Same Password, Different Hashes');
  console.log('===============================================================');

  const hash1 = await bcrypt.hash(plainPassword, 10);
  const hash2 = await bcrypt.hash(plainPassword, 10);

  console.log('Password: ', plainPassword);
  console.log('Hash #1:  ', hash1);
  console.log('Hash #2:  ', hash2);
  console.log('Are hashes identical?', hash1 === hash2 ? 'YES (VULNERABLE)' : 'NO (SECURE - Salt worked! ✅)');

  console.log('\n===============================================================');
  console.log('2. BCRYPT STRING ANATOMY BREAKDOWN');
  console.log('===============================================================');
  const parts = hash1.split('$');
  console.log('Full Hash:     ', hash1);
  console.log('Algorithm:     ', `$${parts[1]}$`);
  console.log('Cost Factor:   ', parts[2], `(Rounds: 2^${parts[2]} = ${Math.pow(2, parseInt(parts[2]))})`);
  console.log('Salt (22 char):', parts[3].slice(0, 22));
  console.log('Hash (31 char):', parts[3].slice(22));

  console.log('\n===============================================================');
  console.log('3. COST FACTOR TIME BENCHMARK');
  console.log('===============================================================');
  for (const cost of [8, 10, 12]) {
    const start = Date.now();
    await bcrypt.hash(plainPassword, cost);
    const duration = Date.now() - start;
    console.log(`Cost Factor: ${cost} (2^${cost} = ${Math.pow(2, cost)} rounds) -> Time taken: ${duration}ms`);
  }

  console.log('\n===============================================================');
  console.log('4. VERIFICATION WITH BCRYPT.COMPARE');
  console.log('===============================================================');
  const matchCorrect = await bcrypt.compare('MySecretPassword@2026', hash1);
  const matchWrong = await bcrypt.compare('WrongPassword@123', hash1);

  console.log('Testing correct password: ', matchCorrect ? 'MATCHED ✅' : 'FAILED ❌');
  console.log('Testing incorrect password:', matchWrong ? 'MATCHED ❌' : 'REJECTED ✅');
}

demonstrateSaltingAndHashing().catch(console.error);
