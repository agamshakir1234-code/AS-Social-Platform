// src/validators/index.js
// express-validator rule sets used by every route.

const { body, param } = require("express-validator");

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["admin", "manager", "viewer"])
    .withMessage("Role must be admin | manager | viewer"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ── Clients ───────────────────────────────────────────────────────────────────
const clientRules = [
  body("name").trim().notEmpty().withMessage("Client name is required"),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),
  body("industry").optional().trim(),
  body("status")
    .optional()
    .isIn(["active", "inactive", "prospect"])
    .withMessage("Status must be active | inactive | prospect"),
  body("notes").optional().trim(),
];

// ── Posts ─────────────────────────────────────────────────────────────────────
const postRules = [
  body("title").trim().notEmpty().withMessage("Post title is required"),
  body("content").trim().notEmpty().withMessage("Post content is required"),
  body("clientId").trim().notEmpty().withMessage("clientId is required"),
  body("platform")
    .isIn(["instagram", "facebook", "twitter", "linkedin", "tiktok", "other"])
    .withMessage("Invalid platform"),
  body("status")
    .optional()
    .isIn(["draft", "scheduled", "published", "rejected"])
    .withMessage("Invalid status"),
  body("scheduledAt")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("scheduledAt must be a valid ISO date"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
];

// ── Leads ─────────────────────────────────────────────────────────────────────
const leadRules = [
  body("name").trim().notEmpty().withMessage("Lead name is required"),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),
  body("source")
    .optional()
    .isIn(["instagram", "facebook", "referral", "website", "other"])
    .withMessage("Invalid source"),
  body("status")
    .optional()
    .isIn(["new", "contacted", "qualified", "converted", "lost"])
    .withMessage("Invalid status"),
  body("clientId").optional().trim(),
  body("notes").optional().trim(),
  body("value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Value must be a positive number"),
];

// ── Shared ────────────────────────────────────────────────────────────────────
const idParam = [
  param("id").trim().notEmpty().withMessage("ID param is required"),
];

module.exports = {
  registerRules,
  loginRules,
  clientRules,
  postRules,
  leadRules,
  idParam,
};
