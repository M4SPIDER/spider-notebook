import type { VcsFileDiff } from "@m4spider/sdk/v2"

const DB_NAME = "opencode-vcs-cache"
const DB_VERSION = 1
const STORE_NAME = "diffs"
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  key: string
  data: VcsFileDiff[]
  timestamp: number
}

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null)
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

export async function getCachedDiff(key: string): Promise<VcsFileDiff[] | null> {
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        const entry: CacheEntry | undefined = request.result
        if (!entry) return resolve(null)
        if (Date.now() - entry.timestamp > MAX_AGE_MS) {
          const delTx = db.transaction(STORE_NAME, "readwrite")
          delTx.objectStore(STORE_NAME).delete(key)
          return resolve(null)
        }
        resolve(entry.data)
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedDiff(key: string, data: VcsFileDiff[]): Promise<void> {
  try {
    const db = await openDB()
    if (!db) return
    const entry: CacheEntry = { key, data, timestamp: Date.now() }
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(entry)
  } catch {
    // silently ignore storage errors
  }
}

export function vcsCacheKey(mode: string, directory: string, branch: string, defaultBranch: string): string {
  return `vcs:${mode}:${directory}:${branch}:${defaultBranch}`
}
