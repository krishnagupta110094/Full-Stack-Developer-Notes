# 🎯 Day 08: Express.js Architecture & Routing - Interview Questions & Answers

> A curated collection of real interview questions and authoritative answers designed to be delivered clearly in technical interviews.

---

## 🟢 1. Basic Interview Questions

### Q1: What is Express.js, and why is it preferred over native Node.js HTTP?
**Direct Interview Answer:**  
*"Express.js is a fast, unopinionated, and minimal web framework built on top of Node's core `http` module.  
While native Node requires manual parsing of URLs, HTTP verbs, query parameters, and streaming request buffers, Express abstracts this complexity by providing an out-of-the-box routing engine, intuitive response methods like `res.json()`, and a flexible sequential middleware pipeline."*

---

### Q2: What is a Middleware in Express.js?
**Direct Interview Answer:**  
*"A middleware is a function that sits in the request-response cycle and has access to three objects: the Request object (`req`), the Response object (`res`), and the `next` callback function.  
Middlewares can execute arbitrary code, modify `req` or `res`, terminate the request cycle by returning a response, or pass control downstream by calling `next()`."*

---

### Q3: What is the purpose of the `next()` function?
**Direct Interview Answer:**  
*"The `next()` function is a callback that passes control to the next middleware in the registered execution stack. If a middleware function does not terminate the request-response cycle by sending a response, it must call `next()`; otherwise, the client request will hang indefinitely until timeout."*

---

### Q4: What are the primary differences between `req.params` and `req.query`?
**Direct Interview Answer:**  
* **`req.params`:** Contains route parameters parsed from path segments defined with colons (e.g., `/api/users/:id` $\to$ `req.params.id`). Used to identify a specific resource.
* **`req.query`:** Contains optional key-value pairs appended after the `?` delimiter in the URL (e.g., `/api/users?status=active&sort=desc` $\to$ `req.query.status`). Used for filtering, pagination, and sorting.

---

## 🟡 2. Intermediate Interview Questions

### Q5: Name and explain the 5 types of Express middleware.
**Direct Interview Answer:**  
*"Express middleware falls into five distinct categories:
1. **Application-level middleware:** Bound directly to `app` using `app.use()` or `app.METHOD()`, executing across all routes or path prefixes.
2. **Router-level middleware:** Bound to an `express.Router()` instance, scoped exclusively to that router's mounted endpoints.
3. **Error-handling middleware:** Defined strictly with 4 parameters `(err, req, res, next)`.
4. **Built-in middleware:** Bundled with Express, such as `express.json()`, `express.urlencoded()`, and `express.static()`.
5. **Third-party middleware:** Community packages installed via NPM, such as `cors`, `helmet`, and `morgan`."*

---

### Q6: What does `next(err)` do when an argument is passed to it?
**Direct Interview Answer:**  
*"When `next()` is called with an argument (any value except the string `'route'`), Express immediately flags the request as an error. It skips all remaining regular middleware and router handlers in the stack and jumps straight to the registered 4-argument Error-Handling Middleware."*

---

### Q7: Why and when would you use `express.Router()`?
**Direct Interview Answer:**  
*"We use `express.Router()` to achieve modular, scalable architecture. Rather than defining every endpoint inside a single monolithic file, `express.Router()` behaves as a mini-application with its own isolated middleware stack and route definitions. This allows us to organize code by business domains (e.g., `userRoutes`, `orderRoutes`), mount them with clean URL prefixes in `server.js`, and maintain separation of concerns."*

---

## 🔴 3. Advanced Interview Questions

### Q8: How does Express recognize Error-Handling Middleware under the hood?
**Direct Interview Answer:**  
*"Express inspects the JavaScript function's arity using `fn.length`.  
* Standard middleware has an arity of 2 or 3 (`(req, res)` or `(req, res, next)`).  
* Error-handling middleware has an arity of exactly 4 (`(err, req, res, next)`).  
When `next(err)` is invoked, Express iterates through its internal router layer stack and executes only those functions where `layer.handle.length === 4`."*

---

### Q9: What causes the `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`?
**Direct Interview Answer:**  
*"This error occurs when backend code attempts to send response headers or write to the response body after a response has already been dispatched and closed for that HTTP connection.  
The most common cause is forgetting to `return` when sending a response inside conditional logic, or calling `next()` after invoking `res.json()`."*

```javascript
// Culprit:
if (!user) {
  res.status(404).json({ message: "User not found" }); // Response sent!
}
res.json(user); // Attempting to send second response -> ERR_HTTP_HEADERS_SENT!

// Fix:
if (!user) {
  return res.status(404).json({ message: "User not found" });
}
return res.json(user);
```

---

### Q10: What is the difference between `res.send()` and `res.json()`?
**Direct Interview Answer:**  
*"While both end the request-response cycle:
* **`res.json()`:** Explicitly sets the `Content-Type` header to `application/json` and formats JavaScript objects/arrays using `JSON.stringify()`.
* **`res.send()`:** A dynamic polymorphic helper. If passed a string, it defaults to `text/html`; if passed an object or array, it invokes `res.json()` internally; if passed a Buffer, it sets `application/octet-stream`."*

---

## 🔄 4. Cross-Questions (Interviewer Deep-Dives)

### Cross-Q1: *"If I have an asynchronous route handler that throws an error (`throw new Error(...)`), will Express catch it automatically?"*
**Direct Interview Answer:**  
*"In **Express 4.x**, No. Express 4 only catches synchronous errors thrown inside middleware. Unhandled promise rejections or errors thrown inside `async` functions will cause unhandled rejections unless wrapped in a `try/catch` block with `next(err)` or processed via a wrapper utility (like `express-async-errors`).  
In **Express 5.x**, Yes. Express 5 natively handles rejected promises and automatically routes them to the error middleware."*

---

### Cross-Q2: *"Can you have multiple route handlers on the same HTTP path?"*
**Direct Interview Answer:**  
*"Yes. Express supports route handler chaining. You can supply multiple callback functions in sequence:  
`router.get('/profile', verifyToken, checkSubscription, getProfileController);`  
Each function in the array must call `next()` to hand off control to the subsequent handler until the final controller sends the response."*

---

## 🧠 5. Tricky Edge Cases & Output-Based Questions

### Tricky Q1: What is the output/behavior of this code?
```javascript
app.use((req, res, next) => {
  console.log("Middleware A");
  next();
  console.log("Middleware B");
});

app.get("/test", (req, res) => {
  console.log("Route Handler");
  res.send("Done");
});
```

**Direct Interview Answer:**  
*"The console output will be:  
1. `Middleware A`  
2. `Route Handler`  
3. `Middleware B`  

**Explanation:** Calling `next()` behaves like a regular synchronous function call. The execution pauses, runs the downstream middleware and route handler to completion, and then unwinds the call stack, returning to print `Middleware B`."*

---

### Tricky Q2: What happens if you define an error handler with only 3 arguments: `(err, req, res)`?
**Direct Interview Answer:**  
*"Express will **fail to recognize it as an error handler** because `fn.length` will be 3 instead of 4. Express will treat it as a standard request middleware, completely skipping it when `next(err)` is called, leaving the error unhandled."*

---

## 🏢 6. Real-World Scenario-Based Questions

### Scenario 1: Global vs Router-Level Authentication
> **Interviewer:** *"We have public routes (`/api/auth/login`, `/api/health`, `/api/docs`) and protected routes (`/api/users`, `/api/orders`). How do you structure authentication middleware without writing `if/else` path checks inside a global middleware?"*

**Direct Interview Answer:**  
*"We enforce separation via **Router-Level Middleware**:
1. Keep `server.js` clean and public routes completely unauthenticated.
2. Group protected domain routers under a protected parent route or apply the auth middleware directly to that specific router instance:
```javascript
// Public Routes
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);

// Protected Domain Routers
userRouter.use(protect); // Router-level guard
app.use('/api/users', userRouter);

orderRouter.use(protect);
app.use('/api/orders', orderRouter);
```
This guarantees that public endpoints are never touched by auth checks and new protected endpoints are secured by default."*
