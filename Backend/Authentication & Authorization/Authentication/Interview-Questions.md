# 🎯 Authentication - Interview Questions & Answers

> Concise, high-yield interview revision questions covering Authentication fundamentals, Stateful Sessions, Stateless JWTs, and modern Enterprise protocols.

---

## 🟢 1. Fundamentals & Password Security

### Q1: What is the difference between Authentication (AuthN) and Authorization (AuthZ)?
**Answer:**  
* **Authentication (AuthN):** Verifies the **identity** of a user ("Who are you?"). Examples: Email/password, biometric Face ID, Google social login.
* **Authorization (AuthZ):** Determines the **permissions** granted to that authenticated identity ("What are you allowed to do?"). Examples: Admin deleting a product, editor publishing a post.

---

### Q2: Why should passwords never be stored in plain text or with general hash algorithms like MD5/SHA-256?
**Answer:**  
Plaintext storage compromises all user accounts immediately upon a database leak. MD5 and SHA-256 are general-purpose, high-speed integrity algorithms; modern GPUs can calculate billions of SHA-256 hashes per second, making brute-force trivial. Passwords must be hashed using adaptive, salted, compute/memory-hard Key Derivation Functions like **`bcrypt`** or **`Argon2`**.

---

## 🟡 2. Stateful Session-Based Architecture

### Q3: How does Stateful Session-Based Authentication work?
**Answer:**  
1. User logs in with valid credentials.
2. Server generates a cryptographically secure, random **Session ID** and saves the user state in memory or a fast cache like **Redis**.
3. Server returns the Session ID to the client inside an `HttpOnly`, `Secure`, `SameSite` cookie.
4. On subsequent requests, the browser sends the cookie automatically; the server looks up the Session ID in Redis to verify identity.

---

### Q4: What is the primary advantage of Stateful Sessions over Stateless Tokens?
**Answer:**  
**Instant Revocation.** Because the session state is held on the server, an administrator or user can instantly terminate any active session (e.g. "Log out of all devices") simply by deleting the session key from Redis.

---

### Q5: How do `HttpOnly`, `Secure`, and `SameSite` cookie attributes defend authentication?
**Answer:**  
* **`HttpOnly`:** Forbids client-side JavaScript from accessing `document.cookie`, preventing token theft via Cross-Site Scripting (XSS).
* **`Secure`:** Guarantees the cookie is only transmitted over encrypted HTTPS connections, preventing man-in-the-middle sniffing.
* **`SameSite=Strict/Lax`:** Restricts when cookies are sent across different origins, defending against Cross-Site Request Forgery (CSRF).

---

## 🔴 3. Stateless Token-Based Architecture (JWT)

### Q6: What are the three parts of a JSON Web Token (JWT)?
**Answer:**  
$$\text{Header} \ . \ \text{Payload} \ . \ \text{Signature}$$
* **Header:** Algorithm (`HS256`, `RS256`) and token type (`JWT`).
* **Payload:** Claims containing user identity (`sub`, `role`) and expiration (`exp`).
* **Signature:** Cryptographic hash generated with a private key or secret, proving the token has not been altered in transit.

---

### Q7: Why is JWT favored in Microservices and Distributed Systems?
**Answer:**  
Because it is **Stateless**. Microservices can independently verify the cryptographic signature of the token locally using a shared secret or public key without making a database call or hitting a centralized authentication server.

---

### Q8: Why do we pair short-lived Access Tokens with long-lived Refresh Tokens?
**Answer:**  
* **Access Tokens** are kept short-lived (e.g., 15 minutes) to minimize damage if intercepted.
* **Refresh Tokens** are long-lived (e.g., 7 days) and stored securely (in a database/cookie). They are used exclusively to mint new Access Tokens when the old one expires, ensuring users stay logged in without compromising security.

---

## 🌐 4. Advanced Protocols & Modern Standards

### Q9: What is the difference between OAuth 2.0 and OpenID Connect (OIDC)?
**Answer:**  
* **OAuth 2.0:** An **authorization** framework designed for delegated access ("Give app X permission to read my Google Drive photos"). It issues **Access Tokens**.
* **OpenID Connect (OIDC):** An **identity** layer built on top of OAuth 2.0 designed specifically for **authentication** ("Sign in with Google"). It introduces the **`id_token`** (JWT) containing the user's verified identity profile.

---

### Q10: What are Passkeys / WebAuthn, and how do they eliminate passwords?
**Answer:**  
Passkeys are built on the W3C WebAuthn / FIDO2 standard using **asymmetric public-key cryptography**:
1. The user's device (phone, laptop) creates a private/public key pair.
2. The private key remains locked inside the device's hardware security chip (TPM/Secure Enclave), unlocked only via biometrics (Face ID, Touch ID).
3. The server stores only the public key.
4. During login, the server sends a cryptographic challenge that the device signs using the private key. Passwords and phishing are completely eliminated.
