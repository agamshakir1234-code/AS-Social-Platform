// src/routes/social-publish.js
// POST /api/social/publish/meta      → מפרסם ל-Instagram ו/או Facebook
// POST /api/social/publish/linkedin  → מפרסם ל-LinkedIn

"use strict";

const router           = require("express").Router();
const fetch            = require("node-fetch");
const { getFirestore } = require("../config/firebase");
const authMiddleware   = require("../middleware/auth");

router.use(authMiddleware);

const TOKENS_COL = "socialTokens";
const POSTS_COL  = "posts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTokens(uid) {
  const db  = getFirestore();
  const doc = await db.collection(TOKENS_COL).doc(uid).get();
  return doc.exists ? doc.data() : null;
}

async function updatePostStatus(postId, platform, status, publishedUrl = null) {
  const db  = getFirestore();
  const ref = db.collection(POSTS_COL).doc(postId);
  const update = {
    [`publishStatus.${platform}`]: status,
    updatedAt: new Date().toISOString(),
  };
  if (publishedUrl) update[`publishedUrl.${platform}`] = publishedUrl;
  await ref.update(update);
}

// ─── POST /api/social/publish/meta ───────────────────────────────────────────

router.post("/meta", async (req, res, next) => {
  try {
    const { postId, caption, imageUrl, publishTo = ["instagram"] } = req.body;

    if (!postId || !caption) {
      return res.status(400).json({ success: false, message: "postId and caption are required" });
    }

    const tokens = await getTokens(req.user.uid);
    if (!tokens?.meta?.accessToken) {
      return res.status(401).json({ success: false, message: "Meta account not connected" });
    }

    const results = {};

    // ── Instagram Publishing ──────────────────────────────────────────────────
    if (publishTo.includes("instagram") && tokens.meta.igAccountId) {
      const igAccountId  = tokens.meta.igAccountId;
      const pageToken    = tokens.meta.pages?.[0]?.access_token || tokens.meta.accessToken;

      if (imageUrl) {
        // Step 1: Create media container
        const containerRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url:   imageUrl,
              caption,
              access_token: pageToken,
            }),
          }
        );
        const containerData = await containerRes.json();

        if (containerData.id) {
          // Step 2: Publish the container
          const publishRes = await fetch(
            `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: pageToken,
              }),
            }
          );
          const publishData = await publishRes.json();
          results.instagram = {
            success: !!publishData.id,
            mediaId: publishData.id || null,
            error:   publishData.error?.message || null,
          };
        }
      } else {
        // Text-only (carousel or reel placeholder)
        results.instagram = { success: false, error: "Image URL required for Instagram posts" };
      }
    }

    // ── Facebook Page Publishing ──────────────────────────────────────────────
    if (publishTo.includes("facebook") && tokens.meta.pages?.length > 0) {
      const page      = tokens.meta.pages[0];
      const pageToken = page.access_token;

      const body = { message: caption, access_token: pageToken };
      if (imageUrl) body.link = imageUrl;

      const fbRes  = await fetch(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const fbData = await fbRes.json();

      results.facebook = {
        success: !!fbData.id,
        postId:  fbData.id || null,
        error:   fbData.error?.message || null,
      };
    }

    // Update post status in Firestore
    const overallSuccess = Object.values(results).some(r => r.success);
    await updatePostStatus(postId, "meta", overallSuccess ? "published" : "failed");

    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/social/publish/linkedin ───────────────────────────────────────

router.post("/linkedin", async (req, res, next) => {
  try {
    const { postId, text, imageUrl } = req.body;

    if (!postId || !text) {
      return res.status(400).json({ success: false, message: "postId and text are required" });
    }

    const tokens = await getTokens(req.user.uid);
    if (!tokens?.linkedin?.accessToken) {
      return res.status(401).json({ success: false, message: "LinkedIn account not connected" });
    }

    const accessToken = tokens.linkedin.accessToken;
    const authorId    = tokens.linkedin.sub;

    const body = {
      author:     `urn:li:person:${authorId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
          ...(imageUrl ? {
            media: [{
              status: "READY",
              description: { text },
              originalUrl: imageUrl,
            }],
          } : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const liRes  = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });
    const liData = await liRes.json();

    const success = !!liData.id;
    await updatePostStatus(postId, "linkedin", success ? "published" : "failed", liData.id || null);

    return res.json({
      success,
      data: {
        postId:  liData.id   || null,
        error:   liData.message || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;  