import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, ChevronRight, ChevronLeft, X, Check, Sparkles, Clock, Bell, Trash2, Edit3, RefreshCw, Copy } from 'lucide-react'
import {
  getClients, getPlannerEvents, savePlannerEvents,
  addPlannerEvent, updatePlannerEvent, deletePlannerEvent,
  getDailyTasks, onSync
} from '@/utils/syncService'

/* ── Tokens ──────────────────────────────────── */
const G = {
  smoke:'#5E685E', smokeDark:'#445246', gold:'#B49A74',
  ivory:'#F7F4EF', white:'#FFFFFF', text:'#1C1C1C',
  muted:'#7A7A6E', border:'rgba(94,104,94,0.12)', cream:'#E8E1D8',
}
const sans  = { fontFamily:"'Inter','Heebo',sans-serif" }
const serif = { fontFamily:"'Cormorant Garamond',serif" }

const PLATFORMS = {
  instagram:{ labelHe:'אינסטגרם', labelEn:'Instagram', color:'#E1306C', bg:'rgba(225,48,108,0.08)', icon:'📸' },
  facebook: { labelHe:'פייסבוק',  labelEn:'Facebook',  color:'#1877F2', bg:'rgba(24,119,242,0.08)',  icon:'📘' },
  tiktok:   { labelHe:'טיקטוק',   labelEn:'TikTok',    color:'#000000', bg:'rgba(0,0,0,0.06)',       icon:'🎵' },
  linkedin: { labelHe:'לינקדאין', labelEn:'LinkedIn',  color:'#0A66C2', bg:'rgba(10,102,194,0.08)',  icon:'💼' },
  youtube:  { labelHe:'יוטיוב',   labelEn:'YouTube',   color:'#FF0000', bg:'rgba(255,0,0,0.07)',     icon:'▶️'  },
  event:    { labelHe:'אירוע',    labelEn:'Event',     color:'#B49A74', bg:'rgba(180,154,116,0.10)', icon:'📅' },
  task:     { labelHe:'משימה',    labelEn:'Task',      color:'#5E685E', bg:'rgba(94,104,94,0.08)',   icon:'✅' },
}

const POST_TYPES = ['פוסט','ריל','סטורי','קרוסלה','לייב','מיטינג','משימה']

const DAYS_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

/* ── Helpers ─────────────────────────────────── */
function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate()
}

function startOfWeek(d) {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay())
  date.setHours(0,0,0,0)
  return date
}

function addDays(d, n) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}) } catch { return '' }
}

function minutesUntil(iso) {
  if (!iso) return null
  return Math.round((new Date(iso) - new Date()) / 60000)
}

/* ── AI tips per platform ────────────────────── */
function getAITip(platform, type) {
  const tips = {
    instagram: { פוסט:'שעות שיא: 07:00, 12:00, 19:00. קאפשן עם שאלה מגדיל מעורבות ב-48%.', ריל:'15-30 שניות = פי 3 חשיפה. פתחי בהוק חזק ב-2 שניות הראשונות!', סטורי:'Stories יומי שומר engagement גבוה. הוסיפי polls ו-Q&A לאינטראקציה.' },
    facebook:  { פוסט:'פוסטים עם תמונה מקבלים פי 2.3 יותר engagement. זמן שיא: 09:00-13:00.', ריל:'Facebook Reels מקבלים priority באלגוריתם כרגע — פרסמי יותר!', default:'Groups ו-Events מגדילים reach אורגני משמעותית.' },
    tiktok:    { ריל:'שעות שיא: 18:00-22:00. טרנדים + סאונד פופולרי = חשיפה מסיבית.', default:'3-5 סרטונים בשבוע = אלגוריתם מועדף. Consistency > perfection.' },
    linkedin:  { פוסט:'LinkedIn posts עם 5-7 줄 + CTA מקבלים פי 4 יותר קליקים.', default:'מנהלים ב-LinkedIn פוסטים בין 08:00-10:00 ו-17:00-19:00 ביום עסקים.' },
    youtube:   { default:'YouTube Shorts מקבלים 55B+ views ביום. זמן שיא: שישי-ראשון.' },
    default:   { default:'תזמן תוכן בשעות עם הכי הרבה active users לפלטפורמה שלך.' },
  }
  const platTips = tips[platform] || tips.default
  return platTips[type] || platTips.default || tips.default.default
}

/* ═══════════════════════════════════════════════ */
export default function Planner() {
  const ctx  = useOutletContext() || {}
  const lang = ctx.lang || 'he'
  const isHe = lang !== 'en'

  const [events,       setEvents]       = useState([])
  const [clients,      setClients]      = useState([])
  const [view,         setView]         = useState('week')   // 'week' | 'month' | 'day'
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [showModal,    setShowModal]    = useState(false)
  const [editEvent,    setEditEvent]    = useState(null)
  const [selectedDay,  setSelectedDay]  = useState(null)
  const [filterClient, setFilterClient] = useState('all')
  const [filterPlat,   setFilterPlat]   = useState('all')
  const [showAI,       setShowAI]       = useState(true)
  const [toast,        setToast]        = useState(null)
  const [hoveredEvent, setHoveredEvent] = useState(null)

  const defaultForm = {
    title:'', clientId:'', platform:'instagram', type:'פוסט',
    date: new Date().toISOString().slice(0,10),
    time:'09:00', endTime:'10:00',
    caption:'', hashtags:'', notes:'', color:'',
    notify: true,
  }
  const [form, setForm] = useState(defaultForm)

  /* ── Load ─────────────────────────────────── */
  const load = useCallback(() => {
    setEvents(getPlannerEvents())
    setClients(getClients())
  }, [])

  useEffect(() => {
    load()
    const unsub = onSync(load)
    return unsub
  }, [load])

  /* ── Week days ─────────────────────────────── */
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate])
  const weekDays  = useMemo(() => Array.from({length:7}, (_, i) => addDays(weekStart, i)), [weekStart])

  /* ── Filtered events ─────────────────────── */
  const filtered = useMemo(() => events.filter(e => {
    if (filterClient !== 'all' && e.clientId !== filterClient) return false
    if (filterPlat   !== 'all' && e.platform  !== filterPlat)  return false
    return true
  }), [events, filterClient, filterPlat])

  /* ── Navigation ─────────────────────────── */
  function prev() {
    const d = new Date(currentDate)
    if (view==='week') d.setDate(d.getDate()-7)
    else if (view==='month') d.setMonth(d.getMonth()-1)
    else d.setDate(d.getDate()-1)
    setCurrentDate(d)
  }
  function next() {
    const d = new Date(currentDate)
    if (view==='week') d.setDate(d.getDate()+7)
    else if (view==='month') d.setMonth(d.getMonth()+1)
    else d.setDate(d.getDate()+1)
    setCurrentDate(d)
  }
  function goToday() { setCurrentDate(new Date()) }

  /* ── Save event ─────────────────────────── */
  function handleSave() {
    if (!form.title || !form.date) return
    const start = new Date(`${form.date}T${form.time}`)
    const end   = new Date(`${form.date}T${form.endTime||form.time}`)
    const client = clients.find(c => c.id === form.clientId)
    const plat   = PLATFORMS[form.platform] || PLATFORMS.instagram

    const eventData = {
      title:      form.title,
      clientId:   form.clientId,
      clientName: client?.name || '',
      platform:   form.platform,
      type:       form.type,
      start:      start.toISOString(),
      end:        end.toISOString(),
      caption:    form.caption,
      hashtags:   form.hashtags,
      notes:      form.notes,
      color:      form.color || plat.color,
      notify:     form.notify,
      source:     'manual',
    }

    if (editEvent) {
      updatePlannerEvent(editEvent.id, eventData)
      showToast(isHe ? '✅ עודכן!' : '✅ Updated!')
    } else {
      addPlannerEvent(eventData)
      // Schedule notification
      if (form.notify && 'Notification' in window && Notification.permission === 'granted') {
        const delay = start - new Date() - 15*60000 // 15 min before
        if (delay > 0) {
          setTimeout(() => new Notification(`📅 תזכורת: ${form.title}`, {
            body: `${client?.name||''} · ${form.platform} · ${form.time}`,
            icon: '/favicon.ico'
          }), Math.min(delay, 2147483647))
        }
      }
      showToast(isHe ? '✅ נוסף ללוח!' : '✅ Added to planner!')
    }
    load()
    closeModal()
  }

  function handleDelete(id) {
    deletePlannerEvent(id)
    load()
    showToast(isHe ? 'נמחק' : 'Deleted')
  }

  function openEdit(evt) {
    setEditEvent(evt)
    const start = new Date(evt.start)
    const end   = new Date(evt.end || evt.start)
    setForm({
      title:    evt.title || '',
      clientId: evt.clientId || '',
      platform: evt.platform || 'instagram',
      type:     evt.type || 'פוסט',
      date:     start.toISOString().slice(0,10),
      time:     start.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}),
      endTime:  end.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}),
      caption:  evt.caption || '',
      hashtags: evt.hashtags || '',
      notes:    evt.notes || '',
      color:    evt.color || '',
      notify:   evt.notify ?? true,
    })
    setShowModal(true)
  }

  function openNew(day) {
    setEditEvent(null)
    setForm({...defaultForm, date: day ? new Date(day).toISOString().slice(0,10) : defaultForm.date})
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditEvent(null)
    setForm(defaultForm)
  }

  function copyCaption(evt) {
    navigator.clipboard.writeText(`${evt.caption||''}\n\n${evt.hashtags||''}`)
    showToast(isHe ? '📋 קאפשן הועתק!' : '📋 Caption copied!')
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null), 3000) }

  async function requestNotif() {
    const r = await Notification.requestPermission()
    showToast(r==='granted' ? '🔔 תזכורות מופעלות!' : '🔕 הרשאה נדחתה')
  }

  /* ── Header title ────────────────────────── */
  function headerTitle() {
    if (view === 'week') {
      const s = weekStart, e = addDays(weekStart, 6)
      if (isHe) return `${s.getDate()}–${e.getDate()} ${MONTHS_HE[s.getMonth()]} ${s.getFullYear()}`
      return `${s.getDate()}–${e.getDate()} ${MONTHS_HE[s.getMonth()]} ${s.getFullYear()}`
    }
    if (view === 'month') return `${MONTHS_HE[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    return new Date(currentDate).toLocaleDateString('he-IL', {weekday:'long',day:'numeric',month:'long'})
  }

  /* ── Month grid ──────────────────────────── */
  function getMonthDays() {
    const year = currentDate.getFullYear(), month = currentDate.getMonth()
    const first = new Date(year, month, 1)
    const last  = new Date(year, month+1, 0)
    const days  = []
    for (let i = 0; i < first.getDay(); i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const inp = { ...sans, padding:'9px 13px', borderRadius:10, fontSize:12, border:`1.5px solid ${G.border}`, background:G.ivory, color:G.text, outline:'none', width:'100%', boxSizing:'border-box' }
  const today = new Date()

  /* ── Upcoming sidebar ────────────────────── */
  const upcoming = [...filtered]
    .filter(e => new Date(e.start) >= today)
    .sort((a,b) => new Date(a.start) - new Date(b.start))
    .slice(0, 8)

  return (
    <div style={{display:'flex',height:'calc(100vh - 64px)',background:G.ivory,direction:isHe?'rtl':'ltr',...sans}}>

      {/* ── SIDEBAR ─────────────────────────── */}
      <div style={{width:260,flexShrink:0,background:G.white,borderLeft:isHe?`1px solid ${G.border}`:'none',borderRight:isHe?'none':`1px solid ${G.border}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Mini calendar header */}
        <div style={{padding:'16px',borderBottom:`1px solid ${G.border}`}}>
          <button onClick={()=>openNew()} style={{...sans,width:'100%',padding:'10px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <Plus size={13}/>{isHe?'אירוע חדש':'New Event'}
          </button>
        </div>

        {/* Filters */}
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${G.border}`}}>
          <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{isHe?'סינון':'Filter'}</p>
          <select value={filterClient} onChange={e=>setFilterClient(e.target.value)} style={{...inp,marginBottom:6,fontSize:11}}>
            <option value="all">{isHe?'כל הלקוחות':'All clients'}</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {['all','instagram','facebook','tiktok','linkedin','youtube'].map(p=>{
              const pl = PLATFORMS[p]
              const active = filterPlat === p
              return (
                <button key={p} onClick={()=>setFilterPlat(p)}
                  style={{...sans,padding:'3px 8px',borderRadius:20,border:`1px solid ${active?(pl?.color||G.smoke):G.border}`,background:active?(pl?.bg||`${G.smoke}10`):'transparent',color:active?(pl?.color||G.smoke):G.muted,fontSize:10,cursor:'pointer',transition:'all 0.1s'}}>
                  {p==='all'?(isHe?'הכל':'All'):(pl?.icon||'')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
          <p style={{...sans,fontSize:9,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{isHe?'בקרוב':'Upcoming'}</p>
          {upcoming.length===0?(
            <p style={{...sans,fontSize:11,color:G.muted}}>{isHe?'אין אירועים קרובים':'No upcoming events'}</p>
          ):upcoming.map(evt=>{
            const pl   = PLATFORMS[evt.platform] || PLATFORMS.instagram
            const mins = minutesUntil(evt.start)
            const urgent = mins !== null && mins > 0 && mins < 60
            return (
              <div key={evt.id} onClick={()=>openEdit(evt)}
                style={{padding:'9px 10px',borderRadius:9,marginBottom:6,background:urgent?'rgba(220,38,38,0.05)':G.ivory,border:`1px solid ${urgent?'rgba(220,38,38,0.2)':G.border}`,cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background=pl.bg} onMouseLeave={e=>e.currentTarget.style.background=urgent?'rgba(220,38,38,0.05)':G.ivory}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:11}}>{pl.icon}</span>
                  <p style={{...sans,fontSize:11,fontWeight:600,color:G.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{evt.title}</p>
                  {urgent&&<span style={{fontSize:9,color:'#dc2626',fontWeight:700}}>⚡</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <Clock size={9} color={G.muted}/>
                  <span style={{...sans,fontSize:9,color:G.muted}}>{new Date(evt.start).toLocaleDateString('he-IL',{day:'numeric',month:'short'})} {formatTime(evt.start)}</span>
                  {evt.clientName&&<span style={{...sans,fontSize:9,color:pl.color,fontWeight:600}}>{evt.clientName}</span>}
                </div>
                {evt.source==='strategy'&&<span style={{...sans,fontSize:8,color:G.smoke,background:`${G.smoke}10`,padding:'1px 5px',borderRadius:4,marginTop:3,display:'inline-block'}}>🧠 AI</span>}
              </div>
            )
          })}
        </div>

        {/* Notification toggle */}
        <div style={{padding:'12px 14px',borderTop:`1px solid ${G.border}`}}>
          {Notification?.permission !== 'granted'
            ? <button onClick={requestNotif} style={{...sans,width:'100%',padding:'8px',borderRadius:9,border:`1px solid ${G.gold}`,background:`${G.gold}10`,color:G.gold,fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <Bell size={11}/>{isHe?'הפעל תזכורות':'Enable Alerts'}
              </button>
            : <div style={{...sans,textAlign:'center',fontSize:10,color:'#4CAF50',fontWeight:600}}>🔔 {isHe?'תזכורות פעילות':'Notifications on'}</div>
          }
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Top bar */}
        <div style={{background:G.white,borderBottom:`1px solid ${G.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <button onClick={prev} style={{width:30,height:30,borderRadius:8,border:`1px solid ${G.border}`,background:G.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:G.muted}}><ChevronLeft size={14}/></button>
            <button onClick={goToday} style={{...sans,padding:'5px 12px',borderRadius:8,border:`1px solid ${G.border}`,background:G.white,color:G.smoke,fontSize:11,fontWeight:600,cursor:'pointer'}}>{isHe?'היום':'Today'}</button>
            <button onClick={next} style={{width:30,height:30,borderRadius:8,border:`1px solid ${G.border}`,background:G.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:G.muted}}><ChevronRight size={14}/></button>
          </div>

          <h2 style={{...serif,fontSize:20,color:G.text,margin:0,fontWeight:400,flex:1,textAlign:'center'}}>{headerTitle()}</h2>

          <div style={{display:'flex',gap:3,background:G.ivory,borderRadius:9,padding:3,border:`1px solid ${G.border}`}}>
            {[{id:'day',he:'יומי',en:'Day'},{id:'week',he:'שבועי',en:'Week'},{id:'month',he:'חודשי',en:'Month'}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)}
                style={{...sans,padding:'5px 12px',borderRadius:7,border:'none',background:view===v.id?G.smoke:'transparent',color:view===v.id?'#fff':G.muted,fontSize:11,fontWeight:view===v.id?700:400,cursor:'pointer'}}>
                {isHe?v.he:v.en}
              </button>
            ))}
          </div>

          <button onClick={()=>setShowAI(v=>!v)}
            style={{...sans,display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:9,border:`1px solid ${showAI?G.gold:G.border}`,background:showAI?`${G.gold}10`:G.white,color:showAI?G.gold:G.muted,fontSize:11,fontWeight:showAI?600:400,cursor:'pointer'}}>
            <Sparkles size={12}/>{isHe?'סוכן AI':'AI Agent'}
          </button>

          <button onClick={load}
            style={{width:30,height:30,borderRadius:8,border:`1px solid ${G.border}`,background:G.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:G.muted}}>
            <RefreshCw size={13}/>
          </button>
        </div>

        <div style={{flex:1,display:'flex',overflow:'hidden'}}>

          {/* ── WEEK VIEW ──────────────────────── */}
          {view==='week'&&(
            <div style={{flex:1,overflowY:'auto'}}>
              {/* Day headers */}
              <div style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',background:G.white,borderBottom:`1px solid ${G.border}`,position:'sticky',top:0,zIndex:10}}>
                <div style={{borderRight:`1px solid ${G.border}`}}/>
                {weekDays.map((day,i)=>{
                  const isToday = isSameDay(day, today)
                  return(
                    <div key={i} onClick={()=>openNew(day)}
                      style={{padding:'10px 8px',textAlign:'center',borderRight:`1px solid ${G.border}`,cursor:'pointer',transition:'background 0.1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=G.ivory} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <p style={{...sans,fontSize:10,color:G.muted,marginBottom:4}}>{isHe?DAYS_HE[day.getDay()]:DAYS_EN[day.getDay()]}</p>
                      <div style={{width:28,height:28,borderRadius:'50%',background:isToday?G.smoke:'transparent',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto'}}>
                        <p style={{...sans,fontSize:14,fontWeight:isToday?700:400,color:isToday?'#fff':G.text}}>{day.getDate()}</p>
                      </div>
                      {/* Event count badge */}
                      {filtered.filter(e=>isSameDay(e.start,day)).length > 0 && (
                        <div style={{marginTop:3,display:'flex',justifyContent:'center',gap:2}}>
                          {filtered.filter(e=>isSameDay(e.start,day)).slice(0,3).map((e,ei)=>(
                            <div key={ei} style={{width:6,height:6,borderRadius:'50%',background:PLATFORMS[e.platform]?.color||G.smoke}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Time slots */}
              {Array.from({length:17},(_,i)=>i+7).map(hour=>(
                <div key={hour} style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',minHeight:72,borderBottom:`1px solid ${G.border}`}}>
                  <div style={{padding:'4px 8px',borderRight:`1px solid ${G.border}`,textAlign:'center',flexShrink:0}}>
                    <span style={{...sans,fontSize:10,color:G.muted}}>{String(hour).padStart(2,'0')}:00</span>
                  </div>
                  {weekDays.map((day,di)=>{
                    const dayEvts = filtered.filter(e=>{
                      const s=new Date(e.start)
                      return isSameDay(s,day) && s.getHours()===hour
                    })
                    return(
                      <div key={di}
                        style={{borderRight:`1px solid ${G.border}`,padding:'2px',position:'relative',background:isSameDay(day,today)?'rgba(94,104,94,0.02)':'transparent',cursor:'pointer'}}
                        onClick={()=>openNew(new Date(day.getFullYear(),day.getMonth(),day.getDate(),hour,0))}>
                        {dayEvts.map((evt,ei)=>{
                          const pl   = PLATFORMS[evt.platform] || PLATFORMS.instagram
                          const mins = minutesUntil(evt.start)
                          const soon = mins !== null && mins > 0 && mins < 60
                          return(
                            <div key={ei}
                              onClick={e=>{e.stopPropagation();openEdit(evt)}}
                              onMouseEnter={()=>setHoveredEvent(evt.id)}
                              onMouseLeave={()=>setHoveredEvent(null)}
                              style={{padding:'4px 7px',borderRadius:7,background:pl.bg,borderRight:isHe?`3px solid ${pl.color}`:'none',borderLeft:isHe?'none':`3px solid ${pl.color}`,marginBottom:2,cursor:'pointer',transition:'all 0.15s',boxShadow:hoveredEvent===evt.id?'0 2px 8px rgba(0,0,0,0.12)':'none',transform:hoveredEvent===evt.id?'translateY(-1px)':'none',position:'relative'}}>
                              <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
                                <span style={{fontSize:9}}>{pl.icon}</span>
                                <p style={{...sans,fontSize:10,fontWeight:700,color:pl.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{evt.title}</p>
                                {soon&&<span style={{...sans,fontSize:8,color:'#dc2626',fontWeight:700}}>⚡</span>}
                              </div>
                              <p style={{...sans,fontSize:9,color:G.muted}}>{evt.clientName} {formatTime(evt.start)}</p>
                              {evt.source==='strategy'&&<span style={{...sans,fontSize:7,color:G.smoke,background:`${G.smoke}15`,padding:'0px 4px',borderRadius:3}}>AI</span>}
                              {hoveredEvent===evt.id&&(
                                <div style={{position:'absolute',top:2,right:isHe?2:'auto',left:isHe?'auto':2,display:'flex',gap:2}}>
                                  <button onClick={e=>{e.stopPropagation();copyCaption(evt)}} style={{width:16,height:16,borderRadius:4,border:'none',background:'rgba(255,255,255,0.9)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <Copy size={8} color={G.muted}/>
                                  </button>
                                  <button onClick={e=>{e.stopPropagation();handleDelete(evt.id)}} style={{width:16,height:16,borderRadius:4,border:'none',background:'rgba(220,38,38,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <Trash2 size={8} color='#dc2626'/>
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── MONTH VIEW ─────────────────────── */}
          {view==='month'&&(
            <div style={{flex:1,overflowY:'auto',padding:'0'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:G.white,borderBottom:`1px solid ${G.border}`,position:'sticky',top:0,zIndex:10}}>
                {(isHe?DAYS_HE:DAYS_EN).map((d,i)=>(
                  <div key={i} style={{padding:'10px',textAlign:'center',borderRight:i<6?`1px solid ${G.border}`:'none'}}>
                    <span style={{...sans,fontSize:11,fontWeight:600,color:G.muted}}>{d}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                {getMonthDays().map((day,i)=>{
                  if (!day) return <div key={i} style={{minHeight:100,borderRight:`1px solid ${G.border}`,borderBottom:`1px solid ${G.border}`,background:'rgba(0,0,0,0.01)'}}/>
                  const isToday = isSameDay(day, today)
                  const dayEvts = filtered.filter(e => isSameDay(e.start, day))
                  return(
                    <div key={i}
                      style={{minHeight:100,borderRight:i%7!==6?`1px solid ${G.border}`:'none',borderBottom:`1px solid ${G.border}`,padding:6,cursor:'pointer',transition:'background 0.1s',background:isToday?'rgba(94,104,94,0.04)':'transparent'}}
                      onClick={()=>openNew(day)}>
                      <div style={{width:24,height:24,borderRadius:'50%',background:isToday?G.smoke:'transparent',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:4}}>
                        <span style={{...sans,fontSize:12,fontWeight:isToday?700:400,color:isToday?'#fff':G.text}}>{day.getDate()}</span>
                      </div>
                      {dayEvts.slice(0,3).map((evt,ei)=>{
                        const pl = PLATFORMS[evt.platform] || PLATFORMS.instagram
                        return(
                          <div key={ei} onClick={e=>{e.stopPropagation();openEdit(evt)}}
                            style={{padding:'2px 5px',borderRadius:4,background:pl.bg,marginBottom:2,cursor:'pointer',overflow:'hidden'}}>
                            <p style={{...sans,fontSize:9,fontWeight:600,color:pl.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pl.icon} {evt.title}</p>
                          </div>
                        )
                      })}
                      {dayEvts.length>3&&<p style={{...sans,fontSize:9,color:G.muted}}>+{dayEvts.length-3} {isHe?'עוד':'more'}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── DAY VIEW ───────────────────────── */}
          {view==='day'&&(
            <div style={{flex:1,overflowY:'auto'}}>
              <div style={{padding:'12px 20px',background:G.white,borderBottom:`1px solid ${G.border}`,display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:isSameDay(currentDate,today)?G.smoke:G.cream,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{...sans,fontSize:18,fontWeight:700,color:isSameDay(currentDate,today)?'#fff':G.text}}>{currentDate.getDate()}</span>
                </div>
                <div>
                  <p style={{...sans,fontSize:12,fontWeight:600,color:G.text}}>{isHe?DAYS_HE[currentDate.getDay()]:DAYS_EN[currentDate.getDay()]}</p>
                  <p style={{...sans,fontSize:10,color:G.muted}}>{filtered.filter(e=>isSameDay(e.start,currentDate)).length} {isHe?'אירועים':'events'}</p>
                </div>
              </div>
              {Array.from({length:17},(_,i)=>i+7).map(hour=>{
                const hourEvts = filtered.filter(e=>{const s=new Date(e.start);return isSameDay(s,currentDate)&&s.getHours()===hour})
                return(
                  <div key={hour} style={{display:'flex',gap:12,padding:'8px 20px',borderBottom:`1px solid ${G.border}`,minHeight:60,alignItems:'flex-start'}}>
                    <span style={{...sans,fontSize:11,color:G.muted,width:40,flexShrink:0,paddingTop:4}}>{String(hour).padStart(2,'0')}:00</span>
                    <div style={{flex:1}}>
                      {hourEvts.map((evt,i)=>{
                        const pl=PLATFORMS[evt.platform]||PLATFORMS.instagram
                        return(
                          <div key={i} onClick={()=>openEdit(evt)}
                            style={{padding:'10px 14px',borderRadius:10,background:pl.bg,borderRight:isHe?`3px solid ${pl.color}`:'none',borderLeft:isHe?'none':`3px solid ${pl.color}`,marginBottom:6,cursor:'pointer'}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:14}}>{pl.icon}</span>
                                <p style={{...sans,fontSize:13,fontWeight:700,color:pl.color}}>{evt.title}</p>
                                {evt.source==='strategy'&&<span style={{...sans,fontSize:9,background:`${G.smoke}15`,color:G.smoke,padding:'1px 6px',borderRadius:4}}>🧠 AI</span>}
                              </div>
                              <div style={{display:'flex',gap:6}}>
                                <button onClick={e=>{e.stopPropagation();copyCaption(evt)}} style={{...sans,padding:'3px 8px',borderRadius:6,border:`1px solid ${G.border}`,background:G.white,color:G.muted,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Copy size={9}/>{isHe?'קאפשן':'Caption'}</button>
                                <button onClick={e=>{e.stopPropagation();openEdit(evt)}} style={{...sans,padding:'3px 8px',borderRadius:6,border:`1px solid ${G.border}`,background:G.white,color:G.muted,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Edit3 size={9}/>{isHe?'עריכה':'Edit'}</button>
                                <button onClick={e=>{e.stopPropagation();handleDelete(evt.id)}} style={{...sans,padding:'3px 8px',borderRadius:6,border:'none',background:'rgba(220,38,38,0.08)',color:'#dc2626',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Trash2 size={9}/>{isHe?'מחק':'Delete'}</button>
                              </div>
                            </div>
                            {evt.clientName&&<p style={{...sans,fontSize:11,color:G.muted,marginBottom:4}}>{evt.clientName} · {formatTime(evt.start)}</p>}
                            {evt.caption&&<p style={{...sans,fontSize:11,color:G.text,lineHeight:1.5,marginBottom:4}}>{evt.caption.slice(0,120)}{evt.caption.length>120?'...':''}</p>}
                            {evt.hashtags&&<p style={{...sans,fontSize:10,color:pl.color}}>{evt.hashtags.slice(0,60)}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── AI AGENT PANEL ─────────────────── */}
          {showAI&&(
            <div style={{width:240,flexShrink:0,background:G.white,borderRight:isHe?`1px solid ${G.border}`:'none',borderLeft:isHe?'none':`1px solid ${G.border}`,overflowY:'auto',padding:'16px 14px',display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <Sparkles size={14} color={G.gold}/>
                <p style={{...serif,fontSize:16,color:G.text,margin:0}}>{isHe?'סוכן תזמון AI':'AI Scheduler'}</p>
              </div>

              {/* Stats */}
              <div style={{padding:'12px',borderRadius:10,background:`${G.smoke}06`,border:`1px solid ${G.smoke}15`}}>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.smoke,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'סיכום שבועי':'Weekly Summary'}</p>
                {[
                  {label:isHe?'אירועים השבוע':'Events this week', val:filtered.filter(e=>weekDays.some(d=>isSameDay(e.start,d))).length},
                  {label:isHe?'מ-AI אסטרטגיה':'From AI strategy',  val:filtered.filter(e=>e.source==='strategy'&&weekDays.some(d=>isSameDay(e.start,d))).length},
                  {label:isHe?'סה"כ לחודש':'Total this month',   val:filtered.filter(e=>new Date(e.start).getMonth()===currentDate.getMonth()).length},
                ].map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{...sans,fontSize:10,color:G.muted}}>{s.label}</span>
                    <span style={{...sans,fontSize:13,fontWeight:700,color:G.smoke}}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Platform tips */}
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{isHe?'טיפים לפלטפורמות':'Platform Tips'}</p>
                {['instagram','facebook','tiktok','linkedin'].map(p=>{
                  const pl=PLATFORMS[p]
                  return(
                    <div key={p} style={{padding:'10px',borderRadius:9,background:pl.bg,border:`1px solid ${pl.color}20`,marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                        <span style={{fontSize:12}}>{pl.icon}</span>
                        <span style={{...sans,fontSize:10,fontWeight:700,color:pl.color}}>{isHe?pl.labelHe:pl.labelEn}</span>
                      </div>
                      <p style={{...sans,fontSize:10,color:G.text,lineHeight:1.5}}>{getAITip(p,'פוסט')}</p>
                    </div>
                  )
                })}
              </div>

              {/* Best times */}
              <div style={{padding:'12px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`}}>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>{isHe?'שעות שיא':'Peak Hours'}</p>
                {[
                  {p:'Instagram',  times:['07:00','12:00','19:00'],icon:'📸'},
                  {p:'TikTok',     times:['18:00','20:00','22:00'],icon:'🎵'},
                  {p:'Facebook',   times:['09:00','13:00','17:00'],icon:'📘'},
                  {p:'LinkedIn',   times:['08:00','12:00','17:00'],icon:'💼'},
                ].map(({p,times,icon})=>(
                  <div key={p} style={{marginBottom:8}}>
                    <p style={{...sans,fontSize:9,color:G.muted,marginBottom:3}}>{icon} {p}</p>
                    <div style={{display:'flex',gap:4}}>
                      {times.map(t=><span key={t} style={{...sans,fontSize:9,padding:'2px 7px',borderRadius:20,background:G.white,border:`1px solid ${G.border}`,color:G.smoke}}>{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD/EDIT MODAL ───────────────────── */}
      {showModal&&(
        <div onClick={closeModal} style={{position:'fixed',inset:0,background:'rgba(28,28,28,0.5)',backdropFilter:'blur(6px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:isHe?'rtl':'ltr'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:G.white,borderRadius:20,width:'100%',maxWidth:520,maxHeight:'90vh',overflow:'hidden',boxShadow:'0 32px 100px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}}>

            {/* Modal header */}
            <div style={{padding:'18px 22px',borderBottom:`1px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <h3 style={{...serif,fontSize:20,color:G.text,margin:0}}>{editEvent?(isHe?'עריכת אירוע':'Edit Event'):(isHe?'אירוע חדש':'New Event')}</h3>
              {editEvent&&<button onClick={()=>handleDelete(editEvent.id)} style={{...sans,display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'none',background:'rgba(220,38,38,0.08)',color:'#dc2626',fontSize:11,cursor:'pointer',marginInlineEnd:'auto',marginInlineStart:10}}>
                <Trash2 size={11}/>{isHe?'מחק':'Delete'}
              </button>}
              <button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer',color:G.muted}}><X size={16}/></button>
            </div>

            <div style={{overflowY:'auto',padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>

              {/* Title */}
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'כותרת':'Title'} *</p>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={isHe?'שם הפוסט / אירוע...':'Post / event name...'} style={inp}
                  onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
              </div>

              {/* Client + Platform */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'לקוח':'Client'}</p>
                  <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))} style={inp}>
                    <option value="">{isHe?'בחר לקוח...':'Select client...'}</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'פלטפורמה':'Platform'}</p>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {Object.entries(PLATFORMS).filter(([k])=>!['event','task'].includes(k)).map(([k,v])=>(
                      <button key={k} onClick={()=>setForm(f=>({...f,platform:k}))}
                        style={{...sans,padding:'4px 10px',borderRadius:20,border:`1.5px solid ${form.platform===k?v.color:G.border}`,background:form.platform===k?v.bg:'transparent',color:form.platform===k?v.color:G.muted,fontSize:11,cursor:'pointer',transition:'all 0.1s'}}>
                        {v.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI tip */}
              {form.platform&&(
                <div style={{padding:'10px 12px',borderRadius:9,background:`${G.gold}08`,border:`1px solid ${G.gold}20`}}>
                  <p style={{...sans,fontSize:10,color:G.gold,lineHeight:1.5}}>💡 {getAITip(form.platform, form.type)}</p>
                </div>
              )}

              {/* Type + Date + Time */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'סוג':'Type'}</p>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp}>
                    {POST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'תאריך':'Date'} *</p>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
                </div>
                <div>
                  <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'שעה':'Time'}</p>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
                </div>
              </div>

              {/* Caption */}
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'קאפשן':'Caption'}</p>
                <textarea value={form.caption} onChange={e=>setForm(f=>({...f,caption:e.target.value}))} rows={3}
                  placeholder={isHe?'כתוב קאפשן מוכן לפרסום...':'Write a ready-to-publish caption...'} style={{...inp,resize:'vertical'}}
                  onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
              </div>

              {/* Hashtags */}
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{isHe?'האשטאגים':'Hashtags'}</p>
                <input value={form.hashtags} onChange={e=>setForm(f=>({...f,hashtags:e.target.value}))} placeholder="#luxury #travel #boutique..." style={inp}
                  onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
              </div>

              {/* Notify */}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`}}>
                <button onClick={()=>setForm(f=>({...f,notify:!f.notify}))}
                  style={{width:20,height:20,borderRadius:6,border:`2px solid ${form.notify?G.smoke:G.border}`,background:form.notify?G.smoke:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {form.notify&&<Check size={11} color="#fff"/>}
                </button>
                <div>
                  <p style={{...sans,fontSize:12,fontWeight:600,color:G.text}}>{isHe?'תזכורת 15 דקות לפני':'Reminder 15 min before'}</p>
                  <p style={{...sans,fontSize:10,color:G.muted}}>{isHe?'דורש הרשאת התראות מהדפדפן':'Requires browser notification permission'}</p>
                </div>
                <Bell size={14} color={form.notify?G.smoke:G.muted} style={{marginInlineStart:'auto'}}/>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding:'14px 22px',borderTop:`1px solid ${G.border}`,display:'flex',gap:10,flexShrink:0}}>
              <button onClick={closeModal} style={{...sans,flex:1,padding:'10px',borderRadius:10,border:`1.5px solid ${G.border}`,background:'transparent',color:G.muted,fontSize:13,cursor:'pointer'}}>
                {isHe?'ביטול':'Cancel'}
              </button>
              <button onClick={handleSave}
                style={{...sans,flex:2,padding:'10px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(94,104,94,0.3)'}}>
                {editEvent?(isHe?'שמור שינויים':'Save Changes'):(isHe?`✅ ${form.notify?'שמור ותזמן תזכורת':'שמור לוח'}`:`✅ ${form.notify?'Save & Remind':'Save Event'}`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',bottom:24,left:isHe?24:'auto',right:isHe?'auto':24,background:G.smokeDark,color:'#fff',borderRadius:14,padding:'12px 18px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:8,zIndex:3000,animation:'slide 0.3s ease',...sans,fontSize:13,fontWeight:500}}>
          {toast}
        </div>
      )}

      <style>{`@keyframes slide{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}  