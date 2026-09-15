# 🎯 Password Hashing, Salt & Bcrypt - Interview Questions & Answers

> A curated question bank covering real interview inquiries from startups to FAANG/Tier-1 tech companies.

---

## 🟢 1. Basic Interview Questions

### Q1: What is the fundamental difference between Hashing and Encryption?
**Answer:**  
* **Encryption is a two-way function:** Data is transformed into ciphertext using an algorithm and a key, and can be decrypted back to plaintext using the corresponding decryption key.
* **Hashing is a one-way mathematical function:** Plaintext is mapped to a fixed-length digest. There is mathematically no inverse function to "decrypt" a hash back to plaintext. Verification works by hashing the input again and checking if the digests match.

---

### Q2: What is a Salt, and why is it necessary?
**Answer:**  
A salt is a cryptographically secure random string (minimum 16 bytes) appended or prepended to a password before hashing.  
**Why it is needed:**
1. **Defeats Rainbow Tables:** Prevents attackers from using precomputed tables of common passwords.
2. **Differentiates Identical Passwords:** If 100 users have the password `"Password@123"`, each receives a unique salt, generating 100 completely distinct hashes in the database.

---

### Q3: How does `bcrypt.compare()` know what salt was used if we only pass the plain password and stored hash?
**Answer:**  
Because the **Salt is embedded directly inside the Bcrypt hash string itself**.  
A Bcrypt string follows the structure: `$2b$[cost]$[22-character salt][31-character hash]`.  
When `bcrypt.compare(candidatePassword, storedHash)` is called:
1. It parses the algorithm version, cost factor, and 22-character salt directly from `storedHash`.
2. It hashes `candidatePassword` using that extracted salt and cost factor.
3. It performs a constant-time comparison between the newly generated hash and the stored hash.

---

## 🟡 2. Intermediate Interview Questions

### Q4: Why are SHA-256 or MD5 considered completely unsafe for password storage?
**Answer:**  
SHA-256 and MD5 were designed for extreme speed and high throughput (data integrity and file verification). They require negligible memory ($O(1)$ RAM). Modern GPUs (such as RTX 4090) can compute **hundreds of billions of SHA-256 hashes per second**. An attacker with a modest GPU rig can brute-force an 8-character password in minutes. Password algorithms like Bcrypt and Argon2 are deliberately designed to be computationally expensive (slow) to make brute-force attacks economically and practically unfeasible.

---

### Q5: What is the difference between a Salt and a Pepper?
**Answer:**  
* **Salt:** Generated per-user, unique, public, and stored directly in the database alongside the hash.
* **Pepper:** An application-wide secret key stored outside the database (in environment variables, AWS Secrets Manager, or an HSM).  
$$\text{Hash} = \text{Algorithm}(\text{Password} + \text{Salt} + \text{Pepper})$$  
If an attacker compromises the database (e.g. via SQL Injection), they cannot crack the hashes because they lack the Pepper stored in the app environment.

---

## 🔴 3. Advanced Interview Questions

### Q6: What is the Bcrypt 72-byte truncation limit, and how do you resolve it in production?
**Answer:**  
Bcrypt is based on the EksBlowfish block cipher, which internally limits key expansion to **72 bytes**. Any characters in a password beyond 72 bytes are silently truncated and ignored.  
**Production Solution:** Pre-hash the password with `SHA-256` before passing it to Bcrypt:
```javascript
const preHash = crypto.createHash('sha256').update(password).digest('hex'); // 64-char string (64 bytes)
const finalHash = await bcrypt.hash(preHash, 12);
```
Since SHA-256 always produces a fixed 32-byte binary (or 64 hex characters) output, it safely fits within the 72-byte limit while preserving entropy.

---

### Q7: Why is Argon2id preferred over Bcrypt in modern security standards?
**Answer:**  
* **Bcrypt is CPU-bound:** It only uses 4KB of internal state (P-array and S-boxes), which easily fits into CPU L1 cache. Attackers can build custom ASIC chips that parallelize Bcrypt.
* **Argon2id is Memory-Hard:** It requires a configurable amount of physical RAM (e.g., 64MB per hash). Because GPUs have limited per-thread memory bandwidth, allocating 64MB per attempt causes GPUs to run out of memory (OOM), defeating hardware-accelerated attacks.

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"If Bcrypt is so slow, won't it cause a Denial of Service (DoS) on our Node.js server under high login traffic?"*
**Answer:**  
*"Yes, Bcrypt is computationally heavy and can tie up Node.js worker threads in the libuv threadpool. In production, we mitigate this by:*
1. *Placing aggressive **Rate Limiting** (e.g., max 5 login requests per minute per IP) in front of the login endpoint.*
2. *Calibrating the cost factor so hashing takes ~200ms–250ms rather than multiple seconds.*
3. *Offloading authentication to dedicated auth microservices or specialized workers so CPU-intensive hashing does not block the main API event loop."*

---

### Cross-Q2: *"Can we use `crypto.createHash('sha256')` to compare user passwords if we compare hashes instead of plaintext?"*
**Answer:**  
*"No. Comparing SHA-256 hashes still suffers from fast GPU attacks and lacks the adaptive cost factor of Bcrypt or Argon2. Additionally, standard string equality (`===`) suffers from timing attacks due to short-circuiting. Always use `bcrypt.compare()` or `crypto.timingSafeEqual()`."*

---

## 🧠 5. Tricky Interview Questions

### Q8: What bug happens if you run `user.save()` in Mongoose after only updating `user.name`?
**Answer:**  
If the Mongoose schema uses a pre-save hook like `userSchema.pre('save', async function() { this.password = await bcrypt.hash(this.password, 10); })` **without checking `this.isModified('password')`**, Mongoose will take the already-hashed password (`$2b$10$...`) and hash it a second time! The next time the user tries to log in with their actual plaintext password, authentication will permanently fail, effectively locking the user out.

---

### Q9: Does a higher cost factor make the hash mathematically stronger?
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
  return res.status(401).json({ message: "Invalid email or password" });
}
```
This guarantees every request follows the exact same 250ms execution path.
