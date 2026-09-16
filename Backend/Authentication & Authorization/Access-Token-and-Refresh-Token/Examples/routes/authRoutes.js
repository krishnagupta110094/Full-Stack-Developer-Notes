const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

const router = express.Router();

// 1. LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 2. Verify password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 4. Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

// 2. PROTECTED ROUTE (Requires Access Token)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

// 3. REFRESH TOKEN ROUTE (Obtain new Access Token)
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
      });
    }

    // 1. Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret"
    );

    // 2. Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // 3. Check stored refresh token
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // 4. Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // 5. Send new access token
    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
});

// 4. LOGOUT ROUTE (Invalidate stored Refresh Token)
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const user = await User.findOne({
      refreshToken,
    });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
