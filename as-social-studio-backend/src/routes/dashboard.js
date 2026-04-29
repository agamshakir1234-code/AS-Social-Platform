// src/routes/dashboard.js
// GET /api/dashboard  – aggregated KPIs for the main dashboard

const router = require("express").Router();

const { getFirestore } = require("../config/firebase");
const authMiddleware   = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET /api/dashboard ───────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const db = getFirestore();

    // Parallel reads for performance
    const [clientsSnap, postsSnap, leadsSnap] = await Promise.all([
      db.collection("clients").get(),
      db.collection("posts").get(),
      db.collection("leads").get(),
    ]);

    // ── Clients KPIs ─────────────────────────────────────────────────────────
    const clients      = clientsSnap.docs.map((d) => d.data());
    const totalClients = clients.length;
    const activeClients  = clients.filter((c) => c.status === "active").length;
    const inactiveClients = clients.filter((c) => c.status === "inactive").length;
    const prospectClients = clients.filter((c) => c.status === "prospect").length;

    // ── Posts KPIs ────────────────────────────────────────────────────────────
    const posts          = postsSnap.docs.map((d) => d.data());
    const totalPosts     = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "published").length;
    const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
    const draftPosts     = posts.filter((p) => p.status === "draft").length;

    // Posts by platform
    const postsByPlatform = posts.reduce((acc, p) => {
      acc[p.platform] = (acc[p.platform] || 0) + 1;
      return acc;
    }, {});

    // ── Leads KPIs ────────────────────────────────────────────────────────────
    const leads         = leadsSnap.docs.map((d) => d.data());
    const totalLeads    = leads.length;
    const newLeads      = leads.filter((l) => l.status === "new").length;
    const convertedLeads = leads.filter((l) => l.status === "converted").length;
    const lostLeads     = leads.filter((l) => l.status === "lost").length;

    const conversionRate =
      totalLeads > 0 ? +((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    // Total pipeline value
    const totalLeadValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

    // Leads by source
    const leadsBySource = leads.reduce((acc, l) => {
      const src = l.source || "other";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});

    // ── Recent Activity (last 5 items each) ───────────────────────────────────
    const sortByDate = (arr) =>
      [...arr]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const recentClients = clientsSnap.docs
      .map((d) => ({ id: d.id, name: d.data().name, status: d.data().status, createdAt: d.data().createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentPosts = postsSnap.docs
      .map((d) => ({ id: d.id, title: d.data().title, platform: d.data().platform, status: d.data().status, createdAt: d.data().createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentLeads = leadsSnap.docs
      .map((d) => ({ id: d.id, name: d.data().name, status: d.data().status, source: d.data().source, value: d.data().value, createdAt: d.data().createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // ── Monthly trend (last 6 months) ─────────────────────────────────────────
    const monthlyTrend = buildMonthlyTrend([...posts, ...leads], 6);

    return res.json({
      success: true,
      data: {
        overview: {
          totalClients,
          activeClients,
          inactiveClients,
          prospectClients,
          totalPosts,
          publishedPosts,
          scheduledPosts,
          draftPosts,
          totalLeads,
          newLeads,
          convertedLeads,
          lostLeads,
          conversionRate,
          totalLeadValue,
        },
        breakdowns: {
          postsByPlatform,
          leadsBySource,
        },
        recent: {
          clients: recentClients,
          posts:   recentPosts,
          leads:   recentLeads,
        },
        monthlyTrend,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a monthly count for the past `months` months.
 * Works on any array of objects that have a `createdAt` ISO string.
 */
function buildMonthlyTrend(items, months = 6) {
  const now    = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en", { month: "short", year: "numeric" });
    const count = items.filter((item) => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return (
        itemDate.getFullYear() === d.getFullYear() &&
        itemDate.getMonth()    === d.getMonth()
      );
    }).length;

    result.push({ month: label, count });
  }

  return result;
}

module.exports = router;
