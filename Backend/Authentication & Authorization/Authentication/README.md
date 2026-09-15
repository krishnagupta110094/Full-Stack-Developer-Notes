# 🚪 Login & Password Authentication - Complete Architecture

> **Category:** Backend  
> **Topic:** Authentication  
> **Concept:** Login & Password  
> **Prerequisites:** Express.js, Mongoose, Password Hashing basics

---

## ⚡ 2-Minute Interview Cheatsheet (TL;DR)

| Concept | Key Technical Point to Mention |
| :--- | :--- |
| **Authentication (AuthN)** | The process of verifying an entity's claimed identity. In web applications, it verifies credentials (identifier + secret) and establishes a security session. |
| **HTTP Status Code** | Always return **`401 Unauthorized`** (meaning unauthenticated) with generic error messages (`"Invalid email or password"`) to prevent user enumeration (CWE-204). |
| **Mongoose Query Rule** | Password should have `select: false` in schema and must be explicitly retrieved in login via `.select('+password')`. |
| **Session Delivery** | Issue signed JWT inside **`httpOnly`, `Secure`, `SameSite=Strict` cookies** to prevent XSS script access. |
| **Defense-in-Depth** | Implement **Rate Limiting** (Token bucket / IP throttling) to prevent credential stuffing and brute-force attacks. |

---

## 1. What is it?

**Login & Password Authentication** is the primary mechanism by which a user asserts their identity to a backend system by providing a public identifier (username/email) and a private secret (password).

```text
Client Request: POST /api/auth/login { email, password }
                    │
                    ▼
          [ Backend Auth Server ]
                    │
          1. Lookup user by identifier
          2. Compare password against stored cryptographic hash
          3. Mint authenticated session (JWT / Cookie)
                    │
                    ▼
Response: 200 OK + Set-Cookie: token=... (or 401 Unauthorized)
```

---

## 2. Why do we need it?

1. **Identity Proof:** Without authentication, an API cannot distinguish between legitimate account owners and malicious actors.
2. **Access Gateway:** Forms the mandatory entry point (Security Principal) required before any authorization (AuthZ) checks can occur.
3. **Auditability & Accountability:** Allows backend services to log, trace, and associate actions, financial transactions, and database modifications with a verified `userId`.

---

## 3. How does it work? (The Production Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant RateLimiter as Rate Limiter (Redis/Memory)
    participant AuthController as Express Login Controller
    participant DB as MongoDB
    participant Bcrypt as Bcrypt Engine

    Client->>RateLimiter: POST /api/auth/login { email, password }
    alt Too Many Requests (> 5 / min)
        RateLimiter-->>Client: 429 Too Many Requests ❌
    else Within Quota
        RateLimiter->>AuthController: Forward Request
    end

    AuthController->>DB: User.findOne({ email }).select('+password')
    DB-->>AuthController: Returns user document (or null)

    alt User Not Found
        AuthController->>Bcrypt: bcrypt.compare(password, DUMMY_HASH)
        Note over AuthController,Bcrypt: Equalizes timing to prevent user enumeration
        AuthController-->>Client: 401 Invalid email or password ❌
    else User Found
        AuthController->>Bcrypt: user.comparePassword(password)
        alt Password Mismatch
            AuthController-->>Client: 401 Invalid email or password ❌
        else Password Matched ✅
            AuthController->>AuthController: Generate JWT (userId, role, tokenVersion)
            AuthController-->>Client: 200 OK (Set-Cookie: jwt=...; HttpOnly; Secure)
        end
    end
```

---

## 4. Syntax & Basic Structure (Express + Mongoose)

```javascript
// Login Route
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  // 1. Validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // 2. Fetch User with password
  const user = await User.findOne({ email }).select('+password');

  // 3. Verify Password
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // 4. Issue Token / Session
  const token = generateJwtToken(user);
  res.cookie('jwt', token, cookieConfig);

  return res.status(200).json({ success: true, message: 'Authenticated successfully' });
});
```

---

## 5. Practical Implementation (Production MERN Standards)

### A. Rate Limiting Middleware
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

### B. Secure Cookie Configuration
```javascript
const cookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
  httpOnly: true, // Prevents access from client-side JavaScript (anti-XSS)
  secure: process.env.NODE_ENV === 'production', // Transmitted only over HTTPS
  sameSite: 'strict' // Defends against Cross-Site Request Forgery (CSRF)
};
```

---

## 6. Important Points & Best Practices

1. **Uniform Error Messages:** Never respond with `"Email not found"` or `"Incorrect password"`. Always respond with `"Invalid email or password"` to prevent attackers from validating which emails are registered (**User Enumeration - CWE-204**).
2. **Never Return the Password Hash:** Always strip or exclude the password from the JSON response before returning user info.
3. **Enforce Password Complexity on the Backend:** Do not rely exclusively on React frontend validation. Validate password length ($\ge 8$ chars), uppercase, lowercase, numbers, and special symbols using libraries like `zod` or `joi` on the server.
4. **Log Failed Attempts Safely:** Log IP addresses and timestamps for security analysis, but **never log the submitted password** (in case users accidentally mistype their username into the password field).

---

## 7. Common Mistakes & Security Pitfalls

| Mistake | Threat | Mitigation |
| :--- | :--- | :--- |
| **No Rate Limiting** | Automated credential stuffing and dictionary attacks. | Add `express-rate-limit` by IP and account. |
| **Returning Tokens in Response Body for LocalStorage** | XSS attacks can read `localStorage.getItem('token')` and hijack the account. | Deliver token via `httpOnly`, `Secure` cookies. |
| **Leaking Email Existence** | User harvesting / phishing campaigns. | Uniform `401` response regardless of email existence. |
| **Not Lowercasing Emails** | `User@gmail.com` and `user@gmail.com` treated as two distinct accounts. | Set `lowercase: true` in Mongoose schema. |

---

## 8. Related Concepts

* **Multi-Factor Authentication (MFA / TOTP):** Adding a second verification step via Google Authenticator or SMS OTP.
* **OAuth 2.0 / Social Login:** Delegating authentication to Google, GitHub, or Microsoft.
* **WebAuthn / Passkeys:** Cryptographic public-key authentication replacing passwords with device biometrics.
