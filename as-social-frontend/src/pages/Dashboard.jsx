import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Edit2, Trash2, Eye, Plus, X, TrendingUp, TrendingDown,
  CheckCircle, Clock, Bell, Loader, RefreshCw, Sparkles
} from 'lucide-react'
import {
  getClients, saveClients, getDailyTasks, toggleDailyTask, saveDailyTasks,
  getPlannerEvents, getStrategy, onSync, getClientStats
} from '@/utils/syncService'

/* ── Design tokens (original) ─────────────────── */
const PLATFORMS  = ['Instagram','Facebook','TikTok','LinkedIn','YouTube']
const PRIORITIES = ['urgent','high','medium','low']

const BADGE = {
  scheduled:{ he:'מתוזמן',     en:'Scheduled', c:'#5E685E', bg:'rgba(94,104,94,0.09)'   },
  pending:  { he:'ממתין',      en:'Pending',   c:'#8a7a5a', bg:'rgba(180,154,116,0.10)' },
  live:     { he:'פעיל',       en:'Live',      c:'#4a6e4a', bg:'rgba(74,110,74,0.09)'   },
  alert:    { he:'דורש טיפול', en:'Attention', c:'#8a3535', bg:'rgba(180,80,80,0.09)'   },
}

const PC = {
  urgent:{ he:'דחוף',         en:'Urgent',   c:'#8a3535', bg:'rgba(180,80,80,0.08)'    },
  high:  { he:'עדיפות גבוהה', en:'High',     c:'#8a7a5a', bg:'rgba(180,154,116,0.09)' },
  medium:{ he:'סטנדרטי',      en:'Standard', c:'#5E685E', bg:'rgba(94,104,94,0.08)'   },
  low:   { he:'נמוך',         en:'Low',      c:'#A7B0A2', bg:'rgba(167,176,162,0.08)' },
}

const PLATICON = { Instagram:'📸', Facebook:'📘', TikTok:'🎵', LinkedIn:'💼', YouTube:'▶️' }

const C = {
  background:'#FFFFFF', borderRadius:'14px',
  border:'1px solid #E2DBD2',
  boxShadow:'0 1px 3px rgba(30,30,28,0.04), 0 4px 20px rgba(30,30,28,0.04)',
}
const iBtn = (c='#5E685E', bg='rgba(94,104,94,0.08)') => ({
  width:'30px', height:'30px', borderRadius:'8px', border:'none',
  background:bg, color:c, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  transition:'all 0.2s ease',
})
const F    = { fontFamily:"'Inter', sans-serif" }
const FG   = { fontFamily:"'Cormorant Garamond', serif" }
const lbl  = { ...F, fontSize:'10px', fontWeight:600, color:'#A7B0A2', textTransform:'uppercase', letterSpacing:'0.12em' }
const num  = { ...F, fontWeight:600, letterSpacing:'-0.025em', color:'#1E1E1C', lineHeight:1 }
const INPUT = {
  ...F, width:'100%', padding:'11px 14px', border:'1px solid #E2DBD2',
  borderRadius:'10px', fontSize:'13px', color:'#1E1E1C',
  background:'#FAFAF8', outline:'none', transition:'all 0.2s ease', boxSizing:'border-box',
}
const primaryBtn = {
  display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px',
  borderRadius:'10px', border:'none', background:'#5E685E', color:'white',
  ...F, fontSize:'13px', fontWeight:500, cursor:'pointer',
  letterSpacing:'0.01em', transition:'all 0.2s ease',
  boxShadow:'0 2px 10px rgba(94,104,94,0.22)',
}

/* ── Helpers ─────────────────────────────────── */
function minutesUntil(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date(), then = new Date()
  then.setHours(h, m, 0, 0)
  return Math.round((then - now) / 60000)
}

function EmptyState({ isHe }) {
  return (
    <tr><td colSpan={8}>
      <div style={{textAlign:'center', padding:'64px 20px'}}>
        <p style={{...FG, fontSize:'22px', fontWeight:400, color:'#A7B0A2', marginBottom:'8px'}}>
          {isHe ? 'הפורטפוליו ריק' : 'Portfolio is empty'}
        </p>
        <p style={{...F, fontSize:'13px', color:'#A7B0A2'}}>
          {isHe ? 'הוסף את לקוח הדגל הראשון שלך' : 'Add your first flagship client'}
        </p>
      </div>
    </td></tr>
  )
}

/* ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const { user }           = useAuth()
  const { lang, search='' } = useOutletContext()
  const isHe = lang === 'he'
  const dir  = isHe ? 'rtl' : 'ltr'

  /* ── State ──────────────────────────────────── */
  const [clients,    setClients]    = useState([])
  const [dailyTasks, setDailyTasks] = useState([])
  const [events,     setEvents]     = useState([])
  const [modal,      setModal]      = useState(null)
  const [focus,      setFocus]      = useState(false)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [viewClient, setViewClient] = useState(null)
  const [newClient,  setNewClient]  = useState({ name:'', platform:'Instagram', status:'pending' })
  const [newTask,    setNewTask]    = useState({ text:'', client:'', priority:'medium', time:'09:00' })

  /* ── Load all data ───────────────────────────── */
  const load = useCallback(() => {
    setClients(getClients())
    setDailyTasks(getDailyTasks())
    setEvents(
      getPlannerEvents()
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 10)
    )
  }, [])

  useEffect(() => {
    load()
    const unsub  = onSync(load)
    const timer  = setInterval(load, 5000)
    return () => { unsub(); clearInterval(timer) }
  }, [load])

  /* ── Derived ─────────────────────────────────── */
  const today         = new Date().toISOString().slice(0, 10)
  const todayStr      = new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const openTasks     = dailyTasks.filter(t => !t.done).length
  const doneTasks     = dailyTasks.filter(t => t.done).length
  const urgentTasks   = dailyTasks.filter(t => t.priority === 'urgent' && !t.done).length
  const scheduledEvts = events.length
  const todayEvents   = events.filter(e => new Date(e.start).toISOString().slice(0,10) === today)

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.platform?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── Actions ─────────────────────────────────── */
  const addClient = async () => {
    if (!newClient.name.trim()) return
    setAiLoading(true); setModal(null)
    await new Promise(r => setTimeout(r, 2200))
    const strategies = [
      isHe ? 'תוכן ויזואלי יוקרתי — 4 פוסטים/שבוע' : 'Luxury visual content — 4 posts/week',
      isHe ? 'סטוריז יומיים + ריל שבועי' : 'Daily stories + weekly reel',
      isHe ? 'תוכן UGC + שיתופי פעולה' : 'UGC content + collaborations',
    ]
    const client = {
      id: `client_${Date.now()}`,
      name: newClient.name.trim(),
      platform: newClient.platform,
      badge: newClient.status,
      email: '', notes: '',
      engagement: Math.floor(Math.random() * 30) + 50,
      trend: `+${Math.floor(Math.random() * 15) + 2}%`,
      up: true,
      nextPost: isHe ? 'מחר 10:00' : 'Tmrw 10:00',
      nextPostEn: 'Tmrw 10:00',
      tasks: 0,
      status: 'high',
      aiStrategy: strategies[Math.floor(Math.random() * strategies.length)],
      createdAt: new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB'),
    }
    const updated = [client, ...clients]
    setClients(updated)
    saveClients(updated)
    setNewClient({ name:'', platform:'Instagram', status:'pending' })
    setAiLoading(false)
  }

  const deleteClient = id => {
    const updated = clients.filter(c => c.id !== id)
    setClients(updated)
    saveClients(updated)
  }

  const addTask = () => {
    if (!newTask.text.trim()) return
    const task = {
      id: `task_${Date.now()}`,
      title: newTask.text.trim(),
      text:  newTask.text.trim(),
      he: newTask.text.trim(), en: newTask.text.trim(),
      client:   newTask.client || (isHe ? 'כללי' : 'General'),
      clientId: clients.find(c => c.name === newTask.client)?.id || null,
      clientName: newTask.client || '',
      priority: newTask.priority,
      p:        newTask.priority,
      time:     newTask.time || '09:00',
      done:     false,
      reminder: true,
      date:     new Date().toDateString(),
      source:   'manual',
    }
    const all = getDailyTasks()
    saveDailyTasks([...all, task])
    setNewTask({ text:'', client:'', priority:'medium', time:'09:00' })
    setModal(null)
    load()
  }

  const toggleTask = id => { toggleDailyTask(id); load() }

  const deleteTask = id => {
    saveDailyTasks(getDailyTasks().filter(t => t.id !== id))
    load()
  }

  /* ── Metrics ─────────────────────────────────── */
  const metrics = [
    { he:'ממתינים לאישור',   en:'Pending Approval',  val: urgentTasks,   sub: isHe?'משימות דחופות':'urgent tasks',        c:'#8a7a5a', trend:`+${urgentTasks}`,  up: urgentTasks > 0  },
    { he:'מאירועי לוח שנה',  en:'From Planner',       val: scheduledEvts, sub: isHe?'אירועים קרובים':'upcoming events',    c:'#5E685E', trend:`+${scheduledEvts}`,up: true              },
    { he:'משימות יומיות',    en:'Daily Tasks',         val: `${doneTasks}/${openTasks+doneTasks}`, sub: isHe?'הושלמו היום':'completed today', c:'#8a7a5a', trend:openTasks===0?'✓':'→', up: openTasks === 0 },
    { he:'לקוחות פעילים',   en:'Active Clients',      val: clients.length,sub: isHe?'בפורטפוליו':'in portfolio',          c:'#1E1E1C', trend:`+${clients.length}`,up: true              },
  ]

  const thS = {
    padding:'11px 18px', ...lbl, textAlign: isHe ? 'right' : 'left',
    background:'rgba(232,225,216,0.45)', whiteSpace:'nowrap',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px', direction:dir }}>

      {/* ── AI Loading overlay ────────────────── */}
      {aiLoading && (
        <div style={{position:'fixed',inset:0,background:'rgba(30,30,28,0.42)',backdropFilter:'blur(10px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{...C,padding:'52px 60px',textAlign:'center',maxWidth:'380px'}}>
            <div style={{marginBottom:'24px',display:'flex',justifyContent:'center'}}><Loader size={28} color='#5E685E' style={{animation:'spin 1s linear infinite'}}/></div>
            <p style={{...FG,fontSize:'24px',color:'#1E1E1C',fontWeight:400,marginBottom:'10px'}}>{isHe?'בונה אסטרטגיה...':'Building Strategy...'}</p>
            <p style={{...F,fontSize:'13px',color:'#A7B0A2',lineHeight:1.8}}>{isHe?'הסוכן החכם מנתח את הנתונים ומכין תוכנית תוכן':'The AI agent is preparing a personalized content plan'}</p>
            <div style={{marginTop:'22px',height:'3px',background:'rgba(30,30,28,0.07)',borderRadius:'3px',overflow:'hidden'}}>
              <div style={{height:'100%',background:'#5E685E',borderRadius:'3px',animation:'progress 2.2s ease-in-out forwards'}}/>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────── */}
      <div style={{...C,padding:'26px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,right:0,left:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(94,104,94,0.3),rgba(180,154,116,0.25),transparent)'}}/>
        <div>
          <p style={{...lbl,marginBottom:'8px'}}>{isHe?'סקירה מנהלתית':'Executive Overview'}</p>
          <p style={{...FG,fontSize:'24px',fontWeight:400,color:'#1E1E1C',marginBottom:'3px',letterSpacing:'0.02em'}}>{user?.name}</p>
          <p style={{...F,fontSize:'12px',color:'#A7B0A2'}}>{todayStr}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'7px',padding:'7px 14px',borderRadius:'20px',border:'1px solid rgba(94,104,94,0.18)',background:'rgba(94,104,94,0.06)'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#5E685E',animation:'pulse 2s infinite',flexShrink:0}}/>
            <p style={{...F,fontSize:'11px',color:'#5E685E',fontWeight:500}}>{isHe?'AI פעיל':'AI Active'}</p>
          </div>
          <button onClick={()=>load()} style={{...primaryBtn,padding:'8px 14px',background:'transparent',color:'#5E685E',border:'1px solid rgba(94,104,94,0.2)',boxShadow:'none'}}>
            <RefreshCw size={12}/>
          </button>
          <button onClick={()=>setModal('task')} style={primaryBtn}
            onMouseEnter={e=>{e.currentTarget.style.background='#4e584e';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='#5E685E';e.currentTarget.style.transform='translateY(0)'}}>
            <Plus size={14}/>{isHe?'הוסף משימה':'Add Task'}
          </button>
        </div>
      </div>

      {/* ── Metrics ──────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
        {metrics.map((m,i)=>(
          <div key={i} style={{...C,padding:'24px 26px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <p style={lbl}>{isHe?m.he:m.en}</p>
              <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'3px 8px',borderRadius:'20px',background:m.up?'rgba(94,104,94,0.10)':'rgba(180,80,80,0.09)',...F,fontSize:'10px',fontWeight:600,color:m.up?'#3d5c3d':'#8a3535'}}>
                {m.up?<TrendingUp size={9}/>:<TrendingDown size={9}/>}{m.trend}
              </span>
            </div>
            <p style={{...num,fontSize:'38px',marginBottom:'5px',color:m.c}}>{m.val}</p>
            <p style={{...F,fontSize:'11px',color:'#A7B0A2'}}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Events Banner ─────────────── */}
      {todayEvents.length > 0 && (
        <div style={{...C,padding:'16px 22px',background:'rgba(94,104,94,0.04)',borderColor:'rgba(94,104,94,0.18)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
            <span style={{fontSize:'14px'}}>📅</span>
            <p style={{...FG,fontSize:'17px',color:'#1E1E1C'}}>{isHe?`סקירה יומית — ${new Date().toLocaleDateString('he-IL',{day:'numeric',month:'long'})}`:`Today's Schedule — ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long'})}`}</p>
            <span style={{...F,fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:'rgba(94,104,94,0.12)',color:'#5E685E',fontWeight:600,marginInlineStart:'auto'}}>
              {todayEvents.length} {isHe?'אירועים מלוח שנה':'events from planner'}
            </span>
          </div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            {todayEvents.map(evt=>{
              const mins = minutesUntil(new Date(evt.start).toTimeString().slice(0,5))
              const urgent = mins !== null && mins > 0 && mins < 30
              return(
                <div key={evt.id} style={{padding:'8px 14px',borderRadius:'10px',background: urgent ? 'rgba(220,38,38,0.06)' : '#fff',border:`1px solid ${urgent?'rgba(220,38,38,0.2)':'rgba(94,104,94,0.12)'}`,display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontSize:'11px'}}>{PLATICON[evt.platform]||'📌'}</span>
                  <span style={{...F,fontSize:'12px',fontWeight:600,color:urgent?'#dc2626':'#5E685E'}}>{new Date(evt.start).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</span>
                  <span style={{...F,fontSize:'12px',color:'#1E1E1C'}}>{evt.title}</span>
                  {evt.clientName&&<span style={{...F,fontSize:'10px',color:'#A7B0A2'}}>· {evt.clientName}</span>}
                  {urgent&&<span style={{...F,fontSize:'9px',padding:'1px 6px',borderRadius:20,background:'rgba(220,38,38,0.1)',color:'#dc2626',fontWeight:700}}>⚡ {mins}ד׳</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Portfolio table ───────────────────── */}
      <div style={{...C,padding:'0',overflow:'hidden'}}>
        <div style={{padding:'18px 24px',borderBottom:'1px solid #E2DBD2',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{...FG,fontSize:'18px',fontWeight:400,color:'#1E1E1C',marginBottom:'2px',letterSpacing:'0.01em'}}>{isHe?'פורטפוליו אסטרטגי':'Strategic Portfolio'}</p>
            <p style={{...F,fontSize:'11px',color:'#A7B0A2'}}>
              {search ? (isHe?`${filteredClients.length} תוצאות`:`${filteredClients.length} results`) : (isHe?`${clients.length} לקוחות פעילים`:`${clients.length} active clients`)}
            </p>
          </div>
          <button onClick={()=>setModal('client')} style={primaryBtn}
            onMouseEnter={e=>{e.currentTarget.style.background='#4e584e';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='#5E685E';e.currentTarget.style.transform='translateY(0)'}}>
            <Plus size={13}/>{isHe?'לקוח חדש':'New Client'}
          </button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',direction:dir}}>
            <thead>
              <tr>
                {[isHe?'לקוח':'Client',isHe?'פלטפורמה':'Platform',isHe?'ביצועים':'Performance',isHe?'מגמה':'Trend',isHe?'ביצוע הבא':'Next Post',isHe?'סטטוס':'Status',isHe?'משימות':'Tasks',isHe?'פעולות':'Actions'].map((h,i)=><th key={i} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? <EmptyState isHe={isHe}/> : filteredClients.map(c => {
                const bd  = BADGE[c.badge] || BADGE.pending
                const sc  = c.status==='high'?'#5E685E':c.status==='medium'?'#8a7a5a':'#8a3535'
                const stats = getClientStats(c.id)
                return (
                  <tr key={c.id} style={{borderTop:'1px solid #E2DBD2',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(232,225,216,0.35)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',flexDirection:isHe?'row-reverse':'row',justifyContent:'flex-end'}}>
                        <div>
                          <p style={{...F,fontSize:'13.5px',fontWeight:500,color:'#1E1E1C',marginBottom:'2px'}}>{c.name}</p>
                          {c.aiStrategy&&<p style={{...F,fontSize:'10px',color:'#A7B0A2'}}>✦ {c.aiStrategy?.slice(0,50)}</p>}
                          {stats.hasStrategy&&<p style={{...F,fontSize:'9px',color:'#5E685E',fontWeight:600}}>🧠 {isHe?'אסטרטגיה פעילה':'Active strategy'}</p>}
                        </div>
                        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:sc,flexShrink:0,boxShadow:`0 0 6px ${sc}40`}}/>
                      </div>
                    </td>
                    <td style={{padding:'14px 18px'}}><p style={{...F,fontSize:'12.5px',color:'#5B5B57'}}>{c.platform}</p></td>
                    <td style={{padding:'14px 18px',minWidth:'120px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{flex:1,height:'3px',background:'rgba(30,30,28,0.07)',borderRadius:'3px'}}>
                          <div style={{width:`${c.engagement||50}%`,height:'100%',background:sc,borderRadius:'3px'}}/>
                        </div>
                        <span style={{...num,fontSize:'12px',color:sc,minWidth:'32px'}}>{c.engagement||50}%</span>
                      </div>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'3px 9px',borderRadius:'20px',background:c.up?'rgba(94,104,94,0.10)':'rgba(180,80,80,0.09)',...F,fontSize:'11px',fontWeight:600,color:c.up?'#3d5c3d':'#8a3535'}}>
                        {c.up?<TrendingUp size={9}/>:<TrendingDown size={9}/>}{c.trend||'+0%'}
                      </span>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                        <Clock size={11} color='#C5BDB4'/>
                        <p style={{...F,fontSize:'12px',color:'#5B5B57'}}>{isHe?c.nextPost:c.nextPostEn}</p>
                      </div>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <span style={{...F,fontSize:'10.5px',fontWeight:500,padding:'3px 10px',borderRadius:'20px',background:bd.bg,color:bd.c}}>
                        {isHe?bd.he:bd.en}
                      </span>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <span style={{...num,fontSize:'14px'}}>{stats.openTasks||c.tasks||0}</span>
                    </td>
                    <td style={{padding:'14px 18px'}}>
                      <div style={{display:'flex',gap:'5px',flexDirection:isHe?'row-reverse':'row'}}>
                        {[
                          {icon:<Eye size={12}/>,    c:'#5E685E',bg:'rgba(94,104,94,0.08)',   fn:()=>{setViewClient(c);setModal('view')}},
                          {icon:<Edit2 size={12}/>,  c:'#8a7a5a',bg:'rgba(180,154,116,0.08)', fn:()=>{}},
                          {icon:<Trash2 size={12}/>, c:'#8a3535',bg:'rgba(180,80,80,0.07)',   fn:()=>deleteClient(c.id)},
                        ].map((b,i)=>(
                          <button key={i} onClick={b.fn} style={iBtn(b.c,b.bg)}
                            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            {b.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Daily Tasks + AI Insights ─────────── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 268px',gap:'14px'}}>

        {/* Daily Tasks (replaces "תזרים אסטרטגי") */}
        <div style={{...C,padding:'0',overflow:'hidden'}}>
          <div style={{padding:'16px 22px',borderBottom:'1px solid #E2DBD2',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{...FG,fontSize:'17px',fontWeight:400,color:'#1E1E1C',marginBottom:'2px'}}>{isHe?'משימות יומיות':'Daily Tasks'}</p>
              <p style={{...F,fontSize:'11px',color:'#A7B0A2'}}>{isHe?`${openTasks} פתוחות · ${doneTasks} הושלמו · מתעדכן אוטומטית מהאסטרטגיה`:`${openTasks} open · ${doneTasks} done · auto-updated from strategy`}</p>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setFocus(f=>!f)} style={{...F,fontSize:'11px',padding:'7px 14px',borderRadius:'10px',fontWeight:500,border:`1px solid ${focus?'#1E1E1C':'#E2DBD2'}`,background:focus?'#1E1E1C':'transparent',color:focus?'white':'#5B5B57',cursor:'pointer',transition:'all 0.2s'}}>
                {focus?`🎯 ${isHe?'מיקוד':'Focus'}`:isHe?'מצב מיקוד':'Focus Mode'}
              </button>
              <button onClick={()=>setModal('task')} style={{...primaryBtn,padding:'7px 14px',fontSize:'11px'}}>
                <Plus size={11}/>{isHe?'חדש':'New'}
              </button>
            </div>
          </div>
          <div>
            {dailyTasks.length === 0 ? (
              <div style={{padding:'40px',textAlign:'center'}}>
                <p style={{...FG,fontSize:'16px',color:'#C5BDB4',marginBottom:8}}>{isHe?'אין משימות להיום':'No tasks today'}</p>
                <p style={{...F,fontSize:'12px',color:'#A7B0A2'}}>{isHe?'צרי אסטרטגיה ויתעדכן אוטומטית':'Create a strategy and it will auto-populate'}</p>
              </div>
            ) : (focus ? dailyTasks.filter(t => (t.priority==='urgent'||t.p==='urgent') && !t.done) : dailyTasks).map(task => {
              const pr     = task.priority || task.p || 'medium'
              const pc     = PC[pr] || PC.medium
              const mins   = minutesUntil(task.time)
              const urgent = mins !== null && mins > 0 && mins < 30
              const isAuto = task.source === 'strategy'
              return (
                <div key={task.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 22px',borderBottom:'1px solid #E2DBD2',transition:'background 0.15s',background:isAuto?'rgba(94,104,94,0.025)':urgent?'rgba(220,38,38,0.02)':'transparent'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(232,225,216,0.3)'}
                  onMouseLeave={e=>e.currentTarget.style.background=isAuto?'rgba(94,104,94,0.025)':urgent?'rgba(220,38,38,0.02)':'transparent'}>
                  <button onClick={()=>toggleTask(task.id)} style={{width:'16px',height:'16px',borderRadius:'4px',flexShrink:0,border:`1.5px solid ${task.done?'#5E685E':'rgba(30,30,28,0.18)'}`,background:task.done?'#5E685E':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}>
                    {task.done&&<span style={{color:'white',fontSize:'9px',fontWeight:700}}>✓</span>}
                  </button>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                      {task.platform&&<span style={{fontSize:'11px'}}>{PLATICON[task.platform]||'📌'}</span>}
                      <p style={{...F,fontSize:'13px',fontWeight:task.done?400:500,color:task.done?'#C5BDB4':'#1E1E1C',textDecoration:task.done?'line-through':'none'}}>
                        {task.title||task.text||task.he||''}
                      </p>
                      {isAuto&&<span style={{...F,fontSize:'9px',padding:'1px 7px',borderRadius:'6px',background:'rgba(94,104,94,0.10)',color:'#5E685E',fontWeight:600}}>🧠 {isHe?'אסטרטגיה':'Strategy'}</span>}
                      {urgent&&!task.done&&<span style={{...F,fontSize:'9px',padding:'1px 6px',borderRadius:20,background:'rgba(220,38,38,0.1)',color:'#dc2626',fontWeight:700}}>⚡ {mins}{isHe?'ד׳':'m'}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      {task.clientName&&<span style={{...F,fontSize:'10px',color:'#A7B0A2'}}>{task.clientName}</span>}
                      {task.time&&<span style={{...F,fontSize:'10px',color:'#A7B0A2',display:'flex',alignItems:'center',gap:'2px'}}><Clock size={8}/>{task.time}</span>}
                      {task.reminder&&!isAuto&&<span style={{...F,fontSize:'9px',color:'#8a7a5a',display:'flex',alignItems:'center',gap:'3px',background:'rgba(180,154,116,0.09)',padding:'2px 7px',borderRadius:'6px'}}><Bell size={8}/>{isHe?'תזכורת':'Reminder'}</span>}
                    </div>
                  </div>
                  <span style={{...F,fontSize:'10px',fontWeight:500,padding:'3px 9px',borderRadius:'10px',background:pc.bg,color:pc.c,flexShrink:0}}>{isHe?pc.he:pc.en}</span>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button style={iBtn('#5E685E','transparent')} onClick={()=>toggleTask(task.id)}><CheckCircle size={12}/></button>
                    {!isAuto&&<button style={iBtn('#8a3535','transparent')} onClick={()=>deleteTask(task.id)}><Trash2 size={12}/></button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Insights panel */}
        <div style={{borderRadius:'14px',border:'1px solid rgba(180,154,116,0.20)',background:'rgba(255,255,255,0.78)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',padding:'22px 18px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,right:0,left:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(180,154,116,0.4),rgba(94,104,94,0.3),transparent)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'18px'}}>
            <span style={{color:'#B49A74',fontSize:'13px'}}>✦</span>
            <p style={{...FG,fontSize:'17px',fontWeight:400,color:'#1E1E1C'}}>{isHe?'תובנות AI':'AI Insights'}</p>
          </div>
          {clients.length === 0 ? (
            <p style={{...F,fontSize:'12px',color:'#A7B0A2',lineHeight:1.8}}>{isHe?'הוסף לקוחות לקבלת תובנות AI.':'Add clients to receive AI insights.'}</p>
          ) : [
            { icon:'📅', he:'סנכרון לוח שנה', en:'Planner Sync',   textHe:`${scheduledEvts} אירועים מסונכרנים אוטומטית`,         textEn:`${scheduledEvts} events auto-synced`,        c:'#5E685E' },
            { icon:'🧠', he:'אסטרטגיה',        en:'Strategy',        textHe:`${clients.filter(c=>getStrategy(c.id)).length} לקוחות עם אסטרטגיה פעילה`, textEn:`${clients.filter(c=>getStrategy(c.id)).length} clients with active strategy`, c:'#1E1E1C' },
            { icon:'🔔', he:'משימות יומיות',   en:'Daily Tasks',     textHe:`${openTasks} משימות פתוחות להיום.`,                  textEn:`${openTasks} tasks open today.`,             c:'#8a7a5a' },
            { icon:'💡', he:'טיפ יומי',        en:'Daily Tip',
              textHe:['שעות שיא ב-Instagram: 07:00, 12:00, 19:00','קאפשן עם שאלה מגדיל מעורבות ב-48%','ריל 15-30 שניות = פי 3 חשיפה','Stories יומי שומר engagement גבוה'][new Date().getDay()%4],
              textEn:['Peak hours on Instagram: 7am, 12pm, 7pm','Caption with question = 48% more engagement','15-30s reel = 3x more reach','Daily stories keep engagement high'][new Date().getDay()%4],
              c:'#B49A74' },
          ].map((ins,i)=>(
            <div key={i} style={{background:'rgba(247,244,239,0.7)',borderRadius:'10px',padding:'12px 13px',marginBottom:'9px',border:'1px solid rgba(226,219,210,0.6)'}}>
              <p style={{...lbl,marginBottom:'5px',color:'#B49A74'}}>{ins.icon} {isHe?ins.he:ins.en}</p>
              <p style={{...F,fontSize:'12px',color:ins.c,lineHeight:1.7}}>{isHe?ins.textHe:ins.textEn}</p>
            </div>
          ))}
        </div>
      </div>


      {/* ── Modals ───────────────────────────── */}
      {(modal==='client'||modal==='task'||modal==='view') && (
        <div style={{position:'fixed',inset:0,background:'rgba(30,30,28,0.38)',backdropFilter:'blur(8px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',direction:dir}}
          onClick={()=>{setModal(null);setViewClient(null)}}>
          <div style={{...C,padding:'34px',width:'440px',maxWidth:'92vw'}} onClick={e=>e.stopPropagation()}>

            {/* View client */}
            {modal==='view' && viewClient && (<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px'}}>
                <p style={{...FG,fontSize:'22px',fontWeight:400,color:'#1E1E1C'}}>{viewClient.name}</p>
                <button onClick={()=>{setModal(null);setViewClient(null)}} style={{background:'none',border:'none',cursor:'pointer',color:'#C5BDB4',display:'flex'}}><X size={17}/></button>
              </div>
              {[
                {l:isHe?'פלטפורמה':'Platform',        v:viewClient.platform},
                {l:isHe?'מעורבות':'Engagement',        v:`${viewClient.engagement||0}%`},
                {l:isHe?'מגמה':'Trend',                v:viewClient.trend||'—'},
                {l:isHe?'סטטוס':'Status',              v:isHe?BADGE[viewClient.badge]?.he:BADGE[viewClient.badge]?.en},
                {l:isHe?'אסטרטגיה':'Has Strategy',    v:getStrategy(viewClient.id)?'✓ פעילה':'—'},
                {l:isHe?'נוצר':'Created',              v:viewClient.createdAt||'—'},
                {l:isHe?'תוכן AI':'AI Strategy',       v:viewClient.aiStrategy||'—'},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #E2DBD2'}}>
                  <p style={{...F,fontSize:'11px',color:'#A7B0A2'}}>{r.l}</p>
                  <p style={{...F,fontSize:'13px',color:'#1E1E1C',fontWeight:500,textAlign:'start',maxWidth:'55%'}}>{r.v}</p>
                </div>
              ))}
            </>)}

            {/* Add Client */}
            {modal==='client' && (<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'26px'}}>
                <p style={{...FG,fontSize:'22px',fontWeight:400,color:'#1E1E1C'}}>{isHe?'לקוח חדש':'New Client'}</p>
                <button onClick={()=>setModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#C5BDB4',display:'flex'}}><X size={17}/></button>
              </div>
              <div style={{marginBottom:'16px'}}>
                <p style={{...lbl,marginBottom:'7px'}}>{isHe?'שם הלקוח':'Client Name'} *</p>
                <input value={newClient.name} onChange={e=>setNewClient(p=>({...p,name:e.target.value}))} placeholder={isHe?'Villa Azure, Kempinski...':'Villa Azure, Kempinski...'} style={INPUT}
                  onFocus={e=>{e.target.style.borderColor='#5E685E';e.target.style.boxShadow='0 0 0 3px rgba(94,104,94,0.11)'}}
                  onBlur={e=>{e.target.style.borderColor='#E2DBD2';e.target.style.boxShadow='none'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
                {[
                  {label:isHe?'פלטפורמה':'Platform',key:'platform',opts:PLATFORMS.map(p=>({v:p,l:p}))},
                  {label:isHe?'סטטוס':'Status',    key:'status',  opts:Object.entries(BADGE).map(([k,v])=>({v:k,l:isHe?v.he:v.en}))},
                ].map(f=>(
                  <div key={f.key}>
                    <p style={{...lbl,marginBottom:'7px'}}>{f.label}</p>
                    <select value={newClient[f.key]} onChange={e=>setNewClient(p=>({...p,[f.key]:e.target.value}))} style={INPUT}>
                      {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{padding:'13px 15px',marginBottom:'22px',background:'rgba(94,104,94,0.06)',borderRadius:'10px',border:'1px solid rgba(180,154,116,0.15)'}}>
                <p style={{...F,fontSize:'12px',color:'#5E685E',lineHeight:1.7}}>✦ {isHe?'הסוכן החכם יבנה אסטרטגיית תוכן ראשונית ללקוח זה':'The AI agent will build an initial content strategy'}</p>
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>setModal(null)} style={{flex:1,padding:'11px',borderRadius:'10px',border:'1px solid #E2DBD2',background:'transparent',color:'#5B5B57',...F,fontSize:'13px',fontWeight:400,cursor:'pointer'}}>{isHe?'ביטול':'Cancel'}</button>
                <button onClick={addClient} style={{flex:1,padding:'11px',borderRadius:'10px',border:'none',background:newClient.name.trim()?'#5E685E':'rgba(94,104,94,0.3)',color:'white',...F,fontSize:'13px',fontWeight:500,cursor:newClient.name.trim()?'pointer':'default',boxShadow:newClient.name.trim()?'0 3px 12px rgba(94,104,94,0.25)':'none'}}>
                  {isHe?'הוסף + AI':'Add + AI'}
                </button>
              </div>
            </>)}

            {/* Add Task */}
            {modal==='task' && (<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'26px'}}>
                <p style={{...FG,fontSize:'22px',fontWeight:400,color:'#1E1E1C'}}>{isHe?'משימה יומית':'Daily Task'}</p>
                <button onClick={()=>setModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#C5BDB4',display:'flex'}}><X size={17}/></button>
              </div>
              <div style={{marginBottom:'16px'}}>
                <p style={{...lbl,marginBottom:'7px'}}>{isHe?'תיאור המשימה':'Task Description'}</p>
                <input value={newTask.text} onChange={e=>setNewTask(p=>({...p,text:e.target.value}))} placeholder={isHe?'מה יש לעשות?':'What needs to be done?'} style={INPUT}
                  onFocus={e=>{e.target.style.borderColor='#5E685E';e.target.style.boxShadow='0 0 0 3px rgba(94,104,94,0.11)'}}
                  onBlur={e=>{e.target.style.borderColor='#E2DBD2';e.target.style.boxShadow='none'}}
                  onKeyDown={e=>e.key==='Enter'&&addTask()}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'24px'}}>
                <div>
                  <p style={{...lbl,marginBottom:'7px'}}>{isHe?'שעה':'Time'}</p>
                  <input type="time" value={newTask.time} onChange={e=>setNewTask(p=>({...p,time:e.target.value}))} style={INPUT}/>
                </div>
                <div>
                  <p style={{...lbl,marginBottom:'7px'}}>{isHe?'לקוח':'Client'}</p>
                  <select value={newTask.client} onChange={e=>setNewTask(p=>({...p,client:e.target.value}))} style={INPUT}>
                    <option value=''>{isHe?'כללי':'General'}</option>
                    {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{...lbl,marginBottom:'7px'}}>{isHe?'עדיפות':'Priority'}</p>
                  <select value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))} style={INPUT}>
                    {PRIORITIES.map(pr=><option key={pr} value={pr}>{isHe?PC[pr].he:PC[pr].en}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>setModal(null)} style={{flex:1,padding:'11px',borderRadius:'10px',border:'1px solid #E2DBD2',background:'transparent',color:'#5B5B57',...F,fontSize:'13px',cursor:'pointer'}}>{isHe?'ביטול':'Cancel'}</button>
                <button onClick={addTask} style={{flex:1,padding:'11px',borderRadius:'10px',border:'none',background:newTask.text.trim()?'#5E685E':'rgba(94,104,94,0.3)',color:'white',...F,fontSize:'13px',fontWeight:500,cursor:newTask.text.trim()?'pointer':'default',boxShadow:newTask.text.trim()?'0 3px 12px rgba(94,104,94,0.25)':'none'}}>
                  {isHe?'שמור':'Save'}
                </button>
              </div>
            </>)}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  )
} 