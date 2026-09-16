# 🎯 Session-Based Authentication - Interview Questions & Answers

> Core interview questions covering Session IDs, Session Stores, Cookies, and Express session management.

---

### Q1: What is Session-Based Authentication?
**Answer:**  
Session-based authentication is an authentication mechanism where the server creates and stores the user's authenticated state in a session, and the client sends a Session ID with subsequent requests to identify themselves.

---

### Q2: What is a Session ID?
**Answer:**  
A Session ID is a unique, opaque identifier used to look up and reference a user's authenticated session on the server.

---

### Q3: Where is session data stored?
**Answer:**  
Session data is stored on the server side, commonly in server memory (for local development), Redis (for production/distributed systems), or a database.

---

### Q4: Where is the Session ID usually stored on the client side?
**Answer:**  
It is commonly stored in a browser cookie (e.g. `connect.sid`).

---

### Q5: Is a Session ID the same thing as a Cookie?
**Answer:**  
No. A **Session ID** is the identifier value that points to the session on the server, whereas a **Cookie** is the browser storage and transmission mechanism used to store and send that Session ID automatically with HTTP requests.

---

### Q6: What happens when the user logs out?
**Answer:**  
The server destroys or invalidates the session record in the session store and clears the cookie, ensuring the Session ID can no longer be used to access protected resources.

---

### Q7: What happens if an incoming Session ID is invalid or expired?
**Answer:**  
The server attempts to look up the Session ID in the session store and finds no active session. The request is treated as unauthenticated and the server returns `401 Unauthorized`.

---

### Q8: Why use Redis with sessions in production?
**Answer:**  
In production, applications typically run across multiple server instances behind a load balancer. Redis provides a fast, shared in-memory session store accessible by all server instances, allowing any server to validate the user's session without relying on sticky sessions.
