# 🎯 Login & Password Authentication - Interview Questions & Answers

> A curated question bank covering real interview inquiries from startups to FAANG/Tier-1 tech companies.

---

## 🟢 1. Basic Interview Questions

### Q1: What is the primary purpose of Authentication (AuthN)?
**Answer:**  
Authentication is the process of verifying that an entity (user or machine) is genuinely who they claim to be. In password-based authentication, this is accomplished by matching the provided identifier (username/email) and secret (password) against the securely hashed credentials stored on the server.

---

### Q2: Why should an authentication failure return `401 Unauthorized` instead of `404 Not Found`?
**Answer:**  
If a login endpoint returns `404 User Not Found` when an email does not exist, an attacker can systematically submit email lists and verify which ones are registered in the system (known as **User Enumeration / CWE-204**). Returning a generic `401 Unauthorized` with the message `"Invalid email or password"` conceals whether the failure was caused by an unknown email or an incorrect password.

---

## 🟡 2. Intermediate Interview Questions

### Q3: Why is sending authentication tokens via `httpOnly` cookies considered more secure than returning them in the JSON body?
**Answer:**  
* When tokens are returned in the JSON body, the frontend typically saves them to `localStorage` or `sessionStorage`. Any Cross-Site Scripting (XSS) vulnerability (e.g. from a malicious npm dependency or unsanitized user comment) can execute `localStorage.getItem('token')` and steal the token.
* With `httpOnly` cookies, the browser automatically attaches the cookie to requests, but **client-side JavaScript is strictly forbidden by the browser engine from reading it**, eliminating the risk of token theft via XSS.

---

### Q4: How do you protect a login endpoint from Credential Stuffing attacks?
**Answer:**  
1. **Rate Limiting:** Throttle requests by IP address (e.g., max 5 attempts per 15 minutes) and by target account.
2. **CAPTCHA Challenges:** Trigger a CAPTCHA (Cloudflare Turnstile or Google reCAPTCHA) after 3 consecutive failures.
3. **Account Lockout / Backoff:** Temporarily lock the account for 15 minutes after multiple consecutive failed attempts.
4. **Multi-Factor Authentication (MFA):** Require a secondary verification channel (TOTP / SMS / Email OTP).

---

## 🔴 3. Advanced Interview Questions

### Q5: What is a Side-Channel Timing Attack during login, and how do you eliminate it?
**Answer:**  
* **The Vulnerability:** If the user email does not exist in the database, the server returns immediately (~5ms). If the email exists, the server executes `bcrypt.compare()`, which takes ~250ms due to the cost factor. An attacker measures the network latency to determine which emails are registered.
* **The Solution:** If the user is not found, execute `bcrypt.compare(password, DUMMY_HASH)` against a precomputed dummy hash. This ensures both valid and invalid email requests follow an identical ~250ms execution path.

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"If we use `httpOnly` cookies to stop XSS, haven't we opened ourselves up to Cross-Site Request Forgery (CSRF)?"*
**Answer:**  
*"Yes, traditional cookies are vulnerable to CSRF because browsers automatically attach cookies across domains. However, in modern backend design, we mitigate CSRF by:*
1. *Setting the cookie attribute `SameSite: 'Strict'` or `SameSite: 'Lax'`, which prevents third-party websites from sending the cookie in cross-site requests.*
2. *Using anti-CSRF Double Submit Cookie tokens for state-changing HTTP requests (POST, PUT, DELETE)."*

---

## 🧠 5. Tricky Interview Questions

### Q6: Can we rely exclusively on frontend validation (e.g., HTML regex or React state) for password rules?
**Answer:**  
No. Frontend validation is strictly for User Experience (UX) to give immediate feedback to legitimate users. An attacker can completely bypass frontend checks by sending HTTP requests directly via `cURL`, Postman, or automated scripts. Backend validation is mandatory.

---

## 🏢 6. Real-World Scenario-Based Questions

### Scenario 1: Preventing Distributed Brute-Force Attacks
> **Question:** *"An attacker uses a botnet with 10,000 different IP addresses to attack a single high-profile email account (`ceo@company.com`). IP-based rate limiting fails because each IP only sends one request. How do you defend against this?"*

**Answer:**  
1. **Account-Based Rate Limiting:** Implement rate limiting keyed on `email` (or `account_id`) in addition to IP address in Redis.
2. **Progressive Delays:** Introduce an exponential backoff per account (e.g. 1st fail: 1s delay, 2nd fail: 2s, 3rd fail: 4s).
3. **Credential Breach Detection:** Check incoming passwords against known compromised password databases (e.g., HaveIBeenPwned API).
4. **Mandatory MFA:** Trigger an immediate out-of-band notification or OTP to the account owner when anomalous distributed logins are detected.
