/**
 * server.js
 * 
 * Production-pattern Express application demonstrating:
 * 1. express-session configuration with secure cookie options.
 * 2. POST /login: Verifies credentials, generates session, sets req.session.userId.
 * 3. GET /profile: Protected endpoint checking req.session.userId.
 * 4. POST /logout: Destroys session with req.session.destroy() and clears cookie.
 */

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// Configure Session Middleware
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "supersecretkey12345",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents client-side script access (anti-XSS)
      secure: false,  // Set to true in production with HTTPS
      sameSite: "lax", // Helps reduce CSRF risks
      maxAge: 30 * 60 * 1000 // 30 minutes
    }
  })
);

// Mock Database
const users = [
  {
    id: "usr_101",
    name: "Krishna Gupta",
    email: "krishna@gmail.com",
    // Pre-hashed '123456'
    passwordHash: "$2a$10$7R9f5mQ3k1v4x6z8b0d2f4h6j8l0n2p4r6t8v0x2z4b6d8f0h2j4l"
  }
];

// Initialize password hash for testing
(async () => {
  users[0].passwordHash = await bcrypt.hash("123456", 10);
})();

// 1. LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = users.find((u) => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store user identity in the server-side session
    req.session.userId = user.id;

    res.status(200).json({
      message: "Login successful",
      sessionId: req.sessionID
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. PROTECTED PROFILE ROUTE
app.get("/profile", (req, res) => {
  // Check if session contains authenticated user ID
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = users.find((u) => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// 3. LOGOUT ROUTE
app.post("/logout", (req, res) => {
  if (!req.session) {
    return res.status(200).json({ message: "Already logged out" });
  }

  // Destroy session in session store
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    // Clear session cookie from client
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  });
});

// Export app for testing/running
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Session Auth Server running on http://localhost:${PORT}`);
  });
}
