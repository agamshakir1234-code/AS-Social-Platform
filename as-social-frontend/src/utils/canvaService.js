/**
 * canvaService.js
 * פותח Canva ישירות עם URL מותאם לסוג העיצוב
 * ללא בעיות CORS או OAuth מהדפדפן
 */

/* ── Design type map → Canva URLs ─────────── */
const CANVA_DESIGN_URLS = {
  instagram_post:   'https://www.canva.com/create/instagram-posts/',
  instagram_story:  'https://www.canva.com/create/instagram-stories/',
  instagram_reel:   'https://www.canva.com/create/instagram-reels/',
  facebook_post:    'https://www.canva.com/create/facebook-posts/',
  tiktok_video:     'https://www.canva.com/create/tiktok-videos/',
  presentation:     'https://www.canva.com/create/presentations/',
  poster:           'https://www.canva.com/create/posters/',
  email_newsletter: 'https://www.canva.com/create/email-newsletters/',
}

/* ── Open Canva design editor ─────────────── */
export function openCanvaDesign(designType, title, clientName) {
  const url = CANVA_DESIGN_URLS[designType] || 'https://www.canva.com/create/'
  window.open(url, '_blank', 'noopener,noreferrer')
  return { id: 'canva_' + Date.now(), title, designType, clientName, openedAt: new Date().toISOString() }
}

/* ── Save design reference to client media ── */
export function saveDesignRef(clientId, design) {
  if (!clientId) return
  const key     = 'media_' + clientId
  const current = JSON.parse(localStorage.getItem(key) || '[]')
  const entry = {
    id:         design.id || 'canva_' + Date.now(),
    title:      design.title || 'עיצוב Canva',
    designType: design.designType,
    savedAt:    new Date().toISOString(),
    source:     'canva',
    status:     'in_progress',
    urls:       { edit_url: CANVA_DESIGN_URLS[design.designType] || 'https://www.canva.com' },
  }
  current.unshift(entry)
  localStorage.setItem(key, JSON.stringify(current))
  return entry
}

export function getClientMedia(clientId) {
  try { return JSON.parse(localStorage.getItem('media_' + clientId) || '[]') } catch { return [] }
}

export function deleteClientMedia(clientId, designId) {
  const current = getClientMedia(clientId)
  localStorage.setItem('media_' + clientId, JSON.stringify(current.filter(d => d.id !== designId)))
}

/* ── Dummy exports for compatibility ─────── */
export function isConnected() { return true }  // always "connected" — opens Canva directly
export function getToken()    { return 'direct_mode' }
export function getUser()     { return { display_name: 'Canva User' } }
export function clearAuth()   {}
export async function startOAuth() { window.open('https://www.canva.com', '_blank') }
export async function fetchUserProfile() { return { display_name: 'Canva User' } }
export async function listDesigns() { return { items: [] } }
export async function createDesign({ title, designType }) {
  return { design: { id: 'canva_' + Date.now(), title, urls: { edit_url: CANVA_DESIGN_URLS[designType] || 'https://www.canva.com/create/' } } }
}
export async function exchangeToken() { return {} }

/* ── Design types ─────────────────────────── */
export const DESIGN_TYPES = [
  { id: 'instagram_post',   label: 'פוסט אינסטגרם',  labelEn: 'Instagram Post',  icon: '📸', w: 1080, h: 1080 },
  { id: 'instagram_story',  label: 'סטורי אינסטגרם', labelEn: 'Instagram Story', icon: '📱', w: 1080, h: 1920 },
  { id: 'instagram_reel',   label: 'ריל',             labelEn: 'Reel',            icon: '🎬', w: 1080, h: 1920 },
  { id: 'facebook_post',    label: 'פוסט פייסבוק',   labelEn: 'Facebook Post',   icon: '📘', w: 1200, h: 630  },
  { id: 'tiktok_video',     label: 'טיקטוק',          labelEn: 'TikTok',          icon: '🎵', w: 1080, h: 1920 },
  { id: 'presentation',     label: 'מצגת',            labelEn: 'Presentation',    icon: '📊', w: 1920, h: 1080 },
  { id: 'poster',           label: 'פוסטר',           labelEn: 'Poster',          icon: '🖼️', w: 794,  h: 1123 },
  { id: 'email_newsletter', label: 'ניוזלטר',         labelEn: 'Newsletter',      icon: '📧', w: 600,  h: 900  },
] 