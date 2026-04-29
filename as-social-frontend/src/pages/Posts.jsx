import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, X, Zap, ExternalLink, Trash2, ChevronRight,
  Search, Grid, List, Upload, Image, FolderOpen,
  Film, FileText, Link2, Check, Download } from 'lucide-react'
import { openCanvaDesign, saveDesignRef, getClientMedia, deleteClientMedia, DESIGN_TYPES } from '@/utils/canvaService'

/* ── Tokens ─────────────────────────────────── */
const G = {
  smoke:'#5E685E', smokeDark:'#445246', gold:'#B49A74',
  ivory:'#F7F4EF', white:'#FFFFFF', text:'#1C1C1C',
  muted:'#7A7A6E', border:'rgba(94,104,94,0.12)', cream:'#E8E1D8',
}
const sans  = { fontFamily:"'Inter','Heebo',sans-serif" }
const serif = { fontFamily:"'Cormorant Garamond',serif" }
const CLIENT_COLORS = ['#5E685E','#B49A74','#8E6B5A','#4A7C8E','#7A6E8E','#8E4A5A']

/* ── File helpers ───────────────────────────── */
function getMediaKey(clientId) { return `media_${clientId}` }
function getFilesKey(clientId)  { return `files_${clientId}` }

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)||'[]') } catch { return [] } }
function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

function getClientFiles(clientId) { return readJSON(getFilesKey(clientId)) }
function saveClientFiles(clientId, files) { writeJSON(getFilesKey(clientId), files) }
function getClientDesigns(clientId) { return readJSON(getMediaKey(clientId)) }
function saveClientDesigns(clientId, designs) { writeJSON(getMediaKey(clientId), designs) }

function fileIcon(type) {
  if (!type) return '📄'
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  if (type.includes('pdf'))      return '📑'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel'))   return '📊'
  return '📄'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/(1024*1024)).toFixed(1) + ' MB'
}

/* ── Google Drive Picker ────────────────────── */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY   || ''
const GOOGLE_APP_ID    = import.meta.env.VITE_GOOGLE_APP_ID    || ''

function loadGooglePicker(callback) {
  if (window.google?.picker) { callback(); return }
  const s = document.createElement('script')
  s.src = 'https://apis.google.com/js/api.js'
  s.onload = () => { window.gapi.load('picker', callback) }
  document.head.appendChild(s)
}

/* ═══════════════════════════════════════════════ */
export default function Posts() {
  const ctx  = useOutletContext() || {}
  const lang = ctx.lang || 'he'
  const isHe = lang !== 'en'

  const [clients,      setClients]      = useState(() => { try { return JSON.parse(localStorage.getItem('as_clients')||'[]') } catch { return [] } })
  const [activeClient, setActiveClient] = useState(null)
  const [tab,          setTab]          = useState('studio')   // 'studio' | 'media'
  const [designs,      setDesigns]      = useState([])
  const [files,        setFiles]        = useState([])
  const [showCreate,   setShowCreate]   = useState(false)
  const [uploadModal,  setUploadModal]  = useState(null)
  const [searchQ,      setSearchQ]      = useState('')
  const [viewMode,     setViewMode]     = useState('grid')
  const [filterType,   setFilterType]   = useState('all')      // 'all'|'image'|'video'|'doc'
  const [toast,        setToast]        = useState(null)
  const [selectedType, setSelectedType] = useState(DESIGN_TYPES[0].id)
  const [dragOver,     setDragOver]     = useState(false)
  const [urlInput,     setUrlInput]     = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [gdriveLinked, setGdriveLinked] = useState(false)
  const fileRef    = useRef()
  const dropRef    = useRef()

  /* ── Load data ────────────────────────────── */
  useEffect(() => {
    if (activeClient) {
      setDesigns(getClientDesigns(activeClient.id))
      setFiles(getClientFiles(activeClient.id))
    } else {
      setDesigns([]); setFiles([])
    }
  }, [activeClient])

  function refreshAll() {
    if (!activeClient) return
    setDesigns(getClientDesigns(activeClient.id))
    setFiles(getClientFiles(activeClient.id))
  }

  /* ── Create Canva design ──────────────────── */
  function handleCreate() {
    const type  = DESIGN_TYPES.find(t => t.id === selectedType)
    const title = activeClient
      ? `${isHe?type.label:type.labelEn} — ${activeClient.name}`
      : (isHe?type.label:type.labelEn)

    openCanvaDesign(selectedType, title, activeClient?.name)

    if (activeClient) {
      saveDesignRef(activeClient.id, { title, designType: selectedType })
      setDesigns(getClientDesigns(activeClient.id))
      showToast(isHe?`נפתח בקנבה ✨ נשמר בתיקיית ${activeClient.name}`:`Opened in Canva ✨ Saved to ${activeClient.name}`)
      setTimeout(() => setUploadModal({ id: getClientDesigns(activeClient.id)[0]?.id }), 3000)
    } else {
      showToast(isHe?'נפתח בקנבה ✨':'Opened in Canva ✨')
    }
    setShowCreate(false)
  }

  /* ── Upload preview for design ────────────── */
  function handlePreviewUpload(file, designId) {
    if (!file || !activeClient) return
    const reader = new FileReader()
    reader.onload = e => {
      const updated = designs.map(d => d.id === designId ? {...d, preview: e.target.result} : d)
      saveClientDesigns(activeClient.id, updated)
      setDesigns(updated)
      setUploadModal(null)
      showToast(isHe?'תמונת preview עודכנה ✅':'Preview updated ✅')
    }
    reader.readAsDataURL(file)
  }

  /* ── Upload files to media library ───────── */
  function handleFilesUpload(fileList) {
    if (!activeClient || !fileList?.length) return
    const toProcess = Array.from(fileList)
    let processed = 0

    toProcess.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const entry = {
          id:       `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name:     file.name,
          type:     file.type,
          size:     file.size,
          data:     e.target.result,  // base64
          source:   'upload',
          savedAt:  new Date().toISOString(),
        }
        const current = getClientFiles(activeClient.id)
        current.unshift(entry)
        saveClientFiles(activeClient.id, current)
        processed++
        if (processed === toProcess.length) {
          setFiles(getClientFiles(activeClient.id))
          showToast(isHe?`${processed} קבצים הועלו ✅`:`${processed} files uploaded ✅`)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  /* ── Add file from URL ────────────────────── */
  function handleAddUrl() {
    if (!urlInput.trim() || !activeClient) return
    const entry = {
      id:      `url_${Date.now()}`,
      name:    urlInput.split('/').pop() || 'קישור חיצוני',
      type:    'link',
      url:     urlInput.trim(),
      source:  'url',
      savedAt: new Date().toISOString(),
    }
    const current = getClientFiles(activeClient.id)
    current.unshift(entry)
    saveClientFiles(activeClient.id, current)
    setFiles(getClientFiles(activeClient.id))
    setUrlInput('')
    setShowUrlInput(false)
    showToast(isHe?'קישור נוסף ✅':'Link added ✅')
  }

  /* ── Google Drive Picker ──────────────────── */
  function openGoogleDrive() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      // Fallback: open Drive in new tab
      window.open('https://drive.google.com', '_blank')
      showToast(isHe?'Google Drive נפתח בחלון חדש':'Google Drive opened in new tab')
      return
    }
    loadGooglePicker(() => {
      window.gapi.auth2.getAuthInstance().signIn().then(user => {
        const token = user.getAuthResponse().access_token
        const picker = new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .setOAuthToken(token)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setAppId(GOOGLE_APP_ID)
          .setCallback(data => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0]
              const entry = {
                id:       `drive_${doc.id}`,
                name:     doc.name,
                type:     doc.mimeType || 'drive',
                url:      doc.url,
                driveId:  doc.id,
                source:   'gdrive',
                savedAt:  new Date().toISOString(),
                thumbnail: doc.thumbnailLink,
              }
              const current = getClientFiles(activeClient.id)
              current.unshift(entry)
              saveClientFiles(activeClient.id, current)
              setFiles(getClientFiles(activeClient.id))
              showToast(isHe?`"${doc.name}" נוסף מ-Drive ✅`:`"${doc.name}" added from Drive ✅`)
            }
          })
          .build()
        picker.setVisible(true)
      })
    })
  }

  /* ── Delete ───────────────────────────────── */
  function deleteDesign(id) {
    const updated = designs.filter(d => d.id !== id)
    if (activeClient) saveClientDesigns(activeClient.id, updated)
    setDesigns(updated)
  }
  function deleteFile(id) {
    const updated = files.filter(f => f.id !== id)
    if (activeClient) saveClientFiles(activeClient.id, updated)
    setFiles(updated)
  }

  /* ── Open file ────────────────────────────── */
  function openFile(file) {
    if (file.url) { window.open(file.url, '_blank'); return }
    if (file.data) {
      const a = document.createElement('a')
      a.href     = file.data
      a.download = file.name
      a.click()
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  /* ── Filtered ─────────────────────────────── */
  const filteredDesigns = useMemo(() =>
    designs.filter(d => !searchQ || (d.title||'').toLowerCase().includes(searchQ.toLowerCase()))
  , [designs, searchQ])

  const filteredFiles = useMemo(() =>
    files.filter(f => {
      if (searchQ && !(f.name||'').toLowerCase().includes(searchQ.toLowerCase())) return false
      if (filterType === 'image')  return f.type?.startsWith('image/')
      if (filterType === 'video')  return f.type?.startsWith('video/')
      if (filterType === 'doc')    return f.type?.includes('pdf') || f.type?.includes('word') || f.type?.includes('doc')
      if (filterType === 'link')   return f.source === 'url' || f.source === 'gdrive'
      return true
    })
  , [files, searchQ, filterType])

  /* ── Styles ───────────────────────────────── */
  const inp = { ...sans, padding:'9px 13px', borderRadius:10, fontSize:13, border:`1.5px solid ${G.border}`, background:G.ivory, color:G.text, outline:'none' }

  /* ═══════════════════════════════════════════ */
  return (
    <div style={{ background:G.ivory, minHeight:'100vh', direction:isHe?'rtl':'ltr', ...sans }}>

      {/* TOP BAR */}
      <div style={{ background:G.white, borderBottom:`1px solid ${G.border}`, padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ ...serif, fontSize:22, fontWeight:700, color:G.text, margin:0 }}>{isHe?'סטודיו יצירתי':'Creative Studio'}</h1>
          <p style={{ ...sans, fontSize:11, color:G.muted, marginTop:2 }}>{isHe?'עיצובים · מדיה · קבצים':'Designs · Media · Files'}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:20, background:'rgba(94,104,94,0.08)', border:`1px solid rgba(94,104,94,0.2)` }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4CAF50' }}/>
            <span style={{ ...sans, fontSize:11, color:G.smoke, fontWeight:500 }}>🎨 Canva {isHe?'מחובר':'Connected'}</span>
          </div>
          <button onClick={openGoogleDrive} style={{ ...sans, display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:20, cursor:'pointer', border:`1px solid ${G.border}`, background:G.white, color:G.muted, fontSize:11, fontWeight:500 }}>
            <span style={{ fontSize:14 }}>📂</span> Google Drive
          </button>
        </div>
      </div>

      <div style={{ display:'flex', height:'calc(100vh - 65px)' }}>

        {/* SIDEBAR */}
        <div style={{ width:228, flexShrink:0, background:G.white, borderRight:isHe?'none':`1px solid ${G.border}`, borderLeft:isHe?`1px solid ${G.border}`:'none', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 14px 6px' }}>
            <p style={{ ...sans, fontSize:9, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>{isHe?'לקוחות':'Clients'}</p>
          </div>

          <button onClick={() => setActiveClient(null)} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 14px', border:'none', cursor:'pointer', background:!activeClient?'rgba(94,104,94,0.10)':'transparent', width:'100%', textAlign:'inherit', borderRight:!activeClient&&isHe?`3px solid ${G.smoke}`:'none', borderLeft:!activeClient&&!isHe?`3px solid ${G.smoke}`:'none' }}>
            <div style={{ width:30, height:30, borderRadius:7, background:G.cream, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>🎨</div>
            <div style={{ flex:1 }}>
              <p style={{ ...sans, fontSize:12, fontWeight:500, color:G.text }}>{isHe?'כל התוכן':'All Content'}</p>
              <p style={{ ...sans, fontSize:10, color:G.muted }}>{clients.length} {isHe?'לקוחות':'clients'}</p>
            </div>
          </button>

          {clients.map((c, i) => {
            const color = CLIENT_COLORS[i % CLIENT_COLORS.length]
            const isActive = activeClient?.id === c.id
            const dCount = getClientDesigns(c.id).length
            const fCount = getClientFiles(c.id).length
            return (
              <button key={c.id} onClick={() => setActiveClient(c)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(94,104,94,0.05)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent' }}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 14px', border:'none', cursor:'pointer', background:isActive?'rgba(94,104,94,0.10)':'transparent', borderRight:isActive&&isHe?`3px solid ${color}`:'none', borderLeft:isActive&&!isHe?`3px solid ${color}`:'none', width:'100%', textAlign:'inherit', transition:'background 0.15s' }}>
                <div style={{ width:30, height:30, borderRadius:7, background:color+'20', border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', ...sans, fontSize:13, fontWeight:700, color, flexShrink:0 }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ ...sans, fontSize:12, fontWeight:500, color:G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                  <p style={{ ...sans, fontSize:10, color:G.muted }}>{dCount} {isHe?'עיצובים':'designs'} · {fCount} {isHe?'קבצים':'files'}</p>
                </div>
                <ChevronRight size={12} color={G.muted} style={{ transform:isHe?'rotate(180deg)':'none', flexShrink:0 }}/>
              </button>
            )
          })}

          {clients.length === 0 && (
            <div style={{ padding:'20px 14px', textAlign:'center' }}>
              <p style={{ ...sans, fontSize:11, color:G.muted }}>{isHe?'הוסף לקוחות בדאשבורד':'Add clients in Dashboard'}</p>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Client header + tabs */}
          {activeClient ? (
            <div style={{ background:G.white, borderBottom:`1px solid ${G.border}`, padding:'16px 24px 0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <p style={{ ...sans, fontSize:9, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{isHe?'סביבת עבודה':'Workspace'}</p>
                  <h2 style={{ ...serif, fontSize:20, color:G.text, margin:0 }}>{activeClient.name}</h2>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {tab === 'studio' && (
                    <button onClick={() => setShowCreate(true)} style={{ ...sans, display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:12, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(94,104,94,0.3)' }}>
                      <Plus size={13}/> {isHe?'עיצוב חדש':'New Design'}
                    </button>
                  )}
                  {tab === 'media' && (
                    <button onClick={() => fileRef.current?.click()} style={{ ...sans, display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      <Upload size={13}/> {isHe?'העלאת קבצים':'Upload Files'}
                    </button>
                  )}
                </div>
              </div>
              {/* Tabs */}
              <div style={{ display:'flex', gap:0 }}>
                {[{id:'studio',he:'עיצובים',en:'Designs',icon:'🎨'},{id:'media',he:'מדיה וקבצים',en:'Media & Files',icon:'📁'}].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{ ...sans, padding:'8px 18px', border:'none', cursor:'pointer', background:'transparent', color:tab===t.id?G.smoke:G.muted, fontSize:12, fontWeight:tab===t.id?600:400, borderBottom:`2px solid ${tab===t.id?G.smoke:'transparent'}`, transition:'all 0.15s', display:'flex', alignItems:'center', gap:5 }}>
                    <span>{t.icon}</span> {isHe?t.he:t.en}
                    {t.id==='studio'&&<span style={{ background:G.ivory, borderRadius:20, padding:'1px 7px', fontSize:10, color:G.muted }}>{designs.length}</span>}
                    {t.id==='media'&&<span style={{ background:G.ivory, borderRadius:20, padding:'1px 7px', fontSize:10, color:G.muted }}>{files.length}</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* No client selected */
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
              <div style={{ textAlign:'center', maxWidth:400 }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🎨</div>
                <h2 style={{ ...serif, fontSize:26, color:G.text, marginBottom:8 }}>{isHe?'סטודיו יצירתי':'Creative Studio'}</h2>
                <p style={{ ...sans, fontSize:13, color:G.muted, lineHeight:1.7, marginBottom:24 }}>
                  {isHe?'בחרי לקוח מהרשימה לניהול עיצובים, מדיה וקבצים — כל לקוח בתיקייה נפרדת':'Select a client to manage designs, media and files'}
                </p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                  {['🎨 עיצוב בקנבה','📁 מאגר מדיה','📂 Google Drive','🖼️ גלריה'].map((f,i) => (
                    <div key={i} style={{ padding:'6px 14px', borderRadius:20, background:G.white, border:`1px solid ${G.border}`, ...sans, fontSize:12, color:G.muted }}>{f}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeClient && (
            <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>

              {/* ── STUDIO TAB ── */}
              {tab === 'studio' && (
                <>
                  {/* AI Strategy bar */}
                  {activeClient.aiStrategy && (
                    <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(94,104,94,0.06)', border:`1px solid rgba(180,154,116,0.15)`, display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                      <Zap size={12} color={G.gold}/>
                      <span style={{ ...sans, fontSize:12, color:G.smoke }}><strong>AI:</strong> {activeClient.aiStrategy}</span>
                    </div>
                  )}

                  {/* Search + view */}
                  <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
                    <div style={{ position:'relative', flex:1, maxWidth:260 }}>
                      <Search size={12} color={G.muted} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', right:isHe?11:'auto', left:isHe?'auto':11 }}/>
                      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={isHe?'חיפוש עיצובים...':'Search designs...'} style={{ ...inp, paddingRight:isHe?32:13, paddingLeft:isHe?13:32, width:'100%', boxSizing:'border-box' }}/>
                    </div>
                    <div style={{ display:'flex', gap:2, background:G.white, borderRadius:8, padding:3, border:`1px solid ${G.border}` }}>
                      {[{v:'grid',icon:<Grid size={12}/>},{v:'list',icon:<List size={12}/>}].map(({v,icon}) => (
                        <button key={v} onClick={()=>setViewMode(v)} style={{ ...sans, padding:'5px 8px', borderRadius:6, border:'none', background:viewMode===v?G.smoke:'transparent', color:viewMode===v?G.white:G.muted, cursor:'pointer', display:'flex', alignItems:'center' }}>{icon}</button>
                      ))}
                    </div>
                    <span style={{ ...sans, fontSize:11, color:G.muted }}>{filteredDesigns.length} {isHe?'עיצובים':'designs'}</span>
                  </div>

                  {/* Designs grid */}
                  {filteredDesigns.length > 0 ? (
                    <div style={{ display:viewMode==='grid'?'grid':'flex', gridTemplateColumns:viewMode==='grid'?'repeat(auto-fill,minmax(185px,1fr))':undefined, flexDirection:viewMode==='list'?'column':undefined, gap:12 }}>
                      {filteredDesigns.map(d => (
                        <DesignCard key={d.id} design={d} viewMode={viewMode} isHe={isHe}
                          onOpen={() => { const url=d.urls?.edit_url; if(url) window.open(url,'_blank') }}
                          onDelete={() => deleteDesign(d.id)}
                          onUpload={() => setUploadModal({id:d.id})}
                          G={G} sans={sans} serif={serif}/>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'48px 20px' }}>
                      <div style={{ fontSize:48, marginBottom:14 }}>🎨</div>
                      <h3 style={{ ...serif, fontSize:20, color:G.text, marginBottom:8 }}>{isHe?'אין עיצובים עדיין':'No designs yet'}</h3>
                      <p style={{ ...sans, fontSize:13, color:G.muted, marginBottom:20 }}>
                        {isHe?`לחצי "עיצוב חדש" — יפתח ישירות בקנבה מותאם ל-${activeClient.name}`:`Click "New Design" — opens in Canva tailored to ${activeClient.name}`}
                      </p>
                      <button onClick={()=>setShowCreate(true)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        <Plus size={13}/>{isHe?'עיצוב חדש בקנבה':'New Canva Design'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── MEDIA TAB ── */}
              {tab === 'media' && (
                <>
                  {/* Upload area */}
                  <div
                    ref={dropRef}
                    onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={e=>{e.preventDefault();setDragOver(false);handleFilesUpload(e.dataTransfer.files)}}
                    onClick={()=>fileRef.current?.click()}
                    style={{ border:`2px dashed ${dragOver?G.smoke:G.border}`, borderRadius:14, padding:'24px 20px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(94,104,94,0.06)':G.ivory, transition:'all 0.2s', marginBottom:16 }}>
                    <Upload size={24} color={dragOver?G.smoke:G.muted} style={{ margin:'0 auto 8px' }}/>
                    <p style={{ ...sans, fontSize:13, fontWeight:600, color:dragOver?G.smoke:G.text, marginBottom:3 }}>
                      {isHe?'גרירת קבצים לכאן או לחיצה להעלאה':'Drag files here or click to upload'}
                    </p>
                    <p style={{ ...sans, fontSize:11, color:G.muted }}>PNG · JPG · MP4 · PDF · Word · Excel</p>
                    <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display:'none' }}
                      onChange={e=>handleFilesUpload(e.target.files)}/>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                    <button onClick={openGoogleDrive} style={{ ...sans, display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, cursor:'pointer', border:`1px solid ${G.border}`, background:G.white, color:G.text, fontSize:12, fontWeight:500 }}>
                      <span style={{ fontSize:15 }}>📂</span> Google Drive
                    </button>
                    <button onClick={()=>setShowUrlInput(v=>!v)} style={{ ...sans, display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, cursor:'pointer', border:`1px solid ${G.border}`, background:showUrlInput?G.smoke:G.white, color:showUrlInput?G.white:G.text, fontSize:12, fontWeight:500 }}>
                      <Link2 size={13}/> {isHe?'הוסף קישור':'Add Link'}
                    </button>
                    {/* Filter chips */}
                    <div style={{ display:'flex', gap:4, marginRight:'auto' }}>
                      {[{v:'all',he:'הכל',en:'All'},{v:'image',he:'תמונות',en:'Images'},{v:'video',he:'וידאו',en:'Video'},{v:'doc',he:'מסמכים',en:'Docs'},{v:'link',he:'קישורים',en:'Links'}].map(f=>(
                        <button key={f.v} onClick={()=>setFilterType(f.v)} style={{ ...sans, padding:'5px 12px', borderRadius:20, border:`1px solid ${filterType===f.v?G.smoke:G.border}`, background:filterType===f.v?G.smoke:'transparent', color:filterType===f.v?G.white:G.muted, fontSize:11, cursor:'pointer' }}>
                          {isHe?f.he:f.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* URL input */}
                  {showUrlInput && (
                    <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                      <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddUrl()} placeholder={isHe?'הדביקי קישור (URL)...':'Paste a URL...'} style={{ ...inp, flex:1 }}/>
                      <button onClick={handleAddUrl} style={{ ...sans, padding:'9px 16px', borderRadius:10, border:'none', background:G.smoke, color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {isHe?'הוסף':'Add'}
                      </button>
                    </div>
                  )}

                  {/* Search */}
                  {files.length > 0 && (
                    <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
                      <div style={{ position:'relative', flex:1, maxWidth:260 }}>
                        <Search size={12} color={G.muted} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', right:isHe?11:'auto', left:isHe?'auto':11 }}/>
                        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={isHe?'חיפוש קבצים...':'Search files...'} style={{ ...inp, paddingRight:isHe?32:13, paddingLeft:isHe?13:32, width:'100%', boxSizing:'border-box' }}/>
                      </div>
                      <span style={{ ...sans, fontSize:11, color:G.muted }}>{filteredFiles.length} {isHe?'קבצים':'files'}</span>
                    </div>
                  )}

                  {/* Files grid */}
                  {filteredFiles.length > 0 ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
                      {filteredFiles.map(f => (
                        <FileCard key={f.id} file={f} isHe={isHe}
                          onOpen={() => openFile(f)}
                          onDelete={() => deleteFile(f.id)}
                          G={G} sans={sans}/>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'40px 20px' }}>
                      <div style={{ fontSize:44, marginBottom:12 }}>📁</div>
                      <h3 style={{ ...serif, fontSize:18, color:G.text, marginBottom:6 }}>{isHe?'מאגר המדיה ריק':'Media library is empty'}</h3>
                      <p style={{ ...sans, fontSize:12, color:G.muted }}>
                        {isHe?'העלי תמונות, וידאו ומסמכים לתיקיית הלקוח':'Upload images, videos and docs to the client folder'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div onClick={()=>setShowCreate(false)} style={{ position:'fixed', inset:0, background:'rgba(28,28,28,0.45)', backdropFilter:'blur(5px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:G.white, borderRadius:20, padding:'30px 34px', width:'100%', maxWidth:540, boxShadow:'0 24px 80px rgba(0,0,0,0.18)', direction:isHe?'rtl':'ltr' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div>
                <h2 style={{ ...serif, fontSize:22, fontWeight:700, color:G.text, margin:0 }}>{isHe?'עיצוב חדש':'New Design'}</h2>
                {activeClient&&<p style={{ ...sans, fontSize:12, color:G.muted, marginTop:3 }}>{isHe?'עבור':'For'} {activeClient.name}</p>}
              </div>
              <button onClick={()=>setShowCreate(false)} style={{ background:'none', border:'none', cursor:'pointer', color:G.muted }}><X size={18}/></button>
            </div>
            {activeClient?.aiStrategy&&(
              <div style={{ padding:'9px 13px', borderRadius:10, marginBottom:14, background:'rgba(94,104,94,0.06)', border:`1px solid rgba(180,154,116,0.2)`, display:'flex', alignItems:'center', gap:7 }}>
                <Zap size={11} color={G.gold}/>
                <span style={{ ...sans, fontSize:11, color:G.smoke }}><strong>AI:</strong> {activeClient.aiStrategy}</span>
              </div>
            )}
            <p style={{ ...sans, fontSize:10, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{isHe?'בחרי סוג עיצוב':'Select Design Type'}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:18 }}>
              {DESIGN_TYPES.map(dt=>(
                <button key={dt.id} onClick={()=>setSelectedType(dt.id)} style={{ ...sans, padding:'11px 7px', borderRadius:10, cursor:'pointer', border:`2px solid ${selectedType===dt.id?G.smoke:G.border}`, background:selectedType===dt.id?'rgba(94,104,94,0.08)':'transparent', transition:'all 0.15s', textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{dt.icon}</div>
                  <p style={{ ...sans, fontSize:9, fontWeight:600, color:selectedType===dt.id?G.smoke:G.text, lineHeight:1.3 }}>{isHe?dt.label:dt.labelEn}</p>
                </button>
              ))}
            </div>
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(94,104,94,0.05)', border:`1px solid ${G.border}`, marginBottom:18 }}>
              <p style={{ ...sans, fontSize:11, color:G.muted }}>🎨 {isHe?'ייפתח בקנבה ויישמר אוטומטית בתיקיית הלקוח':'Opens in Canva and auto-saves to client folder'}</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ ...sans, flex:1, padding:'10px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${G.border}`, background:'transparent', color:G.muted, fontSize:12 }}>{isHe?'ביטול':'Cancel'}</button>
              <button onClick={handleCreate} style={{ ...sans, flex:2, padding:'10px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <ExternalLink size={13}/>{isHe?'פתח בקנבה':'Open in Canva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PREVIEW MODAL */}
      {uploadModal && (
        <div onClick={()=>setUploadModal(null)} style={{ position:'fixed', inset:0, background:'rgba(28,28,28,0.55)', backdropFilter:'blur(6px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:G.white, borderRadius:20, padding:'30px 34px', width:'100%', maxWidth:440, boxShadow:'0 24px 80px rgba(0,0,0,0.2)', direction:isHe?'rtl':'ltr' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ ...serif, fontSize:20, fontWeight:700, color:G.text, margin:0 }}>{isHe?'הוסיפי תמונת preview':'Add Preview Image'}</h2>
              <button onClick={()=>setUploadModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:G.muted }}><X size={18}/></button>
            </div>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);handlePreviewUpload(e.dataTransfer.files?.[0],uploadModal.id)}}
              onClick={()=>{ const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=e=>handlePreviewUpload(e.target.files?.[0],uploadModal.id); i.click() }}
              style={{ border:`2px dashed ${dragOver?G.smoke:G.border}`, borderRadius:14, padding:'36px 20px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(94,104,94,0.06)':G.ivory, transition:'all 0.2s', marginBottom:18 }}>
              <Upload size={28} color={dragOver?G.smoke:G.muted} style={{ margin:'0 auto 10px' }}/>
              <p style={{ ...serif, fontSize:16, color:G.text, marginBottom:5 }}>{isHe?'גרירה או לחיצה להעלאת תמונה':'Drag or click to upload image'}</p>
              <p style={{ ...sans, fontSize:11, color:G.muted }}>PNG · JPG · WebP</p>
            </div>
            <button onClick={()=>setUploadModal(null)} style={{ ...sans, width:'100%', padding:'10px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${G.border}`, background:'transparent', color:G.muted, fontSize:12 }}>{isHe?'דלגי':'Skip'}</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:isHe?24:'auto', right:isHe?'auto':24, background:G.smokeDark, color:G.white, borderRadius:14, padding:'12px 18px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:9, zIndex:2000, animation:'slide 0.3s ease', maxWidth:360 }}>
          <span style={{ fontSize:15 }}>✨</span>
          <span style={{ ...sans, fontSize:12, fontWeight:500 }}>{toast}</span>
        </div>
      )}

      <style>{`@keyframes slide{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

/* ── Design Card ─────────────────────────── */
function DesignCard({ design, viewMode, isHe, onOpen, onDelete, onUpload, G, sans, serif }) {
  const title = design.title || (isHe?'עיצוב Canva':'Canva Design')
  const date  = design.savedAt ? new Date(design.savedAt).toLocaleDateString(isHe?'he-IL':'en-GB') : ''
  const type  = DESIGN_TYPES.find(t => t.id === design.designType)

  if (viewMode === 'list') return (
    <div onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(94,104,94,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
      style={{ background:G.white, borderRadius:12, padding:'11px 15px', border:`1px solid ${G.border}`, display:'flex', alignItems:'center', gap:11, transition:'box-shadow 0.15s' }}>
      <div style={{ width:46, height:46, borderRadius:8, background:G.ivory, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {design.preview ? <img src={design.preview} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:22 }}>{type?.icon||'🎨'}</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ ...sans, fontSize:12, fontWeight:600, color:G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
        <p style={{ ...sans, fontSize:10, color:G.muted }}>{isHe?type?.label:type?.labelEn}{date?' · '+date:''}</p>
      </div>
      <div style={{ display:'flex', gap:5 }}>
        <button onClick={onUpload} style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${G.border}`, background:'transparent', color:G.muted, cursor:'pointer', display:'flex' }}><Upload size={11}/></button>
        <button onClick={onOpen} style={{ ...sans, display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:`1px solid ${G.border}`, background:'transparent', color:G.smoke, fontSize:11, cursor:'pointer' }}><ExternalLink size={10}/>{isHe?'פתח':'Open'}</button>
        <button onClick={onDelete} style={{ padding:'5px 8px', borderRadius:8, border:'none', background:'rgba(220,38,38,0.08)', color:'#dc2626', cursor:'pointer', display:'flex' }}><Trash2 size={11}/></button>
      </div>
    </div>
  )

  return (
    <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(94,104,94,0.12)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}
      style={{ background:G.white, borderRadius:14, overflow:'hidden', border:`1px solid ${G.border}`, transition:'all 0.15s' }}>
      <div style={{ aspectRatio:'1', background:G.ivory, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6, overflow:'hidden', position:'relative' }}>
        {design.preview ? <img src={design.preview} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <><span style={{ fontSize:36 }}>{type?.icon||'🎨'}</span><span style={{ ...sans, fontSize:9, color:G.muted }}>{isHe?type?.label:type?.labelEn}</span></>}
        <button onClick={onUpload} style={{ position:'absolute', top:7, left:isHe?7:'auto', right:isHe?'auto':7, background:'rgba(255,255,255,0.92)', border:`1px solid ${G.border}`, borderRadius:7, padding:'4px 7px', cursor:'pointer', display:'flex', alignItems:'center', gap:3, ...sans, fontSize:9, color:G.smoke, fontWeight:600 }}>
          <Upload size={9}/>{isHe?'תמונה':'Preview'}
        </button>
      </div>
      <div style={{ padding:'10px 12px' }}>
        <p style={{ ...sans, fontSize:11, fontWeight:600, color:G.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
        {date&&<p style={{ ...sans, fontSize:9, color:G.muted, marginBottom:9 }}>{date}</p>}
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={onOpen} style={{ ...sans, flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'6px 0', borderRadius:8, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:10, fontWeight:600, cursor:'pointer' }}><ExternalLink size={10}/>{isHe?'קנבה':'Canva'}</button>
          <button onClick={onDelete} style={{ padding:'6px 9px', borderRadius:8, border:'none', background:'rgba(220,38,38,0.08)', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center' }}><Trash2 size={11}/></button>
        </div>
      </div>
    </div>
  )
}

/* ── File Card ───────────────────────────── */
function FileCard({ file, isHe, onOpen, onDelete, G, sans }) {
  const isImage = file.type?.startsWith('image/')
  const icon    = fileIcon(file.type)
  const size    = formatSize(file.size)

  return (
    <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(94,104,94,0.12)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}
      style={{ background:G.white, borderRadius:12, overflow:'hidden', border:`1px solid ${G.border}`, transition:'all 0.15s', cursor:'pointer' }}
      onClick={onOpen}>
      {/* Preview */}
      <div style={{ aspectRatio:'1', background:G.ivory, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
        {isImage && file.data
          ? <img src={file.data} alt={file.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : file.thumbnail
          ? <img src={file.thumbnail} alt={file.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <span style={{ fontSize:36 }}>{icon}</span>}
        {file.source === 'gdrive' && (
          <div style={{ position:'absolute', top:6, right:6, background:'white', borderRadius:6, padding:'3px 6px', ...sans, fontSize:9, color:'#4285F4', fontWeight:700 }}>Drive</div>
        )}
        {file.source === 'url' && (
          <div style={{ position:'absolute', top:6, right:6, background:'white', borderRadius:6, padding:'3px 6px', ...sans, fontSize:9, color:G.smoke, fontWeight:700 }}>URL</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:'9px 10px' }}>
        <p style={{ ...sans, fontSize:10, fontWeight:600, color:G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{file.name}</p>
        {size && <p style={{ ...sans, fontSize:9, color:G.muted, marginBottom:8 }}>{size}</p>}
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={e=>{e.stopPropagation();onOpen()}} style={{ ...sans, flex:1, padding:'5px 0', borderRadius:7, border:'none', background:`linear-gradient(135deg,${G.smokeDark},${G.smoke})`, color:G.white, fontSize:9, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
            {file.source==='url'||file.source==='gdrive' ? <><ExternalLink size={9}/>{isHe?'פתח':'Open'}</> : <><Download size={9}/>{isHe?'הורד':'Download'}</>}
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete()}} style={{ padding:'5px 8px', borderRadius:7, border:'none', background:'rgba(220,38,38,0.08)', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center' }}><Trash2 size={10}/></button>
        </div>
      </div>
    </div>
  )
} 