# 🎯 Authentication - Interview Questions & Answers

> Concise, high-yield interview revision questions covering Authentication fundamentals and Stateful Session-Based Architecture.

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
