# 🎯 Role-Based Access Control (RBAC) - Interview Questions & Answers

> A curated question bank covering real interview inquiries from startups to FAANG/Tier-1 tech companies.

---

## 🟢 1. Basic Interview Questions

### Q1: What is the difference between Authentication (AuthN) and Authorization (AuthZ)?
**Answer:**  
* **Authentication (AuthN):** Verifies the identity of a user ("Who are you?"). Examples: Email/password verification, OTP, OAuth login. Failure code: `401 Unauthorized`.
* **Authorization (AuthZ):** Verifies what permissions an authenticated user possesses ("What are you allowed to do?"). Examples: RBAC middleware checking if `role === 'admin'`. Failure code: `403 Forbidden`.

---

### Q2: What does the HTTP `403 Forbidden` status code indicate?
**Answer:**  
Per RFC 9110, `403 Forbidden` means the server understood the request and the client's identity is authenticated, but the server explicitly refuses to authorize access because the user lacks the required roles or permissions. Re-authenticating with the same credentials will not change the result.

---

## 🟡 2. Intermediate Interview Questions

### Q3: How do you implement Role-Based Access Control in an Express.js backend?
**Answer:**  
Using a **Higher-Order Middleware Closure**:
```javascript
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
```
This middleware is placed after the `protect` (AuthN) middleware on protected route definitions.

---

### Q4: What is the "Role Explosion" problem in RBAC, and how is it solved?
**Answer:**  
As an enterprise application grows, static roles multiply exponentially (e.g. `billing_viewer`, `billing_editor`, `billing_admin_eu`).  
**Solution:** Transition from coarse-grained roles to **Permission-Based Access Control (PBAC)** or **Attribute-Based Access Control (ABAC)**, where users are granted specific granular permissions (`invoice:read`, `invoice:refund`) or dynamic policy attributes rather than static role labels.

---

## 🔴 3. Advanced Interview Questions

### Q5: What is Broken Object-Level Authorization (BOLA / IDOR), and why does RBAC fail to stop it?
**Answer:**  
BOLA (OWASP API Top 10 #1) occurs when a user can access or modify an arbitrary object simply by guessing or changing its ID (e.g., `PUT /api/orders/105`).  
**Why standard RBAC fails:** The user *does* have the role `'user'`, so the `restrictTo('user')` middleware passes. However, the system failed to verify whether this specific user actually **owns** order `105`.  
**Mitigation:** Always enforce **Object-Level Authorization** at the database query level:
```javascript
const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id });
```

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"Should we embed user roles inside the JWT payload, or query them from the database on every request?"*
**Answer:**  
*"It represents a classic tradeoff:*
* **In JWT Payload:** Fast ($O(1)$ zero DB calls). However, if an admin downgrades a user's role from `'admin'` to `'user'`, the user remains an admin until their JWT expires.
* **From Database:** Always reflects real-time permissions, but introduces database query latency on every request.
* **Hybrid Best Practice:** Embed the role in a short-lived Access Token (10 minutes) with a `tokenVersion` check, or query a fast in-memory Redis cache for active permissions."*

---

## 🧠 5. Tricky Interview Questions

### Q6: If an unauthorized user attempts to access an administrative endpoint `/api/admin/users`, should you return `403 Forbidden` or `404 Not Found`?
**Answer:**  
In high-security environments, returning `404 Not Found` is often preferred to prevent **endpoint reconnaissance**. If you return `403`, you confirm to the attacker that an administrative resource exists at that URL. Returning `404` makes the endpoint appear non-existent.

---

## 🏢 6. Real-World Scenario-Based Questions

### Scenario 1: Multi-Tenant Authorization
> **Question:** *"In a SaaS multi-tenant application (like Jira or Slack), a user is an 'Admin' in Workspace A, but a regular 'Member' in Workspace B. How do you design RBAC for this?"*

**Answer:**  
Roles must be scoped by `tenantId` / `workspaceId` rather than being a global user attribute:
1. **Schema:** A `Membership` collection: `{ userId, organizationId, role: 'admin' }`.
2. **Middleware:** Extract the `workspaceId` from the route params or headers, query the membership table, and attach `req.membership` to the request before evaluating permissions for that specific workspace.

---

### Scenario 2: Secure Password Reset Workflow
> **Question:** *"Why do we store a SHA-256 hash of the password reset token in the database rather than the plain token sent to the user's email?"*

**Answer:**  
If the database is leaked (via SQL injection, unauthorized DB dump, or insider threat), an attacker who reads plain reset tokens could immediately hijack active accounts before tokens expire. By sending the raw crypto random token via email and storing only its SHA-256 hash in the DB:
* The attacker cannot reverse the hash to recover the token.
* When the user clicks the link, the server computes `crypto.createHash('sha256').update(req.params.token).digest('hex')` and matches it against the stored hash.

---

### Scenario 3: Preventing User Enumeration during Auth Workflows
> **Question:** *"How do you prevent attackers from discovering valid user emails via the Forgot Password or Registration endpoints?"*

**Answer:**  
1. **Uniform Responses:** Always return an identical generic message (e.g., `"If an account with that email exists, a password reset link has been sent"`) regardless of whether the email was found.
2. **Constant-Time Execution:** Prevent timing attacks where DB lookups or email sending introduce measurable latency differences. Run email dispatching asynchronously via background job queues (e.g., BullMQ/Redis) so the API response time remains constant.
3. **Rate Limiting:** Enforce strict IP and email-based rate limiting on password reset and verification endpoints.

