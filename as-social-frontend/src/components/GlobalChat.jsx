import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Phone } from 'lucide-react'

const G = {
  smoke:'#5E685E', smokeDark:'#445246',
  ivory:'#F7F4EF', white:'#FFFFFF', text:'#1C1C1C',
  border:'rgba(94,104,94,0.12)',
}
const sans = { fontFamily:"'Inter','Heebo',sans-serif" }
const ADMIN_WHATSAPP = '972507255331'

const FAQ = [
  { q:'איך מוסיפים לקוח חדש?',    a:'דאשבורד → לחצי "לקוח חדש" → מלאי שם ופלטפורמה → לחצי "הוסף + AI".' },
  { q:'איך יוצרים אסטרטגיה?',     a:'מסך "צמיחה אסטרטגית" → בחרי לקוח → מלאי בריף → לחצי "צרי אסטרטגיה AI".' },
  { q:'למה ה-AI לא עובד?',         a:'ודאי שמפתח GEMINI_API_KEY מוגדר ב-.env ושהשרת רץ עם npm run dev.' },
  { q:'איך מסנכרנים עם לוח שנה?', a:'לאחר יצירת אסטרטגיה הפוסטים עוברים אוטומטית ללוח "תכנון ותזמון".' },
  { q:'איך מעלים מדיה?',           a:'תיקיית לקוח → טאב "מאגר מדיה" → לחצי "העלאה" או גרירת קבצים.' },
  { q:'איך עורכים שפת מותג?',      a:'מסך "צמיחה אסטרטגית" → טאב "שפת מותג" → לחצי "ערוך" → שמרי.' },
]

function findLocal(q) {
  const t = q.toLowerCase()
  if (t.includes('לקוח') || t.includes('client'))           return FAQ[0].a
  if (t.includes('אסטרטגי') || t.includes('strategy'))     return FAQ[1].a
  if (t.includes('ai') || t.includes('לא עובד'))            return FAQ[2].a
  if (t.includes('לוח') || t.includes('planner'))           return FAQ[3].a
  if (t.includes('מדיה') || t.includes('תמונ'))             return FAQ[4].a
  if (t.includes('מותג') || t.includes('brand') || t.includes('צבע')) return FAQ[5].a
  return null
}

async function askGemini(history) {
  const key = import.meta.env.VITE_GEMINI_API_KEY || ''
  if (!key) throw new Error('no key')
  const res = await fetch(
    '/api/gemini/v1/models/gemini-2.5-flash-lite:generateContent?key=' + key,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    }
  )
  if (!res.ok) throw new Error('api ' + res.status)
  const d = await res.json()
  return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default function GlobalChat() {
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState([
    { role:'assistant', content:'היי! אני AS Assistant 🤖\nאיך אוכל לעזור לך היום?', id:'init' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [unread,  setUnread]  = useState(0)
  const bottomRef = useRef()

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); setUnread(0) }
  }, [msgs, open])

  async function send(text) {
    const msg = (text !== undefined ? text : input).trim()
    if (!msg) return
    setInput('')
    const userMsg = { role:'user', content:msg, id:'u_' + Date.now() }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setLoading(true)

    // Local FAQ first — instant
    const local = findLocal(msg)
    if (local) {
      setTimeout(() => {
        setMsgs(prev => [...prev, { role:'assistant', content:local, id:'a_' + Date.now() }])
        setLoading(false)
        if (!open) setUnread(n => n + 1)
      }, 350)
      return
    }

    // Gemini fallback
    try {
      const reply = await askGemini(next.filter(m => m.id !== 'init'))
      if (!reply) throw new Error('empty')
      setMsgs(prev => [...prev, { role:'assistant', content:reply, id:'a_' + Date.now() }])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMsgs(prev => [...prev, {
        role:'assistant',
        content:'לא הצלחתי למצוא תשובה. פני למנהלת המערכת.',
        id:'e_' + Date.now(),
        showEscalate: true,
      }])
    }
    setLoading(false)
  }

  function escalate() {
    const txt = msgs.slice(-4).map(m =>
      (m.role === 'user' ? 'שאלה: ' : 'תשובה: ') + m.content
    ).join('\n')
    window.open(
      'https://wa.me/' + ADMIN_WHATSAPP + '?text=' +
      encodeURIComponent('בעיה במערכת AS Social Studio:\n' + txt),
      '_blank'
    )
    setMsgs(prev => [...prev, { role:'assistant', content:'✅ הודעה נשלחה למנהלת!', id:'esc_' + Date.now() }])
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position:'fixed', bottom:90, left:24, zIndex:9999,
          width:320, maxHeight:480,
          background:G.white, borderRadius:18,
          boxShadow:'0 20px 60px rgba(0,0,0,0.18)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          border:'1px solid ' + G.border, direction:'rtl',
        }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#445246,#5E685E)', padding:'12px 15px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <div style={{ flex:1 }}>
              <p style={{ ...sans, fontSize:13, fontWeight:700, color:'#fff', margin:0 }}>AS Assistant</p>
              <p style={{ ...sans, fontSize:10, color:'rgba(255,255,255,0.65)', margin:0 }}>● מחובר</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.65)', display:'flex' }}>
              <X size={15}/>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map(m => (
              <div key={m.id} style={{ display:'flex', justifyContent:m.role==='user'?'flex-start':'flex-end' }}>
                <div style={{
                  maxWidth:'88%', padding:'8px 12px',
                  borderRadius: m.role==='user' ? '12px 12px 12px 3px' : '12px 12px 3px 12px',
                  background: m.role==='user' ? G.ivory : '#fff',
                  border:'1px solid ' + G.border,
                }}>
                  <p style={{ ...sans, fontSize:12, color:G.text, lineHeight:1.6, margin:0, whiteSpace:'pre-wrap' }}>{m.content}</p>
                  {m.showEscalate && (
                    <button onClick={escalate} style={{ ...sans, marginTop:7, padding:'4px 9px', borderRadius:7, border:'none', background:'rgba(34,197,94,0.1)', color:'#16a34a', fontSize:10, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                      <Phone size={9}/> שלח למנהלת
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* FAQ shortcuts */}
            {msgs.length === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
                {FAQ.map((f, i) => (
                  <button key={i} onClick={() => send(f.q)}
                    style={{ ...sans, padding:'7px 11px', borderRadius:9, border:'1px solid ' + G.border, background:G.ivory, color:'#5E685E', fontSize:11, cursor:'pointer', textAlign:'right' }}>
                    {f.q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ padding:'9px 13px', borderRadius:'12px 12px 3px 12px', background:'#fff', border:'1px solid ' + G.border, display:'flex', gap:4 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#5E685E', opacity:0.4, animation:'bounce 1s ' + (i*0.2) + 's infinite' }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* WhatsApp */}
          <div style={{ padding:'7px 12px', borderTop:'1px solid ' + G.border, display:'flex', justifyContent:'center', flexShrink:0 }}>
            <button onClick={escalate} style={{ ...sans, display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'none', background:'rgba(34,197,94,0.08)', color:'#16a34a', fontSize:10, fontWeight:600, cursor:'pointer' }}>
              <Phone size={10}/> דבר עם מנהלת המערכת
            </button>
          </div>

          {/* Input */}
          <div style={{ padding:'9px 12px', borderTop:'1px solid ' + G.border, display:'flex', gap:7, flexShrink:0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="שאלי כל שאלה..."
              style={{ ...sans, flex:1, padding:'8px 11px', borderRadius:9, border:'1.5px solid ' + G.border, background:G.ivory, color:G.text, fontSize:12, outline:'none' }}
              onFocus={e => e.target.style.borderColor = '#5E685E'}
              onBlur={e => e.target.style.borderColor = G.border}
            />
            <button
              onClick={() => send()}
              style={{ width:34, height:34, borderRadius:9, border:'none', background: input.trim() ? '#5E685E' : 'rgba(94,104,94,0.3)', color:'#fff', cursor: input.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Send size={13}/>
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', bottom:24, left:24, zIndex:9999, width:50, height:50, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#445246,#5E685E)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 24px rgba(94,104,94,0.4)', transition:'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {open ? <X size={18}/> : <MessageSquare size={18}/>}
        {!open && unread > 0 && (
          <span style={{ position:'absolute', top:-2, right:-2, width:17, height:17, borderRadius:'50%', background:'#dc2626', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{unread}</span>
        )}
      </button>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-3px);opacity:1}}`}</style>
    </>
  )
}   