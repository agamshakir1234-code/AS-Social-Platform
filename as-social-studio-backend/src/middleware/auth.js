// src/middleware/auth.js
// Verifies the JWT bearer token on protected routes.

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { uid, email, role }
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token has expired. Please log in again."
        : "Invalid token.";

    return res.status(401).json({ success: false, message });
  }
}

module.exports = authMiddleware;
