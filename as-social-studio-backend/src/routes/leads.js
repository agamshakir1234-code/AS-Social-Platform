// src/routes/leads.js
// GET    /api/leads
// POST   /api/leads
// GET    /api/leads/:id
// PUT    /api/leads/:id
// DELETE /api/leads/:id

const router = require("express").Router();

const { getFirestore }       = require("../config/firebase");
const authMiddleware         = require("../middleware/auth");
const { leadRules, idParam } = require("../validators");
const validate               = require("../validators/validate");

const COL = "leads";

router.use(authMiddleware);

// ─── GET /api/leads ───────────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore();
    const { status, source, clientId, search, limit = 50, page = 1 } = req.query;

    let query = db.collection(COL).orderBy("createdAt", "desc");

    if (status)   query = query.where("status",   "==", status);
    if (source)   query = query.where("source",   "==", source);
    if (clientId) query = query.where("clientId", "==", clientId);

    const snapshot = await query.get();
    let leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const term = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(term) ||
          l.email?.toLowerCase().includes(term)
      );
    }

    const total     = leads.length;
    const pageNum   = parseInt(page,  10);
    const limitNum  = parseInt(limit, 10);
    const start     = (pageNum - 1) * limitNum;
    const paginated = leads.slice(start, start + limitNum);

    return res.json({
      success: true,
      data: paginated,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/leads ──────────────────────────────────────────────────────────

router.post("/", leadRules, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const now = new Date().toISOString();

    const payload = {
      ...req.body,
      status:    req.body.status || "new",
      value:     req.body.value  || 0,
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COL).add(payload);

    return res.status(201).json({
      success: true,
      message: "Lead created",
      data: { id: docRef.id, ...payload },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────

router.get("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const doc = await db.collection(COL).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/leads/:id ───────────────────────────────────────────────────────

router.put("/:id", [...idParam, ...leadRules], validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.createdAt;
    delete updates.createdBy;

    await ref.update(updates);

    return res.json({
      success: true,
      message: "Lead updated",
      data: { id: doc.id, ...doc.data(), ...updates },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/leads/:id ────────────────────────────────────────────────────

router.delete("/:id", idParam, validate, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    await ref.delete();

    return res.json({ success: true, message: "Lead deleted", data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
