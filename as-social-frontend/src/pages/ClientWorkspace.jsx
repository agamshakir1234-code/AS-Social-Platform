import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ChevronRight, Plus, X, Trash2, Clock, Edit3,
  TrendingUp, Upload, Image, Calendar, Target, Palette,
  BarChart2, CheckSquare, Grid, Download, Sparkles,
  FolderOpen, Save, Check, Copy, ExternalLink, Hash,
  Layers, Shield, Star, RefreshCw, Bell, Play
} from 'lucide-react'

/* ── Tokens ──────────────────────────────────── */
const COLOR = {
  dark:'#3A443A', sage:'#6D7B6C', cream:'#F2EDE4',
  stone:'#BFB3A6', warm:'#A68B7D', gold:'#B49A74',
}
const C   = { background:'#FFFFFF', borderRadius:'14px', border:`1px solid ${COLOR.stone}30`, boxShadow:'0 2px 12px rgba(58,68,58,0.06)' }
const F   = { fontFamily:"'Inter','Heebo',sans-serif" }
const FG  = { fontFamily:"'Cormorant Garamond',serif" }
const lbl = { ...F, fontSize:'10px', fontWeight:600, color:COLOR.stone, textTransform:'uppercase', letterSpacing:'0.12em' }
const INP = { ...F, width:'100%', padding:'10px 13px', border:`1px solid ${COLOR.stone}40`, borderRadius:'10px', fontSize:'13px', color:COLOR.dark, background:'#FDFCF9', outline:'none', transition:'all 0.2s', boxSizing:'border-box' }

const TABS = [
  { id:'overview',  icon:BarChart2,   he:'סקירה',      en:'Overview'    },
  { id:'strategy',  icon:Target,      he:'אסטרטגיה',   en:'Strategy'    },
  { id:'brand',     icon:Palette,     he:'שפת מותג',   en:'Brand'       },
  { id:'planner',   icon:Calendar,    he:'לוח תכנון',  en:'Planner'     },
  { id:'posts',     icon:Grid,        he:'תוכן',        en:'Content'     },
  { id:'tasks',     icon:CheckSquare, he:'משימות',      en:'Tasks'       },
  { id:'media',     icon:Image,       he:'מאגר מדיה',  en:'Media'       },
  { id:'analytics', icon:TrendingUp,  he:'אנליטיקה',   en:'Analytics'   },
]

const PLATCOLOR = {Instagram:'#E1306C',Facebook:'#1877F2',TikTok:'#000000',LinkedIn:'#0A66C2',YouTube:'#FF0000'}
const PLATICON  = {Instagram:'📸',Facebook:'📘',TikTok:'🎵',LinkedIn:'💼',YouTube:'▶️'}

/* ── Storage ─────────────────────────────────── */
const rj = k     => { try { return JSON.parse(localStorage.getItem(k)||'null') } catch { return null } }
const wj = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} }

function getClients()           { return rj('as_clients')||[] }
function getStrategy(cid)       { return rj(`strategy_${cid}`) }
function getBrand(cid)          { return rj(`brand_${cid}`) || {} }
function saveBrand(cid,data)    { wj(`brand_${cid}`,data); emitSync() }
function getPlanner(cid)        { return (rj('planner_events')||[]).filter(e=>e.clientId===cid) }
function getPosts(cid,plat)     { return rj(`feed_${cid}_${plat||'instagram'}`) || [] }
function getFiles(cid)          { return rj(`files_${cid}`) || [] }
function getDesigns(cid)        { return rj(`media_${cid}`) || [] }
function getTasks(cid)          { return rj(`tasks_${cid}`) || [] }
function saveTasks(cid,tasks)   { wj(`tasks_${cid}`,tasks); emitSync() }
function saveFiles(cid,files)   { wj(`files_${cid}`,files); emitSync() }
function emitSync()             { window.dispatchEvent(new StorageEvent('storage',{key:'__sync__'})) }

function updateClient(cid,patch) {
  const clients = getClients()
  const updated = clients.map(c=>c.id===cid?{...c,...patch}:c)
  wj('as_clients',updated)
  emitSync()
  return updated.find(c=>c.id===cid)
}

/* ── Sub components ──────────────────────────── */
function PillBadge({text,color='#5E685E'}) {
  return <span style={{...F,fontSize:'10px',fontWeight:600,padding:'3px 10px',borderRadius:20,background:`${color}12`,color,border:`1px solid ${color}25`}}>{text}</span>
}

function SectionCard({title,icon,children,action}) {
  return (
    <div style={{...C,padding:'18px 20px',marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {icon&&<span style={{fontSize:16}}>{icon}</span>}
          <p style={{...FG,fontSize:'17px',fontWeight:400,color:COLOR.dark,margin:0}}>{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function SmallBtn({onClick,children,variant='outline'}) {
  return (
    <button onClick={onClick} style={{...F,display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${variant==='primary'?COLOR.sage:COLOR.stone+'50'}`,background:variant==='primary'?COLOR.sage:'transparent',color:variant==='primary'?'#fff':COLOR.dark,fontSize:'11px',fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>
      {children}
    </button>
  )
}

function EmptyState({emoji='📭',title,subtitle,action}) {
  return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:40,marginBottom:12}}>{emoji}</div>
      <p style={{...FG,fontSize:'18px',color:COLOR.dark,marginBottom:6}}>{title}</p>
      {subtitle&&<p style={{...F,fontSize:'12px',color:COLOR.stone,marginBottom:16}}>{subtitle}</p>}
      {action}
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function ClientWorkspace() {
  const { id }   = useParams()
  const nav      = useNavigate()
  const ctx      = useOutletContext()||{}
  const isHe     = (ctx.lang||'he') !== 'en'

  const [client,    setClient]    = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [strategy,  setStrategy]  = useState(null)
  const [brand,     setBrandData] = useState({})
  const [planner,   setPlanner]   = useState([])
  const [tasks,     setTasks]     = useState([])
  const [files,     setFiles]     = useState([])
  const [designs,   setDesigns]   = useState([])
  const [toast,     setToast]     = useState(null)
  const [newTask,   setNewTask]   = useState({title:'',priority:'medium',time:'09:00'})
  const [showTask,  setShowTask]  = useState(false)
  const [editBrand, setEditBrand] = useState(false)
  const [brandDraft,setBrandDraft]= useState({})
  const fileRef = useRef()

  const load = useCallback(()=>{
    const clients = getClients()
    const c = clients.find(cl=>String(cl.id)===String(id))
    if (!c) { nav('/clients'); return }
    setClient(c)
    setStrategy(getStrategy(id))
    setBrandData(getBrand(id))
    setBrandDraft(getBrand(id))
    setPlanner(getPlanner(id))
    setTasks(getTasks(id))
    setFiles(getFiles(id))
    setDesigns(getDesigns(id))
  },[id, nav])

  useEffect(()=>{
    load()
    const handler=()=>load()
    window.addEventListener('storage',handler)
    return ()=>window.removeEventListener('storage',handler)
  },[load])

  function showToast(msg,type='success') { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  /* ── Tasks ────────────────────────────────── */
  function addTask() {
    if (!newTask.title) return
    const t={id:`t_${Date.now()}`,...newTask,done:false,date:new Date().toDateString(),clientId:id}
    const updated=[t,...tasks]
    setTasks(updated); saveTasks(id,updated)
    setNewTask({title:'',priority:'medium',time:'09:00'}); setShowTask(false)
    showToast(isHe?'משימה נוספה ✅':'Task added ✅')
  }
  function toggleTask(tid) {
    const u=tasks.map(t=>t.id===tid?{...t,done:!t.done}:t)
    setTasks(u); saveTasks(id,u)
  }
  function deleteTask(tid) {
    const u=tasks.filter(t=>t.id!==tid)
    setTasks(u); saveTasks(id,u)
  }

  /* ── Brand ────────────────────────────────── */
  function saveBrandEdit() {
    saveBrand(id,brandDraft)
    setBrandData(brandDraft)
    updateClient(id,{brand:{colors:brandDraft.customColors,font:brandDraft.font?.heading,tagline:brandDraft.tagline}})
    setEditBrand(false)
    showToast(isHe?'שפת מותג נשמרה ✅':'Brand saved ✅')
    load()
  }

  /* ── Media upload ─────────────────────────── */
  function handleUpload(fileList) {
    const arr = Array.from(fileList)
    let pending = arr.length
    arr.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = e => {
        const entry = {
          id: `f_${Date.now()}_${idx}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          savedAt: new Date().toISOString()
        }
        // Use functional update to avoid stale closure
        setFiles(prev => {
          const updated = [entry, ...prev]
          saveFiles(id, updated)
          return updated
        })
        pending--
        if (pending === 0) showToast(isHe ? `${arr.length} קבצים הועלו ✅` : `${arr.length} files uploaded ✅`)
      }
      reader.readAsDataURL(file)
    })
  }

  function renameFile(fid) {
    const file = files.find(f => f.id === fid)
    if (!file) return
    const newName = prompt(isHe ? 'שם חדש לקובץ:' : 'New file name:', file.name)
    if (!newName || newName === file.name) return
    const u = files.map(f => f.id === fid ? {...f, name: newName} : f)
    setFiles(u); saveFiles(id, u)
    showToast(isHe ? 'שם עודכן ✅' : 'Renamed ✅')
  }

  function deleteFile(fid) {
    const u=files.filter(f=>f.id!==fid)
    setFiles(u); saveFiles(id,u)
  }

  if (!client) return <div style={{padding:40,textAlign:'center',...F,color:COLOR.stone}}>טוען...</div>

  const upcomingEvents = planner.filter(e=>new Date(e.start)>=new Date()).sort((a,b)=>new Date(a.start)-new Date(b.start))
  const openTasks      = tasks.filter(t=>!t.done).length
  const allPosts       = ['instagram','facebook','tiktok','linkedin'].flatMap(p=>getPosts(id,p))

  /* ── Render tabs ──────────────────────────── */

  /* OVERVIEW */
  const renderOverview = ()=>(
    <div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:isHe?'אירועים קרובים':'Upcoming',  val:upcomingEvents.length, icon:'📅',color:COLOR.sage},
          {label:isHe?'משימות פתוחות':'Open Tasks',  val:openTasks,             icon:'✅',color:COLOR.warm},
          {label:isHe?'מלוח שנה':'Planner',         val:planner.length,        icon:'📋',color:COLOR.gold},
          {label:isHe?'מדיה':'Media',                val:files.length+designs.length,icon:'🖼️',color:COLOR.sage},
        ].map((s,i)=>(
          <div key={i} style={{...C,padding:'16px 18px',borderTop:`3px solid ${s.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <p style={{...lbl}}>{s.label}</p>
              <span style={{fontSize:18}}>{s.icon}</span>
            </div>
            <p style={{...FG,fontSize:'28px',color:s.color,margin:0}}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {/* Upcoming events */}
        <SectionCard title={isHe?'אירועים קרובים':'Upcoming Events'} icon="📅"
          action={<SmallBtn onClick={()=>nav('/planner')}><ExternalLink size={10}/>{isHe?'לוח שנה':'Planner'}</SmallBtn>}>
          {upcomingEvents.length===0
            ? <p style={{...F,fontSize:'12px',color:COLOR.stone}}>{isHe?'אין אירועים קרובים. צרי אסטרטגיה!':'No events. Create a strategy!'}</p>
            : upcomingEvents.slice(0,5).map(evt=>(
              <div key={evt.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${COLOR.stone}15`}}>
                <div style={{width:3,height:32,borderRadius:2,background:PLATCOLOR[evt.platform]||COLOR.sage,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{...F,fontSize:'12px',fontWeight:600,color:COLOR.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{evt.title}</p>
                  <p style={{...F,fontSize:'10px',color:COLOR.stone}}>{PLATICON[evt.platform]||'📌'} {evt.platform} · {new Date(evt.start).toLocaleDateString('he-IL',{day:'numeric',month:'short'})} {new Date(evt.start).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              </div>
            ))
          }
        </SectionCard>

        {/* Strategy summary */}
        <SectionCard title={isHe?'אסטרטגיה':'Strategy'} icon="🧠"
          action={<SmallBtn onClick={()=>nav('/ai-strategy')}><ExternalLink size={10}/>{isHe?'פתח':'Open'}</SmallBtn>}>
          {strategy
            ? <div>
                <p style={{...F,fontSize:'12px',color:COLOR.dark,lineHeight:1.7,marginBottom:10}}>{strategy.executiveSummary?.slice(0,180)}...</p>
                {strategy.monthlyTheme&&<PillBadge text={`🌟 ${strategy.monthlyTheme}`} color={COLOR.gold}/>}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
                  {strategy.contentPillars?.slice(0,3).map((p,i)=>(
                    <PillBadge key={i} text={`${p.name} ${p.percentage}%`} color={COLOR.sage}/>
                  ))}
                </div>
              </div>
            : <div>
                <p style={{...F,fontSize:'12px',color:COLOR.stone,marginBottom:10}}>{isHe?'אין אסטרטגיה עדיין':'No strategy yet'}</p>
                <SmallBtn variant="primary" onClick={()=>nav('/ai-strategy')}><Sparkles size={10}/>{isHe?'צרי אסטרטגיה':'Create Strategy'}</SmallBtn>
              </div>
          }
        </SectionCard>

        {/* Tasks */}
        <SectionCard title={isHe?'משימות':'Tasks'} icon="✅"
          action={<SmallBtn onClick={()=>setActiveTab('tasks')}>{isHe?'הכל':'All'}</SmallBtn>}>
          {tasks.slice(0,4).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:`1px solid ${COLOR.stone}15`}}>
              <button onClick={()=>toggleTask(t.id)} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?COLOR.sage:COLOR.stone+'60'}`,background:t.done?COLOR.sage:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {t.done&&<Check size={9} color="#fff"/>}
              </button>
              <p style={{...F,fontSize:'12px',color:t.done?COLOR.stone:COLOR.dark,textDecoration:t.done?'line-through':'none',flex:1}}>{t.title}</p>
              {t.time&&<span style={{...F,fontSize:'9px',color:COLOR.stone,display:'flex',alignItems:'center',gap:2}}><Clock size={8}/>{t.time}</span>}
            </div>
          ))}
          {tasks.length===0&&<p style={{...F,fontSize:'12px',color:COLOR.stone}}>{isHe?'אין משימות':'No tasks'}</p>}
        </SectionCard>

        {/* Recent media */}
        <SectionCard title={isHe?'מדיה אחרונה':'Recent Media'} icon="🖼️"
          action={<SmallBtn onClick={()=>setActiveTab('media')}>{isHe?'הכל':'All'}</SmallBtn>}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
            {files.filter(f=>f.type?.startsWith('image/')).slice(0,8).map(f=>(
              <div key={f.id} style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',background:COLOR.cream}}>
                <img src={f.data} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
            ))}
            {files.filter(f=>f.type?.startsWith('image/')).length===0&&
              <div style={{gridColumn:'span 4',...F,fontSize:'12px',color:COLOR.stone}}>{isHe?'אין מדיה עדיין':'No media yet'}</div>
            }
          </div>
        </SectionCard>
      </div>
    </div>
  )

  /* STRATEGY */
  const renderStrategy = ()=>(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <SmallBtn variant="primary" onClick={()=>nav('/ai-strategy')}>
          <Sparkles size={10}/>{isHe?strategy?'עדכן אסטרטגיה':'צרי אסטרטגיה':strategy?'Update':'Create Strategy'}
        </SmallBtn>
      </div>

      {!strategy ? (
        <EmptyState emoji="🧠" title={isHe?'אין אסטרטגיה עדיין':'No strategy yet'}
          subtitle={isHe?'עברי למסך "צמיחה אסטרטגית" ליצירת תכנית שיווק מלאה':'Go to AI Strategy screen to create a full marketing plan'}
          action={<SmallBtn variant="primary" onClick={()=>nav('/ai-strategy')}><Sparkles size={10}/>{isHe?'צרי עכשיו':'Create Now'}</SmallBtn>}/>
      ) : (
        <div>
          {/* Executive summary */}
          <div style={{...C,padding:'20px',background:`linear-gradient(135deg,${COLOR.dark},${COLOR.sage})`,border:'none',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <Star size={16} color={COLOR.gold}/>
              <p style={{...FG,fontSize:'18px',color:'#fff',margin:0}}>תקציר מנהלים</p>
              <span style={{...F,fontSize:'9px',color:'rgba(255,255,255,0.6)',marginInlineStart:'auto'}}>{strategy.generatedAt&&new Date(strategy.generatedAt).toLocaleDateString('he-IL')}</span>
            </div>
            <p style={{...F,fontSize:'12px',color:'rgba(255,255,255,0.9)',lineHeight:1.7,margin:0}}>{strategy.executiveSummary}</p>
          </div>

          {/* Content pillars */}
          {strategy.contentPillars?.length>0&&(
            <SectionCard title={isHe?'עמודי תוכן':'Content Pillars'} icon="🏛️">
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                {strategy.contentPillars.map((p,i)=>{
                  const colors=[COLOR.sage,COLOR.gold,COLOR.warm,'#4A7C8E']
                  const color=colors[i%colors.length]
                  return(
                    <div key={i} style={{padding:'12px',borderRadius:10,background:COLOR.cream,borderTop:`3px solid ${color}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <p style={{...F,fontSize:'12px',fontWeight:700,color:COLOR.dark}}>{p.name}</p>
                        <span style={{...F,fontSize:'11px',fontWeight:700,color,background:`${color}15`,padding:'2px 8px',borderRadius:20}}>{p.percentage}%</span>
                      </div>
                      <p style={{...F,fontSize:'11px',color:COLOR.stone,lineHeight:1.5}}>{p.description}</p>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Core messages */}
          {strategy.coreMessages?.length>0&&(
            <SectionCard title={isHe?'מסרי ליבה':'Core Messages'} icon="💬">
              {strategy.coreMessages.map((m,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'10px',borderRadius:9,background:COLOR.cream,marginBottom:8}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:COLOR.sage,color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i+1}</div>
                  <p style={{...F,fontSize:'12px',color:COLOR.dark,lineHeight:1.6,margin:0}}>{m}</p>
                </div>
              ))}
            </SectionCard>
          )}

          {/* KPIs */}
          {strategy.kpis?.length>0&&(
            <SectionCard title="KPIs" icon="📊">
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {strategy.kpis.map((k,i)=>(
                  <div key={i} style={{padding:'12px',borderRadius:9,background:COLOR.cream,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <p style={{...F,fontSize:'11px',fontWeight:600,color:COLOR.dark,marginBottom:2}}>{k.metric}</p>
                      <p style={{...F,fontSize:'10px',color:COLOR.stone}}>{k.timeframe}</p>
                    </div>
                    <span style={{...F,fontSize:'13px',fontWeight:700,color:COLOR.sage,background:`${COLOR.sage}12`,padding:'3px 10px',borderRadius:20}}>{k.target}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Quick wins */}
          {strategy.quickWins?.length>0&&(
            <SectionCard title={isHe?'ניצחונות מהירים':'Quick Wins'} icon="⚡">
              {strategy.quickWins.map((w,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'9px',borderRadius:9,background:COLOR.cream,marginBottom:6}}>
                  <span style={{fontSize:14,flexShrink:0}}>⚡</span>
                  <p style={{...F,fontSize:'12px',color:COLOR.dark,margin:0,lineHeight:1.5}}>{w}</p>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  )

  /* BRAND */
  const renderBrand = ()=>(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:14}}>
        {editBrand
          ? <>
              <SmallBtn onClick={()=>{setEditBrand(false);setBrandDraft(brand)}}>{isHe?'ביטול':'Cancel'}</SmallBtn>
              <SmallBtn variant="primary" onClick={saveBrandEdit}><Save size={10}/>{isHe?'שמור':'Save'}</SmallBtn>
            </>
          : <>
              <SmallBtn onClick={()=>nav('/ai-strategy')}><Sparkles size={10}/>{isHe?'צור עם AI':'Generate with AI'}</SmallBtn>
              <SmallBtn variant="primary" onClick={()=>setEditBrand(true)}><Edit3 size={10}/>{isHe?'ערוך':'Edit'}</SmallBtn>
            </>
        }
      </div>

      {!Object.keys(brand).length&&!editBrand ? (
        <EmptyState emoji="🎨" title={isHe?'אין שפת מותג':'No brand identity'}
          subtitle={isHe?'עברי לצמיחה אסטרטגית ליצירת שפת מותג מלאה':'Go to AI Strategy to create a brand identity'}
          action={<SmallBtn variant="primary" onClick={()=>nav('/ai-strategy')}><Sparkles size={10}/>{isHe?'צור עכשיו':'Create Now'}</SmallBtn>}/>
      ) : (
        <div>
          {/* Color palette */}
          <SectionCard title={isHe?'צבעי מותג':'Brand Colors'} icon="🎨">
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
              {(editBrand?brandDraft.customColors||[]:brand.customColors||[]).map((c,i)=>(
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,position:'relative'}}>
                  {editBrand
                    ? <input type="color" value={c} onChange={e=>{const n=[...(brandDraft.customColors||[])];n[i]=e.target.value;setBrandDraft(b=>({...b,customColors:n}))}}
                        style={{width:48,height:48,borderRadius:10,border:`2px solid rgba(0,0,0,0.1)`,cursor:'pointer',padding:2}}/>
                    : <div style={{width:48,height:48,borderRadius:10,background:c,border:`2px solid rgba(0,0,0,0.08)`}}/>
                  }
                  <span style={{...F,fontSize:8,color:COLOR.stone}}>{c.toUpperCase()}</span>
                  {editBrand&&(
                    <button onClick={()=>{const n=(brandDraft.customColors||[]).filter((_,j)=>j!==i);setBrandDraft(b=>({...b,customColors:n}))}}
                      style={{position:'absolute',top:-6,right:-6,width:16,height:16,borderRadius:'50%',border:'none',background:'#dc2626',color:'#fff',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                  )}
                </div>
              ))}
              {editBrand&&(
                <button onClick={()=>setBrandDraft(b=>({...b,customColors:[...(b.customColors||[]),'#5E685E']}))}
                  style={{width:48,height:48,borderRadius:10,border:`2px dashed ${COLOR.stone}50`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:COLOR.stone}}>
                  <Plus size={16}/>
                </button>
              )}
            </div>
            {/* Preview bar */}
            {(brand.customColors||brandDraft.customColors||[]).length>0&&(
              <div style={{marginTop:12,height:24,borderRadius:8,overflow:'hidden',display:'flex'}}>
                {(editBrand?brandDraft.customColors:brand.customColors||[]).map((c,i)=><div key={i} style={{flex:1,background:c}}/>)}
              </div>
            )}
          </SectionCard>

          {/* Tagline + Voice */}
          <SectionCard title={isHe?'קול מותג':'Brand Voice'} icon="💬">
            {editBrand ? (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div><p style={{...lbl,marginBottom:5}}>{isHe?'סלוגן':'Tagline'}</p><input value={brandDraft.tagline||''} onChange={e=>setBrandDraft(b=>({...b,tagline:e.target.value}))} style={INP} placeholder={isHe?'5-8 מילים...':'5-8 words...'} onFocus={e=>e.target.style.borderColor=COLOR.sage} onBlur={e=>e.target.style.borderColor=COLOR.stone+'40'}/></div>
                <div><p style={{...lbl,marginBottom:5}}>{isHe?'חזון':'Vision'}</p><textarea value={brandDraft.vision||''} onChange={e=>setBrandDraft(b=>({...b,vision:e.target.value}))} rows={2} style={{...INP,resize:'none'}} onFocus={e=>e.target.style.borderColor=COLOR.sage} onBlur={e=>e.target.style.borderColor=COLOR.stone+'40'}/></div>
                <div><p style={{...lbl,marginBottom:5}}>DO ✅</p><textarea value={(brandDraft.doList||[]).join('\n')} onChange={e=>setBrandDraft(b=>({...b,doList:e.target.value.split('\n')}))} rows={3} style={{...INP,resize:'none'}} onFocus={e=>e.target.style.borderColor='#4CAF50'} onBlur={e=>e.target.style.borderColor=COLOR.stone+'40'}/></div>
                <div><p style={{...lbl,marginBottom:5}}>DON'T ❌</p><textarea value={(brandDraft.dontList||[]).join('\n')} onChange={e=>setBrandDraft(b=>({...b,dontList:e.target.value.split('\n')}))} rows={3} style={{...INP,resize:'none'}} onFocus={e=>e.target.style.borderColor='#dc2626'} onBlur={e=>e.target.style.borderColor=COLOR.stone+'40'}/></div>
              </div>
            ) : (
              <div>
                {brand.tagline&&<div style={{padding:'10px',background:COLOR.cream,borderRadius:9,marginBottom:10}}><p style={{...F,fontSize:'11px',color:COLOR.stone,marginBottom:4}}>סלוגן</p><p style={{...FG,fontSize:'16px',color:COLOR.dark}}>{brand.tagline}</p></div>}
                {brand.vision&&<p style={{...F,fontSize:'12px',color:COLOR.dark,lineHeight:1.6,marginBottom:10}}>{brand.vision}</p>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {brand.doList?.filter(Boolean).length>0&&(
                    <div style={{padding:'10px',background:'rgba(76,175,80,0.05)',borderRadius:9,border:'1px solid rgba(76,175,80,0.15)'}}>
                      <p style={{...lbl,color:'#4CAF50',marginBottom:6}}>✅ DO</p>
                      {brand.doList.filter(Boolean).map((d,i)=><p key={i} style={{...F,fontSize:'11px',color:COLOR.dark,marginBottom:3}}>· {d}</p>)}
                    </div>
                  )}
                  {brand.dontList?.filter(Boolean).length>0&&(
                    <div style={{padding:'10px',background:'rgba(220,38,38,0.04)',borderRadius:9,border:'1px solid rgba(220,38,38,0.12)'}}>
                      <p style={{...lbl,color:'#dc2626',marginBottom:6}}>❌ DON'T</p>
                      {brand.dontList.filter(Boolean).map((d,i)=><p key={i} style={{...F,fontSize:'11px',color:COLOR.dark,marginBottom:3}}>· {d}</p>)}
                    </div>
                  )}
                </div>
                {brand.keywords?.length>0&&(
                  <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap'}}>
                    {brand.keywords.map((k,i)=><PillBadge key={i} text={k} color={COLOR.sage}/>)}
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )

  /* PLANNER */
  const renderPlanner = ()=>(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:14}}>
        <SmallBtn variant="primary" onClick={()=>nav('/planner')}><ExternalLink size={10}/>{isHe?'פתח לוח שנה':'Open Planner'}</SmallBtn>
      </div>

      {planner.length===0 ? (
        <EmptyState emoji="📅" title={isHe?'לוח השנה ריק':'Planner is empty'}
          subtitle={isHe?'יצרי אסטרטגיה ותוכן יתסנכרן אוטומטית ללוח השנה':'Create a strategy and content will auto-sync to the planner'}/>
      ) : (
        <div>
          {/* Group by week */}
          {[...new Set(planner.map(e=>new Date(e.start).toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})).slice(0,1))].map(()=>null)}
          <SectionCard title={isHe?`${planner.length} אירועים בלוח`:`${planner.length} events in planner`} icon="📅">
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {planner.sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,20).map(evt=>{
                const platColor=PLATCOLOR[evt.platform]||COLOR.sage
                const isPast=new Date(evt.start)<new Date()
                return(
                  <div key={evt.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:isPast?'rgba(0,0,0,0.02)':COLOR.cream,opacity:isPast?0.6:1,border:`1px solid ${platColor}20`}}>
                    <div style={{width:3,height:40,borderRadius:2,background:platColor,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                        <span style={{fontSize:11}}>{PLATICON[evt.platform]||'📌'}</span>
                        <p style={{...F,fontSize:'12px',fontWeight:600,color:COLOR.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{evt.title}</p>
                        {evt.source==='strategy'&&<span style={{...F,fontSize:'9px',color:COLOR.sage,background:`${COLOR.sage}12`,padding:'1px 5px',borderRadius:4}}>🧠 AI</span>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{...F,fontSize:'10px',color:COLOR.stone,display:'flex',alignItems:'center',gap:3}}><Clock size={9}/>{new Date(evt.start).toLocaleDateString('he-IL',{day:'numeric',month:'short'})} {new Date(evt.start).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</span>
                        <PillBadge text={evt.type||evt.platform} color={platColor}/>
                      </div>
                      {evt.caption&&<p style={{...F,fontSize:'10px',color:COLOR.stone,marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{evt.caption.slice(0,80)}</p>}
                    </div>
                    <button onClick={()=>{navigator.clipboard.writeText(`${evt.caption||''}\n\n${evt.hashtags||''}`);showToast(isHe?'קאפשן הועתק!':'Caption copied!')}}
                      style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone,padding:4}}>
                      <Copy size={12}/>
                    </button>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )

  /* POSTS / CONTENT */
  const renderPosts = ()=>(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:14}}>
        <SmallBtn variant="primary" onClick={()=>nav('/feed-design')}><ExternalLink size={10}/>{isHe?'עיצוב פיד':'Feed Design'}</SmallBtn>
      </div>
      {['instagram','facebook','tiktok','linkedin'].map(plat=>{
        const posts=getPosts(id,plat)
        if(!posts.length) return null
        const platColor=PLATCOLOR[{instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',linkedin:'LinkedIn'}[plat]]||COLOR.sage
        return(
          <SectionCard key={plat} title={`${PLATICON[{instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',linkedin:'LinkedIn'}[plat]]} ${plat.charAt(0).toUpperCase()+plat.slice(1)}`} icon={null}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {posts.slice(0,6).map((post,i)=>(
                <div key={post.id||i} style={{borderRadius:10,background:COLOR.cream,padding:'10px',border:`1px solid ${platColor}15`}}>
                  {post.image&&<img src={post.image} alt="" style={{width:'100%',aspectRatio:'1',objectFit:'cover',borderRadius:7,marginBottom:6}}/>}
                  <p style={{...F,fontSize:'11px',fontWeight:600,color:COLOR.dark,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.topic||post.type||'פוסט'}</p>
                  {post.caption&&<p style={{...F,fontSize:'10px',color:COLOR.stone,lineHeight:1.4}}>{post.caption.slice(0,60)}...</p>}
                  {post.time&&<span style={{...F,fontSize:'9px',color:COLOR.stone,display:'flex',alignItems:'center',gap:3,marginTop:4}}><Clock size={8}/>{post.day} {post.time}</span>}
                </div>
              ))}
            </div>
          </SectionCard>
        )
      })}
      {allPosts.length===0&&(
        <EmptyState emoji="📝" title={isHe?'אין תוכן עדיין':'No content yet'}
          subtitle={isHe?'יצרי אסטרטגיה והפיד יתמלא אוטומטית':'Create a strategy and the feed will auto-populate'}/>
      )}
    </div>
  )

  /* TASKS */
  const renderTasks = ()=>(
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <SmallBtn variant="primary" onClick={()=>setShowTask(v=>!v)}><Plus size={10}/>{isHe?'משימה חדשה':'New Task'}</SmallBtn>
      </div>

      {showTask&&(
        <div style={{...C,padding:'16px',marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,marginBottom:8}}>
            <input value={newTask.title} onChange={e=>setNewTask(f=>({...f,title:e.target.value}))} placeholder={isHe?'שם המשימה...':'Task name...'} style={INP} onKeyDown={e=>e.key==='Enter'&&addTask()} onFocus={e=>e.target.style.borderColor=COLOR.sage} onBlur={e=>e.target.style.borderColor=COLOR.stone+'40'}/>
            <input type="time" value={newTask.time} onChange={e=>setNewTask(f=>({...f,time:e.target.value}))} style={{...INP,width:100}}/>
            <select value={newTask.priority} onChange={e=>setNewTask(f=>({...f,priority:e.target.value}))} style={{...INP,width:100}}>
              <option value="urgent">{isHe?'דחוף':'Urgent'}</option>
              <option value="high">{isHe?'גבוה':'High'}</option>
              <option value="medium">{isHe?'בינוני':'Medium'}</option>
              <option value="low">{isHe?'נמוך':'Low'}</option>
            </select>
          </div>
          <SmallBtn variant="primary" onClick={addTask}>{isHe?'הוסף':'Add'}</SmallBtn>
        </div>
      )}

      {tasks.length===0 ? (
        <EmptyState emoji="✅" title={isHe?'אין משימות':'No tasks'} subtitle={isHe?'הוסיפי משימות לניהול הלקוח':'Add tasks to manage this client'}/>
      ) : (
        <SectionCard title={isHe?`${openTasks} משימות פתוחות`:`${openTasks} open tasks`} icon="✅">
          {tasks.map(t=>{
            const pc={'urgent':'#dc2626','high':'#d97706','medium':COLOR.sage,'low':COLOR.stone}[t.priority]||COLOR.sage
            return(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,background:t.done?'rgba(0,0,0,0.02)':COLOR.cream,marginBottom:6,opacity:t.done?0.6:1}}>
                <button onClick={()=>toggleTask(t.id)} style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${t.done?COLOR.sage:COLOR.stone+'60'}`,background:t.done?COLOR.sage:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {t.done&&<Check size={10} color="#fff"/>}
                </button>
                <div style={{flex:1}}>
                  <p style={{...F,fontSize:'12px',fontWeight:600,color:t.done?COLOR.stone:COLOR.dark,textDecoration:t.done?'line-through':'none'}}>{t.title}</p>
                  {t.time&&<span style={{...F,fontSize:'10px',color:COLOR.stone,display:'flex',alignItems:'center',gap:3}}><Clock size={8}/>{t.time}</span>}
                </div>
                <span style={{...F,fontSize:'10px',padding:'2px 8px',borderRadius:20,background:`${pc}12`,color:pc}}>{t.priority}</span>
                <button onClick={()=>deleteTask(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone,padding:2}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            )
          })}
        </SectionCard>
      )}
    </div>
  )

  /* MEDIA */
  const renderMedia = () => (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <p style={{...F,fontSize:'12px',color:COLOR.stone}}>{files.length} {isHe?'קבצים':'files'}</p>
        <div style={{display:'flex',gap:8}}>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.pdf" style={{display:'none'}} onChange={e=>handleUpload(e.target.files)}/>
          <SmallBtn onClick={()=>window.open('https://drive.google.com','_blank')}><ExternalLink size={10}/>Google Drive</SmallBtn>
          <SmallBtn variant="primary" onClick={()=>fileRef.current?.click()}><Upload size={10}/>{isHe?'העלאה':'Upload'}</SmallBtn>
        </div>
      </div>

      {/* Drop zone */}
      <div
        style={{border:`2px dashed ${COLOR.stone}40`,borderRadius:12,padding:'20px',textAlign:'center',marginBottom:16,cursor:'pointer',background:COLOR.cream,transition:'all 0.15s'}}
        onClick={()=>fileRef.current?.click()}
        onDrop={e=>{e.preventDefault();handleUpload(e.dataTransfer.files)}}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=COLOR.sage}}
        onDragLeave={e=>{e.currentTarget.style.borderColor=COLOR.stone+'40'}}>
        <Upload size={22} color={COLOR.stone} style={{margin:'0 auto 6px'}}/>
        <p style={{...F,fontSize:'12px',color:COLOR.stone,marginBottom:2}}>{isHe?'גרירה להעלאה, או לחצי לבחירת קבצים':'Drag to upload, or click to select files'}</p>
        <p style={{...F,fontSize:'10px',color:COLOR.stone+'80'}}>{isHe?'תמונות, ויאוס, PDF, מסמכים — ניתן להעלות כמה קבצים ביחד':'Images, videos, PDFs — upload multiple files at once'}</p>
      </div>

      {/* Images grid */}
      {files.filter(f=>f.type?.startsWith('image/')).length > 0 && (
        <SectionCard title={isHe?'תמונות':'Images'} icon="🖼️">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {files.filter(f=>f.type?.startsWith('image/')).map(f=>(
              <div key={f.id}
                style={{position:'relative',aspectRatio:'1',borderRadius:9,overflow:'hidden',cursor:'pointer'}}
                onMouseEnter={e=>{const ov=e.currentTarget.querySelector('.ov');if(ov)ov.style.opacity='1'}}
                onMouseLeave={e=>{const ov=e.currentTarget.querySelector('.ov');if(ov)ov.style.opacity='0'}}>
                <img src={f.data} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                {/* Name bar */}
                <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.65))',padding:'12px 5px 4px'}}>
                  <p style={{...F,fontSize:8,color:'rgba(255,255,255,0.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                </div>
                {/* Overlay actions */}
                <div className="ov" style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',opacity:0,transition:'opacity 0.18s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <button onClick={()=>renameFile(f.id)}
                    style={{...F,padding:'5px 9px',borderRadius:7,border:'none',background:'rgba(255,255,255,0.92)',color:'#1C1C1C',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                    ✏️ {isHe?'ערוך':'Edit'}
                  </button>
                  <button onClick={()=>deleteFile(f.id)}
                    style={{...F,padding:'5px 9px',borderRadius:7,border:'none',background:'rgba(220,38,38,0.85)',color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                    🗑️ {isHe?'מחק':'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Videos */}
      {files.filter(f=>f.type?.startsWith('video/')).length > 0 && (
        <SectionCard title={isHe?'ויאו':'Videos'} icon="🎬">
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {files.filter(f=>f.type?.startsWith('video/')).map(f=>(
              <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:9,background:COLOR.cream}}>
                <div style={{width:44,height:44,borderRadius:8,background:COLOR.dark,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Play size={16} color="#fff"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{...F,fontSize:'12px',fontWeight:600,color:COLOR.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                  <p style={{...F,fontSize:'10px',color:COLOR.stone}}>{f.size ? (f.size/1024/1024).toFixed(1)+' MB' : ''}</p>
                </div>
                <button onClick={()=>renameFile(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone,padding:4}} title={isHe?'ערוך שם':'Rename'}>
                  <Edit3 size={13}/>
                </button>
                <button onClick={()=>deleteFile(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',padding:4}} title={isHe?'מחק':'Delete'}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Documents */}
      {files.filter(f=>!f.type?.startsWith('image/') && !f.type?.startsWith('video/')).length > 0 && (
        <SectionCard title={isHe?'מסמכים':'Documents'} icon="📄">
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {files.filter(f=>!f.type?.startsWith('image/') && !f.type?.startsWith('video/')).map(f=>(
              <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:9,background:COLOR.cream}}>
                <span style={{fontSize:20}}>📄</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{...F,fontSize:'12px',fontWeight:600,color:COLOR.dark,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                  <p style={{...F,fontSize:'10px',color:COLOR.stone}}>{f.type}</p>
                </div>
                <button onClick={()=>renameFile(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone,padding:4}}>
                  <Edit3 size={13}/>
                </button>
                <button onClick={()=>deleteFile(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',padding:4}}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {files.length === 0 && (
        <EmptyState emoji="📁" title={isHe?'אין קבצים עדיין':'No files yet'} subtitle={isHe?'העלי תמונות, ויאוס ומסמכים — ניתן להעלות כמה ביחד':'Upload images, videos and documents — multiple files supported'}/>
      )}
    </div>
  )

  const TAB_CONTENT = {
    overview:  renderOverview,
    strategy:  renderStrategy,
    brand:     renderBrand,
    planner:   renderPlanner,
    posts:     renderPosts,
    tasks:     renderTasks,
    media:     renderMedia,
    analytics: renderAnalytics,
  }

  /* ── Main render ─────────────────────────── */
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'#F9F7F4',direction:isHe?'rtl':'ltr',...F}}>

      {/* Header */}
      <div style={{...C,margin:'16px 20px 0',padding:'16px 20px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>nav('/clients')} style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone,display:'flex',alignItems:'center',gap:4,...F,fontSize:'12px'}}>
          <ChevronRight size={14} style={{transform:isHe?'none':'scaleX(-1)'}}/>{isHe?'לקוחות':'Clients'}
        </button>
        <ChevronRight size={12} color={COLOR.stone}/>
        <div style={{width:36,height:36,borderRadius:10,background:COLOR.dark,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16,flexShrink:0}}>
          {client.name.charAt(0)}
        </div>
        <div style={{flex:1}}>
          <p style={{...FG,fontSize:'20px',color:COLOR.dark,margin:0}}>{client.name}</p>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
            <PillBadge text={client.platform||'Instagram'} color={PLATCOLOR[client.platform]||COLOR.sage}/>
            {strategy&&<PillBadge text="🧠 אסטרטגיה פעילה" color={COLOR.sage}/>}
            {Object.keys(brand).length>0&&<PillBadge text="🎨 מותג מוגדר" color={COLOR.gold}/>}
          </div>
        </div>
        <button onClick={load} style={{background:'none',border:'none',cursor:'pointer',color:COLOR.stone}}><RefreshCw size={14}/></button>
        <SmallBtn onClick={()=>nav('/ai-strategy')} variant="primary">
          <Sparkles size={10}/>AI
        </SmallBtn>
      </div>

      {/* Tabs */}
      <div style={{...C,margin:'10px 20px 0',padding:'6px',display:'flex',gap:4,overflowX:'auto'}}>
        {TABS.map(tab=>{
          const Icon=tab.icon
          return(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{flex:'0 0 auto',display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:'none',background:activeTab===tab.id?'#FFFFFF':'transparent',color:activeTab===tab.id?COLOR.dark:COLOR.stone,cursor:'pointer',transition:'all 0.2s',boxShadow:activeTab===tab.id?`0 2px 10px ${COLOR.dark}10`:'none',...F,fontSize:'12px',fontWeight:activeTab===tab.id?600:400,whiteSpace:'nowrap'}}>
              <Icon size={13}/>{isHe?tab.he:tab.en}
              {/* Badges */}
              {tab.id==='tasks'&&openTasks>0&&<span style={{...F,fontSize:'9px',padding:'1px 5px',borderRadius:10,background:COLOR.warm,color:'#fff',fontWeight:700}}>{openTasks}</span>}
              {tab.id==='planner'&&planner.length>0&&<span style={{...F,fontSize:'9px',padding:'1px 5px',borderRadius:10,background:COLOR.sage,color:'#fff',fontWeight:700}}>{planner.length}</span>}
              {tab.id==='strategy'&&strategy&&<span style={{width:6,height:6,borderRadius:'50%',background:'#4CAF50',flexShrink:0}}/>}
              {tab.id==='media'&&files.length>0&&<span style={{...F,fontSize:'9px',padding:'1px 5px',borderRadius:10,background:COLOR.gold,color:'#fff',fontWeight:700}}>{files.length}</span>}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{flex:1,padding:'16px 20px',overflowY:'auto'}}>
        {(TAB_CONTENT[activeTab]||renderOverview)()}
      </div>

      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',bottom:80,right:isHe?24:'auto',left:isHe?'auto':24,background:toast.type==='error'?'#dc2626':COLOR.dark,color:'#fff',borderRadius:12,padding:'11px 18px',boxShadow:'0 8px 24px rgba(0,0,0,0.2)',zIndex:2000,...F,fontSize:'13px',fontWeight:500,display:'flex',alignItems:'center',gap:8,animation:'slide 0.3s ease'}}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes slide{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
} 