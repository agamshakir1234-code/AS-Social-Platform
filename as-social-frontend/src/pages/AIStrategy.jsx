import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Sparkles, Save, RefreshCw, Check, Zap, Target,
  Copy, ArrowRight, BarChart2, Layers, MessageSquare,
  Hash, Shield, Star, Upload, X, Plus, Edit3
} from 'lucide-react'

/* ── Tokens ──────────────────────────────────── */
const G = {
  smoke:'#5E685E', smokeDark:'#445246', gold:'#B49A74',
  ivory:'#F7F4EF', white:'#FFFFFF', text:'#1C1C1C',
  muted:'#7A7A6E', border:'rgba(94,104,94,0.12)', cream:'#E8E1D8',
}
const sans  = { fontFamily:"'Inter','Heebo',sans-serif" }
const serif = { fontFamily:"'Cormorant Garamond',serif" }

const TONES = [
  {id:'luxury',      icon:'👑', he:'יוקרתי ומרוסן',  en:'Luxurious'},
  {id:'warm',        icon:'🤝', he:'חם ואישי',        en:'Warm & Personal'},
  {id:'bold',        icon:'⚡', he:'נועז ומעורר',     en:'Bold & Inspiring'},
  {id:'minimalist',  icon:'◻', he:'מינימליסטי',      en:'Minimalist'},
  {id:'playful',     icon:'🎨', he:'שובבי ויצירתי',  en:'Playful'},
  {id:'professional',icon:'💼', he:'מקצועי ורשמי',   en:'Professional'},
]
const GOALS = [
  {id:'awareness',icon:'📣',he:'מודעות מותג',    en:'Brand Awareness'},
  {id:'leads',    icon:'🎯',he:'יצירת לידים',    en:'Lead Generation'},
  {id:'sales',    icon:'💰',he:'הגדלת מכירות',   en:'Sales Growth'},
  {id:'community',icon:'👥',he:'בניית קהילה',    en:'Community Building'},
  {id:'retention',icon:'❤️',he:'שימור לקוחות',  en:'Customer Retention'},
  {id:'launch',   icon:'🚀',he:'השקת מוצר',      en:'Product Launch'},
]
const PLATFORMS_LIST = [
  {id:'instagram',icon:'📸',label:'Instagram'},
  {id:'facebook', icon:'📘',label:'Facebook'},
  {id:'tiktok',   icon:'🎵',label:'TikTok'},
  {id:'linkedin', icon:'💼',label:'LinkedIn'},
  {id:'youtube',  icon:'▶️', label:'YouTube'},
]
const FONTS = [
  {heading:'Cormorant Garamond', body:'Inter',        label:'יוקרה קלאסית',      style:'serif',   mood:'יוקרה'},
  {heading:'Playfair Display',   body:'Lato',          label:'אלגנטי מודרני',     style:'serif',   mood:'אלגנטי'},
  {heading:'DM Serif Display',   body:'DM Sans',       label:'עכשווי ומדויק',     style:'serif',   mood:'מודרני'},
  {heading:'Libre Baskerville',  body:'Source Sans Pro',label:'קלאסי ואמין',      style:'serif',   mood:'קלאסי'},
  {heading:'Lora',               body:'Nunito',         label:'חמים ואישי',        style:'serif',   mood:'חמים'},
  {heading:'Merriweather',       body:'Open Sans',      label:'עיתונאי ומקצועי',   style:'serif',   mood:'מקצועי'},
  {heading:'EB Garamond',        body:'Raleway',        label:'ספרותי ואצילי',     style:'serif',   mood:'אצילי'},
  {heading:'Montserrat',         body:'Open Sans',      label:'נקי ומינימליסטי',   style:'sans',    mood:'מינימלי'},
  {heading:'Raleway',            body:'Roboto',         label:'גיאומטרי ונועז',    style:'sans',    mood:'נועז'},
  {heading:'Josefin Sans',       body:'Lato',           label:'מינימליסטי-ליניארי',style:'sans',    mood:'ליניארי'},
  {heading:'Poppins',            body:'Inter',          label:'עגול וידידותי',     style:'sans',    mood:'ידידותי'},
  {heading:'Nunito',             body:'Open Sans',      label:'רך ומזמין',         style:'sans',    mood:'מזמין'},
  {heading:'Work Sans',          body:'Roboto',         label:'טכנולוגי ונקי',     style:'sans',    mood:'טכנולוגי'},
  {heading:'Space Grotesk',      body:'Inter',          label:'חדשני ועכשווי',     style:'sans',    mood:'חדשני'},
  {heading:'Syne',               body:'DM Sans',        label:'אמנותי ויצירתי',    style:'sans',    mood:'יצירתי'},
  {heading:'Bebas Neue',         body:'Lato',           label:'נועז ודרמטי',       style:'display', mood:'דרמטי'},
  {heading:'Anton',              body:'Open Sans',      label:'עוצמתי ובולט',      style:'display', mood:'עוצמתי'},
  {heading:'Oswald',             body:'Source Sans Pro',label:'ספורטיבי ותוסס',    style:'display', mood:'ספורטיבי'},
  {heading:'Italiana',           body:'Cormorant Garamond',label:'איטלקי ורומנטי',style:'display', mood:'רומנטי'},
  {heading:'Righteous',          body:'Nunito',         label:'כיפי ויצירתי',      style:'display', mood:'כיפי'},
  {heading:'Heebo',              body:'Assistant',      label:'ישראלי ועברי',      style:'hebrew',  mood:'עברי'},
  {heading:'Assistant',          body:'Heebo',          label:'עברי מודרני',       style:'hebrew',  mood:'עברי-מודרני'},
]

/* ── Storage helpers ─────────────────────────── */
const rj = k     => { try { return JSON.parse(localStorage.getItem(k)||'null') } catch { return null } }
const wj = (k,v) => localStorage.setItem(k, JSON.stringify(v))

function getClients()            { return rj('as_clients') || [] }
function getStrategyDB(cid)      { return rj(`strategy_${cid}`) }
function getBriefDB(cid)         { return rj(`brief_${cid}`) || {} }
function getBrandDB(cid)         { return rj(`brand_${cid}`) || {} }
function saveBriefDB(cid, data)  { wj(`brief_${cid}`, data) }
function saveBrandDB(cid, data)  { wj(`brand_${cid}`, data) }
function getClientFiles(cid)     { return rj(`files_${cid}`) || [] }

function saveStrategyDB(cid, strategy) {
  wj(`strategy_${cid}`, strategy)
  // sync summary to client record
  const clients = getClients()
  const updated = clients.map(c =>
    c.id === cid ? {...c, aiStrategy: strategy.executiveSummary?.slice(0,120), hasStrategy:true} : c
  )
  wj('as_clients', updated)
  // sync to planner
  syncToPlanner(cid, strategy)
  // sync to feed
  syncToFeed(cid, strategy)
  // notify other components
  window.dispatchEvent(new StorageEvent('storage', {key:'__sync__'}))
}

/* ── Sync to planner ────────────────────────── */
function syncToPlanner(clientId, strategy) {
  const clients   = getClients()
  const client    = clients.find(c => c.id === clientId)
  const existing  = rj('planner_events') || []
  const filtered  = existing.filter(e => !(e.clientId === clientId && e.source === 'strategy'))
  const dayMap    = {'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6}
  const platColor = {Instagram:'#E1306C',Facebook:'#1877F2',TikTok:'#000000',LinkedIn:'#0A66C2'}
  const today     = new Date()
  const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay()); weekStart.setHours(0,0,0,0)

  const newEvents = []
  strategy.weeklyPlan?.forEach((week, wi) => {
    week.posts?.forEach(post => {
      const dayOffset = (dayMap[post.day]??0) + wi*7
      const date = new Date(weekStart); date.setDate(weekStart.getDate()+dayOffset)
      const [h,m] = (post.time||'09:00').split(':').map(Number)
      const start = new Date(date); start.setHours(h,m,0,0)
      const end   = new Date(start); end.setMinutes(end.getMinutes()+60)
      newEvents.push({
        id:        `str_${clientId}_w${wi}_${post.day}_${post.platform}`,
        clientId, clientName: client?.name||'',
        title:     post.topic||post.type,
        caption:   post.caption, hashtags: post.hashtags,
        platform:  (post.platform||'Instagram').toLowerCase(),
        type:      post.type, start:start.toISOString(), end:end.toISOString(),
        color:     platColor[post.platform]||'#5E685E',
        source:    'strategy', week:week.week, theme:week.theme,
      })
    })
  })
  wj('planner_events', [...filtered, ...newEvents])
}

/* ── Sync to feed ────────────────────────────── */
function syncToFeed(clientId, strategy) {
  const platMap = {Instagram:'instagram',Facebook:'facebook',TikTok:'tiktok',LinkedIn:'linkedin'}
  const platforms = ['instagram','facebook','tiktok','linkedin']
  const brand    = rj(`brand_${clientId}`) || {}
  const media    = rj(`files_${clientId}`) || []
  const images   = media.filter(f => f.type?.startsWith('image/'))

  platforms.forEach((plat, platIdx) => {
    const existing = (rj(`feed_${clientId}_${plat}`) || []).filter(p => p.source !== 'strategy')
    const newPosts = []
    let imageIdx = 0

    strategy.weeklyPlan?.forEach(week => {
      week.posts?.filter(p => platMap[p.platform]===plat).forEach(post => {
        // Assign uploaded media images to posts in rotation
        const assignedImage = images.length > 0 ? images[imageIdx % images.length]?.data : null
        imageIdx++

        newPosts.push({
          id:             `feed_${clientId}_${plat}_w${week.week}_${post.day}`,
          caption:        post.caption,
          hashtags:       post.hashtags,
          type:           post.type,
          topic:          post.topic,
          day:            post.day,
          time:           post.time,
          platform:       plat,
          visualDirection:post.visualDirection,
          source:         'strategy',
          week:           week.week,
          theme:          week.theme,
          // Brand identity
          brandColors:    brand.customColors || [],
          brandFont:      brand.font?.heading || '',
          brandTagline:   brand.tagline || '',
          // Assigned media
          image:          assignedImage || null,
          hasMedia:       !!assignedImage,
        })
      })
    })
    wj(`feed_${clientId}_${plat}`, [...existing, ...newPosts])
  })

  // Also save media count to client record
  const clients = getClients()
  const updated = clients.map(c => c.id === clientId ? {...c, mediaCount: images.length, feedSynced: true} : c)
  wj('as_clients', updated)
  window.dispatchEvent(new StorageEvent('storage', {key:'__sync__'}))
}

/* ── Gemini API ──────────────────────────────── */
async function callGemini(prompt) {
  const key = import.meta.env.VITE_GEMINI_API_KEY || ''
  const url = `/api/gemini/v1/models/gemini-2.5-flash-lite:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      contents: [{parts:[{text:prompt}]}],
      generationConfig: {temperature:0.7, maxOutputTokens:8192},
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({}))
    throw new Error(err.error?.message || `שגיאה ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/* ── Safe JSON parse ─────────────────────────── */
function safeParseJSON(raw) {
  // Remove markdown code blocks if present
  let clean = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()
  // Find first { and last }
  const first = clean.indexOf('{')
  const last  = clean.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last+1)
  }
  try {
    return JSON.parse(clean)
  } catch {
    return null
  }
}

/* ── Build prompt ────────────────────────────── */
function buildPrompt(form) {
  const postsPerMonth = parseInt(form.postsPerWeek||5) * 4
  const toneMap = {
    luxury:      'יוקרתי, מרוסן, מחושב. שפה עשירה ומדויקת. אף פעם לא זועק. פחות זה יותר.',
    warm:        'חם, אישי, כאילו חבר מדבר. משתמש בשם הלקוח. יוצר חיבור אמוציונלי.',
    bold:        'נועז, ישיר, מעורר השראה. פסקאות קצרות. CTA חזק בכל פוסט.',
    minimalist:  'קצר, חד, ללא עודף. כל מילה עובדת. white space הוא כלי.',
    playful:     'משחקי, יצירתי, עם הומור חכם. אמוג׳י באיפוק. surprising hooks.',
    professional:'רשמי, מהימן, מבוסס נתונים. case studies, statistics, thought leadership.',
  }
  const tone_desc = toneMap[form.tone] || toneMap.warm
  const mediaNote = form.mediaCount > 0 ? `
- יש ${form.mediaCount} חומרי מדיה שהועלו — שלב אותם בתכנון הוויזואלי של הפוסטים` : ''

  return `אתה השיווקאי הכי כריש בעולם. אלייס מדיסון. Gary Vaynerchuk. Seth Godin. בכולם ביחד.
אתה בונה תכניות שיווק שמשנות עסקים — לא תיאוריה, אלא פעולה אמיתית שמייצרת תוצאות.
יש לך ניסיון של 20 שנה עם מותגים כמו Nike, Rolex, Apple ומאות עסקים קטנים שהפכת לאגדות.

═══ פרטי הלקוח ═══
שם: ${form.businessName}
תחום: ${form.businessType}
תיאור: ${form.description}
ערך ייחודי (USP): ${form.uniqueValue}
מתחרים: ${form.competitors}
אתגרים: ${form.challenges}

═══ קהל יעד ═══
גיל: ${form.targetAge} | מגדר: ${form.targetGender} | מיקום: ${form.targetLocation}
תחומי עניין: ${form.targetInterests}

═══ פרמטרים ═══
מטרות: ${form.goals.join(', ')}
פלטפורמות: ${form.platforms.join(', ')}
תקציב: ${form.budget}
תדירות: ${form.postsPerWeek} פוסטים/שבוע = ${postsPerMonth} פוסטים בחודש
שפה ואופי: ${tone_desc}
הערות: ${form.additionalNotes}${mediaNote}

═══ כללי כתיבה חובה ═══
1. כל קאפשן חייב להיות מותאם לאופי הלקוח (${form.tone}) — לא גנרי
2. כל ניסוח חייב לדבר ישירות לקהל היעד (${form.targetAge}, ${form.targetGender})
3. כל פוסט חייב visual direction מדויק — זווית, אור, צבעים, אווירה
4. hashtags — ספציפיים לתחום, לא גנריים
5. שעות תזמון — מבוססות על אלגוריתמי ${form.platforms.join('/')}

CRITICAL: Return ONLY valid JSON. No text, no backticks, no markdown.

{"executiveSummary":"3-4 משפטים מדויקים על המותג, הזדמנות השוק, והיתרון התחרותי","marketAnalysis":"ניתוח מעמיק: גודל שוק, מתחרים, מגמות, הזדמנויות ספציפיות ל${form.businessType}","brandPositioning":"מיצוב ייחודי שאף מתחרה לא יכול לחקות","targetAudienceInsights":"מי הם באמת — מה מרגש אותם, מה מפחיד אותם, מה גורם להם ללחוץ buy","competitiveEdge":"ה-unfair advantage של ${form.businessName}","monthlyTheme":"נושא מרכזי שיוצר קוהרנטיות לכל החודש","coreMessages":["מסר עם ניסוח מדויק בשפת הלקוח","מסר 2 — ספציפי לקהל היעד","מסר 3 — מבדיל מהמתחרים","מסר 4 — call to emotion"],"contentPillars":[{"name":"שם עמוד","description":"מה, למה, איך — ספציפי","percentage":30,"examples":["דוגמה מפורטת לפוסט אמיתי 1","דוגמה 2","דוגמה 3"]},{"name":"שם","description":"תיאור","percentage":25,"examples":["דוגמה 1","דוגמה 2"]},{"name":"שם","description":"תיאור","percentage":25,"examples":["דוגמה 1","דוגמה 2"]},{"name":"שם","description":"תיאור","percentage":20,"examples":["דוגמה 1","דוגמה 2"]}],"weeklyPlan":[{"week":1,"theme":"נושא שבוע — ספציפי ומעניין","objective":"מה השבוע הזה אמור להשיג","posts":[{"day":"ראשון","platform":"Instagram","type":"ריל","topic":"נושא ספציפי","caption":"קאפשן מלא, מותאם לטון ${form.tone}, עם hook חזק בשורה ראשונה, סיפור, וCTA ברור 🎯 — לפחות 4 שורות","hashtags":"#tag_ספציפי_לתחום #tag2 #tag3 #tag4 #tag5","time":"19:00","visualDirection":"תיאור מדויק: זווית המצלמה, תאורה, צבעים, פרופס, מיקום, אווירה, מה בפריים ומה לא","contentTip":"טיפ מקצועי ספציפי לפוסט הזה"},{"day":"שלישי","platform":"Instagram","type":"קרוסלה","topic":"נושא","caption":"קאפשן מלא מותאם","hashtags":"#tags","time":"12:00","visualDirection":"תיאור ויזואלי מלא","contentTip":"טיפ"},{"day":"חמישי","platform":"${form.platforms[0]||'Facebook'}","type":"פוסט","topic":"נושא","caption":"קאפשן מלא","hashtags":"#tags","time":"17:00","visualDirection":"תיאור","contentTip":"טיפ"}]},{"week":2,"theme":"נושא שבוע 2","objective":"מטרת השבוע","posts":[{"day":"שני","platform":"Instagram","type":"סטורי","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"09:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"רביעי","platform":"${form.platforms.includes('tiktok')?'TikTok':'Instagram'}","type":"ריל","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"20:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"שישי","platform":"${form.platforms.includes('linkedin')?'LinkedIn':'Facebook'}","type":"פוסט","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"08:00","visualDirection":"תיאור","contentTip":"טיפ"}]},{"week":3,"theme":"נושא שבוע 3","objective":"מטרת השבוע","posts":[{"day":"ראשון","platform":"Instagram","type":"ריל","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"19:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"שלישי","platform":"Facebook","type":"פוסט","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"12:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"חמישי","platform":"Instagram","type":"קרוסלה","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"17:00","visualDirection":"תיאור","contentTip":"טיפ"}]},{"week":4,"theme":"נושא שבוע 4","objective":"מטרת השבוע","posts":[{"day":"שני","platform":"Instagram","type":"סטורי","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"09:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"רביעי","platform":"${form.platforms.includes('tiktok')?'TikTok':'Instagram'}","type":"ריל","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"20:00","visualDirection":"תיאור","contentTip":"טיפ"},{"day":"שבת","platform":"Instagram","type":"פוסט","topic":"נושא","caption":"קאפשן","hashtags":"#tags","time":"18:00","visualDirection":"תיאור","contentTip":"טיפ"}]}],"kpis":[{"metric":"Engagement Rate","target":"מעל 5%","timeframe":"30 ימים"},{"metric":"Reach","target":"גידול 20%","timeframe":"30 ימים"},{"metric":"Website Clicks","target":"גידול 15%","timeframe":"30 ימים"},{"metric":"Followers Growth","target":"גידול 10%","timeframe":"30 ימים"}],"hashtags":{"primary":["#hashtag_ספציפי_לתחום_1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"],"secondary":["#hashtag6","#hashtag7","#hashtag8"],"campaign":["#campaign_ייחודי_ללקוח"]},"quickWins":["פעולה ספציפית שניתן לבצע השבוע + תוצאה צפויה","פעולה 2 + ROI","פעולה 3","פעולה 4"],"brandVoice":{"tagline":"סלוגן 5-7 מילים שאי אפשר לשכוח","vision":"חזון 2 משפטים","mission":"מיסיון 2 משפטים","keywords":["מילה1","מילה2","מילה3","מילה4","מילה5","מילה6"],"suggestedColors":["#hex1","#hex2","#hex3","#hex4","#hex5"],"colorRationale":"למה הצבעים האלה מתאימים לזהות המותג","doList":["עשה 1 — ספציפי","עשה 2","עשה 3","עשה 4"],"dontList":["אל תעשה 1 — ספציפי","אל תעשה 2","אל תעשה 3"]},"profileOptimization":{"bioTemplate":"ביו מוכן לשימוש — עד 150 תווים, עם CTA ו-value proposition","storyHighlights":["שם הייליט 1","שם הייליט 2","שם הייליט 3","שם הייליט 4"],"profileTips":["טיפ ספציפי לפרופיל 1","טיפ 2","טיפ 3"]}}`
}

/* ── Color Picker ────────────────────────────── */
function ColorPicker({ colors, onChange }) {
  const PRESETS = ['#1C1C1C','#FFFFFF','#F7F4EF','#E8E1D8','#BFB3A6','#A68B7D','#B49A74','#6D5C4E','#5E685E','#445246','#6D7B6C','#4A7C8E','#2D6A7A','#8E4A5A','#C4818F','#4A1E2A','#8C5E3C','#C4956A']
  const [showPresets, setShowPresets] = useState(false)
  return (
    <div style={{position:'relative'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        {colors.map((c,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <input type="color" value={c} onChange={e=>{const n=[...colors];n[i]=e.target.value;onChange(n)}}
              style={{width:40,height:40,borderRadius:10,border:`2px solid rgba(0,0,0,0.1)`,cursor:'pointer',padding:2}}/>
            <span style={{...sans,fontSize:8,color:G.muted}}>{c.toUpperCase()}</span>
          </div>
        ))}
        <button onClick={()=>setShowPresets(v=>!v)}
          style={{width:40,height:40,borderRadius:10,border:`2px dashed ${G.border}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:G.muted}}>
          <Plus size={14}/>
        </button>
      </div>
      {showPresets&&(
        <div style={{position:'absolute',top:'100%',right:0,zIndex:100,background:G.white,borderRadius:12,border:`1px solid ${G.border}`,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',padding:14,marginTop:6,width:200}}>
          <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.1em'}}>צבעים מוכנים</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {PRESETS.map(c=>(
              <button key={c} onClick={()=>{if(colors.length<7)onChange([...colors,c]);setShowPresets(false)}}
                style={{width:26,height:26,borderRadius:6,background:c,border:'1px solid rgba(0,0,0,0.1)',cursor:'pointer'}} title={c}/>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function AIStrategy() {
  const ctx  = useOutletContext()||{}
  const isHe = (ctx.lang||'he')!=='en'

  const [clients,      setClients]      = useState([])
  const [activeClient, setActiveClient] = useState(null)
  const [activeTab,    setActiveTab]    = useState('intake')
  const [loading,      setLoading]      = useState(false)
  const [loadingMsg,   setLoadingMsg]   = useState('')
  const [toast,        setToast]        = useState(null)
  const [strategy,     setStrategy]     = useState(null)
  const [copied,       setCopied]       = useState(false)
  const [mediaFiles,   setMediaFiles]   = useState([])
  const fileRef = useRef()

  const defaultForm = {
    businessName:'',businessType:'',description:'',uniqueValue:'',
    competitors:'',challenges:'',targetAge:'',targetGender:'all',
    targetLocation:'',targetInterests:'',goals:[],platforms:[],
    budget:'',postsPerWeek:'5',tone:'luxury',additionalNotes:'',
  }
  const [form, setForm] = useState(defaultForm)

  const defaultBrand = {
    customColors:['#5E685E','#B49A74','#E8E1D8','#F7F4EF','#445246'],
    font:FONTS[0],tagline:'',vision:'',mission:'',
    keywords:[],doList:[],dontList:[],
  }
  const [brand, setBrand] = useState(defaultBrand)

  /* ── Load clients ────────────────────────── */
  useEffect(()=>{
    setClients(getClients())
    const handler = ()=>setClients(getClients())
    window.addEventListener('storage', handler)
    return ()=>window.removeEventListener('storage', handler)
  },[])

  /* ── Load per client ─────────────────────── */
  useEffect(()=>{
    if (!activeClient) return
    const brief = getBriefDB(activeClient.id)
    if (Object.keys(brief).length>0) setForm({...defaultForm,...brief})
    else setForm({...defaultForm,businessName:activeClient.name||''})
    const s = getStrategyDB(activeClient.id)
    setStrategy(s)
    const b = getBrandDB(activeClient.id)
    if (Object.keys(b).length>0) setBrand({...defaultBrand,...b})
    else setBrand({...defaultBrand,customColors:[...defaultBrand.customColors]})
    setMediaFiles(getClientFiles(activeClient.id).filter(f=>f.type?.startsWith('image/')).slice(0,15))
  },[activeClient])

  /* ── Form helpers ────────────────────────── */
  function setF(k,v) {
    const nf = {...form,[k]:v}
    setForm(nf)
    if (activeClient) saveBriefDB(activeClient.id, nf)
  }
  function toggleArr(key,val) {
    const nf = {...form,[key]:form[key].includes(val)?form[key].filter(x=>x!==val):[...form[key],val]}
    setForm(nf)
    if (activeClient) saveBriefDB(activeClient.id, nf)
  }

  function showToast(msg,type='success') { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  /* ── Upload media ────────────────────────── */
  function handleUpload(fileList) {
    const arr = Array.from(fileList).slice(0, 15 - mediaFiles.length)
    if (!arr.length) return
    const clientId = activeClient.id
    const results = []
    let done = 0

    arr.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = e => {
        results[idx] = {
          id:       `f_${Date.now()}_${idx}_${Math.random().toString(36).slice(2,7)}`,
          name:     file.name,
          type:     file.type,
          size:     file.size,
          data:     e.target.result,
          clientId: clientId,
          savedAt:  new Date().toISOString(),
        }
        done++
        if (done === arr.length) {
          // All files read — save atomically
          const curr = rj(`files_${clientId}`) || []
          const updated = [...results.filter(Boolean), ...curr]
          wj(`files_${clientId}`, updated)
          setMediaFiles(updated.slice(0, 15))
          showToast(isHe ? `${arr.length} קבצים נשמרו במאגר ✅` : `${arr.length} files saved ✅`)
          window.dispatchEvent(new StorageEvent('storage', {key:'__sync__'}))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function deleteMedia(fid) {
    const curr = (rj(`files_${activeClient.id}`) || []).filter(f => f.id !== fid)
    wj(`files_${activeClient.id}`, curr)
    setMediaFiles(curr.slice(0, 15))
    showToast(isHe ? 'קובץ נמחק' : 'File deleted')
  }

  /* ── Generate strategy ───────────────────── */
  async function generateStrategy() {
    if (!form.businessName||!form.businessType||!form.goals.length||!form.platforms.length) {
      showToast(isHe?'מלאי את כל השדות המסומנים *':'Fill all required fields *','error'); return
    }
    setLoading(true)
    const msgs = [
      '🔍 מנתח שוק ומתחרים...',
      '🎯 בונה מיצוב מותגי...',
      '✍️ יוצר תכנית תוכן חודשית...',
      '🎨 מעצב שפת מותג...',
      '📊 מגדיר KPIs...',
      isHe&&mediaFiles.length>0 ? `🖼️ משלב ${mediaFiles.length} חומרי מדיה בפיד...` : '✨ מסיים...',
    ]
    let mi = 0
    setLoadingMsg(msgs[0])
    const interval = setInterval(()=>{ mi=(mi+1)%msgs.length; setLoadingMsg(msgs[mi]) },2500)

    try {
      const raw    = await callGemini(buildPrompt(form))
      const parsed = safeParseJSON(raw)
      clearInterval(interval)

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('תגובת AI לא תקינה — נסי שוב')
      }

      const result = {...parsed, generatedAt:new Date().toISOString(), clientId:activeClient.id}
      setStrategy(result)
      saveStrategyDB(activeClient.id, result)

      // Auto update brand from AI
      if (parsed.brandVoice) {
        const nb = {
          ...brand,
          tagline:  parsed.brandVoice.tagline||brand.tagline,
          vision:   parsed.brandVoice.vision||brand.vision,
          mission:  parsed.brandVoice.mission||brand.mission,
          keywords: parsed.brandVoice.keywords||brand.keywords,
          doList:   parsed.brandVoice.doList||brand.doList,
          dontList: parsed.brandVoice.dontList||brand.dontList,
          customColors: parsed.brandVoice.suggestedColors?.length>=4 ? parsed.brandVoice.suggestedColors : brand.customColors,
        }
        setBrand(nb)
        saveBrandDB(activeClient.id, nb)
      }

      setActiveTab('strategy')
      showToast(isHe?'✨ האסטרטגיה נוצרה ומסונכרנת!':'✨ Strategy created & synced!')
    } catch(e) {
      clearInterval(interval)
      showToast((isHe?'שגיאה: ':'Error: ')+e.message,'error')
    }
    setLoading(false); setLoadingMsg('')
  }

  /* ── Generate brand AI ───────────────────── */
  async function generateBrandAI() {
    if (!form.businessName) { showToast(isHe?'מלאי שם עסק':'Enter business name','error'); return }
    setLoading(true); setLoadingMsg('🎨 בונה שפת מותג...')
    try {
      const raw = await callGemini(
        `מומחה מיתוג בינלאומי. צור זהות מותג עבור: "${form.businessName}" — ${form.businessType}.
        Return ONLY valid JSON, no text, no backticks:
        {"tagline":"סלוגן 5-8 מילים","vision":"חזון 2 משפטים","mission":"מיסיון 2 משפטים","keywords":["מ1","מ2","מ3","מ4","מ5"],"suggestedColors":["#hex1","#hex2","#hex3","#hex4","#hex5"],"doList":["עשה 1","עשה 2","עשה 3"],"dontList":["אל תעשה 1","אל תעשה 2"]}`
      )
      const parsed = safeParseJSON(raw)
      if (!parsed) throw new Error('תגובה לא תקינה')
      const nb = {
        ...brand, ...parsed,
        customColors: parsed.suggestedColors?.length>=4 ? parsed.suggestedColors : brand.customColors,
      }
      setBrand(nb)
      saveBrandDB(activeClient.id, nb)
      showToast(isHe?'✨ שפת המותג נוצרה!':'✨ Brand identity created!')
    } catch(e) { showToast((isHe?'שגיאה: ':'Error: ')+e.message,'error') }
    setLoading(false); setLoadingMsg('')
  }

  function saveBrandData() { saveBrandDB(activeClient.id,brand); showToast(isHe?'נשמר ✅':'Saved ✅') }

  function copyAll() {
    navigator.clipboard.writeText(JSON.stringify(strategy,null,2))
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  /* ── Style helpers ───────────────────────── */
  const inp  = {...sans,padding:'10px 14px',borderRadius:10,fontSize:13,border:`1.5px solid ${G.border}`,background:G.ivory,color:G.text,outline:'none',width:'100%',boxSizing:'border-box'}
  const card = (x={})=>({background:G.white,borderRadius:16,border:`1px solid ${G.border}`,boxShadow:'0 2px 12px rgba(94,104,94,0.06)',...x})
  const SL   = ({icon,text})=>(
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
      <span style={{fontSize:16}}>{icon}</span>
      <h3 style={{...serif,fontSize:18,color:G.text,margin:0,fontWeight:400}}>{text}</h3>
    </div>
  )
  const FL = ({text,req})=>(
    <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
      {text}{req&&<span style={{color:'#dc2626',marginInlineStart:3}}>*</span>}
    </p>
  )

  /* ── No client ───────────────────────────── */
  if (!activeClient) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',gap:20,direction:isHe?'rtl':'ltr',...sans}}>
      <div style={{fontSize:64}}>🧠</div>
      <h2 style={{...serif,fontSize:32,color:G.text,margin:0}}>{isHe?'סוכן אסטרטגיה AI':'AI Strategy Agent'}</h2>
      <p style={{...sans,fontSize:14,color:G.muted,maxWidth:440,textAlign:'center',lineHeight:1.8}}>
        {isHe?'בחרי לקוח לבניית אסטרטגיית שיווק חודשית ברמה בינלאומית':'Select a client to build a world-class monthly marketing strategy'}
      </p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
        {clients.map((c,i)=>{
          const colors=['#5E685E','#B49A74','#8E6B5A','#4A7C8E','#7A6E8E','#8E4A5A']
          const color=colors[i%colors.length]
          return (
            <button key={c.id} onClick={()=>setActiveClient(c)}
              style={{...sans,display:'flex',alignItems:'center',gap:10,padding:'14px 22px',borderRadius:14,border:`2px solid ${color}30`,background:`${color}10`,cursor:'pointer',color:G.text,fontSize:13,fontWeight:600,transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
              <div style={{width:36,height:36,borderRadius:10,background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:15}}>{c.name.charAt(0)}</div>
              <div style={{textAlign:'start'}}>
                <div>{c.name}</div>
                <div style={{fontSize:9,color:G.muted,marginTop:1}}>
                  {getStrategyDB(c.id)&&<span style={{color:color,fontWeight:700}}>✓ אסטרטגיה  </span>}
                  {Object.keys(getBriefDB(c.id)).length>0&&<span>✓ בריף שמור</span>}
                </div>
              </div>
            </button>
          )
        })}
        {clients.length===0&&<p style={{...sans,fontSize:13,color:G.muted}}>הוסיפי לקוחות בדאשבורד תחילה</p>}
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:G.ivory,direction:isHe?'rtl':'ltr',...sans}}>

      {/* TOP BAR */}
      <div style={{background:G.white,borderBottom:`1px solid ${G.border}`,padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',flexShrink:0}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {clients.map((c,i)=>{
            const colors=['#5E685E','#B49A74','#8E6B5A','#4A7C8E']
            const color=colors[i%colors.length]
            const isAct=activeClient?.id===c.id
            return (
              <button key={c.id} onClick={()=>setActiveClient(c)}
                style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'6px 13px',borderRadius:20,border:`1.5px solid ${isAct?color:G.border}`,background:isAct?`${color}15`:G.white,color:isAct?color:G.muted,fontSize:12,fontWeight:isAct?700:400,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{width:18,height:18,borderRadius:5,background:color,color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{c.name.charAt(0)}</div>
                {c.name}
              </button>
            )
          })}
        </div>
        <div style={{flex:1}}/>

        {/* Tabs */}
        <div style={{display:'flex',gap:2,background:G.ivory,borderRadius:10,padding:3,border:`1px solid ${G.border}`}}>
          {[
            {id:'intake',  icon:'📋',he:'בריף לקוח',  en:'Brief'},
            {id:'brand',   icon:'🎨',he:'שפת מותג',   en:'Brand'},
            {id:'media',   icon:'🖼️', he:'מדיה',       en:'Media'},
            {id:'strategy',icon:'🧠',he:'אסטרטגיה',   en:'Strategy', disabled:!strategy},
            {id:'calendar',icon:'📅',he:'לוח תוכן',   en:'Content',  disabled:!strategy},
          ].map(t=>(
            <button key={t.id} onClick={()=>!t.disabled&&setActiveTab(t.id)}
              style={{...sans,padding:'6px 12px',borderRadius:8,border:'none',background:activeTab===t.id?G.smoke:'transparent',color:activeTab===t.id?'#fff':t.disabled?`${G.muted}40`:G.muted,fontSize:11,fontWeight:activeTab===t.id?700:400,cursor:t.disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
              {t.icon} {isHe?t.he:t.en}
              {t.id==='strategy'&&strategy&&<span style={{width:6,height:6,borderRadius:'50%',background:'#4CAF50',display:'inline-block',marginInlineStart:2}}/>}
            </button>
          ))}
        </div>

        {strategy&&(
          <button onClick={copyAll} style={{...sans,display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:9,border:`1px solid ${G.border}`,background:G.white,color:G.muted,fontSize:11,cursor:'pointer'}}>
            {copied?<><Check size={10} color="#4CAF50"/>הועתק</>:<><Copy size={10}/>העתק</>}
          </button>
        )}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'24px'}}>

        {/* ════ INTAKE ════ */}
        {activeTab==='intake'&&(
          <div style={{maxWidth:860,margin:'0 auto',display:'flex',flexDirection:'column',gap:18}}>

            {/* Header card */}
            <div style={{...card(),padding:'22px 28px',borderRight:isHe?`4px solid ${G.smoke}`:'none',borderLeft:isHe?'none':`4px solid ${G.smoke}`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                <Sparkles size={20} color={G.gold}/>
                <h2 style={{...serif,fontSize:24,color:G.text,margin:0}}>{isHe?`בריף אסטרטגי — ${activeClient.name}`:`Strategic Brief — ${activeClient.name}`}</h2>
                {getBriefDB(activeClient.id)?.businessName&&(
                  <span style={{...sans,fontSize:10,padding:'3px 9px',borderRadius:20,background:`${G.smoke}12`,color:G.smoke,marginInlineStart:'auto'}}>✓ {isHe?'נשמר אוטומטית':'Auto-saved'}</span>
                )}
              </div>
              <p style={{...sans,fontSize:13,color:G.muted,lineHeight:1.7}}>{isHe?'מלאי את הפרטים — הסוכן יבנה תכנית שיווק מקצועית ומדויקת. הנתונים נשמרים אוטומטית.':'Fill in the details — the agent will build a professional strategy. Data saves automatically.'}</p>
            </div>

            {/* Business details */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="🏢" text={isHe?'פרטי העסק':'Business Details'}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><FL text={isHe?'שם העסק':'Business Name'} req/><input value={form.businessName} onChange={e=>setF('businessName',e.target.value)} placeholder="Villa Masai..." style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'סוג עסק / תעשייה':'Industry'} req/><input value={form.businessType} onChange={e=>setF('businessType',e.target.value)} placeholder={isHe?'מלון בוטיק, מסעדה...':'Boutique hotel...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div style={{gridColumn:'span 2'}}><FL text={isHe?'תיאור מפורט':'Description'} req/><textarea value={form.description} onChange={e=>setF('description',e.target.value)} rows={3} placeholder={isHe?'ספרי על העסק, הערכים, המוצרים/שירותים, האווירה...':'Describe the business, values, products/services, atmosphere...'} style={{...inp,resize:'vertical'}} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'ערך ייחודי (USP)':'Unique Value'} req/><input value={form.uniqueValue} onChange={e=>setF('uniqueValue',e.target.value)} placeholder={isHe?'מה מבדיל אתכם לחלוטין?':'What makes you truly unique?'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'מתחרים עיקריים':'Competitors'}/><input value={form.competitors} onChange={e=>setF('competitors',e.target.value)} placeholder={isHe?'שמות מתחרים...':'Competitor names...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
              </div>
            </div>

            {/* Audience */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="👥" text={isHe?'קהל יעד':'Target Audience'}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div><FL text={isHe?'טווח גיל':'Age'}/><input value={form.targetAge} onChange={e=>setF('targetAge',e.target.value)} placeholder="25-45" style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'מגדר':'Gender'}/><select value={form.targetGender} onChange={e=>setF('targetGender',e.target.value)} style={inp}><option value="all">{isHe?'כל המגדרים':'All'}</option><option value="female">{isHe?'נשים':'Female'}</option><option value="male">{isHe?'גברים':'Male'}</option></select></div>
                <div><FL text={isHe?'מיקום':'Location'}/><input value={form.targetLocation} onChange={e=>setF('targetLocation',e.target.value)} placeholder={isHe?'ישראל, אירופה...':'Israel, Europe...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div style={{gridColumn:'span 3'}}><FL text={isHe?'תחומי עניין ואורח חיים':'Interests & Lifestyle'}/><input value={form.targetInterests} onChange={e=>setF('targetInterests',e.target.value)} placeholder={isHe?'טיולים, יוקרה, בריאות, מסעדות, עיצוב...':'Travel, luxury, wellness, dining, design...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
              </div>
            </div>

            {/* Goals */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="🎯" text={isHe?'מטרות שיווק':'Marketing Goals'}/>
              <FL text={isHe?'בחרי עד 3 מטרות עיקריות':'Select up to 3 goals'} req/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {GOALS.map(g=>{
                  const act=form.goals.includes(g.id)
                  return(
                    <button key={g.id} onClick={()=>toggleArr('goals',g.id)}
                      style={{...sans,padding:'12px 14px',borderRadius:12,border:`2px solid ${act?G.smoke:G.border}`,background:act?`${G.smoke}12`:G.white,color:act?G.smoke:G.muted,fontSize:12,fontWeight:act?700:400,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:18}}>{g.icon}</span><span>{isHe?g.he:g.en}</span>
                      {act&&<Check size={11} style={{marginInlineStart:'auto'}}/>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Platforms */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="📱" text={isHe?'פלטפורמות ותדירות':'Platforms & Frequency'}/>
              <FL text={isHe?'פלטפורמות פעילות':'Active Platforms'} req/>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                {PLATFORMS_LIST.map(p=>{
                  const act=form.platforms.includes(p.id)
                  return(
                    <button key={p.id} onClick={()=>toggleArr('platforms',p.id)}
                      style={{...sans,display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:20,border:`1.5px solid ${act?G.smoke:G.border}`,background:act?G.smoke:G.white,color:act?'#fff':G.muted,fontSize:12,fontWeight:act?600:400,cursor:'pointer',transition:'all 0.15s'}}>
                      <span style={{fontSize:14}}>{p.icon}</span>{p.label}
                    </button>
                  )
                })}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div><FL text={isHe?'פוסטים/שבוע':'Posts/Week'}/><select value={form.postsPerWeek} onChange={e=>setF('postsPerWeek',e.target.value)} style={inp}>{['3','4','5','6','7','10','14'].map(n=><option key={n} value={n}>{n} {isHe?'פוסטים':'posts'}</option>)}</select></div>
                <div><FL text={isHe?'תקציב חודשי':'Budget'}/><input value={form.budget} onChange={e=>setF('budget',e.target.value)} placeholder="₪3,000-₪15,000" style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'אתגרים':'Challenges'}/><input value={form.challenges} onChange={e=>setF('challenges',e.target.value)} placeholder={isHe?'מה מונע צמיחה?':'What prevents growth?'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
              </div>
            </div>

            {/* Tone */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="🗣️" text={isHe?'טון ושפה':'Tone & Voice'}/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                {TONES.map(t=>{
                  const act=form.tone===t.id
                  return(
                    <button key={t.id} onClick={()=>setF('tone',t.id)}
                      style={{...sans,padding:'11px 14px',borderRadius:12,border:`2px solid ${act?G.smoke:G.border}`,background:act?`${G.smoke}12`:G.white,color:act?G.smoke:G.muted,fontSize:12,fontWeight:act?700:400,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:18}}>{t.icon}</span><span>{isHe?t.he:t.en}</span>
                      {act&&<Check size={11} style={{marginInlineStart:'auto'}}/>}
                    </button>
                  )
                })}
              </div>
              <div><FL text={isHe?'הערות נוספות':'Additional Notes'}/><textarea value={form.additionalNotes} onChange={e=>setF('additionalNotes',e.target.value)} rows={2} placeholder={isHe?'כל מידע נוסף חשוב...':'Any other important details...'} style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
            </div>

            {/* Generate */}
            <button onClick={generateStrategy} disabled={loading}
              style={{...sans,width:'100%',padding:'16px',borderRadius:14,border:'none',background:loading?'rgba(94,104,94,0.4)':`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'wait':'pointer',boxShadow:'0 4px 20px rgba(94,104,94,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
              {loading
                ? <><div style={{width:18,height:18,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.8s linear infinite'}}/>{loadingMsg}</>
                : <><Sparkles size={18}/>✨ {isHe?'צרי אסטרטגיה AI ברמה בינלאומית':'Generate World-Class AI Strategy'}</>
              }
            </button>
          </div>
        )}

        {/* ════ BRAND ════ */}
        {activeTab==='brand'&&(
          <div style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:18}}>
            <div style={{...card(),padding:'22px 28px',borderRight:isHe?`4px solid ${G.gold}`:'none',borderLeft:isHe?'none':`4px solid ${G.gold}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <Sparkles size={20} color={G.gold}/>
                  <h2 style={{...serif,fontSize:24,color:G.text,margin:0}}>{isHe?`שפת מותג — ${activeClient.name}`:`Brand Identity — ${activeClient.name}`}</h2>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={generateBrandAI} disabled={loading} style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:`1.5px solid ${G.gold}`,background:`${G.gold}10`,color:G.gold,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    <Sparkles size={11}/>{isHe?'AI מותג':'AI Brand'}
                  </button>
                  <button onClick={saveBrandData} style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:'none',background:G.smoke,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    <Save size={11}/>{isHe?'שמור':'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Color Palette - Canva style */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="🎨" text={isHe?'פלטת צבעי מותג':'Brand Colors'}/>
              <p style={{...sans,fontSize:12,color:G.muted,marginBottom:14,lineHeight:1.6}}>{isHe?'לחצי על צבע לשינוי. לחצי + להוספת צבע חדש. הסוכן ממליץ על צבעים לאחר יצירת האסטרטגיה.':'Click to change, + to add. The agent recommends colors after generating the strategy.'}</p>
              <ColorPicker colors={brand.customColors} onChange={c=>setBrand(b=>({...b,customColors:c}))}/>
              {brand.customColors.length>0&&(
                <div style={{marginTop:16,borderRadius:10,overflow:'hidden',height:32,display:'flex'}}>
                  {brand.customColors.map((c,i)=><div key={i} style={{flex:1,background:c}} title={c}/>)}
                </div>
              )}
            </div>

            {/* Typography */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="✏️" text={isHe?'טיפוגרפיה':'Typography'}/>
              {/* Font category filter */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {['הכל','serif','sans','display','hebrew'].map(cat=>(
                  <button key={cat} onClick={()=>setFontFilter&&setFontFilter(cat)}
                    style={{...sans,padding:'4px 12px',borderRadius:20,border:`1px solid ${G.border}`,background:G.ivory,color:G.smoke,fontSize:10,cursor:'pointer'}}>
                    {cat==='הכל'?'הכל':cat}
                  </button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,maxHeight:360,overflowY:'auto'}}>
                {FONTS.map((f,i)=>(
                  <button key={i} onClick={()=>setBrand(b=>({...b,font:f}))}
                    style={{...sans,padding:'12px',borderRadius:12,border:`2px solid ${brand.font?.heading===f.heading?G.smoke:G.border}`,background:brand.font?.heading===f.heading?`${G.smoke}08`:G.white,cursor:'pointer',textAlign:'start',transition:'all 0.15s'}}>
                    <p style={{fontFamily:f.heading+',serif',fontSize:15,color:G.text,margin:'0 0 3px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.heading}</p>
                    <p style={{...sans,fontSize:9,color:G.muted,margin:'0 0 5px'}}>{f.label}</p>
                    <p style={{fontFamily:f.heading+',serif',fontSize:12,color:G.smoke,margin:0,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeClient?.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Voice */}
            <div style={{...card(),padding:'22px 28px'}}>
              <SL icon="💬" text={isHe?'קול מותג':'Brand Voice'}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div><FL text={isHe?'סלוגן / טאגליין':'Tagline'}/><input value={brand.tagline||''} onChange={e=>setBrand(b=>({...b,tagline:e.target.value}))} placeholder={isHe?'5-8 מילים חדות...':'5-8 sharp words...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'מילות מפתח':'Keywords'}/><input value={(brand.keywords||[]).join(', ')} onChange={e=>setBrand(b=>({...b,keywords:e.target.value.split(',').map(k=>k.trim())}))} placeholder={isHe?'יוקרה, חוויה, שקט...':'luxury, experience...'} style={inp} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'חזון':'Vision'}/><textarea value={brand.vision||''} onChange={e=>setBrand(b=>({...b,vision:e.target.value}))} rows={2} style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text={isHe?'מיסיון':'Mission'}/><textarea value={brand.mission||''} onChange={e=>setBrand(b=>({...b,mission:e.target.value}))} rows={2} style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><FL text="✅ DO"/><textarea value={(brand.doList||[]).join('\n')} onChange={e=>setBrand(b=>({...b,doList:e.target.value.split('\n')}))} rows={4} placeholder={isHe?'שימוש בשפה חמה...\nסיפורי לקוחות...':'Warm language...'} style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor='#4CAF50'} onBlur={e=>e.target.style.borderColor=G.border}/></div>
                <div><FL text="❌ DON'T"/><textarea value={(brand.dontList||[]).join('\n')} onChange={e=>setBrand(b=>({...b,dontList:e.target.value.split('\n')}))} rows={4} placeholder={isHe?'שפה רשמית קרה...\nתוכן ללא עריכה...':'Cold language...'} style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor=G.border}/></div>
              </div>
            </div>
          </div>
        )}

        {/* ════ MEDIA ════ */}
        {activeTab==='media'&&(
          <div style={{maxWidth:860,margin:'0 auto',display:'flex',flexDirection:'column',gap:18}}>

            <div style={{...card(),padding:'22px 28px',borderRight:isHe?`4px solid ${G.smoke}`:'none',borderLeft:isHe?'none':`4px solid ${G.smoke}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:20}}>🖼️</span>
                  <h2 style={{...serif,fontSize:22,color:G.text,margin:0}}>{isHe?`מאגר מדיה — ${activeClient.name}`:`Media Library — ${activeClient.name}`}</h2>
                </div>
                <span style={{...sans,fontSize:11,color:G.muted}}>{mediaFiles.length}/15 {isHe?'קבצים':'files'}</span>
              </div>
              <p style={{...sans,fontSize:13,color:G.muted,lineHeight:1.7}}>{isHe?'העלי עד 15 חומרים — הסוכן ישתמש בהם לבניית תכנית תוכן מדויקת, ולאחר יצירת האסטרטגיה הם יסודרו אוטומטית בפיד לפי שפת המותג.':'Upload up to 15 assets — the agent uses them to build an accurate content plan and auto-arranges them in the feed by brand identity.'}</p>
            </div>

            {/* Drop zone */}
            <div style={{...card(),padding:0,overflow:'hidden'}}>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/pdf" style={{display:'none'}} onChange={e=>handleUpload(e.target.files)}/>
              <div
                style={{padding:'32px',textAlign:'center',cursor:'pointer',background:G.ivory,transition:'all 0.15s'}}
                onClick={()=>fileRef.current?.click()}
                onDrop={e=>{e.preventDefault();handleUpload(e.dataTransfer.files)}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.background=`${G.smoke}08`}}
                onDragLeave={e=>{e.currentTarget.style.background=G.ivory}}>
                <div style={{fontSize:40,marginBottom:10}}>📁</div>
                <p style={{...sans,fontSize:14,fontWeight:600,color:G.smoke,marginBottom:4}}>{isHe?'לחצי להעלאה או גרירת קבצים':'Click to upload or drag files'}</p>
                <p style={{...sans,fontSize:12,color:G.muted}}>{isHe?'תמונות, ויאוס, PDF — ניתן להעלות כמה קבצים ביחד':'Images, videos, PDFs — upload multiple at once'}</p>
              </div>
            </div>

            {/* Media grid */}
            {mediaFiles.length > 0 && (
              <div style={{...card(),padding:'22px 28px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <p style={{...serif,fontSize:18,color:G.text,margin:0}}>{isHe?'החומרים שהועלו':'Uploaded Assets'}</p>
                  <p style={{...sans,fontSize:11,color:G.muted}}>{isHe?'הסוכן ישתמש בחומרים אלו לבניית הפיד':'Agent will use these to build the feed'}</p>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                  {mediaFiles.map((f,i) => (
                    <div key={f.id}
                      style={{position:'relative',borderRadius:12,overflow:'hidden',background:G.cream,border:`1px solid ${G.border}`,cursor:'pointer'}}
                      onMouseEnter={e=>{const ov=e.currentTarget.querySelector('.ov');if(ov)ov.style.opacity='1'}}
                      onMouseLeave={e=>{const ov=e.currentTarget.querySelector('.ov');if(ov)ov.style.opacity='0'}}>
                      {/* Preview */}
                      <div style={{aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                        {f.type?.startsWith('image/')
                          ? <img src={f.data} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : f.type?.startsWith('video/')
                          ? <div style={{width:'100%',height:'100%',background:'#111',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                              <span style={{fontSize:32}}>🎬</span>
                              <span style={{...sans,fontSize:9,color:'rgba(255,255,255,0.7)'}}>VIDEO</span>
                            </div>
                          : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                              <span style={{fontSize:32}}>📄</span>
                              <span style={{...sans,fontSize:9,color:G.muted}}>{f.type?.split('/')[1]?.toUpperCase()}</span>
                            </div>
                        }
                      </div>
                      {/* Name */}
                      <div style={{padding:'6px 8px',borderTop:`1px solid ${G.border}`}}>
                        <p style={{...sans,fontSize:9,color:G.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                        {f.size && <p style={{...sans,fontSize:8,color:G.muted}}>{(f.size/1024).toFixed(0)} KB</p>}
                      </div>
                      {/* Always visible delete button */}
                      <button onClick={e=>{e.stopPropagation();deleteMedia(f.id)}}
                        style={{position:'absolute',top:4,left:isHe?4:'auto',right:isHe?'auto':4,width:22,height:22,borderRadius:'50%',border:'none',background:'rgba(220,38,38,0.85)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,zIndex:2}}
                        title={isHe?'מחק':'Delete'}>
                        ×
                      </button>
                      {/* Index badge */}
                      <div style={{position:'absolute',top:6,right:isHe?6:'auto',left:isHe?'auto':6,width:20,height:20,borderRadius:'50%',background:G.smoke,display:'flex',alignItems:'center',justifyContent:'center',...sans,fontSize:10,fontWeight:700,color:'#fff'}}>
                        {i+1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Brand preview */}
                {getBrandDB(activeClient.id)?.customColors?.length > 0 && (
                  <div style={{marginTop:16,padding:'12px 14px',borderRadius:10,background:`${G.smoke}06`,border:`1px solid ${G.smoke}15`}}>
                    <p style={{...sans,fontSize:10,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{isHe?'שפת מותג לפיד':'Brand identity for feed'}</p>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {getBrandDB(activeClient.id).customColors.map((c,i)=>(
                        <div key={i} style={{width:24,height:24,borderRadius:6,background:c,border:'1px solid rgba(0,0,0,0.1)'}} title={c}/>
                      ))}
                      {getBrandDB(activeClient.id).font?.heading && (
                        <span style={{...sans,fontSize:11,color:G.muted,marginInlineStart:8,fontStyle:'italic'}}>{getBrandDB(activeClient.id).font.heading}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate button */}
            <button onClick={generateStrategy} disabled={loading||!form.businessName}
              style={{...sans,width:'100%',padding:'14px',borderRadius:12,border:'none',background:form.businessName?`linear-gradient(135deg,${G.smokeDark},${G.smoke})`:'rgba(94,104,94,0.3)',color:'#fff',fontSize:14,fontWeight:700,cursor:form.businessName?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              {loading
                ? <><div style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.8s linear infinite'}}/>{loadingMsg}</>
                : <><Sparkles size={16}/>{isHe?`✨ צרי אסטרטגיה עם ${mediaFiles.length} חומרי מדיה`:`✨ Generate Strategy with ${mediaFiles.length} media assets`}</>
              }
            </button>

            {mediaFiles.length === 0 && (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <p style={{...sans,fontSize:12,color:G.muted}}>{isHe?'💡 טיפ: העלאת חומרים מגדילה את דיוק האסטרטגיה ומאפשרת לסוכן לבנות פיד מותאם אישית':'💡 Tip: Uploading assets increases strategy accuracy and lets the agent build a personalized feed'}</p>
              </div>
            )}
          </div>
        )}

        {/* ════ STRATEGY ════ */}
        {activeTab==='strategy'&&strategy&&(
          <div style={{maxWidth:920,margin:'0 auto',display:'flex',flexDirection:'column',gap:16}}>

            {/* Executive summary */}
            <div style={{...card(),padding:'28px',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,border:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <Star size={20} color={G.gold}/>
                <h3 style={{...serif,fontSize:22,margin:0,color:'#fff'}}>{isHe?'תקציר מנהלים':'Executive Summary'}</h3>
                <span style={{...sans,fontSize:10,padding:'3px 10px',borderRadius:20,background:'rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.9)',marginInlineStart:'auto'}}>{strategy.generatedAt&&new Date(strategy.generatedAt).toLocaleDateString('he-IL')}</span>
              </div>
              <p style={{...sans,fontSize:14,lineHeight:1.8,color:'rgba(255,255,255,0.92)',margin:0}}>{strategy.executiveSummary}</p>
            </div>

            {/* Monthly theme */}
            {strategy.monthlyTheme&&(
              <div style={{...card(),padding:'18px 22px',background:`${G.gold}08`,borderColor:`${G.gold}30`,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24}}>🌟</span>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.gold,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>{isHe?'נושא חודשי':'Monthly Theme'}</p>
                  <p style={{...serif,fontSize:20,color:G.text,margin:0}}>{strategy.monthlyTheme}</p>
                </div>
              </div>
            )}

            {/* Market + Brand positioning */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {strategy.marketAnalysis&&(
                <div style={{...card(),padding:'20px 22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><span style={{fontSize:14}}>🔍</span><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'ניתוח שוק':'Market Analysis'}</p></div>
                  <p style={{...sans,fontSize:13,color:G.text,lineHeight:1.7}}>{strategy.marketAnalysis}</p>
                </div>
              )}
              {strategy.brandPositioning&&(
                <div style={{...card(),padding:'20px 22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><Target size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'מיצוב מותג':'Brand Positioning'}</p></div>
                  <p style={{...sans,fontSize:13,color:G.text,lineHeight:1.7}}>{strategy.brandPositioning}</p>
                </div>
              )}
            </div>

            {/* Core messages */}
            {strategy.coreMessages?.length>0&&(
              <div style={{...card(),padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}><MessageSquare size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'מסרי ליבה':'Core Messages'}</p></div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {strategy.coreMessages.map((m,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'11px 14px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:G.smoke,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
                      <p style={{...sans,fontSize:13,color:G.text,lineHeight:1.6,margin:0}}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content pillars */}
            {strategy.contentPillars?.length>0&&(
              <div style={{...card(),padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}><Layers size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'עמודי תוכן':'Content Pillars'}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
                  {strategy.contentPillars.map((p,i)=>{
                    const colors=[G.smoke,G.gold,'#8E6B5A','#4A7C8E']
                    const color=colors[i%colors.length]
                    return(
                      <div key={i} style={{padding:'16px',borderRadius:12,background:G.ivory,border:`1px solid ${G.border}`,borderTop:`3px solid ${color}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                          <p style={{...sans,fontSize:13,fontWeight:700,color:G.text}}>{p.name}</p>
                          <span style={{...sans,fontSize:12,fontWeight:700,color,background:`${color}15`,padding:'2px 8px',borderRadius:20}}>{p.percentage}%</span>
                        </div>
                        <p style={{...sans,fontSize:12,color:G.muted,lineHeight:1.5,marginBottom:8}}>{p.description}</p>
                        {p.examples?.map((ex,ei)=>(
                          <div key={ei} style={{display:'flex',alignItems:'center',gap:6,...sans,fontSize:11,color:G.text,marginBottom:3}}>
                            <span style={{width:4,height:4,borderRadius:'50%',background:color,flexShrink:0}}/>{ex}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Competitive edge + Quick wins */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {strategy.competitiveEdge&&(
                <div style={{...card(),padding:'20px 22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><Shield size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'יתרון תחרותי':'Competitive Edge'}</p></div>
                  <p style={{...sans,fontSize:13,color:G.text,lineHeight:1.7}}>{strategy.competitiveEdge}</p>
                </div>
              )}
              {strategy.quickWins?.length>0&&(
                <div style={{...card(),padding:'20px 22px',background:`${G.gold}06`,borderColor:`${G.gold}20`}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><Zap size={14} color={G.gold}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.gold,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'ניצחונות מהירים':'Quick Wins'}</p></div>
                  {strategy.quickWins.map((w,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',borderRadius:8,background:G.white,border:`1px solid ${G.border}`,marginBottom:6}}>
                      <span style={{fontSize:13,flexShrink:0}}>⚡</span>
                      <p style={{...sans,fontSize:12,color:G.text,margin:0,lineHeight:1.5}}>{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile optimization */}
            {strategy.profileOptimization?.bioTemplate&&(
              <div style={{...card(),padding:'20px 22px',background:`${G.smoke}05`,borderColor:`${G.smoke}15`}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}><span style={{fontSize:16}}>👤</span><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'ביו מוכן לשימוש':'Ready Bio'}</p></div>
                <div style={{padding:'12px 14px',borderRadius:10,background:G.white,border:`1px solid ${G.border}`,marginBottom:10}}>
                  <p style={{...sans,fontSize:13,color:G.text,lineHeight:1.6}}>{strategy.profileOptimization.bioTemplate}</p>
                  <button onClick={()=>{navigator.clipboard.writeText(strategy.profileOptimization.bioTemplate);showToast(isHe?'ביו הועתק!':'Bio copied!')}}
                    style={{...sans,marginTop:8,padding:'4px 10px',borderRadius:7,border:`1px solid ${G.border}`,background:'transparent',color:G.muted,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                    <Copy size={9}/>{isHe?'העתק':'Copy'}
                  </button>
                </div>
                {strategy.profileOptimization.storyHighlights?.length>0&&(
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {strategy.profileOptimization.storyHighlights.map((h,i)=>(
                      <span key={i} style={{...sans,fontSize:11,padding:'4px 10px',borderRadius:20,background:G.white,border:`1px solid ${G.border}`,color:G.text}}>◯ {h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KPIs */}
            {strategy.kpis?.length>0&&(
              <div style={{...card(),padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}><BarChart2 size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>KPIs</p></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                  {strategy.kpis.map((k,i)=>(
                    <div key={i} style={{padding:'14px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <p style={{...sans,fontSize:12,fontWeight:600,color:G.text,marginBottom:2}}>{k.metric}</p>
                        <p style={{...sans,fontSize:10,color:G.muted}}>{k.timeframe}</p>
                      </div>
                      <span style={{...sans,fontSize:14,fontWeight:700,color:G.smoke,background:`${G.smoke}12`,padding:'4px 12px',borderRadius:20}}>{k.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {strategy.hashtags&&(
              <div style={{...card(),padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}><Hash size={14} color={G.smoke}/><p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'האשטאגים':'Hashtags'}</p></div>
                {Object.entries(strategy.hashtags).map(([key,tags])=>(
                  <div key={key} style={{marginBottom:12}}>
                    <p style={{...sans,fontSize:10,color:G.muted,fontWeight:600,textTransform:'capitalize',marginBottom:6}}>{key}</p>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {tags?.map((tag,i)=>(
                        <span key={i} onClick={()=>{navigator.clipboard.writeText(tag);showToast(isHe?'הועתק':'Copied')}}
                          style={{...sans,fontSize:11,padding:'4px 10px',borderRadius:20,background:`${G.smoke}10`,color:G.smoke,border:`1px solid ${G.smoke}20`,cursor:'pointer'}}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={()=>setActiveTab('intake')}
              style={{...sans,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',borderRadius:12,border:`1.5px solid ${G.border}`,background:G.white,color:G.muted,fontSize:12,cursor:'pointer',fontWeight:500}}>
              <RefreshCw size={12}/>{isHe?'עדכן ויצור מחדש':'Update & Regenerate'}
            </button>
          </div>
        )}

        {/* ════ CALENDAR ════ */}
        {activeTab==='calendar'&&strategy?.weeklyPlan&&(
          <div style={{maxWidth:1000,margin:'0 auto',display:'flex',flexDirection:'column',gap:16}}>
            <div style={{...card(),padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h2 style={{...serif,fontSize:22,color:G.text,margin:0}}>{isHe?'לוח תוכן חודשי':'Monthly Content Calendar'}</h2>
                <p style={{...sans,fontSize:11,color:G.muted,marginTop:3}}>
                  {activeClient.name} · {parseInt(form.postsPerWeek||5)*4} {isHe?'פוסטים החודש':'posts this month'} · {isHe?'✓ מסונכרן עם לוח השנה':'✓ Synced with planner'}
                </p>
              </div>
              <button onClick={()=>{
                const t=strategy.weeklyPlan.map(w=>`━━ שבוע ${w.week}: ${w.theme} ━━\n${w.posts?.map(p=>`${p.day} ${p.time} | ${p.platform} | ${p.type}\n📝 ${p.topic}\n${p.caption}\n${p.hashtags}\n📸 ${p.visualDirection||''}`).join('\n\n')}`).join('\n\n')
                navigator.clipboard.writeText(t);showToast(isHe?'הלוח הועתק ✅':'Calendar copied ✅')
              }} style={{...sans,display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:9,border:`1px solid ${G.border}`,background:G.white,color:G.muted,fontSize:11,cursor:'pointer'}}>
                <Copy size={11}/>{isHe?'העתק הכל':'Copy All'}
              </button>
            </div>

            {strategy.weeklyPlan.map((week,wi)=>(
              <div key={wi} style={{...card(),padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${G.border}`}}>
                  <div style={{width:32,height:32,borderRadius:10,background:G.smoke,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>{week.week}</div>
                  <div>
                    <p style={{...sans,fontSize:10,color:G.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{isHe?'שבוע':'Week'} {week.week}</p>
                    <p style={{...serif,fontSize:18,color:G.text,margin:0}}>{week.theme}</p>
                  </div>
                  <span style={{...sans,fontSize:11,color:G.muted,marginInlineStart:'auto'}}>{week.posts?.length} {isHe?'פוסטים':'posts'}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {week.posts?.map((post,pi)=>{
                    const platColor={'Instagram':'#E1306C','Facebook':'#1877F2','TikTok':'#000000','LinkedIn':'#0A66C2'}[post.platform]||G.smoke
                    return(
                      <div key={pi} style={{padding:'14px 16px',borderRadius:12,background:G.ivory,border:`1px solid ${G.border}`,borderRight:isHe?`3px solid ${platColor}`:'none',borderLeft:isHe?'none':`3px solid ${platColor}`}}>
                        <div style={{display:'grid',gridTemplateColumns:'70px 90px 70px 1fr auto',gap:10,alignItems:'flex-start',marginBottom:post.visualDirection?10:0}}>
                          <div>
                            <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,marginBottom:2,textTransform:'uppercase'}}>{isHe?'יום':'Day'}</p>
                            <p style={{...sans,fontSize:12,fontWeight:600,color:G.text}}>{post.day}</p>
                          </div>
                          <div>
                            <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,marginBottom:3,textTransform:'uppercase'}}>{isHe?'פלטפורמה':'Platform'}</p>
                            <span style={{...sans,fontSize:11,fontWeight:600,color:platColor,background:`${platColor}15`,padding:'2px 7px',borderRadius:20}}>{post.platform}</span>
                          </div>
                          <div>
                            <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,marginBottom:2,textTransform:'uppercase'}}>{isHe?'סוג':'Type'}</p>
                            <p style={{...sans,fontSize:11,color:G.text}}>{post.type}</p>
                            <p style={{...sans,fontSize:10,color:G.muted}}>{post.time}</p>
                          </div>
                          <div>
                            <p style={{...sans,fontSize:11,fontWeight:700,color:G.text,marginBottom:4}}>{post.topic}</p>
                            <p style={{...sans,fontSize:12,color:G.text,lineHeight:1.6,marginBottom:4}}>{post.caption}</p>
                            <p style={{...sans,fontSize:10,color:platColor}}>{post.hashtags}</p>
                          </div>
                          <button onClick={()=>{
                          const newCaption = window.prompt(isHe?'ערכי קאפשן:':'Edit caption:', post.caption)
                          if (newCaption !== null && newCaption !== post.caption) {
                            const s = getStrategyDB(activeClient.id)
                            s.weeklyPlan[wi].posts[pi].caption = newCaption
                            setStrategy({...s})
                            saveStrategyDB(activeClient.id, s)
                            showToast(isHe?'קאפשן עודכן ✅':'Caption updated ✅')
                          }
                        }} style={{background:'none',border:'none',cursor:'pointer',color:G.muted,padding:4,display:'flex',alignSelf:'flex-start'}}
                            onMouseEnter={e=>e.currentTarget.style.color=G.smoke} onMouseLeave={e=>e.currentTarget.style.color=G.muted}>
                            <Edit3 size={12}/>
                          </button>
                          <button onClick={()=>{navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`);showToast(isHe?'קאפשן הועתק':'Caption copied')}}
                            style={{background:'none',border:'none',cursor:'pointer',color:G.muted,padding:4,display:'flex',alignSelf:'flex-start'}}
                            onMouseEnter={e=>e.currentTarget.style.color=G.smoke} onMouseLeave={e=>e.currentTarget.style.color=G.muted}>
                            <Copy size={12}/>
                          </button>
                        </div>
                        {post.visualDirection&&(
                          <div style={{padding:'9px 12px',borderRadius:9,background:`${G.gold}08`,border:`1px solid ${G.gold}20`}}>
                            <p style={{...sans,fontSize:9,fontWeight:700,color:G.gold,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>📸 {isHe?'הוראות ויזואל':'Visual Direction'}</p>
                            <p style={{...sans,fontSize:11,color:G.text,lineHeight:1.5}}>{post.visualDirection}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty strategy */}
        {activeTab==='strategy'&&!strategy&&(
          <div style={{textAlign:'center',padding:'80px 20px'}}>
            <div style={{fontSize:64,marginBottom:16}}>🧠</div>
            <p style={{...serif,fontSize:24,color:G.text,marginBottom:8}}>{isHe?'אין אסטרטגיה עדיין':'No strategy yet'}</p>
            <button onClick={()=>setActiveTab('intake')} style={{...sans,display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
              <ArrowRight size={14}/>{isHe?'עבר לבריף':'Go to Brief'}
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading&&(
        <div style={{position:'fixed',inset:0,background:'rgba(28,28,28,0.6)',backdropFilter:'blur(10px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:G.white,borderRadius:24,padding:'48px 56px',textAlign:'center',boxShadow:'0 32px 100px rgba(0,0,0,0.25)',maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:16}}>🧠</div>
            <div style={{...serif,fontSize:24,color:G.text,marginBottom:8}}>{isHe?'הסוכן עובד...':'Agent working...'}</div>
            <div style={{...sans,fontSize:13,color:G.muted,marginBottom:24,lineHeight:1.6}}>{loadingMsg}</div>
            <div style={{height:3,background:'rgba(94,104,94,0.12)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',background:`linear-gradient(90deg,${G.smoke},${G.gold})`,borderRadius:3,animation:'progress 2s ease-in-out infinite'}}/>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',bottom:24,left:isHe?24:'auto',right:isHe?'auto':24,background:toast.type==='error'?'#dc2626':G.smokeDark,color:'#fff',borderRadius:14,padding:'13px 20px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:9,zIndex:3000,animation:'slide 0.3s ease',...sans,fontSize:13,fontWeight:500,maxWidth:380}}>
          <span>{toast.type==='error'?'❌':'✨'}</span>{toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes slide   { from { transform: translateY(12px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes progress{ 0%{width:0%} 50%{width:70%} 100%{width:100%} }
      `}</style>
    </div>
  )
}   