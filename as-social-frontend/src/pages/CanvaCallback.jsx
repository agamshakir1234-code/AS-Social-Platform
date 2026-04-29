import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeToken } from '@/utils/canvaService'

const F  = { fontFamily:"'Inter','Heebo',sans-serif" }
const FG = { fontFamily:"'Cormorant Garamond',serif" }

export default function CanvaCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [error,  setError]  = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const err    = params.get('error')

    if (err) {
      setStatus('error')
      setError(err === 'access_denied' ? 'הגישה נדחתה על ידי Canva' : err)
      setTimeout(() => navigate('/posts'), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setError('לא התקבל קוד אימות מ-Canva')
      setTimeout(() => navigate('/posts'), 3000)
      return
    }

    exchangeToken(code)
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/posts'), 1500)
      })
      .catch(e => {
        setStatus('error')
        setError(e.message)
        setTimeout(() => navigate('/posts'), 3000)
      })
  }, [])

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F7F4EF', fontFamily:"'Inter','Heebo',sans-serif",
    }}>
      <div style={{
        background:'#fff', borderRadius:20, padding:'48px 56px', textAlign:'center',
        boxShadow:'0 8px 40px rgba(94,104,94,0.12)', maxWidth:380,
        border:'1px solid rgba(94,104,94,0.12)',
      }}>

        {status === 'loading' && (
          <>
            <div style={{ marginBottom:24, display:'flex', justifyContent:'center' }}>
              <div style={{
                width:48, height:48, borderRadius:'50%',
                border:'3px solid rgba(94,104,94,0.15)',
                borderTopColor:'#5E685E',
                animation:'spin 0.9s linear infinite',
              }}/>
            </div>
            <p style={{...FG, fontSize:22, color:'#1C1C1C', marginBottom:8}}>מתחבר ל-Canva...</p>
            <p style={{...F, fontSize:13, color:'#7A7A6E'}}>אנא המתיני מספר שניות</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <p style={{...FG, fontSize:22, color:'#5E685E', marginBottom:8}}>החיבור הצליח!</p>
            <p style={{...F, fontSize:13, color:'#7A7A6E'}}>מעבירה אותך לסטודיו...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
            <p style={{...FG, fontSize:22, color:'#dc2626', marginBottom:8}}>שגיאה בחיבור</p>
            <p style={{...F, fontSize:13, color:'#7A7A6E', marginBottom:4}}>{error}</p>
            <p style={{...F, fontSize:12, color:'#A7B0A2'}}>חוזרת לסטודיו...</p>
          </>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
} 