# 🎯 Password Authentication - Interview Questions & Answers

> Concise, high-yield interview revision questions covering fundamental Password Authentication concepts.

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
