// src/services/api.js
// Centralised API service. All backend calls go through here.

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api'

const http = axios.create({ baseURL: BASE_URL })

// ── Request interceptor – attach JWT ─────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor – handle 401 globally ───────────────────────────────
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const unwrap = (res) => res.data

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (data)  => http.post('/auth/login',    data).then(unwrap)
export const register = (data)  => http.post('/auth/register', data).then(unwrap)

// ── Clients ───────────────────────────────────────────────────────────────────
export const getClients    = (params) => http.get('/clients',       { params }).then(unwrap)
export const getClient     = (id)     => http.get(`/clients/${id}`).then(unwrap)
export const createClient  = (data)   => http.post('/clients',      data).then(unwrap)
export const updateClient  = (id, data) => http.put(`/clients/${id}`, data).then(unwrap)
export const deleteClient  = (id)     => http.delete(`/clients/${id}`).then(unwrap)

// ── Posts ─────────────────────────────────────────────────────────────────────
export const getPosts     = (params)   => http.get('/posts',        { params }).then(unwrap)
export const getPost      = (id)       => http.get(`/posts/${id}`).then(unwrap)
export const createPost   = (data)     => http.post('/posts',       data).then(unwrap)
export const updatePost   = (id, data) => http.put(`/posts/${id}`,  data).then(unwrap)
export const deletePost   = (id)       => http.delete(`/posts/${id}`).then(unwrap)

// ── Leads ─────────────────────────────────────────────────────────────────────
export const getLeads     = (params)   => http.get('/leads',        { params }).then(unwrap)
export const getLead      = (id)       => http.get(`/leads/${id}`).then(unwrap)
export const createLead   = (data)     => http.post('/leads',       data).then(unwrap)
export const updateLead   = (id, data) => http.put(`/leads/${id}`,  data).then(unwrap)
export const deleteLead   = (id)       => http.delete(`/leads/${id}`).then(unwrap)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () => http.get('/dashboard').then(unwrap)

export default http
