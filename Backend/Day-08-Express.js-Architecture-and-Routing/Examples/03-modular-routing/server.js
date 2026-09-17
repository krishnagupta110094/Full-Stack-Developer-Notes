/**
 * server.js (Modular Routing Master Orchestrator)
 * 
 * Demonstrates:
 * 1. Global application-level middleware (logging, body-parsing)
 * 2. Modular router mounting (/api/v1/users, /api/v1/products)
 * 3. 404 Fallback route handler
 * 4. Centralized Error-handling middleware
 */

const express = require('express');
const requestLogger = require('./middleware/logger');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// 1. Built-in body parser middleware
app.use(express.json());

// 2. Application-level logging middleware
app.use(requestLogger);

// 3. Health check root endpoint
app.get('/health', (req, res) => {
  return res.json({ status: "OK", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 4. Mount Modular Sub-Routers
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// 5. 404 Fallback Catch-All Handler (Must be placed AFTER all valid routes)
app.use((req, res, next) => {
  const error = new Error(`Resource not found on endpoint: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // Forward to centralized error handler
});

// 6. Centralized Error-Handling Middleware (Must have 4 arguments)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      statusCode: statusCode
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Modular Routing API running on http://localhost:${PORT}`);
    console.log(`Available Endpoints:`);
    console.log(`- GET  http://localhost:${PORT}/health`);
    console.log(`- GET  http://localhost:${PORT}/api/v1/users`);
    console.log(`- GET  http://localhost:${PORT}/api/v1/products`);
    console.log(`- POST http://localhost:${PORT}/api/v1/users (Requires 'Authorization: Bearer valid-token')`);
  });
}

module.exports = app;
