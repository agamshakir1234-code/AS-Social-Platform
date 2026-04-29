import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, X, Zap, Upload, Image, ChevronRight, ChevronLeft,
  Clock, Bell, Trash2, Edit3, Move, ExternalLink, Download,
  Grid, Play, Circle, Search, FolderOpen, Link2, Check,
  Instagram, Youtube, Facebook, Layers, Camera, Film,
  AlignLeft, Sparkles, RefreshCw, Eye, Share2, Calendar
} from 'lucide-react'

/* ── Tokens ──────────────────────────────────── */
const G = {
  smoke:'#5E685E', smokeDark:'#445246', gold:'#B49A74',
  ivory:'#F7F4EF', white:'#FFFFFF', text:'#1C1C1C',
  muted:'#7A7A6E', border:'rgba(94,104,94,0.12)', cream:'#E8E1D8',
  sage:'#6D7B6C', warm:'#A68B7D',
}
const sans  = { fontFamily:"'Inter','Heebo',sans-serif" }
const serif = { fontFamily:"'Cormorant Garamond',serif" }

const PLATFORMS = [
  { id:'instagram', label:'Instagram', icon:'📸', color:'#E1306C', cols:3, gridRatio:'1/1' },
  { id:'tiktok',    label:'TikTok',    icon:'🎵', color:'#000000', cols:3, gridRatio:'9/16' },
  { id:'facebook',  label:'Facebook',  icon:'📘', color:'#1877F2', cols:2, gridRatio:'4/5'  },
  { id:'linkedin',  label:'LinkedIn',  icon:'💼', color:'#0A66C2', cols:2, gridRatio:'1/1'  },
]

const POST_TYPES = ['פוסט','ריל','סטורי','קרוסלה','לייב']
const DAYS_HE    = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
const HOURS      = Array.from({length:24},(_,i)=>String(i).padStart(2,'0')+':00')

/* ── Storage ─────────────────────────────────── */
const rj  = k     => { try { return JSON.parse(localStorage.getItem(k)||'null') } catch { return null } }
const wj  = (k,v) => localStorage.setItem(k, JSON.stringify(v))

function getFeedPosts(clientId, platform) {
  return rj(`feed_${clientId}_${platform}`) || []
}
function saveFeedPosts(clientId, platform, posts) {
  wj(`feed_${clientId}_${platform}`, posts)
}
function getClientFiles(clientId)   { try { return JSON.parse(localStorage.getItem(`files_${clientId}`)||'[]') } catch { return [] } }
function getClientDesigns(clientId) { try { return JSON.parse(localStorage.getItem(`media_${clientId}`)||'[]') } catch { return [] } }
function getClientProfile(clientId) { return rj(`profile_${clientId}`) || { name:'', bio:'', avatar:null, followers:'', following:'' } }
function saveClientProfile(clientId, profile) { wj(`profile_${clientId}`, profile) }

function fileIcon(type) {
  if (!type) return '📄'
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  return '📄'
}

/* ── AI Tips generator ───────────────────────── */
function generateAITips(client, platform, posts) {
  const pCount = posts.length
  const hasCaption = posts.filter(p => p.caption?.length > 10).length
  const scheduled  = posts.filter(p => p.day && p.time).length
  const brandColors = client?.brandColors || []

  return [
    pCount < 6
      ? { icon:'📐', type:'מבנה', tip:`הוסיפי לפחות ${6-pCount} פוסטים נוספים לפיד ${platform} מאוזן ויזואלית — גריד 3×3 מחזיר את מבט המבקר לנקודת ההתחלה.` }
      : { icon:'✅', type:'מבנה', tip:`כל הכבוד! יש לך ${pCount} פוסטים — הגריד נראה מלא ומקצועי.` },
    { icon:'🎨', type:'עיצוב', tip: client?.aiStrategy
        ? `בהתאם לאסטרטגייה: "${client.aiStrategy}" — שמרי על פלטה חמה ועקבית בין הפוסטים. שלבי צבעי מותג בכל 3-4 פוסטים.`
        : 'שמרי על פלטה צבעים עקבית — 2-3 צבעים מרכזיים בלבד לאורך כל הפיד.' },
    hasCaption < pCount
      ? { icon:'✍️', type:'קופי', tip:`${pCount-hasCaption} פוסטים ללא קאפשן — קאפשן מוכן מראש מגדיל מעורבות ב-38%.` }
      : { icon:'✍️', type:'קופי', tip:'קאפשן מעולה! זכרי לשלב קריאה לפעולה (CTA) בכל 3 פוסטים.' },
    scheduled < pCount
      ? { icon:'📅', type:'תזמון', tip:`תזמני את ${pCount-scheduled} הפוסטים שנותרו — שעות השיא ב-Instagram: 07:00, 12:00, 19:00.` }
      : { icon:'📅', type:'תזמון', tip:'כל הפוסטים מתוזמנים! תקבלי תזכורת ביום הפרסום.' },
    { icon:'🔄', type:'תוכן', tip: platform==='instagram'
        ? 'שלבי: 3 פוסטים אסתטיים → 1 ריל → 1 קרוסלה — מגדיל חשיפה אורגנית ב-60%.'
        : platform==='tiktok'
        ? 'פרסמי 3-5 ריילים בשבוע בשעות 18:00-21:00 לחשיפה מקסימלית.'
        : 'שלבי פוסטים עם תמונות לצד וידאו קצר — מגדיל reach ב-Facebook.' },
    { icon:'👤', type:'פרופיל', tip: !getClientProfile(client?.id)?.bio
        ? 'הוסיפי ביו ממוקד — 150 תווים שמסבירים WHO, WHAT, WHY עם אמוג\'י ו-CTA.'
        : 'הביו נראה טוב! וודאי שיש קישור עדכני בביו.' },
  ]
}

/* ── Notification helper ─────────────────────── */
function scheduleNotification(post, clientName) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') {
    Notification.requestPermission()
    return
  }
  const [h, m] = (post.time||'09:00').split(':').map(Number)
  const now    = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate()+1)
  const delay = target - now
  setTimeout(() => {
    new Notification(`📅 תזכורת פרסום — ${clientName}`, {
      body: `"${post.caption?.slice(0,60)||'פוסט חדש'}" — ${post.platform} ${post.time}`,
      icon: '/favicon.ico',
    })
  }, Math.min(delay, 2147483647))
}

/* ═══════════════════════════════════════════════ */
export default function FeedDesign() {
  const ctx  = useOutletContext() || {}
  const lang = ctx.lang || 'he'
  const isHe = lang !== 'en'

  const [clients,       setClients]       = useState(() => { try { return JSON.parse(localStorage.getItem('as_clients')||'[]') } catch { return [] } })
  const [activeClient,  setActiveClient]  = useState(null)
  const [activePlatform,setActivePlatform]= useState('instagram')
  const [activeSection, setActiveSection] = useState('feed') // 'feed'|'reels'|'stories'
  const [posts,         setPosts]         = useState([])
  const [profile,       setProfile]       = useState({ name:'', bio:'', avatar:null, followers:'', following:'' })
  const [showMedia,     setShowMedia]     = useState(false)
  const [showAI,        setShowAI]        = useState(true)
  const [showAddPost,   setShowAddPost]   = useState(false)
  const [editPost,      setEditPost]      = useState(null)
  const [editProfile,   setEditProfile]   = useState(false)
  const [dragOver,      setDragOver]      = useState(null)
  const [mediaTab,      setMediaTab]      = useState('files') // 'files'|'designs'|'drive'
  const [searchQ,       setSearchQ]       = useState('')
  const [aiTips,        setAiTips]        = useState([])
  const [toast,         setToast]         = useState(null)
  const [notifGranted,  setNotifGranted]  = useState(Notification?.permission==='granted')

  const fileRef    = useRef()
  const avatarRef  = useRef()

  const platform = PLATFORMS.find(p => p.id===activePlatform) || PLATFORMS[0]

  /* ── Load ─────────────────────────────────── */
  useEffect(() => {
    if (activeClient) {
      const p = getFeedPosts(activeClient.id, activePlatform)
      setPosts(p)
      setProfile(getClientProfile(activeClient.id))
      setAiTips(generateAITips(activeClient, activePlatform, p))
    }
  }, [activeClient, activePlatform])

  /* ── Save + regen tips on posts change ─────── */
  useEffect(() => {
    if (activeClient) {
      saveFeedPosts(activeClient.id, activePlatform, posts)
      setAiTips(generateAITips(activeClient, activePlatform, posts))
    }
  }, [posts])

  /* ── Profile save ────────────────────────────*/
  function saveProfile(p) {
    setProfile(p)
    if (activeClient) saveClientProfile(activeClient.id, p)
  }

  /* ── Request notifications ───────────────── */
  async function requestNotif() {
    const result = await Notification.requestPermission()
    setNotifGranted(result==='granted')
    showToast(result==='granted' ? '🔔 תזכורות מופעלות!' : '🔕 הרשאת התראות נדחתה')
  }

  /* ── Add / edit post ─────────────────────── */
  function handleSavePost(postData) {
    if (editPost) {
      setPosts(prev => prev.map(p => p.id===editPost.id ? {...postData, id:editPost.id} : p))
      setEditPost(null)
    } else {
      const newPost = {...postData, id:`post_${Date.now()}`, createdAt:new Date().toISOString()}
      setPosts(prev => [...prev, newPost])
      if (notifGranted && newPost.day && newPost.time) scheduleNotification(newPost, activeClient?.name||'')
    }
    setShowAddPost(false)
    showToast(isHe?'פוסט נשמר ✅':'Post saved ✅')
  }

  function deletePost(id) {
    setPosts(prev => prev.filter(p => p.id!==id))
    showToast(isHe?'פוסט נמחק':'Post deleted')
  }

  /* ── Drag reorder ────────────────────────── */
  function handleDragStart(e, idx) { e.dataTransfer.setData('text/plain', idx) }
  function handleDrop(e, targetIdx) {
    e.preventDefault()
    const srcIdx = parseInt(e.dataTransfer.getData('text/plain'))
    if (srcIdx===targetIdx) return
    const next = [...posts]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(targetIdx, 0, moved)
    setPosts(next)
    setDragOver(null)
  }

  /* ── Media file select ───────────────────── */
  function handleMediaFile(file, forPost) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      if (forPost==='avatar') {
        saveProfile({...profile, avatar:e.target.result})
      } else if (forPost==='addpost') {
        setShowAddPost({ prefillImage: e.target.result })
      } else {
        // save to client files
        const entry = { id:`file_${Date.now()}`, name:file.name, type:file.type, size:file.size, data:e.target.result, source:'upload', savedAt:new Date().toISOString() }
        const curr  = getClientFiles(activeClient.id)
        curr.unshift(entry)
        localStorage.setItem(`files_${activeClient.id}`, JSON.stringify(curr))
        showToast(isHe?'קובץ הועלה ✅':'File uploaded ✅')
      }
    }
    reader.readAsDataURL(file)
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null),3000) }

  /* ── Filtered media ────────────────────────── */
  const allFiles   = activeClient ? getClientFiles(activeClient.id) : []
  const allDesigns = activeClient ? getClientDesigns(activeClient.id) : []
  const filteredMedia = mediaTab==='files'
    ? allFiles.filter(f => !searchQ || f.name?.toLowerCase().includes(searchQ.toLowerCase()))
    : allDesigns.filter(d => !searchQ || d.title?.toLowerCase().includes(searchQ.toLowerCase()))

  /* ── Sections filter ─────────────────────── */
  const feedPosts    = posts.filter(p => !p.type||p.type==='פוסט'||p.type==='קרוסלה')
  const reelsPosts   = posts.filter(p => p.type==='ריל')
  const storiesPosts = posts.filter(p => p.type==='סטורי')
  const displayPosts = activeSection==='feed' ? feedPosts : activeSection==='reels' ? reelsPosts : storiesPosts

  const inp = { ...sans, padding:'9px 13px', borderRadius:10, fontSize:13, border:`1.5px solid ${G.border}`, background:G.ivory, color:G.text, outline:'none', width:'100%', boxSizing:'border-box' }

  if (!activeClient) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',gap:20,direction:isHe?'rtl':'ltr'}}>
      <div style={{fontSize:60}}>📱</div>
      <h2 style={{...serif,fontSize:28,color:G.text,margin:0}}>{isHe?'עיצוב הפיד':'Feed Design'}</h2>
      <p style={{...sans,fontSize:14,color:G.muted,maxWidth:400,textAlign:'center',lineHeight:1.7}}>
        {isHe?'בחרי לקוח כדי לעצב את הפיד, לתזמן תוכן ולנהל את מאגר המדיה':'Select a client to design their feed, schedule content and manage media'}
      </p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',maxWidth:500}}>
        {clients.map((c,i)=>{
          const colors=['#5E685E','#B49A74','#8E6B5A','#4A7C8E','#7A6E8E','#8E4A5A']
          const color=colors[i%colors.length]
          return (
            <button key={c.id} onClick={()=>setActiveClient(c)}
              style={{...sans,display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderRadius:12,border:`2px solid ${color}30`,background:`${color}10`,cursor:'pointer',color:G.text,fontSize:13,fontWeight:600,transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${color}20`;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${color}10`;e.currentTarget.style.transform='none'}}>
              <div style={{width:32,height:32,borderRadius:8,background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>{c.name.charAt(0)}</div>
              {c.name}
            </button>
          )
        })}
      </div>
      {clients.length===0&&<p style={{...sans,fontSize:13,color:G.muted}}>{isHe?'הוסיפי לקוחות בדאשבורד תחילה':'Add clients in Dashboard first'}</p>}
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:G.ivory,direction:isHe?'rtl':'ltr',...sans}}>

      {/* ── TOP BAR ──────────────────────────── */}
      <div style={{background:G.white,borderBottom:`1px solid ${G.border}`,padding:'12px 24px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        {/* Client selector */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {clients.map((c,i)=>{
            const colors=['#5E685E','#B49A74','#8E6B5A','#4A7C8E']
            const color=colors[i%colors.length]
            const isActive=activeClient?.id===c.id
            return (
              <button key={c.id} onClick={()=>setActiveClient(c)}
                style={{...sans,display:'flex',alignItems:'center',gap:7,padding:'6px 14px',borderRadius:20,border:`1.5px solid ${isActive?color:G.border}`,background:isActive?`${color}15`:G.white,color:isActive?color:G.muted,fontSize:12,fontWeight:isActive?700:400,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{width:20,height:20,borderRadius:6,background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:700}}>{c.name.charAt(0)}</div>
                {c.name}
              </button>
            )
          })}
        </div>

        <div style={{flex:1}}/>

        {/* Notification toggle */}
        {!notifGranted&&(
          <button onClick={requestNotif} style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`1px solid ${G.gold}`,background:`${G.gold}15`,color:G.gold,fontSize:11,fontWeight:600,cursor:'pointer'}}>
            <Bell size={12}/>{isHe?'הפעל תזכורות':'Enable Notifications'}
          </button>
        )}
        {notifGranted&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,background:'rgba(76,175,80,0.08)',border:'1px solid rgba(76,175,80,0.2)',...sans,fontSize:11,color:'#4CAF50',fontWeight:600}}><Bell size={11}/>🔔 {isHe?'תזכורות פעילות':'Notifications on'}</div>}

        {/* Media button */}
        <button onClick={()=>setShowMedia(v=>!v)} style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:`1.5px solid ${showMedia?G.smoke:G.border}`,background:showMedia?`${G.smoke}10`:G.white,color:showMedia?G.smoke:G.muted,fontSize:12,fontWeight:600,cursor:'pointer'}}>
          <FolderOpen size={13}/>{isHe?'מאגר מדיה':'Media Library'}
        </button>

        {/* AI tips toggle */}
        <button onClick={()=>setShowAI(v=>!v)} style={{...sans,display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:`1.5px solid ${showAI?G.gold:G.border}`,background:showAI?`${G.gold}10`:G.white,color:showAI?G.gold:G.muted,fontSize:12,fontWeight:600,cursor:'pointer'}}>
          <Sparkles size={13}/>{isHe?'סוכן AI':'AI Agent'}
        </button>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── MAIN CONTENT ─────────────────────── */}
        <div style={{flex:1,overflowY:'auto',padding:'24px'}}>

          {/* Platform tabs */}
          <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
            {PLATFORMS.map(p=>(
              <button key={p.id} onClick={()=>setActivePlatform(p.id)}
                style={{...sans,display:'flex',alignItems:'center',gap:7,padding:'8px 18px',borderRadius:20,border:`2px solid ${activePlatform===p.id?p.color:G.border}`,background:activePlatform===p.id?`${p.color}12`:G.white,color:activePlatform===p.id?p.color:G.muted,fontSize:12,fontWeight:activePlatform===p.id?700:400,cursor:'pointer',transition:'all 0.15s'}}>
                <span style={{fontSize:15}}>{p.icon}</span>{p.label}
                <span style={{background:activePlatform===p.id?`${p.color}20`:'rgba(0,0,0,0.06)',borderRadius:20,padding:'1px 7px',fontSize:10,color:activePlatform===p.id?p.color:G.muted}}>
                  {getFeedPosts(activeClient.id, p.id).length}
                </span>
              </button>
            ))}
            <div style={{flex:1}}/>
            {/* Section tabs */}
            <div style={{display:'flex',gap:3,background:G.white,borderRadius:10,padding:3,border:`1px solid ${G.border}`}}>
              {[{id:'feed',label:isHe?'פיד':'Feed',icon:'⊞'},{id:'reels',label:isHe?'ריילס':'Reels',icon:'▶'},{id:'stories',label:isHe?'סטורי':'Stories',icon:'◯'}].map(s=>(
                <button key={s.id} onClick={()=>setActiveSection(s.id)}
                  style={{...sans,padding:'6px 14px',borderRadius:8,border:'none',background:activeSection===s.id?G.smoke:'transparent',color:activeSection===s.id?G.white:G.muted,fontSize:11,fontWeight:activeSection===s.id?700:400,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:5}}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── PROFILE SECTION ─────────────────── */}
          <div style={{background:G.white,borderRadius:16,border:`1px solid ${G.border}`,padding:'20px 24px',marginBottom:20,boxShadow:'0 2px 12px rgba(94,104,94,0.06)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:18}}>
              {/* Avatar */}
              <div style={{position:'relative',flexShrink:0}}>
                <div onClick={()=>avatarRef.current?.click()}
                  style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${platform.color}40,${platform.color}15)`,border:`3px solid ${platform.color}30`,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
                  {profile.avatar
                    ? <img src={profile.avatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span>{activeClient.name.charAt(0)}</span>}
                </div>
                <div style={{position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:platform.color,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={()=>avatarRef.current?.click()}>
                  <Camera size={10} color="#fff"/>
                </div>
                <input ref={avatarRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleMediaFile(e.target.files?.[0],'avatar')}/>
              </div>

              {/* Profile info */}
              <div style={{flex:1}}>
                {editProfile ? (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                      <input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder={isHe?'שם המשתמש @':'@username'} style={{...inp,fontSize:12}}/>
                      <input value={profile.followers} onChange={e=>setProfile(p=>({...p,followers:e.target.value}))} placeholder={isHe?'עוקבים':'Followers'} style={{...inp,fontSize:12}}/>
                      <input value={profile.following} onChange={e=>setProfile(p=>({...p,following:e.target.value}))} placeholder={isHe?'עוקב':'Following'} style={{...inp,fontSize:12}}/>
                    </div>
                    <textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder={isHe?'ביו — עד 150 תווים (WHO | WHAT | WHY + CTA)...':'Bio — up to 150 chars (WHO | WHAT | WHY + CTA)...'} rows={2} style={{...inp,resize:'none',fontSize:12}}/>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>{saveProfile(profile);setEditProfile(false);showToast(isHe?'פרופיל נשמר ✅':'Profile saved ✅')}} style={{...sans,padding:'7px 16px',borderRadius:8,border:'none',background:G.smoke,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        <Check size={12}/> {isHe?'שמור':'Save'}
                      </button>
                      <button onClick={()=>setEditProfile(false)} style={{...sans,padding:'7px 14px',borderRadius:8,border:`1px solid ${G.border}`,background:'transparent',color:G.muted,fontSize:12,cursor:'pointer'}}>{isHe?'ביטול':'Cancel'}</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                      <span style={{...sans,fontSize:14,fontWeight:700,color:G.text}}>{profile.name||activeClient.name}</span>
                      {profile.followers&&<span style={{...sans,fontSize:12,color:G.muted}}>{profile.followers} {isHe?'עוקבים':'followers'}</span>}
                      {profile.following&&<span style={{...sans,fontSize:12,color:G.muted}}>{profile.following} {isHe?'עוקב':'following'}</span>}
                      <span style={{...sans,fontSize:12,color:platform.color,fontWeight:600}}>{displayPosts.length} {isHe?'פוסטים':'posts'}</span>
                      <button onClick={()=>setEditProfile(true)} style={{marginInlineStart:'auto',background:'none',border:'none',cursor:'pointer',color:G.muted,display:'flex',alignItems:'center',gap:4,...sans,fontSize:11}}>
                        <Edit3 size={11}/>{isHe?'עריכה':'Edit'}
                      </button>
                    </div>
                    <p style={{...sans,fontSize:12,color:G.text,lineHeight:1.6,maxWidth:500}}>
                      {profile.bio||<span style={{color:G.muted,fontStyle:'italic'}}>{isHe?'לחצי "עריכה" להוספת ביו מקצועי':'Click "Edit" to add a professional bio'}</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Add post button */}
              <button onClick={()=>setShowAddPost(true)}
                style={{...sans,display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(94,104,94,0.3)',flexShrink:0}}>
                <Plus size={14}/>{isHe?'פוסט חדש':'New Post'}
              </button>
            </div>
          </div>

          {/* ── FEED GRID ───────────────────────── */}
          {activeSection==='feed' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <h3 style={{...serif,fontSize:18,color:G.text,margin:0}}>
                  {isHe?`פיד ${platform.label}`:`${platform.label} Feed`}
                </h3>
                <p style={{...sans,fontSize:11,color:G.muted}}>
                  {isHe?'גרירה לשינוי סדר':'Drag to reorder'}
                </p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${platform.cols},1fr)`,gap:3,marginBottom:24}}>
                {displayPosts.map((post,idx)=>(
                  <FeedCard
                    key={post.id} post={post} idx={idx}
                    platform={platform} isHe={isHe} G={G} sans={sans}
                    onEdit={()=>{setEditPost(post);setShowAddPost(true)}}
                    onDelete={()=>deletePost(post.id)}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    dragOver={dragOver===idx}
                    onDragOver={e=>{e.preventDefault();setDragOver(idx)}}
                    onDragLeave={()=>setDragOver(null)}
                  />
                ))}
                {/* Add placeholder */}
                <div onClick={()=>setShowAddPost(true)}
                  style={{aspectRatio:platform.gridRatio,background:G.ivory,border:`2px dashed ${G.border}`,borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:6,transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=G.smoke;e.currentTarget.style.background=`${G.smoke}06`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background=G.ivory}}>
                  <Plus size={20} color={G.muted}/>
                  <span style={{...sans,fontSize:10,color:G.muted}}>{isHe?'הוסף':'Add'}</span>
                </div>
              </div>
            </>
          )}

          {/* ── REELS SECTION ────────────────────── */}
          {activeSection==='reels' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <h3 style={{...serif,fontSize:18,color:G.text,margin:0}}>🎬 {isHe?`ריילס ${platform.label}`:`${platform.label} Reels`}</h3>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:24}}>
                {reelsPosts.map((post,idx)=>(
                  <div key={post.id} style={{position:'relative',aspectRatio:'9/16',borderRadius:10,overflow:'hidden',background:'#000',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.querySelector('.reel-overlay').style.opacity='1'}
                    onMouseLeave={e=>e.currentTarget.querySelector('.reel-overlay').style.opacity='0'}>
                    {post.image
                      ? <img src={post.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/>
                      : <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#1a1a2e,#16213e)',display:'flex',alignItems:'center',justifyContent:'center'}}><Play size={32} color="rgba(255,255,255,0.5)"/></div>}
                    <div className="reel-overlay" style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)',padding:10,display:'flex',flexDirection:'column',justifyContent:'flex-end',opacity:0,transition:'opacity 0.2s'}}>
                      <p style={{...sans,fontSize:10,color:'#fff',marginBottom:6,lineHeight:1.4}}>{post.caption?.slice(0,60)||'...'}</p>
                      {post.day&&post.time&&<span style={{...sans,fontSize:9,color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',gap:3}}><Clock size={8}/>  {post.day} {post.time}</span>}
                      <div style={{display:'flex',gap:5,marginTop:6}}>
                        <button onClick={()=>{setEditPost(post);setShowAddPost(true)}} style={{flex:1,padding:'4px',borderRadius:6,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:9,cursor:'pointer'}}>{isHe?'עריכה':'Edit'}</button>
                        <button onClick={()=>deletePost(post.id)} style={{padding:'4px 8px',borderRadius:6,border:'none',background:'rgba(220,38,38,0.5)',color:'#fff',fontSize:9,cursor:'pointer'}}><Trash2 size={9}/></button>
                      </div>
                    </div>
                    {post.day&&post.time&&(
                      <div style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.6)',borderRadius:6,padding:'2px 6px',...sans,fontSize:8,color:'#fff',display:'flex',alignItems:'center',gap:3}}>
                        <Clock size={7}/>{post.time}
                      </div>
                    )}
                  </div>
                ))}
                <div onClick={()=>{setShowAddPost({prefillType:'ריל'})}}
                  style={{aspectRatio:'9/16',borderRadius:10,border:`2px dashed ${G.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',background:G.ivory}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=G.smoke;e.currentTarget.style.background=`${G.smoke}06`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background=G.ivory}}>
                  <Play size={24} color={G.muted}/>
                  <span style={{...sans,fontSize:10,color:G.muted}}>{isHe?'ריל חדש':'New Reel'}</span>
                </div>
              </div>
            </>
          )}

          {/* ── STORIES SECTION ─────────────────── */}
          {activeSection==='stories' && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <h3 style={{...serif,fontSize:18,color:G.text,margin:0}}>◯ {isHe?`סטורי ${platform.label}`:`${platform.label} Stories`}</h3>
              </div>
              <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8,marginBottom:24}}>
                {storiesPosts.map((post,idx)=>(
                  <div key={post.id} style={{flexShrink:0,width:110,position:'relative'}}>
                    <div style={{width:110,height:196,borderRadius:14,overflow:'hidden',background:'linear-gradient(135deg,#667eea,#764ba2)',border:`3px solid ${platform.color}`,cursor:'pointer'}}>
                      {post.image
                        ? <img src={post.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>{platform.icon}</div>}
                    </div>
                    <div style={{marginTop:6,textAlign:'center'}}>
                      <p style={{...sans,fontSize:9,color:G.text,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.caption?.slice(0,20)||isHe?'סטורי':'Story'}</p>
                      {post.day&&<p style={{...sans,fontSize:8,color:G.muted}}>{post.day} {post.time}</p>}
                    </div>
                    <button onClick={()=>deletePost(post.id)} style={{position:'absolute',top:4,right:4,width:18,height:18,borderRadius:'50%',border:'none',background:'rgba(220,38,38,0.8)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>×</button>
                  </div>
                ))}
                {/* Add story */}
                <div onClick={()=>setShowAddPost({prefillType:'סטורי'})}
                  style={{flexShrink:0,width:110,height:196,borderRadius:14,border:`2px dashed ${G.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',background:G.ivory}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=G.smoke;e.currentTarget.style.background=`${G.smoke}06`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background=G.ivory}}>
                  <Circle size={22} color={G.muted}/>
                  <span style={{...sans,fontSize:9,color:G.muted}}>{isHe?'סטורי חדש':'New Story'}</span>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {displayPosts.length===0 && activeSection!=='feed' && (
            <div style={{textAlign:'center',padding:'48px 20px'}}>
              <div style={{fontSize:48,marginBottom:12}}>{activeSection==='reels'?'🎬':'◯'}</div>
              <p style={{...serif,fontSize:20,color:G.text,marginBottom:6}}>
                {activeSection==='reels'?(isHe?'אין ריילס עדיין':'No reels yet'):(isHe?'אין סטורי עדיין':'No stories yet')}
              </p>
              <p style={{...sans,fontSize:13,color:G.muted}}>{isHe?'לחצי "פוסט חדש" ובחרי את הסוג המתאים':'Click "New Post" and select the right type'}</p>
            </div>
          )}
        </div>

        {/* ── AI SIDEBAR ──────────────────────── */}
        {showAI && (
          <div style={{width:280,flexShrink:0,background:G.white,borderRight:isHe?`1px solid ${G.border}`:'none',borderLeft:isHe?'none':`1px solid ${G.border}`,overflowY:'auto',padding:'20px 16px',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <Sparkles size={16} color={G.gold}/>
              <h3 style={{...serif,fontSize:18,color:G.text,margin:0}}>{isHe?'סוכן עיצוב AI':'AI Design Agent'}</h3>
            </div>

            {/* Brand context */}
            {activeClient.aiStrategy && (
              <div style={{padding:'10px 13px',borderRadius:10,background:`${G.gold}10`,border:`1px solid ${G.gold}25`}}>
                <p style={{...sans,fontSize:9,fontWeight:700,color:G.gold,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>אסטרטגיה</p>
                <p style={{...sans,fontSize:11,color:G.text,lineHeight:1.5}}>{activeClient.aiStrategy}</p>
              </div>
            )}

            {/* Tips */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {aiTips.map((tip,i)=>(
                <div key={i} style={{padding:'11px 13px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`,position:'relative'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                    <span style={{fontSize:14}}>{tip.icon}</span>
                    <span style={{...sans,fontSize:9,fontWeight:700,color:G.smoke,textTransform:'uppercase',letterSpacing:'0.08em'}}>{tip.type}</span>
                  </div>
                  <p style={{...sans,fontSize:11,color:G.text,lineHeight:1.6}}>{tip.tip}</p>
                </div>
              ))}
            </div>

            {/* Refresh tips */}
            <button onClick={()=>setAiTips(generateAITips(activeClient,activePlatform,posts))}
              style={{...sans,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:10,border:`1px solid ${G.border}`,background:'transparent',color:G.muted,fontSize:11,cursor:'pointer'}}>
              <RefreshCw size={11}/>{isHe?'רענן טיפים':'Refresh tips'}
            </button>

            {/* Best times */}
            <div style={{padding:'12px 13px',borderRadius:10,background:`${G.smoke}08`,border:`1px solid ${G.smoke}20`}}>
              <p style={{...sans,fontSize:10,fontWeight:700,color:G.smoke,marginBottom:8}}>{isHe?`שעות שיא — ${platform.label}`:`Peak hours — ${platform.label}`}</p>
              {(activePlatform==='instagram'?['07:00','12:00','19:00','21:00']:activePlatform==='tiktok'?['18:00','20:00','22:00']:['09:00','13:00','17:00','20:00']).map(h=>(
                <div key={h} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <Clock size={9} color={G.smoke}/>
                  <span style={{...sans,fontSize:11,color:G.text}}>{h}</span>
                  <div style={{flex:1,height:3,background:`${G.smoke}15`,borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:['07:00','18:00','09:00'].includes(h)?'60%':['19:00','20:00','13:00'].includes(h)?'85%':'70%',background:G.smoke,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Color palette */}
            <div style={{padding:'12px 13px',borderRadius:10,background:G.ivory,border:`1px solid ${G.border}`}}>
              <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'פלטת צבעים מומלצת':'Recommended Palette'}</p>
              <div style={{display:'flex',gap:6}}>
                {['#5E685E','#B49A74','#E8E1D8','#F7F4EF','#445246'].map(c=>(
                  <div key={c} style={{flex:1,aspectRatio:'1',borderRadius:8,background:c,border:`1px solid rgba(0,0,0,0.08)`,cursor:'pointer'}} title={c}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEDIA PANEL ─────────────────────── */}
        {showMedia && (
          <div style={{width:280,flexShrink:0,background:G.white,borderRight:isHe?`1px solid ${G.border}`:'none',borderLeft:isHe?'none':`1px solid ${G.border}`,overflowY:'auto',padding:'20px 16px',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
              <h3 style={{...serif,fontSize:18,color:G.text,margin:0}}>📁 {isHe?'מאגר מדיה':'Media Library'}</h3>
              <button onClick={()=>fileRef.current?.click()} style={{...sans,display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'none',background:G.smoke,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                <Upload size={9}/>{isHe?'העלאה':'Upload'}
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{display:'none'}} onChange={e=>handleMediaFile(e.target.files?.[0])}/>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:3,background:G.ivory,borderRadius:8,padding:3}}>
              {[{id:'files',he:'קבצים',en:'Files'},{id:'designs',he:'קנבה',en:'Canva'},{id:'drive',he:'Drive',en:'Drive'}].map(t=>(
                <button key={t.id} onClick={()=>setMediaTab(t.id)} style={{...sans,flex:1,padding:'5px 8px',borderRadius:6,border:'none',background:mediaTab===t.id?G.white:'transparent',color:mediaTab===t.id?G.smoke:G.muted,fontSize:10,fontWeight:mediaTab===t.id?700:400,cursor:'pointer'}}>
                  {isHe?t.he:t.en}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{position:'relative'}}>
              <Search size={11} color={G.muted} style={{position:'absolute',top:'50%',transform:'translateY(-50%)',right:isHe?10:'auto',left:isHe?'auto':10}}/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={isHe?'חיפוש...':'Search...'} style={{...inp,paddingRight:isHe?30:12,paddingLeft:isHe?12:30,fontSize:11}}/>
            </div>

            {/* Google Drive */}
            {mediaTab==='drive' && (
              <div style={{textAlign:'center',padding:'24px 12px'}}>
                <div style={{fontSize:40,marginBottom:12}}>📂</div>
                <p style={{...serif,fontSize:16,color:G.text,marginBottom:6}}>Google Drive</p>
                <p style={{...sans,fontSize:11,color:G.muted,marginBottom:14}}>{isHe?'גישה לקבצים ב-Drive שלך':'Access your Drive files'}</p>
                <button onClick={()=>window.open('https://drive.google.com','_blank')} style={{...sans,display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,border:'none',background:'#4285F4',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  <ExternalLink size={11}/>  {isHe?'פתח Google Drive':'Open Google Drive'}
                </button>
              </div>
            )}

            {/* Files / Designs grid */}
            {mediaTab!=='drive' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {filteredMedia.map(item=>(
                  <div key={item.id}
                    draggable
                    onDragStart={e=>e.dataTransfer.setData('mediaItem', JSON.stringify(item))}
                    style={{borderRadius:8,overflow:'hidden',background:G.ivory,border:`1px solid ${G.border}`,cursor:'grab',transition:'all 0.15s'}}
                    title={isHe?'גרור לפוסט':'Drag to post'}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                    <div style={{aspectRatio:'1',background:G.cream,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',fontSize:22}}>
                      {(item.data||item.preview)&&(item.type?.startsWith('image/')||item.preview)
                        ? <img src={item.data||item.preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : fileIcon(item.type)}
                    </div>
                    <div style={{padding:'5px 7px'}}>
                      <p style={{...sans,fontSize:9,color:G.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name||item.title||'קובץ'}</p>
                    </div>
                  </div>
                ))}
                {filteredMedia.length===0&&<div style={{gridColumn:'span 2',textAlign:'center',padding:'24px 0',...sans,fontSize:11,color:G.muted}}>{isHe?mediaTab==='files'?'אין קבצים — העלי תמונות ווידאו':'אין עיצובי קנבה':mediaTab==='files'?'No files uploaded':'No Canva designs'}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADD/EDIT POST MODAL ─────────────────── */}
      {showAddPost && (
        <PostModal
          isHe={isHe} G={G} sans={sans} serif={serif}
          platform={platform} editPost={editPost}
          prefill={typeof showAddPost==='object'?showAddPost:{}}
          allFiles={allFiles} allDesigns={allDesigns}
          onSave={handleSavePost}
          onClose={()=>{ setShowAddPost(false); setEditPost(null) }}
          notifGranted={notifGranted}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{position:'fixed',bottom:24,left:isHe?24:'auto',right:isHe?'auto':24,background:G.smokeDark,color:'#fff',borderRadius:14,padding:'12px 18px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:8,zIndex:3000,animation:'slide 0.3s ease',...sans,fontSize:13,fontWeight:500}}>
          ✨ {toast}
        </div>
      )}

      <style>{`
        @keyframes slide { from { transform:translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        .reel-overlay { transition: opacity 0.2s !important; }
      `}</style>
    </div>
  )
}

/* ── Feed Card ───────────────────────────────── */
function FeedCard({ post, idx, platform, isHe, G, sans, onEdit, onDelete, onDragStart, onDrop, dragOver, onDragOver, onDragLeave }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      draggable onDragStart={e=>onDragStart(e,idx)} onDrop={e=>onDrop(e,idx)} onDragOver={onDragOver} onDragLeave={onDragLeave}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{position:'relative',aspectRatio:platform.gridRatio,background:G.cream,border:`2px solid ${dragOver?platform.color:'transparent'}`,cursor:'grab',borderRadius:2,overflow:'hidden',transition:'all 0.15s'}}>
      {/* Image */}
      {post.image
        ? <img src={post.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,background:`linear-gradient(135deg,${platform.color}15,${platform.color}05)`}}>
            <span style={{fontSize:24}}>{platform.icon}</span>
            <span style={{...sans,fontSize:8,color:G.muted,textAlign:'center',padding:'0 6px',lineHeight:1.3}}>{post.caption?.slice(0,30)||'...'}</span>
          </div>}
      {/* Overlay */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.75),transparent 60%)',opacity:hover?1:0,transition:'opacity 0.2s'}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 6px'}}>
          <p style={{...sans,fontSize:8,color:'rgba(255,255,255,0.9)',lineHeight:1.4,marginBottom:4}}>{post.caption?.slice(0,50)||''}</p>
          {post.day&&post.time&&<span style={{...sans,fontSize:7,color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',gap:2}}><Clock size={7}/>{post.day} {post.time}</span>}
          <div style={{display:'flex',gap:3,marginTop:4}}>
            <button onClick={onEdit} style={{flex:1,padding:'3px',borderRadius:4,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:8,cursor:'pointer',...sans}}>✏️ {isHe?'עריכה':'Edit'}</button>
            <button onClick={onDelete} style={{padding:'3px 5px',borderRadius:4,border:'none',background:'rgba(220,38,38,0.5)',color:'#fff',fontSize:8,cursor:'pointer'}}><Trash2 size={8}/></button>
          </div>
        </div>
      </div>
      {/* Type badge */}
      {post.type&&post.type!=='פוסט'&&(
        <div style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.55)',borderRadius:4,padding:'1px 5px',...sans,fontSize:7,color:'#fff',fontWeight:700}}>
          {post.type==='ריל'?'▶':post.type==='סטורי'?'◯':post.type==='קרוסלה'?'⊡':''}
        </div>
      )}
      {/* Scheduled indicator */}
      {post.day&&post.time&&(
        <div style={{position:'absolute',top:4,left:4,background:'rgba(76,175,80,0.8)',borderRadius:'50%',width:7,height:7}} title={`${post.day} ${post.time}`}/>
      )}
    </div>
  )
}

/* ── Post Modal ─────────────────────────────── */
function PostModal({ isHe, G, sans, serif, platform, editPost, prefill, allFiles, allDesigns, onSave, onClose, notifGranted }) {
  const [image,    setImage]    = useState(editPost?.image    || prefill.prefillImage || null)
  const [caption,  setCaption]  = useState(editPost?.caption  || '')
  const [type,     setType]     = useState(editPost?.type     || prefill.prefillType  || 'פוסט')
  const [day,      setDay]      = useState(editPost?.day      || '')
  const [time,     setTime]     = useState(editPost?.time     || '19:00')
  const [hashtags, setHashtags] = useState(editPost?.hashtags || '')
  const [aiCaption,setAiCaption]= useState(false)
  const [tab,      setTab]      = useState('upload') // 'upload'|'library'
  const fileRef = useRef()

  const DAYS_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
  const charCount = caption.length
  const inp = { ...sans, padding:'9px 13px', borderRadius:10, fontSize:12, border:`1.5px solid ${G.border}`, background:G.ivory, color:G.text, outline:'none', width:'100%', boxSizing:'border-box' }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setImage(e.target.result)
    reader.readAsDataURL(file)
  }

  function generateCaption() {
    setAiCaption(true)
    const suggestions = [
      `✨ ${platform.label === 'Instagram' ? 'כשהיופי פוגש את הטבע...' : 'חוויה שלא תשכחו לעולם'} 🌿\n\nמקום שמדבר לנשמה. כל פינה מספרת סיפור.\n\n#${platform.label.toLowerCase()} #luxury #travel`,
      `🏡 בואו לגלות עולם שלם של שלווה ורוגע.\n\nרזרבציות: בלינק בביו ⬆️\n\n#boutique #hotel #travel #luxury`,
      `🌅 כל שקיעה כאן היא יצירת אמנות.\n\nחוויה של פעם בחיים — עכשיו הזמן לתפוס מקום.\n\n#sunset #travel #escapism`,
    ]
    setTimeout(() => { setCaption(suggestions[Math.floor(Math.random()*suggestions.length)]); setAiCaption(false) }, 1200)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(28,28,28,0.5)',backdropFilter:'blur(6px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:isHe?'rtl':'ltr'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:G.white,borderRadius:20,width:'100%',maxWidth:700,maxHeight:'90vh',overflow:'hidden',boxShadow:'0 32px 100px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}}>

        {/* Header */}
        <div style={{padding:'20px 24px',borderBottom:`1px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <h2 style={{...serif,fontSize:22,fontWeight:700,color:G.text,margin:0}}>{editPost?(isHe?'עריכת פוסט':'Edit Post'):(isHe?'פוסט חדש':'New Post')}</h2>
            <p style={{...sans,fontSize:11,color:G.muted,marginTop:2}}>{platform.label} · {type}</p>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:G.muted}}><X size={18}/></button>
        </div>

        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* Left — Image */}
          <div style={{width:220,flexShrink:0,padding:16,borderRight:isHe?'none':`1px solid ${G.border}`,borderLeft:isHe?`1px solid ${G.border}`:'none',display:'flex',flexDirection:'column',gap:10}}>
            {/* Image area */}
            <div
              style={{aspectRatio:platform.gridRatio,borderRadius:12,background:G.ivory,border:`2px dashed ${G.border}`,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:6}}
              onClick={()=>fileRef.current?.click()}
              onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files?.[0])}}
              onDragOver={e=>e.preventDefault()}>
              {image
                ? <img src={image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <><Upload size={22} color={G.muted}/><span style={{...sans,fontSize:9,color:G.muted,textAlign:'center'}}>{isHe?'לחיצה להעלאה\nאו גרירה':'Click or drag'}</span></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0])}/>

            {/* Library tabs */}
            <div style={{display:'flex',gap:2,background:G.ivory,borderRadius:7,padding:2}}>
              {[{id:'upload',he:'העלאה',en:'Upload'},{id:'library',he:'ספרייה',en:'Library'}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{...sans,flex:1,padding:'4px',borderRadius:5,border:'none',background:tab===t.id?G.white:'transparent',color:tab===t.id?G.smoke:G.muted,fontSize:9,fontWeight:tab===t.id?700:400,cursor:'pointer'}}>
                  {isHe?t.he:t.en}
                </button>
              ))}
            </div>

            {/* Library grid */}
            {tab==='library' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,overflowY:'auto',maxHeight:120}}>
                {[...allFiles.filter(f=>f.type?.startsWith('image/')||f.type?.startsWith('video/')), ...allDesigns.filter(d=>d.preview)].map(item=>(
                  <div key={item.id} onClick={()=>setImage(item.data||item.preview)}
                    style={{aspectRatio:'1',borderRadius:6,overflow:'hidden',background:G.cream,cursor:'pointer',border:`2px solid ${(item.data||item.preview)===image?G.smoke:'transparent'}`,transition:'all 0.1s'}}>
                    <img src={item.data||item.preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                ))}
                {allFiles.filter(f=>f.type?.startsWith('image/')).length===0&&<div style={{gridColumn:'span 2',...sans,fontSize:9,color:G.muted,textAlign:'center',padding:'8px 0'}}>{isHe?'אין קבצים':'No files'}</div>}
              </div>
            )}
          </div>

          {/* Right — Fields */}
          <div style={{flex:1,padding:16,overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>

            {/* Type + Platform */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'סוג':'Type'}</p>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {POST_TYPES.map(t=>(
                    <button key={t} onClick={()=>setType(t)} style={{...sans,padding:'4px 10px',borderRadius:20,border:`1.5px solid ${type===t?G.smoke:G.border}`,background:type===t?G.smoke:'transparent',color:type===t?'#fff':G.muted,fontSize:10,cursor:'pointer'}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'פלטפורמה':'Platform'}</p>
                <p style={{...sans,fontSize:13,fontWeight:600,color:platform.color}}>{platform.icon} {platform.label}</p>
              </div>
            </div>

            {/* Caption */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'קאפשן':'Caption'}</p>
                <button onClick={generateCaption} disabled={aiCaption} style={{...sans,display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,border:`1px solid ${G.gold}`,background:`${G.gold}10`,color:G.gold,fontSize:9,fontWeight:600,cursor:'pointer'}}>
                  <Sparkles size={9}/>{aiCaption?(isHe?'יוצר...':'Creating...'):(isHe?'צור קאפשן AI':'AI Caption')}
                </button>
              </div>
              <textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={5}
                placeholder={isHe?'כתבי את הקאפשן כאן — קריאה לפעולה, אמוג׳י, ועוד...':'Write your caption — CTA, emojis, and more...'}
                style={{...inp,resize:'none',lineHeight:1.6}}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
                <span style={{...sans,fontSize:9,color:charCount>2200?'#dc2626':G.muted}}>{charCount}/2200</span>
                {charCount>0&&<span style={{...sans,fontSize:9,color:G.muted}}>~{Math.round(charCount/5)} {isHe?'מילים':'words'}</span>}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <p style={{...sans,fontSize:10,fontWeight:700,color:G.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{isHe?'האשטאגים':'Hashtags'}</p>
              <input value={hashtags} onChange={e=>setHashtags(e.target.value)} placeholder="#luxury #travel #boutique..." style={inp}/>
            </div>

            {/* Schedule */}
            <div style={{padding:'12px 14px',borderRadius:12,background:`${G.smoke}06`,border:`1px solid ${G.smoke}15`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <Calendar size={13} color={G.smoke}/>
                <p style={{...sans,fontSize:11,fontWeight:700,color:G.smoke}}>{isHe?'תזמון פרסום':'Schedule Publication'}</p>
                {notifGranted&&<span style={{...sans,fontSize:9,color:'#4CAF50',marginInlineStart:'auto'}}>🔔 {isHe?'תקבלי תזכורת':'You\'ll get a reminder'}</span>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div>
                  <p style={{...sans,fontSize:9,color:G.muted,marginBottom:4}}>{isHe?'יום':'Day'}</p>
                  <select value={day} onChange={e=>setDay(e.target.value)} style={{...inp,fontSize:11}}>
                    <option value="">{isHe?'בחר יום...':'Select day...'}</option>
                    {DAYS_HE.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{...sans,fontSize:9,color:G.muted,marginBottom:4}}>{isHe?'שעה':'Time'}</p>
                  <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{...inp,fontSize:11}}
                    onFocus={e=>e.target.style.borderColor=G.smoke} onBlur={e=>e.target.style.borderColor=G.border}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'14px 24px',borderTop:`1px solid ${G.border}`,display:'flex',gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{...sans,flex:1,padding:'10px',borderRadius:10,border:`1.5px solid ${G.border}`,background:'transparent',color:G.muted,fontSize:13,cursor:'pointer'}}>
            {isHe?'ביטול':'Cancel'}
          </button>
          <button onClick={()=>onSave({image,caption,hashtags,type,day,time,platform:platform.id})}
            style={{...sans,flex:2,padding:'10px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(94,104,94,0.3)'}}>
            {day&&time?`📅 ${isHe?'שמור ותזמן':'Save & Schedule'}`:(isHe?'שמור פוסט':'Save Post')}
          </button>
        </div>
      </div>
    </div>
  )
} 