import fs from "fs/promises"
import path from "path"
import { Global } from "@m4spider/core/global"

const LIMIT = 200
const WINDOW_MS = 2 * 60 * 60 * 1000
const file = path.join(Global.Path.state, "usage.json")

interface UsageEntry {
  timestamp: number
}

let cached: UsageEntry[] | undefined

async function load(): Promise<UsageEntry[]> {
  if (cached) return cached
  try {
    const data = JSON.parse(await fs.readFile(file, "utf-8"))
    cached = Array.isArray(data) ? data : []
  } catch {
    cached = []
  }
  return cached!
}

async function save(entries: UsageEntry[]) {
  cached = entries
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(entries, null, 2), "utf-8")
}

function prune(entries: UsageEntry[], now: number): UsageEntry[] {
  return entries.filter((e) => now - e.timestamp < WINDOW_MS)
}

export async function trackRequest() {
  const entries = await load()
  const now = Date.now()
  entries.push({ timestamp: now })
  const pruned = prune(entries, now)
  await save(pruned)
}

export async function getDeviceUsage() {
  const entries = await load()
  const now = Date.now()
  const pruned = prune(entries, now)
  return {
    used: pruned.length,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - pruned.length),
  }
}
