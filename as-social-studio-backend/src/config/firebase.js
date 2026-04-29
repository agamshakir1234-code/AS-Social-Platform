// src/config/firebase.js
// Initialises Firebase Admin SDK once and exports the Firestore instance.

const admin = require("firebase-admin");

let db;

function getFirestore() {
  if (db) return db;

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  db = admin.firestore();
  return db;
}

module.exports = { getFirestore };
