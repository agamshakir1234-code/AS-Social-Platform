/**
 * plannerSync.js
 * ──────────────────────────────────────────────────────────────
 * Sync engine: keeps planner_events ↔ as_tasks ↔ tasks_{clientId}
 * in perfect sync at all times.
 *
 * Strategy: every mutation (add / edit / delete) calls fullSync()
 * which wipes all planner-sourced tasks and rebuilds them from scratch.
 * This guarantees no orphaned tasks and no duplicates.
 * ──────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'planner_events'

/* ── Read helpers ─────────────────────────────────────────── */
function readJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) }
  catch { return fallback }
}

/* ── Full sync ────────────────────────────────────────────── */
export function fullSync(events, clients) {
  if (!events) events = readJSON(STORAGE_KEY, [])
  if (!clients) clients = readJSON('as_clients', [])

  /* 1. Strip all planner-sourced entries from global tasks */
  const globalTasks = readJSON('as_tasks', []).filter(t => t.source !== 'planner')

  /* 2. Strip planner-sourced entries from every client's tasks */
  clients.forEach(c => {
    const ct = readJSON(`tasks_${c.id}`, []).filter(t => t.source !== 'planner')
    localStorage.setItem(`tasks_${c.id}`, JSON.stringify(ct))
  })

  /* 3. Re-inject every planner event as a task */
  events.forEach(ev => {
    const client     = clients.find(c => c.id === ev.clientId)
    const clientName = client?.name || ''

    /* → global daily task */
    globalTasks.push({
      id:       `planner_${ev.id}`,
      text:     `${ev.title}${clientName ? ` — ${clientName}` : ''}`,
      date:     ev.date,
      time:     ev.time,
      done:     false,
      priority: 'medium',
      source:   'planner',
      eventId:  ev.id,
      category: 'daily_review',
      platform: ev.platform,
      type:     ev.type,
      clientId: ev.clientId,
      clientName,
    })

    /* → client-specific task */
    if (ev.clientId) {
      const ct = readJSON(`tasks_${ev.clientId}`, [])
      ct.push({
        id:       `planner_${ev.id}`,
        text:     ev.title,
        date:     ev.date,
        time:     ev.time,
        platform: ev.platform,
        type:     ev.type,
        notes:    ev.notes || '',
        done:     false,
        priority: 'medium',
        source:   'planner',
        eventId:  ev.id,
      })
      localStorage.setItem(`tasks_${ev.clientId}`, JSON.stringify(ct))
    }
  })

  /* 4. Sort global tasks by date + time */
  globalTasks.sort((a, b) => {
    const da = `${a.date||''}${a.time||''}`, db = `${b.date||''}${b.time||''}`
    return da < db ? -1 : da > db ? 1 : 0
  })

  localStorage.setItem('as_tasks', JSON.stringify(globalTasks))

  /* 5. Fire storage event so other open tabs / components re-render */
  window.dispatchEvent(new Event('planner-sync'))
}

/* ── Convenience: save events then sync ───────────────────── */
export function saveAndSync(events, clients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  fullSync(events, clients)
}

/* ── Read planner events ──────────────────────────────────── */
export function readEvents() { return readJSON(STORAGE_KEY, []) }

/* ── Read today's tasks from global list ─────────────────── */
export function getTodayTasks() {
  const today = new Date().toISOString().slice(0, 10)
  return readJSON('as_tasks', []).filter(t => t.date === today)
}

/* ── Read tasks for a specific client ────────────────────── */
export function getClientTasks(clientId) {
  return readJSON(`tasks_${clientId}`, [])
}

/* ── Read upcoming tasks (next N days) ───────────────────── */
export function getUpcomingTasks(days = 7) {
  const today = new Date()
  const end   = new Date(); end.setDate(end.getDate() + days)
  const ts    = today.toISOString().slice(0, 10)
  const te    = end.toISOString().slice(0, 10)
  return readJSON('as_tasks', []).filter(t => t.source === 'planner' && t.date >= ts && t.date <= te)
} 