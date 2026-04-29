import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText,
  Target, BarChart3, Settings, LogOut, CalendarDays, Grid, Sparkles
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/utils/helpers'

const NAV = [
  { to:'/dashboard', icon:LayoutDashboard, he:'סקירה מנהלתית',  en:'Executive Overview'   },
  { to:'/clients',   icon:Users,           he:'ניהול פורטפוליו', en:'Portfolio Management' },
  { to:'/posts',     icon:FileText,        he:'סטודיו יצירתי',   en:'Creative Studio'      },
  { to:'/planner',   icon:CalendarDays,    he:'תכנון ותזמון',    en:'Planning & Schedule'  },
  { to:'/ai-strategy', icon:Sparkles, he:'צמיחה אסטרטגית', en:'AI Strategy' },
  { to:'/feed-design', icon:Grid, he:'עיצוב הפיד', en:'Feed Design' },
  { to:'/kpis',      icon:BarChart3,       he:'תובנות ביצועים',  en:'Performance Insights' },
  { to:'/settings',  icon:Settings,        he:'העדפות מערכת',    en:'System Preferences'   },
]

const F  = { fontFamily:"'Inter',sans-serif" }
const FG = { fontFamily:"'Cormorant Garamond',serif" }

export default function Sidebar({ lang, onToggleLang }) {
  const { user, logout } = useAuth()
  const isHe = lang === 'he'

  return (
    <aside style={{
      width:'244px', flexShrink:0,
      display:'flex', flexDirection:'column',
      background:'#5E685E',
      height:'100vh',
      borderLeft:'1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Brand Mark ── */}
      <div style={{
        padding:'28px 20px 22px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        display:'flex', flexDirection:'column',
        alignItems:'center', gap:'6px',
      }}>
        {/* Logo container */}
        <div style={{
          background:'rgba(255,255,255,0.09)',
          borderRadius:'10px', padding:'10px 14px',
          width:'100%',
          display:'flex', alignItems:'center', justifyContent:'center',
          border:'1px solid rgba(255,255,255,0.06)',
        }}>
          <img src='/logo.png' alt='AGAM' style={{
            height:'62px', objectFit:'contain', width:'100%',
          }}/>
        </div>

        {/* Brand text */}
        <div style={{textAlign:'center', marginTop:'2px'}}>
          <p style={{
            ...FG,
            fontSize:'22px', fontWeight:400,
            color:'rgba(255,255,255,0.92)',
            letterSpacing:'0.14em',
            lineHeight:1,
          }}>AGAM</p>
          <p style={{
            ...F,
            fontSize:'8px', fontWeight:400,
            color:'rgba(255,255,255,0.28)',
            letterSpacing:'0.28em',
            textTransform:'uppercase',
            marginTop:'3px',
          }}>system</p>
        </div>

        {/* Workspace tag */}
        <div style={{
          marginTop:'6px',
          padding:'3px 10px',
          borderRadius:'20px',
          background:'rgba(180,154,116,0.15)',
          border:'1px solid rgba(180,154,116,0.20)',
        }}>
          <p style={{
            ...F,
            fontSize:'9px', fontWeight:500,
            color:'rgba(180,154,116,0.85)',
            letterSpacing:'0.12em',
            textTransform:'uppercase',
          }}>AS Social Studio</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex:1, paddingTop:'18px',
        display:'flex', flexDirection:'column', gap:'1px',
      }}>
        <p style={{
          ...F, fontSize:'9px', fontWeight:500,
          color:'rgba(255,255,255,0.20)',
          letterSpacing:'0.22em', textTransform:'uppercase',
          padding:'0 24px 10px',
        }}>
          {isHe ? 'ניווט' : 'Navigation'}
        </p>

        {NAV.map(({ to, icon:Icon, he, en }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <Icon size={15} strokeWidth={1.5} style={{flexShrink:0}}/>
            <span>{isHe ? he : en}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── AI indicator ── */}
      <div style={{
        margin:'0 14px 8px', padding:'9px 13px',
        background:'rgba(255,255,255,0.06)',
        borderRadius:'10px',
        border:'1px solid rgba(180,154,116,0.14)',
        display:'flex', alignItems:'center', gap:'9px',
      }}>
        <span style={{
          width:'7px', height:'7px', borderRadius:'50%',
          background:'#B49A74', flexShrink:0,
          animation:'pulse 2.5s infinite',
        }}/>
        <span style={{
          ...F, fontSize:'11px',
          color:'rgba(255,255,255,0.36)',
        }}>
          {isHe ? 'AI פעיל' : 'AI Active'}
        </span>
      </div>

      {/* ── Language toggle ── */}
      <div style={{
        margin:'0 14px 10px', display:'flex',
        border:'1px solid rgba(255,255,255,0.10)',
        borderRadius:'8px', overflow:'hidden',
      }}>
        {['he','en'].map(l => (
          <button key={l} onClick={() => onToggleLang(l)} style={{
            flex:1, padding:'8px 0',
            ...F, fontSize:'11px', fontWeight:500,
            border:'none', cursor:'pointer',
            letterSpacing:'0.06em',
            background: lang===l ? 'rgba(255,255,255,0.13)' : 'transparent',
            color: lang===l ? '#FFFFFF' : 'rgba(255,255,255,0.28)',
            transition:'all 0.18s ease',
          }}>
            {l === 'he' ? 'עב' : 'EN'}
          </button>
        ))}
      </div>

      {/* ── User ── */}
      <div style={{
        padding:'10px 14px 16px',
        borderTop:'1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'9px 11px',
          background:'rgba(255,255,255,0.06)',
          borderRadius:'10px',
        }}>
          <div style={{
            width:'32px', height:'32px',
            borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,rgba(180,154,116,0.4),rgba(180,154,116,0.15))',
            border:'1.5px solid rgba(180,154,116,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{
              ...F, fontSize:'11px', fontWeight:600,
              color:'rgba(255,255,255,0.9)',
            }}>{getInitials(user?.name)}</span>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <p style={{
              ...F, fontSize:'13px', fontWeight:500,
              color:'rgba(255,255,255,0.88)',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{user?.name}</p>
            <p style={{
              ...F, fontSize:'10px',
              color:'rgba(255,255,255,0.32)',
              marginTop:'1px',
            }}>{user?.role}</p>
          </div>
          <button onClick={logout} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(255,255,255,0.22)', padding:0,
            display:'flex', transition:'color 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.65)'}
          onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.22)'}>
            <LogOut size={14} strokeWidth={1.5}/>
          </button>
        </div>
      </div>
    </aside>
  )
} 