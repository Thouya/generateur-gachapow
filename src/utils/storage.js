const STORAGE_KEY = 'gachapow-data'

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}
