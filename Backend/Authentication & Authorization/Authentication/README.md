# 🛡️ Authentication Architecture & Strategies

> Structured revision notes covering authentication fundamentals, stateful sessions, stateless tokens, and modern enterprise identity standards.

---

## 1. Fundamentals & Password Security

* **Definition:** Authentication (AuthN) is the process of verifying an entity's claimed **identity** ("Who are you?"). It is distinct from Authorization (AuthZ), which determines permissions ("What can you do?").
* **Password Hashing:** Passwords must **never** be stored in plaintext. Always use adaptive, salted cryptographic hashing algorithms such as `bcrypt` or `Argon2` before persisting credentials to a database.
* **Core Rule:** The server never decrypts passwords; it verifies identity by comparing one-way cryptographic hashes.

---

## 2. Stateful Session-Based Architecture

* **Session Management:** Upon successful login, the server generates a cryptographically secure, high-entropy **Session ID** and stores user session state on the server (in memory or an in-memory cache like Redis).
* **Secure Cookie Transport:** The Session ID is transmitted to the client inside an HTTP cookie configured with:
  * `HttpOnly`: Prevents client-side JavaScript from accessing the cookie, mitigating Cross-Site Scripting (XSS) token theft.
  * `Secure`: Ensures cookies are only sent over encrypted HTTPS connections.
  * `SameSite=Strict/Lax`: Restricts cookie transmission on cross-origin requests, defending against Cross-Site Request Forgery (CSRF).
* **Instant Revocation:** Because state is tracked on the server, an administrator or user can instantly terminate an active session across any device simply by deleting the session key from Redis.

---

## 3. Stateless Token-Based Architecture (JWT)

* **Anatomy of a JWT:** A JSON Web Token consists of three parts separated by dots:
  $$\text{Header} \ . \ \text{Payload (Claims)} \ . \ \text{Signature}$$
  The **Signature** cryptographically guarantees that the payload has not been tampered with in transit.
* **Microservices Ready:** Ideal for distributed and multi-service architectures because each backend service can independently and locally verify the cryptographic signature using a shared secret or public key without querying a central database.
* **Access & Refresh Tokens:** To balance stateless performance with security:
  * **Access Token:** Short-lived (e.g., 15 minutes) for API access.
  * **Refresh Token:** Long-lived (e.g., 7 days) stored securely in the database/cookie, used exclusively to request new access tokens when the old one expires.

---

## 4. Advanced Enterprise Protocols & Modern Standards

* **OAuth 2.0 & OIDC (OpenID Connect):**
  * **OAuth 2.0:** An authorization framework that allows third-party applications limited access to user resources without exposing credentials (delegated access).
  * **OIDC (OpenID Connect):** An identity layer built on top of OAuth 2.0 that standardizes user authentication and provides profile identity tokens (`id_token`) for federated social logins (e.g., "Sign in with Google" or GitHub).
* **Multi-Factor Authentication (MFA):**
  * Adds an essential secondary layer of defense beyond passwords.
  * Requires a secondary verification factor: typically **Knowledge** (password) + **Possession** (Time-based One-Time Password / TOTP via Google Authenticator or SMS).
* **Passkeys & WebAuthn:**
  * The modern W3C/FIDO2 standard eliminating traditional passwords entirely.
  * Uses **asymmetric public-key cryptography**: the client device (phone, laptop) generates a private key secured by biometric hardware (Face ID, Touch ID, or Windows Hello), while the backend stores only the public key.

---

## 5. Quick Comparison: Sessions vs Tokens

| Feature | Stateful Sessions (Redis) | Stateless Tokens (JWT) |
| :--- | :--- | :--- |
| **State Storage** | Server-side (RAM / Redis) | Client-side (Token payload) |
| **Scalability** | Requires central cache / shared session store | Highly scalable across microservices |
| **Database Overhead** | DB/Cache lookup on every request | Zero DB lookup on verification |
| **Session Revocation** | **Instant** (delete session key from Redis) | Difficult (requires token blacklist / short expiry) |
| **Best Fit** | Monolithic apps, admin panels, financial systems | Distributed systems, mobile APIs, microservices |
