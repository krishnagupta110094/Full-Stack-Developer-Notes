# 🎯 JWT (JSON Web Token) - Interview Questions & Answers

> A curated question bank covering real interview inquiries from startups to FAANG/Tier-1 tech companies.

---

## 🟢 1. Basic Interview Questions

### Q1: What is a JSON Web Token (JWT)?
**Answer:**  
A JWT is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed using a secret (with the HMAC algorithm) or a public/private key pair using RSA or ECDSA.

---

### Q2: What are the three parts of a JWT?
**Answer:**  
A JWT string consists of three parts separated by dots (`.`): `Header.Payload.Signature`
1. **Header:** Contains token metadata, typically the token type (`JWT`) and the signing algorithm used (e.g., `HS256`, `RS256`).
2. **Payload:** Contains claims (user ID, roles, metadata, expiration `exp`, issued-at `iat`).
3. **Signature:** Created by hashing the base64url-encoded header and payload with a secret key or private key. Used by the server to verify integrity.

---

### Q3: What is the difference between Authentication and Authorization?
**Answer:**  
* **Authentication (AuthN):** Verifying **who** the user is (e.g., username & password, OAuth login).
* **Authorization (AuthZ):** Verifying **what** permissions the authenticated user has (e.g., role `admin` vs `user`, accessing `/admin/dashboard`).  
JWT is commonly used to pass both identity and authorization claims (roles/permissions) together.

---

## 🟡 2. Intermediate Interview Questions

### Q4: Where should JWT tokens be stored on the client side? (LocalStorage vs Cookie)
**Answer:**  
* **`localStorage` / `sessionStorage`:**
  - ❌ **Vulnerable to XSS (Cross-Site Scripting):** Any third-party script, injected script, or compromised npm package can access `localStorage.getItem('token')` and steal it.
* **`httpOnly`, `Secure`, `SameSite` Cookies (Recommended ⭐):**
  - ✅ **Immune to JavaScript XSS access:** The browser automatically attaches the cookie to requests, and scripts cannot read it.
  - To prevent CSRF (Cross-Site Request Forgery), cookies must use `SameSite=Strict` or `SameSite=Lax` along with CSRF tokens for mutating requests.

---

### Q5: What is the difference between Symmetric (HS256) and Asymmetric (RS256) algorithms?
**Answer:**  
* **HS256 (Symmetric):** Uses the **same secret key** to both sign and verify the token.
  - *Best for:* Single monolithic backend applications where only one server signs and verifies.
  - *Drawback:* If you have multiple microservices, all services need the private secret key. If one service is compromised, an attacker can generate fake tokens.
* **RS256 (Asymmetric):** Uses a **Private Key to sign** and a **Public Key to verify**.
  - *Best for:* Microservices and distributed systems. The Auth Service holds the Private Key to issue tokens, while 20 other microservices only hold the Public Key to verify tokens.

---

### Q6: Why do we need Refresh Tokens if we already have Access Tokens?
**Answer:**  
* **Access Tokens:** Have a very short lifespan (e.g., 10–15 minutes). If leaked, the attacker's window of opportunity is minimal.
* **Refresh Tokens:** Have a longer lifespan (7 to 30 days) and are stored securely in the database. When the access token expires, the client sends the refresh token to `/api/refresh` to get a new short-lived access token without forcing the user to log in again.
* If a user's account is compromised, the admin can revoke the refresh token in the database, locking the attacker out once the 15-minute access token expires.

---

## 🔴 3. Advanced Interview Questions

### Q7: How do you revoke/invalidate a stateless JWT before its expiration time?
**Answer:**  
Since JWTs are stateless, the server doesn't keep active session records. To invalidate a token prematurely (e.g., on logout, password change, or suspicious activity), industry systems use:
1. **`tokenVersion` in Database:** Increment a version counter in the User schema. Tokens carry the version they were signed with. Middleware rejects requests where `decoded.tokenVersion !== dbUser.tokenVersion`.
2. **Redis Blacklisting:** Add the token to a Redis cache with a TTL matching the token's remaining lifespan. The auth middleware checks `redis.get(token)` before granting access.
3. **Short Expiry Window:** Keep access token lifetime down to 5–15 minutes so revocation latency is negligible.

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"If you use `tokenVersion` or query Redis on every request, doesn't that defeat the purpose of JWT being stateless?"*
**Answer:**  
*"That is a very valid critique. Once you query a database or Redis on every request, you have re-introduced a state check. However, there is an architectural difference:*
1. *With Redis Blacklist, we perform a simple O(1) in-memory key check that takes 1ms, whereas traditional sessions require loading complex session objects and writing access timestamps.*
2. *Alternatively, in a modern architecture, we keep Access Tokens purely stateless (no DB check, valid for 10 minutes) and only do the stateful check (DB lookup) when the user hits the `/refresh` endpoint to rotate tokens. This balances scalability with security."*

---

### Cross-Q2: *"Can an attacker decode a JWT payload without knowing the secret key?"*
**Answer:**  
*"Yes, absolutely! The payload is only Base64URL-encoded, not encrypted. Anyone can decode it using `Buffer.from(payload, 'base64url')` or paste it into [jwt.io](https://jwt.io). The secret key only prevents tampering with the signature; it does not protect payload confidentiality. Sensitive data must never be placed in a standard JWT unless it is explicitly encrypted using JWE (JSON Web Encryption)."*

---

## 🧠 5. Tricky Interview Questions

### Q8: Can two users have the exact same JWT?
**Answer:**  
Only if their payload, header, signing secret, and exact timestamp (`iat`) are 100% identical down to the second. In real-world setups, different user IDs or timestamps make every JWT unique.
