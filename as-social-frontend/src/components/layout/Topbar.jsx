import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/utils/helpers'

const TITLES = {
  '/dashboard': { he:'סקירה מנהלתית',  en:'Executive Overview'   },
  '/clients':   { he:'ניהול פורטפוליו', en:'Portfolio Management' },
  '/posts':     { he:'סטודיו יצירתי',   en:'Creative Studio'      },
  '/leads':     { he:'צמיחה אסטרטגית',  en:'Strategic Growth'     },
  '/kpis':      { he:'תובנות ביצועים',  en:'Performance Insights' },
  '/settings':  { he:'העדפות מערכת',    en:'System Preferences'   },
}

export default function Topbar({ lang, onSearch }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const isHe = lang === 'he'
  const title = TITLES[pathname]?.[isHe?'he':'en'] ?? 'AS Social'
  const dir = isHe ? 'rtl' : 'ltr'

  const handleSearch = (v) => {
    setSearchVal(v)
    if (onSearch) onSearch(v)
  }

  return (
    <header style={{
      height:'60px', flexShrink:0,
      background:'rgba(232,226,217,0.88)',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(142,148,132,0.12)',
      display:'flex', alignItems:'center',
      padding:'0 28px', gap:'14px', direction:dir,
      position:'relative', zIndex:100,
    }}>

      {/* Title */}
      <h1 style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:'16px', fontStyle:'italic',
        fontWeight:400, color:'#1a1c1e',
        letterSpacing:'0.02em', flex:1,
      }}>{title}</h1>

      {/* Search */}
      <div style={{position:'relative', display:'flex', alignItems:'center'}}>
        <Search size={13} strokeWidth={1.5} style={{
          position:'absolute',
          right: isHe ? '12px' : 'auto',
          left: isHe ? 'auto' : '12px',
          color:'rgba(142,148,132,0.6)', pointerEvents:'none',
        }}/>
        <input
          value={searchVal}
          onChange={e => handleSearch(e.target.value)}
          placeholder={isHe ? 'חיפוש...' : 'Search...'}
          style={{
            padding: isHe ? '8px 32px 8px 32px' : '8px 32px 8px 32px',
            border:'1px solid rgba(142,148,132,0.18)',
            borderRadius:'20px', fontSize:'12px',
            background:'rgba(255,255,255,0.7)',
            backdropFilter:'blur(10px)',
            color:'#1a1c1e', width:'200px', outline:'none',
            fontFamily:'Inter,sans-serif', fontWeight:400,
            transition:'all 0.3s ease',
          }}
          onFocus={e=>{e.target.style.background='rgba(255,255,255,0.95)';e.target.style.boxShadow='0 4px 20px rgba(142,148,132,0.15)'}}
          onBlur={e=>{e.target.style.background='rgba(255,255,255,0.7)';e.target.style.boxShadow='none'}}
        />
        {searchVal && (
          <button onClick={()=>handleSearch('')} style={{
            position:'absolute',
            left: isHe ? '10px' : 'auto',
            right: isHe ? 'auto' : '10px',
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(142,148,132,0.6)', display:'flex',
          }}><X size={12}/></button>
        )}
      </div>

      {/* Notifications */}
      <div style={{position:'relative'}}>
        <button onClick={()=>{setNotifOpen(o=>!o);setProfileOpen(false)}} style={{
          width:'34px', height:'34px', borderRadius:'50%',
          border:'1px solid rgba(142,148,132,0.18)',
          background: notifOpen ? 'rgba(142,148,132,0.12)' : 'rgba(255,255,255,0.6)',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          color:'#8e9484', position:'relative', transition:'all 0.3s ease',
        }}>
          <Bell size={14} strokeWidth={1.5}/>
          <span style={{
            position:'absolute', top:'7px', right:'7px',
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#b58269',
            boxShadow:'0 0 6px rgba(181,130,105,0.5)',
          }}/>
        </button>
        {notifOpen && (
          <div style={{
            position:'absolute', top:'44px',
            left: isHe ? '0' : 'auto', right: isHe ? 'auto' : '0',
            width:'280px', background:'#ffffff',
            borderRadius:'16px', padding:'16px',
            boxShadow:'0 8px 40px rgba(26,28,30,0.12)',
            border:'1px solid rgba(142,148,132,0.12)',
            direction:dir, zIndex:200,
          }}>
            <p style={{fontFamily:"'Playfair Display',serif", fontSize:'14px',
              fontStyle:'italic', color:'#1a1c1e', marginBottom:'12px'}}>
              {isHe?'התראות':'Notifications'}
            </p>
            {[
              {text:isHe?'Villa Azure — פוסט חדש מוכן לאישור':'Villa Azure — new post ready for approval', time:'2m'},
              {text:isHe?'Kempinski — 5 ימים ללא פרסום':'Kempinski — 5 days without a post', time:'1h'},
              {text:isHe?'Aman Tel Aviv — מעורבות גבוהה':'Aman Tel Aviv — high engagement', time:'3h'},
            ].map((n,i)=>(
              <div key={i} style={{
                padding:'10px 0', borderBottom: i<2 ? '1px solid rgba(142,148,132,0.08)' : 'none',
                display:'flex', gap:'10px', alignItems:'flex-start',
              }}>
                <span style={{width:'6px', height:'6px', borderRadius:'50%',
                  background:'#8e9484', flexShrink:0, marginTop:'5px'}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:'12px', color:'#1a1c1e', fontFamily:'Inter,sans-serif',
                    lineHeight:1.5, marginBottom:'2px'}}>{n.text}</p>
                  <p style={{fontSize:'10px', color:'rgba(142,148,132,0.6)',
                    fontFamily:'Inter,sans-serif'}}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{position:'relative'}}>
        <div onClick={()=>{setProfileOpen(o=>!o);setNotifOpen(false)}} style={{
          width:'32px', height:'32px', borderRadius:'50%',
          background:'linear-gradient(135deg,#8e9484,#6b7261)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer',
          border: profileOpen ? '2px solid #8e9484' : '2px solid rgba(255,255,255,0.8)',
          boxShadow:'0 2px 10px rgba(142,148,132,0.25)',
          transition:'all 0.3s ease',
        }}>
          <span style={{fontSize:'11px', fontWeight:500, color:'white',
            fontFamily:'Inter,sans-serif'}}>{getInitials(user?.name)}</span>
        </div>
        {profileOpen && (
          <div style={{
            position:'absolute', top:'44px',
            left: isHe ? '0' : 'auto', right: isHe ? 'auto' : '0',
            width:'220px', background:'#ffffff',
            borderRadius:'16px', padding:'16px',
            boxShadow:'0 8px 40px rgba(26,28,30,0.12)',
            border:'1px solid rgba(142,148,132,0.12)',
            direction:dir, zIndex:200,
          }}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px',
              paddingBottom:'12px', borderBottom:'1px solid rgba(142,148,132,0.08)'}}>
              <div style={{width:'36px', height:'36px', borderRadius:'50%',
                background:'linear-gradient(135deg,#8e9484,#6b7261)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <span style={{fontSize:'13px', fontWeight:500, color:'white',
                  fontFamily:'Inter,sans-serif'}}>{getInitials(user?.name)}</span>
              </div>
              <div>
                <p style={{fontSize:'13px', fontWeight:500, color:'#1a1c1e',
                  fontFamily:'Inter,sans-serif'}}>{user?.name}</p>
                <p style={{fontSize:'10px', color:'rgba(142,148,132,0.7)',
                  fontFamily:'Inter,sans-serif'}}>{user?.role}</p>
              </div>
            </div>
            {[
              isHe?'הפרופיל שלי':'My Profile',
              isHe?'הגדרות':'Settings',
              isHe?'יציאה':'Sign Out',
            ].map((item,i)=>(
              <p key={i} style={{
                fontSize:'12px', color: i===2 ? '#b58269' : '#1a1c1e',
                fontFamily:'Inter,sans-serif', padding:'8px 4px',
                cursor:'pointer', borderRadius:'6px',
                transition:'all 0.2s ease',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(142,148,132,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                {item}
              </p>
            ))}
          </div>
        )}
      </div>

    </header>
  )
} 