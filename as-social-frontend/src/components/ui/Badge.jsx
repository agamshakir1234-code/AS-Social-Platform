import { STATUS_COLORS } from '@/utils/helpers'

export default function Badge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  return (
    <span className={`badge border ${cls} capitalize`}>{status}</span>
  )
}
