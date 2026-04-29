AS Social Studio – Full‑Stack Platform

AS Social Studio היא פלטפורמת ניהול חכמה לעסקים, הכוללת ממשק ניהול מודרני (Frontend) ו‑API מאובטח (Backend).  
המערכת מאפשרת ניהול לקוחות, לידים, פוסטים ו‑KPIs במקום אחד, עם חיבור מלא ל‑Firestore ופריסה ל‑Netlify.

---

🚀 Features
- ממשק ניהול מלא (Frontend)  
- API מאובטח מבוסס Serverless Functions  
- Authentication עם JWT  
- ניהול לקוחות / פוסטים / לידים (CRUD)  
- Dashboard עם נתונים בזמן אמת  
- חיבור ל‑Firestore  
- פריסה מלאה ל‑Netlify  

---

📁 Project Structure
`
/frontend        → React/Vite app (UI)
/netlify/functions → Backend API endpoints
/public          → Static assets
/src             → Shared logic & utilities
package.json     → Dependencies & scripts
README.md        → Project documentation
`

---

🔧 Setup & Development

Install dependencies:
`
npm install
`

Run frontend locally:
`
npm run dev
`

Deploy backend (Netlify Functions):
Netlify builds functions automatically from:
`
/netlify/functions
`

---

🌐 Deployment
הפרויקט מותאם לפריסה מלאה ב‑Netlify:  
- Frontend → Build & Publish  
- Backend → Netlify Functions  
- תמיכה ב‑Environment Variables  
- תמיכה ב‑CI/CD  
-
