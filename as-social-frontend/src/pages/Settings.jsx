import { useState, useEffect } from 'react'
import { User, Lock, Bell, Globe, Shield, Save, Link, Link2Off, Linkedin, Instagram, CheckCircle, Loader } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/ui/PageHeader'
import { getInitials } from '@/utils/helpers'
import http from '@/services/api'

const Section = ({ icon: Icon, title, children }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-bg-border">
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
        <Icon size={15} className="text-brand-400" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
    {children}
  </div>
)

function SocialCard({ platform, label, icon: Icon, iconColor, connected, info, onConnect, onDisconnect, loading }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-hover border border-bg-border">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? "bg-brand-500/15 border border-brand-500/25" : "bg-bg-card border border-bg-border"}`}>
          <Icon size={20} className={connected ? iconColor : "text-slate-500"} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-500">{connected && info ? info : "לא מחובר"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <CheckCircle size={12} /> מחובר
            </span>
            <button onClick={() => onDisconnect(platform)} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              {loading ? <Loader size={12} className="animate-spin" /> : <Link2Off size={12} />} נתק
            </button>
          </>
        ) : (
          <button onClick={() => onConnect(platform)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brand-400 border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 transition-colors disabled:opacity-50">
            {loading ? <Loader size={12} className="animate-spin" /> : <Link size={12} />} חבר חשבון
          </button>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" })
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" })
  const [notifications, setNotifications] = useState({ email: true, browser: false, weekly: true })
  const [socialStatus, setSocialStatus] = useState({ meta: false, linkedin: false, metaPages: [], igAccountId: null, linkedinName: null })
  const [socialLoading, setSocialLoading] = useState({ meta: false, linkedin: false })
  const [statusLoading, setStatusLoading] = useState(true)

  const setP = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }))
  const setPw = (k) => (e) => setPasswords((p) => ({ ...p, [k]: e.target.value }))
  const toggleN = (k) => setNotifications((p) => ({ ...p, [k]: !p[k] }))

  useEffect(() => {
    fetchSocialStatus()
    const params = new URLSearchParams(window.location.search)
    const connected = params.get("social_connected")
    const error = params.get("social_error")
    if (connected) {
      toast(connected === "meta" ? "Meta חובר בהצלחה!" : "LinkedIn חובר בהצלחה!", "success")
      window.history.replaceState({}, "", window.location.pathname)
      fetchSocialStatus()
    }
    if (error) {
      toast("שגיאה בחיבור: " + error, "error")
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  async function fetchSocialStatus() {
    try {
      setStatusLoading(true)
      const res = await http.get("/social/status")
      if (res.data && res.data.success) setSocialStatus(res.data.data)
    } catch (err) {
      console.error("social status error", err)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleConnect(platform) {
    setSocialLoading(prev => ({ ...prev, [platform]: true }))
    try {
      const res = await http.get("/social/" + platform + "/init")
      const data = res.data
      if (data && data.success && data.data && data.data.url) {
        window.location.href = data.data.url
      } else {
        toast("שגיאה: " + JSON.stringify(data), "error")
      }
    } catch (err) {
      toast(err?.response?.data?.message || err?.message || "שגיאה בחיבור", "error")
    } finally {
      setSocialLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  async function handleDisconnect(platform) {
    setSocialLoading(prev => ({ ...prev, [platform]: true }))
    try {
      await http.delete("/social/" + platform)
      toast(platform + " נותק", "success")
      fetchSocialStatus()
    } catch (err) {
      toast("שגיאה בניתוק", "error")
    } finally {
      setSocialLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const saveProfile = (e) => {
    e.preventDefault()
    toast("Profile saved", "info")
  }

  const savePassword = (e) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) { toast("Passwords do not match", "error"); return }
    if (passwords.next.length < 6) { toast("Min 6 characters", "error"); return }
    toast("Password updated", "success")
    setPasswords({ current: "", next: "", confirm: "" })
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8888/api"

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <PageHeader title="הגדרות" subtitle="ניהול חשבון וחיבורי רשתות." />

      <Section icon={User} title="פרופיל">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center">
            <span className="font-display text-xl font-bold text-brand-400">{getInitials(user?.name)}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-100">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/25 text-brand-400 text-xs capitalize">{user?.role}</span>
          </div>
        </div>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">שם מלא</label><input className="input" value={profile.name} onChange={setP("name")} /></div>
            <div><label className="label">אימייל</label><input className="input" type="email" value={profile.email} onChange={setP("email")} /></div>
          </div>
          <div className="flex justify-end"><button type="submit" className="btn-primary"><Save size={14} /> שמור</button></div>
        </form>
      </Section>

      <Section icon={Link} title="חיבורי רשתות חברתיות">
        {statusLoading ? (
          <div className="flex items-center gap-2 py-4 text-slate-500"><Loader size={16} className="animate-spin" /><span className="text-sm">טוען...</span></div>
        ) : (
          <div className="flex flex-col gap-3">
            <SocialCard platform="meta" label="Meta — Facebook & Instagram" icon={Instagram} iconColor="text-pink-400"
              connected={socialStatus.meta} info={socialStatus.igAccountId ? "Instagram ID: " + socialStatus.igAccountId : socialStatus.metaPages?.[0]?.name || null}
              onConnect={handleConnect} onDisconnect={handleDisconnect} loading={socialLoading.meta} />
            <SocialCard platform="linkedin" label="LinkedIn" icon={Linkedin} iconColor="text-sky-400"
              connected={socialStatus.linkedin} info={socialStatus.linkedinName || null}
              onConnect={handleConnect} onDisconnect={handleDisconnect} loading={socialLoading.linkedin} />
          </div>
        )}
      </Section>

      <Section icon={Lock} title="שינוי סיסמה">
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <div><label className="label">סיסמה נוכחית</label><input className="input" type="password" value={passwords.current} onChange={setPw("current")} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">סיסמה חדשה</label><input className="input" type="password" value={passwords.next} onChange={setPw("next")} required /></div>
            <div><label className="label">אימות</label><input className="input" type="password" value={passwords.confirm} onChange={setPw("confirm")} required /></div>
          </div>
          <div className="flex justify-end"><button type="submit" className="btn-primary"><Save size={14} /> עדכן</button></div>
        </form>
      </Section>

      <Section icon={Bell} title="התראות">
        <div className="flex flex-col gap-4">
          {[
            { key: "email", label: "התראות אימייל", desc: "עדכונים במייל" },
            { key: "browser", label: "התראות דפדפן", desc: "push בדפדפן" },
            { key: "weekly", label: "סיכום שבועי", desc: "כל יום שני" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-bg-border last:border-0">
              <div><p className="text-sm font-medium text-slate-200">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
              <button onClick={() => toggleN(key)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${notifications[key] ? "bg-brand-500" : "bg-bg-hover border border-bg-border"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${notifications[key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Globe} title="API">
        <div><label className="label">Backend URL</label>
          <div className="flex items-center gap-2">
            <input className="input font-mono text-xs flex-1" value={apiUrl} readOnly />
            <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">מחובר</span>
          </div>
        </div>
      </Section>

      <Section icon={Shield} title="אזור מסוכן">
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div><p className="text-sm font-medium text-slate-200">התנתקות</p><p className="text-xs text-slate-500">ינקה את הסשן</p></div>
          <button onClick={logout} className="btn-danger">התנתק</button>
        </div>
      </Section>
    </div>
  )
}      