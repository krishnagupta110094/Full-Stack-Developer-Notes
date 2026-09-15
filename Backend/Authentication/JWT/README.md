# 🔐 JWT (JSON Web Token) - Complete Guide & Architecture

> **Level:** Beginner to Advanced  
> **Topic:** Authentication & Authorization  
> **Prerequisites:** Basic HTTP, Client-Server Architecture, Node.js / Express basics

---

## ⚡ 2-Minute Interview Cheatsheet (TL;DR)

| Concept | Key Point to Mention in Interview |
| :--- | :--- |
| **Definition** | An open standard (RFC 7519) for securely transmitting compact, self-contained JSON objects between parties. |
| **Structure** | `Header.Payload.Signature` separated by dots, Base64Url-encoded. |
| **Nature** | **Stateless**: The server verifies token authenticity via cryptographic signature without storing active session records in a database. |
| **Storage Best Practice** | Store in **`httpOnly`, `Secure`, `SameSite=Strict/Lax` Cookies** to defend against XSS attacks. Never use `localStorage` for high-security tokens. |
| **The Revocation Problem** | Because JWT is stateless, an issued token remains valid until expiry. Logging out or logging in again does not automatically kill the previous token. |
| **Revocation Solutions** | 1. **`tokenVersion` in DB** (lightweight, increments on re-login/logout, checked in middleware).<br>2. **Redis Blacklist** (lightning-fast 1-2ms cache with TTL matching remaining token lifespan). |

---

## 1. What is it?

A **JSON Web Token (JWT)** is a compact, URL-safe means of representing claims to be transferred between two parties. It is cryptographically signed using either a **symmetric shared secret** (HMAC algorithms like `HS256`) or an **asymmetric public/private key pair** (RSA or ECDSA like `RS256`).

A standard JWT string looks like this:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Notice the two dots (`.`) splitting the token into **three distinct components**:

```text
[   HEADER   ] . [   PAYLOAD   ] . [   SIGNATURE   ]
 Base64Url         Base64Url         Cryptographic
  Encoded           Encoded            Hash/Sign
```

> [!CAUTION]
> **JWT is ENCODED, NOT ENCRYPTED (by default).**  
> Anyone can paste your JWT into [jwt.io](https://jwt.io) and inspect the payload in plain text. Never store sensitive secrets like passwords, credit card numbers, or API keys in the JWT payload!

---

## 2. Why do we need it? (Session vs Token Authentication)

Before JWT, traditional web applications used **Stateful Session-Based Authentication**:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server
    participant SessionDB as Session Store (Redis/DB)

    Client->>Server: POST /login (email, password)
    Server->>Server: Validate credentials
    Server->>SessionDB: Save session record { sessionId: "xyz", userId: "101" }
    Server-->>Client: Set-Cookie: sessionId=xyz
    
    Note over Client,Server: Next Authenticated Request
    Client->>Server: GET /profile (Cookie: sessionId=xyz)
    Server->>SessionDB: Query session "xyz"
    SessionDB-->>Server: User record found
    Server-->>Client: 200 OK (User Profile)
```

### Why Sessions Fall Short in Modern Architectures:
1. **Database Bottleneck:** Every incoming request requires a database/cache lookup to resolve the session ID.
2. **Horizontal Scaling Issues:** If you have 10 load-balanced servers, all servers must either share a centralized session database (Redis) or use sticky sessions.
3. **Cross-Domain & Mobile Limitations:** Native mobile apps and third-party microservices struggle with browser cookie session sharing.

### The JWT (Stateless) Advantage:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server

    Client->>Server: POST /login (email, password)
    Server->>Server: Validate credentials & Sign JWT with Secret
    Server-->>Client: Return Token (Cookie or Bearer JSON)
    
    Note over Client,Server: Next Authenticated Request
    Client->>Server: GET /profile (Authorization: Bearer <token>)
    Server->>Server: Verify Signature with Secret (Zero DB lookup needed)
    Server-->>Client: 200 OK (User Profile)
```

* **Stateless:** The server doesn't keep track of logged-in tokens. The token itself carries all necessary data (user ID, role).
* **Decentralized Validation:** Any microservice that knows the secret key (or public key) can independently verify the token without contacting the authentication service.

---

## 3. How does it work? (Internal Mechanics)

A JWT consists of 3 parts:

### Part 1: Header
Contains metadata about the token: the hashing algorithm used and token type.
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Part 2: Payload (Claims)
Contains user data and claims. Claims are classified into:
1. **Registered Claims:** Pre-defined standards (`iss` - issuer, `sub` - subject, `exp` - expiration time, `iat` - issued at).
2. **Public Claims:** Defined by developers (e.g., `role`, `email`).
3. **Private Claims:** Custom claims agreed between sharing parties.
```json
{
  "sub": "651a2b3c4d5e6f",
  "name": "Krishna Gupta",
  "role": "admin",
  "iat": 1718000000,
  "exp": 1718604800
}
```

### Part 3: Signature
The signature is created by combining the encoded header, encoded payload, and signing them with a private secret key using the specified algorithm:
```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  process.env.JWT_SECRET
)
```
If an attacker alters even a single character in the payload (e.g. changing `"role": "user"` to `"role": "admin"`), the reconstructed signature will not match the signature attached to the token, and the server will instantly reject it!

---

## 4. Syntax & Basic Structure (Node.js Example)

```javascript
const jwt = require('jsonwebtoken');

// 1. Generate / Sign Token
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' } // 1 day validity
);

// 2. Verify Token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token is valid for user:', decoded.userId);
} catch (err) {
  if (err.name === 'TokenExpiredError') {
    console.error('Token expired at:', err.expiredAt);
  } else {
    console.error('Invalid token signature or payload!');
  }
}
```

---

## 5. Practical Implementation & The Real-World Revocation Problem

### ⚠️ The Problem: What happens when a user re-logins or logs out?
Because standard JWT is **Stateless**, if a user logs in, receives Token #1 (valid for 7 days), and then logs in again to receive Token #2:
* Cookie gets overwritten with Token #2.
* **BUT Token #1 is still cryptographically 100% valid!** If an attacker (or the user) manually sends Token #1 in the `Authorization: Bearer` header, the server will accept it for the next 7 days!

### Solution 1: The `tokenVersion` Pattern (Production Best Practice without Redis) ⭐

Add a `tokenVersion` counter directly in the User schema:

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  tokenVersion: { type: Number, default: 0 }
});
```

#### Step 1: Sign JWT with the Current Version
```javascript
// authController.js (login)
const token = jwt.sign(
  { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

#### Step 2: Invalidate Previous Tokens on New Login or Logout
Whenever a new login, password change, or global logout happens, simply increment `tokenVersion`:
```javascript
// Re-login / Password Reset / Revoke All Sessions
user.tokenVersion += 1;
await user.save();
```

#### Step 3: Verification Middleware
```javascript
// authMiddleware.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.id);

if (!user || decoded.tokenVersion !== user.tokenVersion) {
  return res.status(401).json({ 
    message: "Session expired or logged in from another device. Please re-login." 
  });
}

req.user = user;
next();
```

```mermaid
flowchart TD
    A[Incoming Request with Token] --> B[jwt.verify secret & exp]
    B -->|Invalid / Expired| C[401 Unauthorized]
    B -->|Valid Signature| D[Fetch User from DB]
    D --> E{decoded.tokenVersion === user.tokenVersion?}
    E -->|No / Mismatch| F[401 Session Revoked]
    E -->|Yes / Match| G[next() Allow Access ✅]
```

---

### Solution 2: Redis Blacklisting (High Scale / Millisecond Latency) ⭐

For massive enterprise apps (Netflix, Amazon) where checking MongoDB/Postgres on every single HTTP request adds too much DB overhead, **Redis** is used as an in-memory cache:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthMiddleware
    participant Redis
    participant Controller

    Client->>AuthMiddleware: Request with Bearer Token
    AuthMiddleware->>AuthMiddleware: Check signature & expiration
    AuthMiddleware->>Redis: GET "blacklist:<token>"
    alt Token in Redis Blacklist
        Redis-->>AuthMiddleware: "blacklisted"
        AuthMiddleware-->>Client: 401 Revoked Token ❌
    else Token NOT in Redis
        Redis-->>AuthMiddleware: null
        AuthMiddleware->>Controller: Forward request ✅
    end
```

```javascript
// Logout Route (Redis Implementation)
const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
if (remainingTime > 0) {
  // Store token in Redis with TTL equal to remaining lifetime
  await redisClient.set(`blacklist:${token}`, 'true', 'EX', remainingTime);
}
```

---

## 6. Important Points & Best Practices

1. **Keep Expiry Short:** Access tokens should expire in **10–15 minutes**. Use long-lived **Refresh Tokens (7–30 days)** stored securely in database to generate new access tokens.
2. **Secure Cookie Storage:** Set `httpOnly: true` (prevents JavaScript access), `secure: true` (HTTPS only), and `sameSite: 'strict'` (defends CSRF).
3. **Use Strong Secrets:** Keep secrets at least 256 bits long and rotate them periodically using environment variables.
4. **Use Asymmetric Keys (RS256) for Microservices:** Sign tokens with a **Private Key** on the Auth service; allow other microservices to verify with the **Public Key**. If a microservice is hacked, the attacker cannot forge new tokens!

---

## 7. Common Mistakes & Security Vulnerabilities

| Mistake | Vulnerability | Proper Mitigation |
| :--- | :--- | :--- |
| **Storing in `localStorage`** | Any XSS vulnerability (e.g. malicious npm package or user script) can steal your token via `localStorage.getItem()`. | Store in an `httpOnly`, `Secure` Cookie. |
| **Algorithm `none` Exploit** | Older libraries allowed attackers to set `"alg": "none"` in header and remove signature. | Always strictly specify allowed algorithms: `jwt.verify(token, secret, { algorithms: ['HS256'] })`. |
| **Storing Sensitive Data** | Storing passwords, SSNs, or role permissions in payload. Payload is Base64 readable. | Store only non-sensitive identifiers (`id`, `tokenVersion`, `role`). |
| **Infinite Lifetime Tokens** | Issuing tokens without `expiresIn`. | Always set explicit expiry (`exp`). |

---

## 8. Related Concepts

* **Refresh Token Rotation:** Issuing a new refresh token every time an access token is refreshed, invalidating the old one.
* **OAuth 2.0 & OIDC:** Industry authorization protocols that frequently use JWTs as access and ID tokens.
* **PASETO (Platform-Agnostic Security Tokens):** A modern alternative to JWT that removes algorithm agility vulnerabilities by default.
