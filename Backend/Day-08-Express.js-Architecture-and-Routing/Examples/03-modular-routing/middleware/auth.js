/**
 * middleware/auth.js
 * 
 * Reusable authentication guard middleware.
 */

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Provide 'Authorization: Bearer <token>' header."
    });
  }

  const token = authHeader.split(' ')[1];
  if (token !== 'valid-token') {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Provided token is invalid or expired."
    });
  }

  // Attach mock authenticated user to request
  req.user = { id: 1, username: "krishna", role: "admin" };
  return next();
};

module.exports = authenticate;
