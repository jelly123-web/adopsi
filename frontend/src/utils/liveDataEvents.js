export const LIVE_DATA_EVENTS = {
  animals: 'animals-updated',
  categories: 'categories-updated',
  adoptions: 'adoptions-updated',
  users: 'users-updated',
  customers: 'customers-updated',
  settings: 'app-settings-updated',
  dashboard: 'dashboard-data-updated',
}

const LIVE_DATA_STORAGE_KEYS = {
  animals: 'animalsLastUpdated',
  categories: 'categoriesLastUpdated',
  adoptions: 'adoptionsLastUpdated',
  users: 'usersLastUpdated',
  customers: 'customersLastUpdated',
  settings: 'appSettingsLastUpdated',
}

export function publishLiveData(scope, detail = {}) {
  if (typeof window === 'undefined') return

  const timestamp = Date.now()
  const payload = { scope, timestamp, ...detail }
  const eventName = LIVE_DATA_EVENTS[scope]

  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }))
  }

  window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENTS.dashboard, { detail: payload }))

  const storageKey = LIVE_DATA_STORAGE_KEYS[scope]
  if (storageKey) {
    localStorage.setItem(storageKey, String(timestamp))
  }
}

export function subscribeLiveData(scopes, callback) {
  if (typeof window === 'undefined') return () => {}

  const scopeList = Array.isArray(scopes) ? scopes : [scopes]
  const eventNames = new Set(
    scopeList
      .map((scope) => LIVE_DATA_EVENTS[scope])
      .filter(Boolean),
  )

  if (scopeList.includes('dashboard')) {
    eventNames.add(LIVE_DATA_EVENTS.dashboard)
  }

  const handleEvent = (event) => callback(event)
  const handleStorage = (event) => {
    const shouldRefresh = scopeList.some((scope) => LIVE_DATA_STORAGE_KEYS[scope] === event.key)
    if (shouldRefresh) callback(event)
  }

  eventNames.forEach((eventName) => window.addEventListener(eventName, handleEvent))
  window.addEventListener('storage', handleStorage)

  return () => {
    eventNames.forEach((eventName) => window.removeEventListener(eventName, handleEvent))
    window.removeEventListener('storage', handleStorage)
  }
}
