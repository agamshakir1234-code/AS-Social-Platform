import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute  from '@/components/ProtectedRoute'
import Layout          from '@/components/layout/Layout'
import Login           from '@/pages/Login'
import Dashboard       from '@/pages/Dashboard'
import Clients         from '@/pages/Clients'
import ClientWorkspace from '@/pages/ClientWorkspace'
import Posts           from '@/pages/Posts'
import Leads           from '@/pages/Leads'
import KPIs            from '@/pages/KPIs'
import Settings        from '@/pages/Settings'
import Planner         from '@/pages/Planner'
import CanvaCallback   from '@/pages/CanvaCallback'
import FeedDesign      from '@/pages/FeedDesign'
import AIStrategy      from '@/pages/AIStrategy'

export default function App() {
  return (
    <Routes>
      <Route path="/login"          element={<Login />} />
      <Route path="/canva/callback" element={<CanvaCallback />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index                   element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/clients"         element={<Clients />} />
          <Route path="/clients/:id"     element={<ClientWorkspace />} />
          <Route path="/posts"           element={<Posts />} />
          <Route path="/feed-design"     element={<FeedDesign />} />
          <Route path="/ai-strategy"     element={<AIStrategy />} />
          <Route path="/leads"           element={<Leads />} />
          <Route path="/kpis"            element={<KPIs />} />
          <Route path="/settings"        element={<Settings />} />
          <Route path="/planner"         element={<Planner />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
} 