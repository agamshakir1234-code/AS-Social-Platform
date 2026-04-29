// src/routes/posts.js
// GET    /api/posts
// POST   /api/posts
// GET    /api/posts/:id
// PUT    /api/posts/:id
// DELETE /api/posts/:id

const router = require("express").Router();

const { getFirestore }       = require("../config/firebase");
const authMiddleware         = require("../middleware/auth");
const { postRules, idParam } = require("../validators");
const validate               = require("../validators/validate");

const COL = "posts";

router.use(authMiddleware);

// ─── GET /api/posts ───────────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore();
    const { clientId, platform, status, limit = 50, page = 1 } = req.query;

    let query = db.collection(COL).orderBy("createdAt", "desc");

    if (clientId) query = query.where("clientId",  "==", clientId);
    if (platform)  query = query.where("platform",  "==", platform);
    if (status)    query = query.where("status",    "==", status);

    const snapshot = await query.get();
    let posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const total     = posts.length;
    const pageNum   = parseInt(page,  10);
    const limitNum  = parseInt(limit, 10);
    const start     = (pageNum - 1) * limitNum;
    const paginated = posts.slice(start, start + limitNum);

    return res.json({
      success: true,
      data: paginated,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────

router.post("/", postRules, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const now = new Date().toISOString();

    const payload = {
      ...req.body,
      status:    req.body.status || "draft",
      tags:      req.body.tags   || [],
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    // Validate that the referenced client exists
    const clientDoc = await db.collection("clients").doc(payload.clientId).get();
    if (!clientDoc.exists) {
      return res.status(404).json({ success: false, message: "Referenced client not found" });
    }

    const docRef = await db.collection(COL).add(payload);

    return res.status(201).json({
      success: true,
      message: "Post created",
      data: { id: docRef.id, ...payload },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

router.get("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const doc = await db.collection(COL).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

router.put("/:id", [...idParam, ...postRules], validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.createdAt;
    delete updates.createdBy;

    await ref.update(updates);

    return res.json({
      success: true,
      message: "Post updated",
      data: { id: doc.id, ...doc.data(), ...updates },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

router.delete("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    await ref.delete();

    return res.json({ success: true, message: "Post deleted", data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
