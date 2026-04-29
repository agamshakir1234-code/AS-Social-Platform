// src/routes/auth.js
// POST /api/auth/register
// POST /api/auth/login

const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

const { getFirestore }   = require("../config/firebase");
const { registerRules, loginRules } = require("../validators");
const validate           = require("../validators/validate");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function safeUser(doc) {
  const { password: _pw, ...rest } = doc;
  return rest;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post("/register", registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password, role = "viewer" } = req.body;
    const db = getFirestore();

    // Check for existing user
    const existing = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const docRef = await db.collection("users").add({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({ uid: docRef.id, email, role });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { token, user: { id: docRef.id, name, email, role } },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post("/login", loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getFirestore();

    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const userDoc  = snapshot.docs[0];
    const userData = userDoc.data();

    const match = await bcrypt.compare(password, userData.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken({ uid: userDoc.id, email, role: userData.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: safeUser({ id: userDoc.id, ...userData }),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
