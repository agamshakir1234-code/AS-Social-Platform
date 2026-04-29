import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export default function Login() {
  const { login, signup } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('login')  // 'login' | 'register'
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'viewer' })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password })
      } else {
        await signup(form)
      }
      toast(`Welcome${form.name ? ', ' + form.name : ''}!`, 'success')
      navigate('/dashboard')
    } catch (err) {
      toast(err?.response?.data?.message || 'Authentication failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bg-card via-[#0d1530] to-bg-base relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white">AS Social Studio</p>
            <p className="text-xs text-slate-500 font-mono">Social Media Management</p>
          </div>
        </div>

        <div className="relative">
          <p className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="text-brand-400">social presence</span><br />
            with precision.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Clients, posts, leads and KPIs — all in one elegant dashboard built for modern social media studios.
          </p>

          <div className="flex gap-4 mt-8">
            {[['24+', 'Clients'], ['98', 'Posts published'], ['55', 'Leads tracked']].map(([n, l]) => (
              <div key={l} className="bg-bg-card/60 border border-bg-border rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-white">{n}</p>
                <p className="text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© 2025 AS Social Studio. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white">AS Social Studio</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start your free workspace'}
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="João Silva" value={form.name} onChange={set('name')} required />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="joao@studio.com" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary justify-center mt-2 py-2.5">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
