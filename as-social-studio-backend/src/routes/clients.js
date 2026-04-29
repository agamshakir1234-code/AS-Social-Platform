// src/routes/clients.js
// GET    /api/clients
// POST   /api/clients
// GET    /api/clients/:id
// PUT    /api/clients/:id
// DELETE /api/clients/:id

const router = require("express").Router();

const { getFirestore }         = require("../config/firebase");
const authMiddleware           = require("../middleware/auth");
const { clientRules, idParam } = require("../validators");
const validate                 = require("../validators/validate");

const COL = "clients";

// All client routes require authentication
router.use(authMiddleware);

// ─── GET /api/clients ─────────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore();
    const { status, search, limit = 50, page = 1 } = req.query;

    let query = db.collection(COL).orderBy("createdAt", "desc");

    if (status) query = query.where("status", "==", status);

    const snapshot = await query.get();

    let clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory search (Firestore doesn't support full-text search natively)
    if (search) {
      const term = search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.industry?.toLowerCase().includes(term)
      );
    }

    // Pagination
    const total      = clients.length;
    const pageNum    = parseInt(page, 10);
    const limitNum   = parseInt(limit, 10);
    const start      = (pageNum - 1) * limitNum;
    const paginated  = clients.slice(start, start + limitNum);

    return res.json({
      success: true,
      data: paginated,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/clients ────────────────────────────────────────────────────────

router.post("/", clientRules, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const now = new Date().toISOString();

    const payload = {
      ...req.body,
      status:    req.body.status    || "active",
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COL).add(payload);

    return res.status(201).json({
      success: true,
      message: "Client created",
      data: { id: docRef.id, ...payload },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/clients/:id ─────────────────────────────────────────────────────

router.get("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const doc = await db.collection(COL).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/clients/:id ─────────────────────────────────────────────────────

router.put("/:id", [...idParam, ...clientRules], validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    // Prevent overwriting immutable fields
    delete updates.createdAt;
    delete updates.createdBy;

    await ref.update(updates);

    return res.json({
      success: true,
      message: "Client updated",
      data: { id: doc.id, ...doc.data(), ...updates },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/clients/:id ──────────────────────────────────────────────────

router.delete("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    await ref.delete();

    return res.json({ success: true, message: "Client deleted", data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
