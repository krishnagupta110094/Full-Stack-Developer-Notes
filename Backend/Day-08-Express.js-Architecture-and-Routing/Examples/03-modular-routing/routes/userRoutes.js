/**
 * routes/userRoutes.js
 * 
 * Modular Router demonstrating:
 * 1. Router-level middleware
 * 2. Route grouping using router.route()
 * 3. URL params (req.params) and query params (req.query)
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// In-memory data store for demonstration
let users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];

// Router-Level Middleware: Scoped strictly to /api/v1/users
router.use((req, res, next) => {
  console.log(`[UserRouter] Accessed at ${new Date().toISOString()}`);
  next();
});

// Route chaining for root path: /api/v1/users
router.route('/')
  .get((req, res) => {
    // Handling query filters: /api/v1/users?search=Alice
    const { search } = req.query;
    if (search) {
      const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    return res.json({ success: true, count: users.length, data: users });
  })
  .post(authenticate, (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const newUser = { id: users.length + 1, name, email };
    users.push(newUser);
    return res.status(201).json({ success: true, data: newUser });
  });

// Parameterized routes: /api/v1/users/:id
router.route('/:id')
  .get((req, res) => {
    const userId = parseInt(req.params.id, 10);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: `User with ID ${userId} not found` });
    }

    return res.json({ success: true, data: user });
  })
  .delete(authenticate, (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length === initialLength) {
      return res.status(404).json({ success: false, message: `User with ID ${userId} not found` });
    }

    return res.json({ success: true, message: `User ${userId} successfully deleted` });
  });

module.exports = router;
