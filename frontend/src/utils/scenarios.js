const STORAGE_KEY = 'financiero_scenarios'

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(scenarios) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

export function listScenarios(type) {
  return getAll().filter(s => s.type === type)
}

export function getScenario(id) {
  return getAll().find(s => s.id === id) || null
}

export function saveScenario(type, data, name, status) {
  const all = getAll()
  const existing = all.find(s => s.type === type && s.name === name && s.status === status)
  const now = new Date().toISOString()

  if (existing) {
    existing.data = data
    existing.updatedAt = now
    existing.status = status
  } else {
    all.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      name,
      status,
      data,
      createdAt: now,
      updatedAt: now,
    })
  }

  saveAll(all)
  return true
}

export function deleteScenario(id) {
  saveAll(getAll().filter(s => s.id !== id))
}

export function updateScenario(id, updates) {
  const all = getAll()
  const idx = all.findIndex(s => s.id === id)
  if (idx === -1) return false
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  saveAll(all)
  return true
}

export function exportScenario(id) {
  const s = getScenario(id)
  if (!s) return null
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `escenario-${s.name.replace(/\s+/g, '-').toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importScenario(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.type || !data.name || !data.data) {
          reject(new Error('Archivo inválido'))
          return
        }
        const all = getAll()
        const now = new Date().toISOString()
        all.push({
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
          type: data.type,
          name: data.name,
          status: 'permanent',
          data: data.data,
          createdAt: now,
          updatedAt: now,
        })
        saveAll(all)
        resolve(data)
      } catch {
        reject(new Error('Archivo inválido'))
      }
    }
    reader.readAsText(file)
  })
}