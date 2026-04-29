import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, X, Edit2, Trash2, Eye, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react'

const PLATFORMS = ['Instagram','Facebook','TikTok','LinkedIn','YouTube']
const STATUSES  = ['scheduled','pending','live','alert']

const BADGE = {
  scheduled:{ he:'מתוזמן',     en:'Scheduled', c:'#8e9484', bg:'rgba(142,148,132,0.09)' },
  pending:  { he:'ממתין',      en:'Pending',   c:'#9b8e7d', bg:'rgba(155,142,125,0.09)' },
  live:     { he:'פעיל',       en:'Live',      c:'#5a7a5a', bg:'rgba(90,122,90,0.09)'   },
  alert:    { he:'דורש טיפול', en:'Attention', c:'#b58269', bg:'rgba(181,130,105,0.09)' },
}

const C = {
  background:'#ffffff', borderRadius:'20px', border:'none',
  boxShadow:'0 2px 24px rgba(26,28,30,0.05), 0 1px 4px rgba(26,28,30,0.03)',
}

const serif = { fontFamily:"'Playfair Display', serif" }
const sans  = { fontFamily:"'Inter', sans-serif" }

const INPUT_STYLE = {
  fontFamily:"'Inter', sans-serif",
  width:'100%', padding:'11px 14px',
  border:'1px solid rgba(142,148,132,0.22)', borderRadius:'10px',
  fontSize:'13px', color:'#1a1c1e', background:'#f9f8f6',
  outline:'none', transition:'border-color 0.2s',
}

const iBtn = (c='#8e9484', bg='rgba(142,148,132,0.08)') => ({
  width:'30px', height:'30px', borderRadius:'8px', border:'none',
  background:bg, color:c, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  transition:'all 0.25s ease',
})

export default function Clients() {
  const { lang } = useOutletContext()
  const navigate = useNavigate()
  const isHe = lang === 'he'
  const dir  = isHe ? 'rtl' : 'ltr'

  const [clients, setClients] = useState(() => {
    try { return JSON.parse(localStorage.getItem('as_clients') || '[]') } catch { return [] }
  })
  const [modal,       setModal]       = useState(null)
  const [viewClient,  setViewClient]  = useState(null)
  const [editClient,  setEditClient]  = useState(null)
  const [localSearch, setLocalSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [form, setForm] = useState({
    name:'', platform:'Instagram', status:'pending', email:'', notes:'',
  })

  useEffect(() => {
    localStorage.setItem('as_clients', JSON.stringify(clients))
  }, [clients])

  const openAdd = () => {
    setForm({name:'', platform:'Instagram', status:'pending', email:'', notes:''})
    setEditClient(null)
    setModal('form')
  }

  const openEdit = (c) => {
    setForm({name:c.name, platform:c.platform, status:c.badge,
      email:c.email||'', notes:c.notes||''})
    setEditClient(c)
    setModal('form')
  }

  const saveClient = () => {
    if (!form.name.trim()) return
    if (editClient) {
      setClients(prev => prev.map(c => c.id===editClient.id
        ? {...c, name:form.name, platform:form.platform,
            badge:form.status, email:form.email, notes:form.notes}
        : c))
    } else {
      const newC = {
        id: Date.now(),
        name: form.name.trim(),
        platform: form.platform,
        badge: form.status,
        email: form.email,
        notes: form.notes,
        engagement: Math.floor(Math.random()*30)+50,
        trend: `+${Math.floor(Math.random()*15)+2}%`,
        up: true,
        nextPost: isHe?'מחר 10:00':'Tmrw 10:00',
        nextPostEn: 'Tmrw 10:00',
        tasks: 0,
        status: 'high',
        createdAt: new Date().toLocaleDateString(isHe?'he-IL':'en-GB'),
      }
      setClients(prev => [newC, ...prev])
    }
    setModal(null)
  }

  const deleteClient = id => setClients(prev => prev.filter(c => c.id!==id))

  const filtered = clients.filter(c => {
    const q = localSearch.toLowerCase()
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email||'').toLowerCase().includes(q) ||
      c.platform.toLowerCase().includes(q)
    const matchPlatform = !filterPlatform || c.platform===filterPlatform
    const matchStatus   = !filterStatus   || c.badge===filterStatus
    return matchSearch && matchPlatform && matchStatus
  })

  const thS = {
    padding:'11px 20px', fontSize:'9px', fontWeight:600,
    color:'rgba(155,142,125,0.7)', textTransform:'uppercase',
    letterSpacing:'0.14em', textAlign:isHe?'right':'left',
    whiteSpace:'nowrap', ...sans,
  }

  const selectStyle = {
    ...sans, padding:'8px 12px',
    border:'1px solid rgba(142,148,132,0.2)', borderRadius:'10px',
    fontSize:'12px', color:'#1a1c1e', background:'#ffffff',
    outline:'none', cursor:'pointer',
  }

  const primaryBtn = {
    display:'flex', alignItems:'center', gap:'7px',
    padding:'10px 20px', borderRadius:'12px', border:'none',
    background:'#8e9484', color:'white', fontSize:'12px',
    fontWeight:500, cursor:'pointer', ...sans,
    letterSpacing:'0.04em', transition:'all 0.3s ease',
    boxShadow:'0 4px 14px rgba(142,148,132,0.28)',
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'22px', direction:dir}}>

      {/* Header */}
      <div style={{...C, padding:'26px 32px', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, right:0, left:0, height:'2px',
          background:'linear-gradient(90deg,transparent,rgba(142,148,132,0.4),rgba(155,142,125,0.3),transparent)'}}/>
        <div>
          <p style={{...sans, fontSize:'10px', fontWeight:500,
            color:'rgba(155,142,125,0.7)', letterSpacing:'0.18em',
            textTransform:'uppercase', marginBottom:'6px'}}>
            {isHe?'ניהול פורטפוליו':'Portfolio Management'}
          </p>
          <p style={{...serif, fontSize:'22px', fontWeight:400, color:'#1a1c1e', fontStyle:'italic'}}>
            {isHe?`${clients.length} לקוחות פעילים`:`${clients.length} Active Clients`}
          </p>
        </div>
        <button onClick={openAdd} style={primaryBtn}
          onMouseEnter={e=>{e.currentTarget.style.background='#7a8070';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='#8e9484';e.currentTarget.style.transform='translateY(0)'}}>
          <Plus size={14}/>{isHe?'לקוח חדש':'New Client'}
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:'10px', alignItems:'center',
        flexWrap:'wrap', flexDirection:isHe?'row-reverse':'row'}}>
        <div style={{position:'relative', flex:1, minWidth:'200px'}}>
          <Search size={13} strokeWidth={1.5} style={{
            position:'absolute', top:'50%', transform:'translateY(-50%)',
            right:isHe?'12px':'auto', left:isHe?'auto':'12px',
            color:'rgba(142,148,132,0.5)', pointerEvents:'none',
          }}/>
          <input value={localSearch} onChange={e=>setLocalSearch(e.target.value)}
            placeholder={isHe?'חיפוש לקוח, אימייל, פלטפורמה...':'Search client, email, platform...'}
            style={{...INPUT_STYLE,
              paddingRight:isHe?'36px':'14px',
              paddingLeft:isHe?'14px':'36px',
              borderRadius:'12px',
            }}
            onFocus={e=>e.target.style.borderColor='#8e9484'}
            onBlur={e=>e.target.style.borderColor='rgba(142,148,132,0.22)'}/>
        </div>
        <select value={filterPlatform} onChange={e=>setFilterPlatform(e.target.value)}
          style={selectStyle}>
          <option value=''>{isHe?'כל הפלטפורמות':'All Platforms'}</option>
          {PLATFORMS.map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={selectStyle}>
          <option value=''>{isHe?'כל הסטטוסים':'All Statuses'}</option>
          {STATUSES.map(s=>(
            <option key={s} value={s}>{isHe?BADGE[s].he:BADGE[s].en}</option>
          ))}
        </select>
        {(localSearch||filterPlatform||filterStatus) && (
          <button
            onClick={()=>{setLocalSearch('');setFilterPlatform('');setFilterStatus('')}}
            style={{...sans, fontSize:'11px', color:'#9b8e7d', background:'none',
              border:'1px solid rgba(155,142,125,0.2)', borderRadius:'10px',
              padding:'8px 12px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'4px'}}>
            <X size={11}/>{isHe?'נקה':'Clear'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px'}}>
        {[
          {label:isHe?'סה"כ לקוחות':'Total Clients',
           val:clients.length, c:'#2c2e2b'},
          {label:isHe?'פעילים':'Active',
           val:clients.filter(c=>c.badge==='live').length, c:'#5a7a5a'},
          {label:isHe?'ממתינים':'Pending',
           val:clients.filter(c=>c.badge==='pending'||c.badge==='scheduled').length, c:'#8e9484'},
          {label:isHe?'דורשים טיפול':'Need Attention',
           val:clients.filter(c=>c.badge==='alert').length, c:'#b58269'},
        ].map((s,i)=>(
          <div key={i} style={{...C, padding:'20px 22px'}}>
            <p style={{...sans, fontSize:'9px', fontWeight:600,
              color:'rgba(155,142,125,0.65)', textTransform:'uppercase',
              letterSpacing:'0.16em', marginBottom:'10px'}}>{s.label}</p>
            <p style={{...serif, fontSize:'36px', fontWeight:400,
              color:s.c, lineHeight:1}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{...C, padding:'0', overflow:'hidden'}}>
        <div style={{padding:'18px 26px', borderBottom:'1px solid rgba(155,142,125,0.08)',
          display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <p style={{...serif, fontSize:'17px', fontWeight:400, color:'#1a1c1e', fontStyle:'italic'}}>
            {isHe?'רשימת לקוחות':'Client Directory'}
          </p>
          {filtered.length!==clients.length && (
            <p style={{...sans, fontSize:'11px', color:'rgba(155,142,125,0.6)'}}>
              {isHe
                ?`מציג ${filtered.length} מתוך ${clients.length}`
                :`Showing ${filtered.length} of ${clients.length}`}
            </p>
          )}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', direction:dir}}>
            <thead>
              <tr style={{background:'rgba(232,226,217,0.35)'}}>
                {[isHe?'לקוח':'Client', isHe?'פלטפורמה':'Platform',
                  isHe?'ביצועים':'Performance', isHe?'מגמה':'Trend',
                  isHe?'ביצוע הבא':'Next Post', isHe?'סטטוס':'Status',
                  isHe?'נוצר':'Created', isHe?'פעולות':'Actions',
                ].map((h,i)=><th key={i} style={thS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={8}>
                  <div style={{textAlign:'center', padding:'60px 20px'}}>
                    <p style={{...serif, fontSize:'20px', fontWeight:400,
                      color:'rgba(155,142,125,0.4)', fontStyle:'italic', marginBottom:'8px'}}>
                      {clients.length===0
                        ?(isHe?'הפורטפוליו ריק':'Portfolio is empty')
                        :(isHe?'לא נמצאו תוצאות':'No results found')}
                    </p>
                    {clients.length===0 && (
                      <button onClick={openAdd} style={{
                        ...sans, marginTop:'14px', padding:'10px 22px',
                        borderRadius:'12px', border:'none', background:'#8e9484',
                        color:'white', fontSize:'12px', fontWeight:500, cursor:'pointer',
                      }}>
                        {isHe?'+ הוסף לקוח ראשון':'+ Add First Client'}
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : filtered.map(c=>{
                const bd = BADGE[c.badge]||BADGE.pending
                const sc = c.status==='high'?'#8e9484':c.status==='medium'?'#9b8e7d':'#b58269'
                return (
                  <tr key={c.id}
                    style={{borderTop:'1px solid rgba(155,142,125,0.07)', transition:'background 0.2s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(232,226,217,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'16px 20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px',
                        flexDirection:isHe?'row-reverse':'row', justifyContent:'flex-end'}}>
                        <div>
                          <p onClick={()=>navigate(`/clients/${c.id}`)}
                            style={{...serif, fontSize:'14px', fontWeight:400,
                            color:'#1a1c1e', fontStyle:'italic', marginBottom:'2px',
                            cursor:'pointer', transition:'color 0.2s'}}
                            onMouseEnter={e=>e.target.style.color='#8e9484'}
                            onMouseLeave={e=>e.target.style.color='#1a1c1e'}>
                            {c.name}
                          </p>
                          {c.email && (
                            <p style={{...sans, fontSize:'10px',
                              color:'rgba(155,142,125,0.6)'}}>{c.email}</p>
                          )}
                        </div>
                        <span style={{width:'8px', height:'8px', borderRadius:'50%',
                          background:sc, flexShrink:0, boxShadow:`0 0 7px ${sc}50`}}/>
                      </div>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <span style={{...sans, fontSize:'11px', fontWeight:400, color:'#9b8e7d'}}>
                        {c.platform}
                      </span>
                    </td>
                    <td style={{padding:'16px 20px', minWidth:'120px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{flex:1, height:'3px',
                          background:'rgba(155,142,125,0.12)', borderRadius:'2px'}}>
                          <div style={{width:`${c.engagement}%`, height:'100%',
                            background:sc, borderRadius:'2px'}}/>
                        </div>
                        <span style={{...sans, fontSize:'11px', fontWeight:500,
                          color:sc, minWidth:'30px'}}>{c.engagement}%</span>
                      </div>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'3px'}}>
                        {c.up
                          ?<TrendingUp size={11} color='#8e9484'/>
                          :<TrendingDown size={11} color='#b58269'/>}
                        <span style={{...sans, fontSize:'11px', fontWeight:500,
                          color:c.up?'#8e9484':'#b58269'}}>{c.trend}</span>
                      </div>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                        <Clock size={10} color='rgba(155,142,125,0.5)'/>
                        <span style={{...sans, fontSize:'11px', color:'#9b8e7d'}}>
                          {isHe?c.nextPost:c.nextPostEn}
                        </span>
                      </div>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <span style={{...sans, fontSize:'10px', padding:'4px 10px',
                        borderRadius:'20px', background:bd.bg, color:bd.c,
                        fontWeight:500, letterSpacing:'0.03em'}}>
                        {isHe?bd.he:bd.en}
                      </span>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <span style={{...sans, fontSize:'10px', color:'rgba(155,142,125,0.55)'}}>
                        {c.createdAt}
                      </span>
                    </td>
                    <td style={{padding:'16px 20px'}}>
                      <div style={{display:'flex', gap:'6px',
                        flexDirection:isHe?'row-reverse':'row'}}>
                        {[
                          {icon:<Eye size={12}/>,    c:'#8e9484', bg:'rgba(142,148,132,0.08)',
                           fn:()=>navigate(`/clients/${c.id}`)},
                          {icon:<Edit2 size={12}/>,  c:'#9b8e7d', bg:'rgba(155,142,125,0.08)',
                           fn:()=>openEdit(c)},
                          {icon:<Trash2 size={12}/>, c:'#b58269', bg:'rgba(181,130,105,0.07)',
                           fn:()=>deleteClient(c.id)},
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

      {/* Modals */}
      {modal && (
        <div style={{position:'fixed', inset:0, background:'rgba(26,28,30,0.45)',
          backdropFilter:'blur(8px)', zIndex:1000, direction:dir,
          display:'flex', alignItems:'center', justifyContent:'center'}}
          onClick={()=>{setModal(null);setViewClient(null)}}>
          <div style={{...C, padding:'36px', width:'460px', maxWidth:'92vw'}}
            onClick={e=>e.stopPropagation()}>

            {modal==='view' && viewClient && (
              <>
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:'24px'}}>
                  <p style={{...serif, fontSize:'22px', fontWeight:400,
                    color:'#1a1c1e', fontStyle:'italic'}}>{viewClient.name}</p>
                  <button onClick={()=>{setModal(null);setViewClient(null)}}
                    style={{background:'none',border:'none',cursor:'pointer',
                      color:'rgba(155,142,125,0.5)',display:'flex'}}>
                    <X size={18}/>
                  </button>
                </div>
                {[
                  {l:isHe?'פלטפורמה':'Platform',  v:viewClient.platform},
                  {l:isHe?'מעורבות':'Engagement', v:`${viewClient.engagement}%`},
                  {l:isHe?'סטטוס':'Status',
                   v:isHe?BADGE[viewClient.badge]?.he:BADGE[viewClient.badge]?.en},
                  {l:isHe?'אימייל':'Email',         v:viewClient.email||'—'},
                  {l:isHe?'הערות':'Notes',          v:viewClient.notes||'—'},
                  {l:isHe?'נוצר':'Created',         v:viewClient.createdAt},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex', justifyContent:'space-between',
                    padding:'10px 0', borderBottom:'1px solid rgba(155,142,125,0.08)'}}>
                    <p style={{...sans, fontSize:'11px', color:'rgba(155,142,125,0.6)'}}>{r.l}</p>
                    <p style={{...sans, fontSize:'12px', color:'#1a1c1e', fontWeight:500}}>{r.v}</p>
                  </div>
                ))}
                <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                  <button onClick={()=>navigate(`/clients/${viewClient.id}`)} style={{
                    flex:1, padding:'11px', borderRadius:'12px', ...sans,
                    border:'none', background:'#8e9484',
                    color:'white', fontSize:'13px', fontWeight:500, cursor:'pointer',
                  }}>{isHe?'פתח סביבת עבודה':'Open Workspace'}</button>
                </div>
              </>
            )}

            {modal==='form' && (
              <>
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:'28px'}}>
                  <p style={{...serif, fontSize:'22px', fontWeight:400,
                    color:'#1a1c1e', fontStyle:'italic'}}>
                    {editClient?(isHe?'עריכת לקוח':'Edit Client'):(isHe?'לקוח חדש':'New Client')}
                  </p>
                  <button onClick={()=>setModal(null)}
                    style={{background:'none',border:'none',cursor:'pointer',
                      color:'rgba(155,142,125,0.5)',display:'flex'}}>
                    <X size={18}/>
                  </button>
                </div>
                {[
                  {label:isHe?'שם הנכס':'Property Name', key:'name', type:'text',
                   ph:isHe?'Villa Azure, Kempinski...':'Villa Azure, Kempinski...'},
                  {label:isHe?'אימייל':'Email', key:'email', type:'email',
                   ph:'contact@villa.com'},
                ].map(f=>(
                  <div key={f.key} style={{marginBottom:'16px'}}>
                    <p style={{...sans, fontSize:'9px', fontWeight:600,
                      color:'rgba(155,142,125,0.7)', textTransform:'uppercase',
                      letterSpacing:'0.14em', marginBottom:'7px'}}>{f.label}</p>
                    <input value={form[f.key]}
                      onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                      placeholder={f.ph} type={f.type} style={INPUT_STYLE}
                      onFocus={e=>e.target.style.borderColor='#8e9484'}
                      onBlur={e=>e.target.style.borderColor='rgba(142,148,132,0.22)'}/>
                  </div>
                ))}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr',
                  gap:'14px', marginBottom:'16px'}}>
                  {[
                    {label:isHe?'פלטפורמה':'Platform', key:'platform',
                     opts:PLATFORMS.map(p=>({v:p,l:p}))},
                    {label:isHe?'סטטוס':'Status', key:'status',
                     opts:STATUSES.map(s=>({v:s,l:isHe?BADGE[s].he:BADGE[s].en}))},
                  ].map(f=>(
                    <div key={f.key}>
                      <p style={{...sans, fontSize:'9px', fontWeight:600,
                        color:'rgba(155,142,125,0.7)', textTransform:'uppercase',
                        letterSpacing:'0.14em', marginBottom:'7px'}}>{f.label}</p>
                      <select value={form[f.key]}
                        onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                        style={INPUT_STYLE}>
                        {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:'24px'}}>
                  <p style={{...sans, fontSize:'9px', fontWeight:600,
                    color:'rgba(155,142,125,0.7)', textTransform:'uppercase',
                    letterSpacing:'0.14em', marginBottom:'7px'}}>
                    {isHe?'הערות':'Notes'}
                  </p>
                  <textarea value={form.notes}
                    onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                    placeholder={isHe?'הערות נוספות...':'Additional notes...'}
                    rows={3} style={{...INPUT_STYLE, resize:'none'}}
                    onFocus={e=>e.target.style.borderColor='#8e9484'}
                    onBlur={e=>e.target.style.borderColor='rgba(142,148,132,0.22)'}/>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={()=>setModal(null)} style={{
                    flex:1, padding:'12px', borderRadius:'12px', ...sans,
                    border:'1px solid rgba(142,148,132,0.25)', background:'transparent',
                    color:'#8e9484', fontSize:'13px', fontWeight:500, cursor:'pointer',
                  }}>{isHe?'ביטול':'Cancel'}</button>
                  <button onClick={saveClient} style={{
                    flex:1, padding:'12px', borderRadius:'12px', border:'none',
                    background:form.name.trim()?'#8e9484':'rgba(142,148,132,0.3)',
                    color:'white', fontSize:'13px', fontWeight:500,
                    cursor:form.name.trim()?'pointer':'default', ...sans,
                    boxShadow:form.name.trim()?'0 4px 14px rgba(142,148,132,0.28)':'none',
                  }}>
                    {editClient?(isHe?'שמור שינויים':'Save Changes'):(isHe?'הוסף לקוח':'Add Client')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
} 