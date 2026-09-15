# 🎯 Password Authentication - Interview Questions & Answers

> A curated question bank covering real interview inquiries from startups to FAANG/Tier-1 tech companies.

---

## 🟢 1. Basic Interview Questions

### Q1: What is the fundamental difference between Hashing and Encryption?
**Answer:**  
* **Encryption is a two-way function:** Data is transformed into ciphertext using an algorithm and a key, and can be decrypted back to plaintext using the corresponding decryption key.
* **Hashing is a one-way mathematical function:** Plaintext is mapped to a fixed-length digest. There is mathematically no inverse function to "decrypt" a hash back to plaintext. Verification works by hashing the input again and checking if the digests match.

---

### Q2: Why don't you encrypt passwords instead of hashing them?
**Answer:**  
Because the server never needs to recover or read the original plaintext password. It only needs to verify whether the password supplied during login matches the password established during registration. Encryption introduces unnecessary risk: it requires storing and managing a decryption key. If an attacker breaches the server and accesses that key, all user passwords can be decrypted into plaintext. Hashing avoids this vulnerability entirely.

---

### Q3: What is a Salt, and why is it necessary?
**Answer:**  
A salt is a cryptographically secure random string (minimum 16 bytes via CSPRNG) added to a password before hashing.  
**Why it is needed:**
1. **Defeats Rainbow Tables:** Prevents attackers from using precomputed tables of common passwords.
2. **Differentiates Identical Passwords:** If 100 users share the password `"Password@123"`, each receives a unique salt, generating 100 completely distinct hashes in the database.

---

### Q4: Why can't you verify a password by hashing the input again and comparing with `===`?
**Answer:**  
Because modern password hashing functions (like Bcrypt) generate a **brand-new random salt** on every single invocation. Running `bcrypt.hash("Password@123", 12)` twice produces two completely different strings. Therefore, you must use `bcrypt.compare(candidatePassword, storedHash)`, which parses the original salt directly from the stored hash and performs a constant-time comparison.

---

## 🟡 2. Intermediate Interview Questions

### Q5: Why are SHA-256 or MD5 considered completely unsafe for password storage?
**Answer:**  
SHA-256 and MD5 are general-purpose cryptographic hash functions designed for high throughput and data integrity ($O(1)$ memory). Modern GPUs (such as RTX 4090) can compute **hundreds of billions of SHA-256 hashes per second**. An attacker with a modest GPU rig can brute-force common passwords in minutes. Password algorithms like Bcrypt and Argon2 are deliberately designed to be computationally expensive (slow) to make brute-force cracking economically and practically infeasible.

---

### Q6: What is the difference between a Salt and a Pepper?
**Answer:**  
* **Salt:** Unique per user, generated via CSPRNG, and stored directly in the database alongside the hash.
* **Pepper:** An application-wide secret key stored outside the database (in environment variables, AWS Secrets Manager, or an HSM).  
$$\text{Hash} = \text{Algorithm}(\text{Password} + \text{Salt} + \text{Pepper})$$  
If the database alone is breached, attackers cannot crack hashes without the Pepper key.

---

### Q7: Why should login failures return a generic "Invalid credentials" error instead of "User not found"?
**Answer:**  
To defend against **Account Enumeration (CWE-204)**. If an API returns distinct errors (e.g. `"User does not exist"` vs `"Incorrect password"`), an attacker can feed lists of leaked email addresses into the login endpoint to identify which emails are registered in your system. A uniform `401 Invalid credentials` conceals this information.

---

## 🔴 3. Advanced Interview Questions

### Q8: How would you design a secure, end-to-end Password Authentication pipeline in production?
**Answer:**  
*"In a production system, password authentication requires defense-in-depth across multiple layers:*
1. *Transport Security: Enforce HTTPS with HSTS to prevent MITM sniffing.*
2. *Registration: Validate input lengths and formats, hash passwords using Bcrypt (cost factor 12) or Argon2id, and store only the hash with `select: false`.*
3. *Login Verification: Fetch user by normalized email, verify credentials using `bcrypt.compare()` with dummy hash execution on misses to prevent timing side-channels.*
4. *Session Minting: Deliver authentication tokens inside `httpOnly`, `Secure`, `SameSite=Strict` cookies.*
5. *Abuse Protection: Apply sliding-window rate limiting on login attempts by IP and target account.*
6. *Account Recovery: Implement password reset via high-entropy, short-lived, single-use opaque tokens stored as hashes in the database."*

---

### Q9: What is the Bcrypt 72-byte truncation limit, and how do you resolve it in production?
**Answer:**  
Bcrypt is based on the EksBlowfish block cipher, which internally limits key expansion to **72 bytes**. Any characters in a password beyond 72 bytes are silently ignored.  
**Production Solution:** Pre-hash the password with `SHA-256` before passing it to Bcrypt:
```javascript
const preHash = crypto.createHash('sha256').update(password).digest('hex'); // 64 bytes
const finalHash = await bcrypt.hash(preHash, 12);
```
Since SHA-256 always produces a fixed 32-byte binary (or 64 hex characters) output, it safely fits within the 72-byte limit while preserving entropy.

---

### Q10: Why is Argon2id preferred over Bcrypt in modern security standards?
**Answer:**  
* **Bcrypt is CPU-bound:** It uses only 4KB of state, which fits into CPU L1 cache. Attackers can build custom ASIC chips to crack Bcrypt in parallel.
* **Argon2id is Memory-Hard:** It requires a configurable amount of physical RAM (e.g., 64MB per hash). Because GPUs have limited per-thread memory bandwidth, allocating 64MB per attempt causes GPUs to run out of memory (OOM), defeating hardware-accelerated attacks.

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"If Bcrypt is so slow, won't it cause a Denial of Service (DoS) on our Node.js server under high login traffic?"*
**Answer:**  
*"Yes, Bcrypt is computationally heavy and can saturate Node.js libuv worker threads. In production, we mitigate this by:*
1. *Placing aggressive **Rate Limiting** (e.g. max 5 login requests per 15 minutes per IP) in front of the login route.*
2. *Calibrating the cost factor so hashing takes ~250ms rather than multiple seconds.*
3. *Offloading authentication to dedicated auth microservices or serverless workers so CPU-heavy hashing does not block the main API event loop."*

---

### Cross-Q2: *"How does `bcrypt.compare()` know what salt to use if we never passed the salt to it?"*
**Answer:**  
*"The salt is extracted directly from the stored hash string itself. A standard Bcrypt output contains the algorithm identifier, the cost factor, and the 22-character base64-encoded salt concatenated into the first 29 characters of the string. `bcrypt.compare()` parses those parameters before hashing the candidate password."*

---

## 🧠 5. Tricky Interview Questions

### Q11: What bug happens if you run `user.save()` in Mongoose after only updating `user.name`?
**Answer:**  
If the Mongoose schema uses a pre-save hook like `userSchema.pre('save', async function() { this.password = await bcrypt.hash(this.password, 10); })` **without checking `this.isModified('password')`**, Mongoose will take the already-hashed password (`$2b$10$...`) and hash it a second time! The next time the user attempts to log in with their actual plaintext password, authentication will permanently fail, effectively locking the user out.

---

### Q12: Does a higher cost factor make the hash mathematically more secure?
**Answer:**  
No. The cryptographic entropy and output length remain the same (184 bits). A higher cost factor only increases the **time (CPU iterations)** required to compute the hash. It slows down brute-force search speed, but does not alter the underlying cipher strength.

---

## 🏢 6. Real-World Scenario-Based Questions

### Scenario 1: Preventing User Enumeration via Timing Differences
> **Question:** *"An attacker submits logins with various emails. If an email exists, `bcrypt.compare` runs (taking ~250ms). If the email does not exist, the API returns immediately (~5ms). The attacker uses this timing gap to harvest registered emails. How do you prevent this?"*

**Answer:**  
Run a **dummy hash comparison** when the user is not found:
```javascript
const DUMMY_HASH = '$2b$10$wK1Ww9Kx9d9d9d9d9d9d9u0O7o1r5r9m5m1m5m9m5m1m5m9m5m1m.';
const user = await User.findOne({ email });
const hashToCompare = user ? user.password : DUMMY_HASH;
const isMatch = await bcrypt.compare(password, hashToCompare);

if (!user || !isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}
```
This guarantees every request follows the exact same 250ms execution path regardless of email existence.
