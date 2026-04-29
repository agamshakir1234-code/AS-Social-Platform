// src/utils/helpers.js

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatCurrency(value, currency = 'BRL') {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en').format(n ?? 0)
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function pct(a, b) {
  if (!b) return 0
  return +((a / b) * 100).toFixed(1)
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const STATUS_COLORS = {
  // clients
  active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  inactive:  'bg-slate-500/15   text-slate-400   border-slate-500/25',
  prospect:  'bg-amber-500/15   text-amber-400   border-amber-500/25',
  // posts
  published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  scheduled: 'bg-blue-500/15    text-blue-400    border-blue-500/25',
  draft:     'bg-slate-500/15   text-slate-400   border-slate-500/25',
  rejected:  'bg-red-500/15     text-red-400     border-red-500/25',
  // leads
  new:         'bg-brand-500/15  text-brand-400  border-brand-500/25',
  contacted:   'bg-blue-500/15   text-blue-400   border-blue-500/25',
  qualified:   'bg-violet-500/15 text-violet-400 border-violet-500/25',
  converted:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  lost:        'bg-red-500/15    text-red-400    border-red-500/25',
}

export const PLATFORMS = ['instagram','facebook','twitter','linkedin','tiktok','other']
export const LEAD_SOURCES = ['instagram','facebook','referral','website','other']
