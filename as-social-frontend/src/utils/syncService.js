/* ═══════════════════════════════════════════════════
   syncService.js — Central data management layer
   All screens read/write through here for consistency
═══════════════════════════════════════════════════ */

const PREFIX = {
  clients:   'as_clients',
  strategy:  'strategy_',
  brand:     'brand_',
  brief:     'brief_',
  posts:     'posts_',
  feed:      'feed_',
  media:     'media_',
  files:     'files_',
  tasks:     'tasks_',
  planner:   'planner_events',
  profile:   'profile_',
  daily:     'daily_tasks',
}

/* ── Helpers ────────────────────────────────────── */
const rj = k     => { try { return JSON.parse(localStorage.getItem(k)||'null') } catch { return null } }
const wj = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch(e) { console.error('syncService write error',e) } }

/* ── Event bus (cross-screen updates) ───────────── */
export function emitSync(event, data) {
  localStorage.setItem('__sync__', JSON.stringify({ event, data, ts: Date.now() }))
  window.dispatchEvent(new StorageEvent('storage', { key: '__sync__' }))
}

export function onSync(callback) {
  const handler = (e) => {
    if (e.key !== '__sync__') return
    try {
      const payload = JSON.parse(e.newValue || '{}')
      callback(payload)
    } catch {}
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

/* ── Clients ────────────────────────────────────── */
export function getClients()           { return rj(PREFIX.clients) || [] }
export function getClient(id)          { return getClients().find(c => c.id === id) || null }
export function saveClients(clients)   { wj(PREFIX.clients, clients); emitSync('clients', clients) }

export function updateClient(id, patch) {
  const clients = getClients()
  const updated = clients.map(c => c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)
  saveClients(updated)
  return updated.find(c => c.id === id)
}

/* ── Brief (form data) ──────────────────────────── */
export function getBrief(clientId)        { return rj(PREFIX.brief + clientId) || {} }
export function saveBrief(clientId, data) {
  wj(PREFIX.brief + clientId, { ...data, savedAt: new Date().toISOString() })
  emitSync('brief', { clientId, data })
}

/* ── Strategy ───────────────────────────────────── */
export function getStrategy(clientId)           { return rj(PREFIX.strategy + clientId) }
export function saveStrategy(clientId, strategy) {
  wj(PREFIX.strategy + clientId, { ...strategy, savedAt: new Date().toISOString() })
  // Auto-sync to planner
  if (strategy.weeklyPlan) syncStrategyToPlanner(clientId, strategy)
  // Auto-sync summary to client
  updateClient(clientId, {
    aiStrategy:   strategy.executiveSummary?.slice(0, 200),
    monthlyTheme: strategy.monthlyTheme,
    hasStrategy:  true,
  })
  emitSync('strategy', { clientId, strategy })
}

/* ── Brand ──────────────────────────────────────── */
export function getBrand(clientId)        { return rj(PREFIX.brand + clientId) || {} }
export function saveBrand(clientId, data) {
  wj(PREFIX.brand + clientId, { ...data, savedAt: new Date().toISOString() })
  updateClient(clientId, { brand: { colors: data.customColors, font: data.font?.heading, tagline: data.tagline } })
  emitSync('brand', { clientId, data })
}

/* ── Planner events ─────────────────────────────── */
export function getPlannerEvents()           { return rj(PREFIX.planner) || [] }
export function savePlannerEvents(events)    { wj(PREFIX.planner, events); emitSync('planner', events) }

export function addPlannerEvent(event) {
  const events = getPlannerEvents()
  const newEvent = { ...event, id: event.id || `evt_${Date.now()}`, createdAt: new Date().toISOString() }
  savePlannerEvents([...events, newEvent])
  return newEvent
}

export function updatePlannerEvent(id, patch) {
  const events = getPlannerEvents().map(e => e.id === id ? { ...e, ...patch } : e)
  savePlannerEvents(events)
}

export function deletePlannerEvent(id) {
  savePlannerEvents(getPlannerEvents().filter(e => e.id !== id))
}

/* ── Sync strategy → planner ────────────────────── */
export function syncStrategyToPlanner(clientId, strategy) {
  const client    = getClient(clientId)
  const existing  = getPlannerEvents().filter(e => e.clientId !== clientId || e.source !== 'strategy')
  const dayMap    = { 'ראשון':0,'שני':1,'שלישי':2,'רביעי':3,'חמישי':4,'שישי':5,'שבת':6 }
  const platColor = { Instagram:'#E1306C', Facebook:'#1877F2', TikTok:'#000000', LinkedIn:'#0A66C2', YouTube:'#FF0000' }

  const today     = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  const newEvents = []

  strategy.weeklyPlan?.forEach((week, wi) => {
    week.posts?.forEach(post => {
      const dayOffset  = (dayMap[post.day] ?? 0) + (wi * 7)
      const eventDate  = new Date(startOfWeek)
      eventDate.setDate(startOfWeek.getDate() + dayOffset)

      const [h, m] = (post.time || '09:00').split(':').map(Number)
      const start  = new Date(eventDate)
      start.setHours(h, m, 0, 0)
      const end    = new Date(start)
      end.setMinutes(end.getMinutes() + 60)

      newEvents.push({
        id:         `strategy_${clientId}_${wi}_${post.day}_${post.platform}`,
        clientId,
        clientName: client?.name || '',
        title:      post.topic || post.type,
        caption:    post.caption,
        hashtags:   post.hashtags,
        platform:   post.platform,
        type:       post.type,
        start:      start.toISOString(),
        end:        end.toISOString(),
        color:      platColor[post.platform] || '#5E685E',
        source:     'strategy',
        week:       week.week,
        theme:      week.theme,
      })
    })
  })

  savePlannerEvents([...existing, ...newEvents])

  // Also add to daily tasks
  syncStrategyToDailyTasks(clientId, strategy)
}

/* ── Sync strategy → daily tasks ───────────────── */
export function syncStrategyToDailyTasks(clientId, strategy) {
  const client    = getClient(clientId)
  const today     = new Date().toDateString()
  const todayDay  = new Date().getDay()
  const dayNames  = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
  const todayHe   = dayNames[todayDay]
  const existing  = rj(PREFIX.daily) || []

  const todayPosts = []
  strategy.weeklyPlan?.[0]?.posts?.forEach(post => {
    if (post.day === todayHe) todayPosts.push(post)
  })

  const newTasks = todayPosts.map(post => ({
    id:         `daily_${clientId}_${post.platform}_${Date.now()}`,
    clientId,
    clientName: client?.name || '',
    title:      `${post.platform} — ${post.type}: ${post.topic}`,
    caption:    post.caption,
    time:       post.time,
    platform:   post.platform,
    type:       post.type,
    priority:   'high',
    done:       false,
    date:       today,
    source:     'strategy',
  }))

  const filtered = existing.filter(t => t.source !== 'strategy' || t.clientId !== clientId)
  wj(PREFIX.daily, [...filtered, ...newTasks])
  emitSync('daily', [...filtered, ...newTasks])
}

/* ── Daily tasks ────────────────────────────────── */
export function getDailyTasks() {
  const all   = rj(PREFIX.daily) || []
  const today = new Date().toDateString()
  return all.filter(t => !t.date || t.date === today)
}

export function saveDailyTasks(tasks) { wj(PREFIX.daily, tasks); emitSync('daily', tasks) }

export function toggleDailyTask(id) {
  const all     = rj(PREFIX.daily) || []
  const updated = all.map(t => t.id === id ? { ...t, done: !t.done } : t)
  wj(PREFIX.daily, updated)
  emitSync('daily', updated)
}

/* ── Client tasks ───────────────────────────────── */
export function getClientTasks(clientId) { return rj(PREFIX.tasks + clientId) || [] }
export function saveClientTasks(clientId, tasks) {
  wj(PREFIX.tasks + clientId, tasks)
  emitSync('tasks', { clientId, tasks })
}

/* ── Feed posts ─────────────────────────────────── */
export function getFeedPosts(clientId, platform) { return rj(PREFIX.feed + clientId + '_' + platform) || [] }
export function saveFeedPosts(clientId, platform, posts) {
  wj(PREFIX.feed + clientId + '_' + platform, posts)
  emitSync('feed', { clientId, platform, posts })
}

/* ── Auto-populate feed from strategy ───────────── */
export function syncStrategyToFeed(clientId, strategy) {
  const platforms = ['instagram','facebook','tiktok','linkedin']
  const platMap   = { Instagram:'instagram', Facebook:'facebook', TikTok:'tiktok', LinkedIn:'linkedin' }

  platforms.forEach(plat => {
    const existing = getFeedPosts(clientId, plat).filter(p => p.source !== 'strategy')
    const fromStrategy = []

    strategy.weeklyPlan?.forEach(week => {
      week.posts?.filter(p => platMap[p.platform] === plat).forEach(post => {
        fromStrategy.push({
          id:       `feed_${clientId}_${plat}_${week.week}_${post.day}`,
          caption:  post.caption,
          hashtags: post.hashtags,
          type:     post.type,
          topic:    post.topic,
          day:      post.day,
          time:     post.time,
          platform: plat,
          source:   'strategy',
          week:     week.week,
          theme:    week.theme,
        })
      })
    })

    saveFeedPosts(clientId, plat, [...existing, ...fromStrategy])
  })
}

/* ── Media / Files ──────────────────────────────── */
export function getClientFiles(clientId)         { return rj(PREFIX.files + clientId) || [] }
export function saveClientFiles(clientId, files) { wj(PREFIX.files + clientId, files) }
export function addClientFile(clientId, file) {
  const files = getClientFiles(clientId)
  files.unshift({ ...file, id: file.id || `file_${Date.now()}`, savedAt: new Date().toISOString() })
  saveClientFiles(clientId, files)
  return files
}

export function getClientDesigns(clientId) { return rj(PREFIX.media + clientId) || [] }

/* ── Profile ────────────────────────────────────── */
export function getClientProfile(clientId)         { return rj(PREFIX.profile + clientId) || {} }
export function saveClientProfile(clientId, data)  { wj(PREFIX.profile + clientId, data); emitSync('profile', { clientId, data }) }

/* ── Stats helper ───────────────────────────────── */
export function getClientStats(clientId) {
  const strategy = getStrategy(clientId)
  const tasks    = getClientTasks(clientId)
  const events   = getPlannerEvents().filter(e => e.clientId === clientId)
  const files    = getClientFiles(clientId)
  return {
    hasStrategy:   !!strategy,
    taskCount:     tasks.length,
    openTasks:     tasks.filter(t => !t.done).length,
    eventCount:    events.length,
    upcomingCount: events.filter(e => new Date(e.start) > new Date()).length,
    fileCount:     files.length,
    strategyDate:  strategy?.savedAt,
  }
} 