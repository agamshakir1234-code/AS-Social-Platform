const serverless = require("serverless-http")
const express = require("express")
const cors = require("cors")

const authRoutes = require("../../src/routes/auth")
const clientRoutes = require("../../src/routes/clients")
const postRoutes = require("../../src/routes/posts")
const leadRoutes = require("../../src/routes/leads")
const dashboardRoutes = require("../../src/routes/dashboard")
const socialAuthRoutes = require("../../src/routes/social-auth")
const socialPublishRoutes = require("../../src/routes/social-publish")

const app = express()

app.use(cors({ origin: "*" }))
app.use(express.json())

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }))

app.use("/api/auth", authRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/leads", leadRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/social", socialAuthRoutes)
app.use("/api/social", socialPublishRoutes)

module.exports.handler = serverless(app)
