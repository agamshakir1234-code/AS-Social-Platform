import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ label, value, sub, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand:   'bg-brand-500/10   border-brand-500/20   text-brand-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10   border-amber-500/20   text-amber-400',
    rose:    'bg-rose-500/10    border-rose-500/20    text-rose-400',
    blue:    'bg-blue-500/10    border-blue-500/20    text-blue-400',
    violet:  'bg-violet-500/10  border-violet-500/20  text-violet-400',
  }

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colors[color]}`}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <div>
        <p className="font-display text-3xl font-bold text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
  )
}
