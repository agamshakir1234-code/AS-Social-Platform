import { useState } from 'react'
import { User, Lock, Bell, Globe, Shield, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/ui/PageHeader'
import { getInitials } from '@/utils/helpers'

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

export default function Settings() {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [notifications, setNotifications] = useState({ email: true, browser: false, weekly: true })

  const setP = (k) => (e) => setProfile((p)  => ({ ...p, [k]: e.target.value }))
  const setPw = (k) => (e) => setPasswords((p) => ({ ...p, [k]: e.target.value }))
  const toggleN = (k) => setNotifications((p)  => ({ ...p, [k]: !p[k] }))

  const saveProfile = (e) => {
    e.preventDefault()
    toast('Profile saved (UI only — connect to your /users endpoint to persist)', 'info')
  }

  const savePassword = (e) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) { toast('Passwords do not match', 'error'); return }
    if (passwords.next.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    toast('Password updated (connect to your API to persist)', 'success')
    setPasswords({ current: '', next: '', confirm: '' })
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888/api'

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and workspace preferences." />

      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center">
            <span className="font-display text-xl font-bold text-brand-400">{getInitials(user?.name)}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-100">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/25 text-brand-400 text-xs capitalize">
              {user?.role}
            </span>
          </div>
        </div>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={profile.name} onChange={setP('name')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={profile.email} onChange={setP('email')} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary"><Save size={14} /> Save Profile</button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" value={passwords.current} onChange={setPw('current')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={passwords.next} onChange={setPw('next')} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={passwords.confirm} onChange={setPw('confirm')} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary"><Save size={14} /> Update Password</button>
          </div>
        </form>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="flex flex-col gap-4">
          {[
            { key: 'email',   label: 'Email notifications',   desc: 'Receive important updates by email' },
            { key: 'browser', label: 'Browser notifications', desc: 'Push alerts in your browser' },
            { key: 'weekly',  label: 'Weekly digest',         desc: 'Summary email every Monday morning' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-bg-border last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => toggleN(key)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${notifications[key] ? 'bg-brand-500' : 'bg-bg-hover border border-bg-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* API / Environment */}
      <Section icon={Globe} title="API Configuration">
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Backend URL</label>
            <div className="flex items-center gap-2">
              <input className="input font-mono text-xs flex-1" value={apiUrl} readOnly />
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Set via <code className="text-brand-400">VITE_API_URL</code> in your .env file.</p>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section icon={Shield} title="Danger Zone">
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div>
            <p className="text-sm font-medium text-slate-200">Sign out of all devices</p>
            <p className="text-xs text-slate-500">This will clear your session and redirect to login.</p>
          </div>
          <button onClick={logout} className="btn-danger">Sign out</button>
        </div>
      </Section>
    </div>
  )
}
