import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const DEMO_USERS = {
  'admin@associalstudio.com': { password: 'Admin@123', user: { id: '1', name: 'Admin AS Studio', email: 'admin@associalstudio.com', role: 'admin' }},
  'demo@associalstudio.com':  { password: 'Demo@123',  user: { id: '2', name: 'Demo User', email: 'demo@associalstudio.com', role: 'viewer' }},
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/.netlify/functions/api'

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  const login = useCallback(async ({ email, password }) => {
    const demo = DEMO_USERS[email]
    if (demo && demo.password === password) {
      const tok = 'demo_' + Date.now()
      localStorage.setItem('token', tok)
      localStorage.setItem('user', JSON.stringify(demo.user))
      setToken(tok)
      setUser(demo.user)
      return demo.user
    }
    try {
      const res = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      throw new Error('Authentication failed')
    }
  }, [])

  const signup = useCallback(async (form) => {
    try {
      const res = await fetch(API_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      throw new Error('Registration failed')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
