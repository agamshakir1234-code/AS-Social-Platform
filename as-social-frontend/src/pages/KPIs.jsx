import { useEffect, useState } from 'react'
import {
  Users, FileText, Target, TrendingUp, BarChart3,
  DollarSign, CheckCircle, Clock, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { getDashboard } from '@/services/api'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, formatNumber, pct } from '@/utils/helpers'

const COLORS   = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#a78bfa']
const TT_STYLE = {
  contentStyle: { background: '#0d1221', border: '1px solid #1e2a3a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#94a3b8' },
  itemStyle:    { color: '#e2e8f0' },
}

export default function KPIs() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const ov = data?.overview || {}

  const clientBreakdown = [
    { name: 'Active',   value: ov.activeClients   || 0 },
    { name: 'Inactive', value: ov.inactiveClients  || 0 },
    { name: 'Prospect', value: ov.prospectClients  || 0 },
  ]

  const postBreakdown = [
    { name: 'Published', value: ov.publishedPosts || 0 },
    { name: 'Scheduled', value: ov.scheduledPosts || 0 },
    { name: 'Draft',     value: ov.draftPosts     || 0 },
  ]

  const leadBreakdown = Object.entries(data?.breakdowns?.leadsBySource || {}).map(([name, value]) => ({ name, value }))

  const platformData = Object.entries(data?.breakdowns?.postsByPlatform || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), posts: value,
  }))

  const conversionRadial = [
    { name: 'Conversion', value: ov.conversionRate || 0, fill: '#6366f1' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader title="KPIs Overview" subtitle="Full performance breakdown across clients, posts and leads." />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Active Clients"    value={loading ? '—' : formatNumber(ov.activeClients)}   icon={Users}        color="brand"   sub={`of ${ov.totalClients ?? 0} total`} />
        <StatCard label="Posts Published"   value={loading ? '—' : formatNumber(ov.publishedPosts)}  icon={CheckCircle}  color="emerald" sub={`${ov.scheduledPosts ?? 0} queued`} />
        <StatCard label="Pipeline Value"    value={loading ? '—' : formatCurrency(ov.totalLeadValue)} icon={DollarSign}  color="amber"   sub="total lead value" />
        <StatCard label="Conversion Rate"   value={loading ? '—' : `${ov.conversionRate ?? 0}%`}     icon={TrendingUp}   color="violet"  sub={`${ov.convertedLeads ?? 0} converted`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend bar */}
        <div className="card p-5 lg:col-span-2">
          <p className="section-title mb-4">Monthly Activity Trend</p>
          {loading
            ? <div className="h-52 bg-bg-hover rounded-lg animate-pulse" />
            : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data?.monthlyTrend || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT_STYLE} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Conversion gauge */}
        <div className="card p-5 flex flex-col items-center">
          <p className="section-title mb-2 self-start">Lead Conversion</p>
          {loading
            ? <div className="h-52 w-full bg-bg-hover rounded-lg animate-pulse" />
            : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={conversionRadial} barSize={14}>
                    <RadialBar background={{ fill: '#1e2a3a' }} dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <p className="font-display text-4xl font-bold text-white -mt-8">{ov.conversionRate ?? 0}%</p>
                <p className="text-xs text-slate-500 mt-1">of leads converted</p>
                <div className="grid grid-cols-3 gap-2 w-full mt-4">
                  {[
                    { label: 'New',       value: ov.newLeads,       color: 'text-brand-400' },
                    { label: 'Converted', value: ov.convertedLeads, color: 'text-emerald-400' },
                    { label: 'Lost',      value: ov.lostLeads,      color: 'text-red-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className={`font-display text-lg font-bold ${color}`}>{value ?? 0}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Posts by platform */}
        <div className="card p-5">
          <p className="section-title mb-4">Posts by Platform</p>
          {loading
            ? <div className="h-48 bg-bg-hover rounded-lg animate-pulse" />
            : platformData.length === 0
              ? <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={platformData} layout="vertical" margin={{ left: 0, right: 4 }}>
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip {...TT_STYLE} />
                    <Bar dataKey="posts" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
          }
        </div>

        {/* Client breakdown */}
        <div className="card p-5">
          <p className="section-title mb-4">Client Status</p>
          {loading
            ? <div className="h-48 bg-bg-hover rounded-lg animate-pulse" />
            : (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={clientBreakdown} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                      {clientBreakdown.map((_, i) => <Cell key={i} fill={['#6366f1','#64748b','#f59e0b'][i]} />)}
                    </Pie>
                    <Tooltip {...TT_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                {clientBreakdown.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between w-full text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: ['#6366f1','#64748b','#f59e0b'][i] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-medium text-slate-200">{d.value}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Leads by source */}
        <div className="card p-5">
          <p className="section-title mb-4">Leads by Source</p>
          {loading
            ? <div className="h-48 bg-bg-hover rounded-lg animate-pulse" />
            : leadBreakdown.length === 0
              ? <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No leads yet</div>
              : (
                <div className="flex flex-col gap-3 mt-2">
                  {leadBreakdown.map((d, i) => (
                    <div key={d.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{d.name}</span>
                        <span className="text-slate-200 font-medium">{d.value}</span>
                      </div>
                      <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct(d.value, Math.max(...leadBreakdown.map((x) => x.value)))}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      </div>

      {/* Post status breakdown */}
      <div className="card p-5">
        <p className="section-title mb-4">Post Status Breakdown</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Published', value: ov.publishedPosts, icon: CheckCircle, color: 'emerald' },
            { label: 'Scheduled', value: ov.scheduledPosts, icon: Clock,        color: 'blue'   },
            { label: 'Draft',     value: ov.draftPosts,     icon: FileText,     color: 'brand'  },
            { label: 'Total',     value: ov.totalPosts,     icon: BarChart3,    color: 'violet' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-bg-base rounded-xl p-4 border border-bg-border">
              <p className="text-xs text-slate-500 mb-2">{label}</p>
              <p className="font-display text-3xl font-bold text-white">{loading ? '—' : value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
