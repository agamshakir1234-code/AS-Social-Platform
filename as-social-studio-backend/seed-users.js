// seed-user.js
// Run this ONCE to create the default admin user in your Firestore.
//
// Usage:
//   1. Copy this file to the ROOT of your backend folder
//   2. Make sure your .env file is filled in (FIREBASE_* vars)
//   3. Run:  node seed-user.js

require("dotenv").config();
const admin  = require("firebase-admin");
const bcrypt = require("bcryptjs");

// ── Default credentials (change before running if you want) ──────────────────
const DEFAULT_USER = {
  name:     "Admin AS Studio",
  email:    "admin@associalstudio.com",
  password: "Admin@123",
  role:     "admin",
};
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  // Init Firebase
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (!process.env.FIREBASE_PROJECT_ID || !privateKey) {
    console.error("\n❌  Missing Firebase env vars. Check your .env file.\n");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  const db = admin.firestore();

  // Check if user already exists
  const existing = await db
    .collection("users")
    .where("email", "==", DEFAULT_USER.email)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`\n⚠️  User already exists: ${DEFAULT_USER.email}`);
    console.log("    Delete them in Firestore console first if you want to re-seed.\n");
    process.exit(0);
  }

  // Hash password
  const hashed = await bcrypt.hash(DEFAULT_USER.password, 12);
  const now    = new Date().toISOString();

  const docRef = await db.collection("users").add({
    name:      DEFAULT_USER.name,
    email:     DEFAULT_USER.email,
    password:  hashed,
    role:      DEFAULT_USER.role,
    createdAt: now,
    updatedAt: now,
  });

  console.log("\n✅  Default user created successfully!\n");
  console.log("┌─────────────────────────────────────────┐");
  console.log("│         AS Social Studio – Login         │");
  console.log("├─────────────────────────────────────────┤");
  console.log(`│  Email   :  ${DEFAULT_USER.email.padEnd(27)} │`);
  console.log(`│  Password:  ${DEFAULT_USER.password.padEnd(27)} │`);
  console.log(`│  Role    :  ${DEFAULT_USER.role.padEnd(27)} │`);
  console.log(`│  Doc ID  :  ${docRef.id.padEnd(27)} │`);
  console.log("└─────────────────────────────────────────┘");
  console.log("\n👉  Open your frontend and log in with the credentials above.\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌  Seed failed:\n", err.message, "\n");
  process.exit(1);
});
