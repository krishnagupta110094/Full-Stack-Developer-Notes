/**
 * 02-middleware-pipeline.js
 * 
 * Demonstrates the 5 middleware behaviors:
 * 1. Sequential execution order
 * 2. Route-level middleware chaining
 * 3. Conditional short-circuiting (Auth / API key check)
 * 4. Preventing ERR_HTTP_HEADERS_SENT via proper return statements
 * 5. Error middleware execution via next(err)
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Application-Level Middleware: Runs on every single incoming request
app.use((req, res, next) => {
  console.log(`\n[App-Level Middleware] --> ${req.method} ${req.url}`);
  next();
});

// Custom Route-Level Middleware: Authenticate via API Key Header
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== 'secret-token-123') {
    console.log(`[Guard Middleware] ❌ Access denied: Invalid or missing API key`);
    // Crucial: 'return' prevents downstream code from executing
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or missing 'x-api-key' header (expected 'secret-token-123')"
    });
  }

  console.log(`[Guard Middleware] ✅ API key validated successfully`);
  req.auth = { user: 'Admin User', role: 'admin' };
  return next();
};

// Custom Route-Level Middleware: Validate Request Query
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  if (page < 1 || limit < 1 || limit > 100) {
    const error = new Error("Invalid pagination query: page must be >= 1 and limit must be 1-100");
    error.statusCode = 400;
    return next(error); // Route straight to Error Handler
  }

  req.pagination = { page, limit };
  return next();
};

// Public Route (No guards)
app.get('/public', (req, res) => {
  return res.json({ message: "Public endpoint - accessible without any API key." });
});

// Protected Route with Chained Middleware
// Execution order: App-Level Middleware -> requireApiKey -> validatePagination -> Route Handler
app.get('/protected/data', requireApiKey, validatePagination, (req, res) => {
  return res.json({
    success: true,
    message: "Protected data accessed successfully",
    authenticatedUser: req.auth.user,
    pagination: req.pagination,
    items: [
      { id: 101, item: "Server Metrics" },
      { id: 102, item: "Database Status" }
    ]
  });
});

// Error-Handling Middleware (Must have 4 arguments)
app.use((err, req, res, next) => {
  console.error(`[Error Middleware] Caught error: ${err.message}`);
  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Middleware Pipeline Demo listening on http://localhost:${PORT}`);
    console.log(`1. Test public:     GET http://localhost:${PORT}/public`);
    console.log(`2. Test unauthorized: GET http://localhost:${PORT}/protected/data`);
    console.log(`3. Test authorized:   GET http://localhost:${PORT}/protected/data (Header: x-api-key: secret-token-123)`);
  });
}

module.exports = app;
