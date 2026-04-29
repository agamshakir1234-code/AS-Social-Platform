// src/middleware/errorHandler.js
// Global error-handling middleware – catches any error forwarded via next(err).

function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === "development";

  // Firestore / Firebase errors
  if (err.code && err.code.startsWith("firestore/")) {
    return res.status(503).json({
      success: false,
      message: "Database error. Please try again later.",
      ...(isDev && { detail: err.message }),
    });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(`[ERROR] ${status} – ${message}`, isDev ? err.stack : "");

  return res.status(status).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
