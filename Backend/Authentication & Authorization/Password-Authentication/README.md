# 🔐 Password Authentication

> Concise, production-ready guide to password storage, hashing, and verification in backend systems.

---

## 1. What is Password Authentication?

A mechanism where a user proves their identity by providing a known secret (password) matching the identity identifier (email/username).

### The Authentication Flow:
```text
[ Registration ]  Plaintext Password ──► Salt + Hash (Bcrypt) ──► Store Hash in DB
[ Login Verify ]  Plaintext Password ──► bcrypt.compare() with DB Hash ──► Match? (200 OK / 401)
```

---

## 2. Core Pillars of Password Security

| Pillar | What it is | Why it matters |
| :--- | :--- | :--- |
| **One-Way Hashing** | Mathematical function that cannot be reversed. | Passwords can never be decrypted, even if the DB is leaked. |
| **Salting (CSPRNG)** | Unique 16+ byte random string added per password. | Destroys **Rainbow Tables**; identical passwords produce completely different hashes. |
| **Cost Factor (Slowness)** | Deliberate CPU/Memory delay (e.g. Bcrypt rounds: $2^{10}$ to $2^{12}$). | Blocks GPU/ASIC brute-force. A 250ms delay is imperceptible to users, but stops billions of guesses/sec. |

> [!IMPORTANT]
> **Never use SHA-256 or MD5 for passwords.** They are fast integrity hashes ($O(1)$ RAM). Modern GPUs calculate **100+ billion SHA-256 hashes/sec**. Always use **Bcrypt** or **Argon2id**.

---

## 3. Anatomy of a Stored Bcrypt Hash

```text
 $2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 └──┘ └┘ └────────────────────┘ └────────────────────────────┘
  │    │            │                         │
 Alg  Cost     Salt (22 chars)          Hash (31 chars)
```
* **Alg (`$2b$`):** Bcrypt version.
* **Cost (`12`):** $2^{12} = 4,096$ iterations.
* **Salt:** Embedded directly in the string (no need for a separate DB column).
* **Hash:** The cryptographic digest.

---

## 4. Production Mongoose Implementation

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // 🔥 Never leak password hash in queries
  }
});

// 1. Hash password automatically before save
userSchema.pre('save', async function (next) {
  // Only hash if password was created or updated!
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 2. Helper method for verification during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

## 5. Login Verification Pattern

```javascript
// controllers/authController.js
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  // Explicitly include password because select: false is set in schema
  const user = await User.findOne({ email }).select('+password');

  // Generic 401 avoids user enumeration (never reveal if email or password was wrong)
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Issue Token / Session
  const token = generateToken(user._id);
  res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.status(200).json({ success: true, message: 'Logged in successfully' });
};
```

---

## 6. Critical Security Checklist (To The Point)

* **Bcrypt 72-Byte Limit:** Bcrypt ignores characters past 72 bytes. For passphrases $>72$ chars, pre-hash with SHA-256 before passing to Bcrypt.
* **User Enumeration Defense:** Never return `"User not found"` on login; always return `"Invalid email or password"`.
* **Timing Equalization:** If user does not exist in DB, run `bcrypt.compare()` against a dummy hash to keep response time consistent (~250ms).
* **Password Reset Tokens:** Never store raw reset tokens in DB. Store `crypto.createHash('sha256').update(rawToken).digest('hex')`.
* **Pepper (Defense-in-Depth):** An optional server-side secret key stored in environment variables (not DB) added to passwords before hashing.

---

## 7. Common Pitfalls & Quick Fixes

| Pitfall | Problem | Fix |
| :--- | :--- | :--- |
| **Missing `isModified` check** | Updating `user.name` re-hashes the already-hashed password, locking the user out. | `if (!this.isModified('password')) return next();` |
| **Missing `select: false`** | `User.find()` sends password hashes to client responses. | Set `select: false` in Mongoose schema. |
| **Using `findOneAndUpdate()`** | Bypasses Mongoose `save` pre-hooks entirely. | Use `findById()` $\to$ update fields $\to$ `user.save()`. |
| **Client-only validation** | Attackers bypass React validation via Postman/cURL. | Enforce minimum length and complexity on the Express backend. |
