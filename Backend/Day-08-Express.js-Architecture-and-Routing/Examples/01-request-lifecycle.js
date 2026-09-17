/**
 * 01-request-lifecycle.js
 * 
 * Demonstrates the step-by-step Request-Response Lifecycle in Express.js:
 * 1. Request arrival & global middleware processing
 * 2. Request enhancement (attaching metadata to req)
 * 3. Route matching & route handler execution
 * 4. Response dispatch and execution timing
 * 5. Error handling pipeline via next(err)
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Built-in middleware to parse JSON request bodies
app.use(express.json());

// 1. Global Middleware: Tracks entry timestamp & logs method/path
app.use((req, res, next) => {
  req.startTime = Date.now();
  console.log(`\n[STEP 1: Global Middleware] Incoming Request: ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware
});

// 2. Request Enhancement Middleware: Simulates enriching req with request-id and client info
app.use((req, res, next) => {
  req.requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[STEP 2: Request Enhancement] Attached requestId: ${req.requestId}`);
  next();
});

// 3. Normal Route Handler
app.get('/api/users', (req, res) => {
  console.log(`[STEP 3: Route Controller] Handling /api/users request`);

  const executionTimeMs = Date.now() - req.startTime;

  // Returning JSON response and terminating the request-response cycle
  return res.status(200).json({
    success: true,
    requestId: req.requestId,
    data: [
      { id: 1, name: "Alice", role: "Developer" },
      { id: 2, name: "Bob", role: "Designer" }
    ],
    metadata: {
      executionTimeMs: `${executionTimeMs}ms`
    }
  });
});

// 4. Route triggering an error to demonstrate next(err) flow
app.get('/api/error-demo', (req, res, next) => {
  console.log(`[STEP 3: Route Controller] Triggering intentional error`);
  const err = new Error("Simulated database failure");
  err.statusCode = 500;
  return next(err); // Jumps directly to error-handling middleware
});

// 5. Centralized Error-Handling Middleware (4 arguments)
app.use((err, req, res, next) => {
  console.log(`[STEP 4: Error Handling Middleware] Caught error: ${err.message}`);
  return res.status(err.statusCode || 500).json({
    success: false,
    requestId: req.requestId,
    error: {
      message: err.message,
      statusCode: err.statusCode || 500
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try GET http://localhost:${PORT}/api/users`);
    console.log(`Try GET http://localhost:${PORT}/api/error-demo`);
  });
}

module.exports = app;
