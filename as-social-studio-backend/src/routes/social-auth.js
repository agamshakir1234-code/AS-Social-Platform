// src/routes/social-auth.js
// GET  /api/social/meta/init          → מתחיל OAuth עם Meta
// GET  /api/social/meta/callback      → מקבל code ומחליף ל-token
// GET  /api/social/linkedin/init      → מתחיל OAuth עם LinkedIn
// GET  /api/social/linkedin/callback  → מקבל code ומחליף ל-token
// GET  /api/social/status             → מחזיר אילו רשתות מחוברות
// DELETE /api/social/:platform        → מנתק רשת חברתית

"use strict";

const router       = require("express").Router();
const fetch        = require("node-fetch");
const { getFirestore } = require("../config/firebase");
const authMiddleware   = require("../middleware/auth");

// ─── Meta Constants ───────────────────────────────────────────────────────────

const META_APP_ID      = process.env.META_APP_ID;
const META_APP_SECRET  = process.env.META_APP_SECRET;
const META_REDIRECT    = process.env.META_REDIRECT_URI ||
  "https://as-social.netlify.app/.netlify/functions/api/social/meta/callback";

const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

// ─── LinkedIn Constants ───────────────────────────────────────────────────────

const LI_CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID;
const LI_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LI_REDIRECT      = process.env.LINKEDIN_REDIRECT_URI ||
  "https://as-social.netlify.app/.netlify/functions/api/social/linkedin/callback";

const LI_SCOPES = "openid profile email w_member_social";

// ─── Collection ───────────────────────────────────────────────────────────────

const COL = "socialTokens";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateState(uid, platform) {
  const payload = Buffer.from(JSON.stringify({ uid, platform, ts: Date.now() })).toString("base64");
  return payload;
}

function parseState(state) {
  try {
    return JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// ─── GET /api/social/meta/init ────────────────────────────────────────────────

router.get("/meta/init", authMiddleware, (req, res) => {
  const state = generateState(req.user.uid, "meta");
  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id",     META_APP_ID);
  url.searchParams.set("redirect_uri",  META_REDIRECT);
  url.searchParams.set("scope",         META_SCOPES);
  url.searchParams.set("state",         state);
  url.searchParams.set("response_type", "code");

  return res.json({ success: true, data: { url: url.toString() } });
});

// ─── GET /api/social/meta/callback ───────────────────────────────────────────

router.get("/meta/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/?social_error=meta_denied`);
    }

    const parsed = parseState(state);
    if (!parsed) {
      return res.status(400).json({ success: false, message: "Invalid state" });
    }

    // Exchange code for token
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id",     META_APP_ID);
    tokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri",  META_REDIRECT);
    tokenUrl.searchParams.set("code",          code);

    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ success: false, message: "Failed to get Meta access token", detail: tokenData });
    }

    // Get user pages
    const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`);
    const pagesData = await pagesRes.json();

    // Get Instagram accounts linked to pages
    let igAccounts = [];
    if (pagesData.data && pagesData.data.length > 0) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${pagesData.data[0].id}?fields=instagram_business_account&access_token=${pagesData.data[0].access_token}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account) {
        igAccounts.push(igData.instagram_business_account.id);
      }
    }

    // Save tokens to Firestore
    const db  = getFirestore();
    const now = new Date().toISOString();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    await db.collection(COL).doc(parsed.uid).set({
      meta: {
        accessToken:  tokenData.access_token,
        tokenType:    tokenData.token_type || "bearer",
        expiresAt,
        pages:        pagesData.data || [],
        igAccountId:  igAccounts[0] || null,
        connectedAt:  now,
      },
      updatedAt: now,
    }, { merge: true });

    return res.redirect(`${process.env.FRONTEND_URL}/?social_connected=meta`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/social/linkedin/init ───────────────────────────────────────────

router.get("/linkedin/init", authMiddleware, (req, res) => {
  const state = generateState(req.user.uid, "linkedin");
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id",     LI_CLIENT_ID);
  url.searchParams.set("redirect_uri",  LI_REDIRECT);
  url.searchParams.set("state",         state);
  url.searchParams.set("scope",         LI_SCOPES);

  return res.json({ success: true, data: { url: url.toString() } });
});

// ─── GET /api/social/linkedin/callback ───────────────────────────────────────

router.get("/linkedin/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/?social_error=linkedin_denied`);
    }

    const parsed = parseState(state);
    if (!parsed) {
      return res.status(400).json({ success: false, message: "Invalid state" });
    }

    // Exchange code for token
    const params = new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  LI_REDIRECT,
      client_id:     LI_CLIENT_ID,
      client_secret: LI_CLIENT_SECRET,
    });

    const tokenRes  = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ success: false, message: "Failed to get LinkedIn access token", detail: tokenData });
    }

    // Get user profile
    const profileRes  = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    // Save to Firestore
    const db  = getFirestore();
    const now = new Date().toISOString();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    await db.collection(COL).doc(parsed.uid).set({
      linkedin: {
        accessToken:  tokenData.access_token,
        expiresAt,
        sub:          profileData.sub || null,
        name:         profileData.name || null,
        email:        profileData.email || null,
        connectedAt:  now,
      },
      updatedAt: now,
    }, { merge: true });

    return res.redirect(`${process.env.FRONTEND_URL}/?social_connected=linkedin`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/social/status ───────────────────────────────────────────────────

router.get("/status", authMiddleware, async (req, res, next) => {
  try {
    const db  = getFirestore();
    const doc = await db.collection(COL).doc(req.user.uid).get();

    if (!doc.exists) {
      return res.json({ success: true, data: { meta: false, linkedin: false } });
    }

    const data = doc.data();
    return res.json({
      success: true,
      data: {
        meta: !!data.meta?.accessToken,
        linkedin: !!data.linkedin?.accessToken,
        metaPages: data.meta?.pages?.map(p => ({ id: p.id, name: p.name })) || [],
        igAccountId: data.meta?.igAccountId || null,
        linkedinName: data.linkedin?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/social/:platform ────────────────────────────────────────────

router.delete("/:platform", authMiddleware, async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (!["meta", "linkedin"].includes(platform)) {
      return res.status(400).json({ success: false, message: "Invalid platform" });
    }

    const db  = getFirestore();
    const ref = db.collection(COL).doc(req.user.uid);

    await ref.set({ [platform]: null, updatedAt: new Date().toISOString() }, { merge: true });

    return res.json({ success: true, message: `${platform} disconnected` });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 