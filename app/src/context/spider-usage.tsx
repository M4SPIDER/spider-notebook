import { createSignal, createMemo, createEffect, onMount, onCleanup } from "solid-js"
import { useAuth } from "./auth"

export type SpiderUsageData = {
  totalRequests: number
  tokensUsed: number
  avgLatency: number
  errorRate: number
  plan: string
  resetsInDays: number
  periodEndsAt: string
  tokenLimit: number
  requestLimit: number
  hasPaid: boolean
  directTokens?: number
  window5hLimit?: number
  window5hUsed?: number
  window5hActive?: boolean
}

function parseJwt(token: string | null): Record<string, any> | null {
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const binStr = atob(base64)
    const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export function useSpiderUsage() {
  const auth = useAuth()
  const [data, setData] = createSignal<SpiderUsageData | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null)

  const userId = createMemo(() => {
    const u = auth.user()
    if (u?.id) return u.id
    const token = auth.token()
    if (token) {
      const payload = parseJwt(token)
      if (payload?.user_id) return payload.user_id as string
      if (payload?.sub) return payload.sub as string
    }
    return u?.email || "demo_user"
  })

  async function refresh() {
    const uid = userId()
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      const token = auth.token()
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`https://aistudio.m4spider.com/api/usage?userId=${encodeURIComponent(uid)}`, {
        headers,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData({
        totalRequests: Number(json.totalRequests ?? 0),
        tokensUsed: Number(json.tokensUsed ?? 0),
        avgLatency: Number(json.avgLatency ?? 120),
        errorRate: Number(json.errorRate ?? 0),
        plan: json.plan || "Free Pack",
        resetsInDays: Number(json.resetsInDays ?? 7),
        periodEndsAt: json.periodEndsAt || "",
        tokenLimit: Number(json.tokenLimit ?? 1000000),
        requestLimit: Number(json.requestLimit ?? 10000),
        hasPaid: json.hasPaid === true,
        directTokens: json.directTokens ? Number(json.directTokens) : undefined,
        window5hLimit: json.window5hLimit ? Number(json.window5hLimit) : undefined,
        window5hUsed: json.window5hUsed ? Number(json.window5hUsed) : undefined,
        window5hActive: json.window5hActive === true,
      })
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e?.message ?? "Failed to load usage")
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    if (userId()) {
      void refresh()
    }
  })

  onMount(() => {
    const interval = setInterval(() => {
      if (userId()) void refresh()
    }, 60000)
    onCleanup(() => clearInterval(interval))
  })

  const isUnlimited = createMemo(() => {
    const d = data()
    if (!d) return false
    // Only genuine unlimited tokens (e.g. Scale tier or tokenLimit === -1)
    return (d.tokenLimit < 0 && (d.directTokens === undefined || d.directTokens < 0)) || /scale/i.test(d.plan)
  })

  const usagePercent = createMemo(() => {
    const d = data()
    if (!d || isUnlimited()) return 0
    let tokenP = 0
    let reqP = 0
    if (d.tokenLimit > 0) {
      tokenP = Math.min(100, Math.round((d.tokensUsed / d.tokenLimit) * 100))
    }
    if (d.requestLimit > 0) {
      reqP = Math.min(100, Math.round((d.totalRequests / d.requestLimit) * 100))
    }
    return Math.max(tokenP, reqP)
  })

  const planName = createMemo(() => {
    const p = data()?.plan || "Free Pack"
    return p
  })

  const isFreePlan = createMemo(() => {
    const p = planName().toLowerCase()
    return p.includes("free")
  })

  const canSeeModels = createMemo(() => {
    const raw = (data()?.plan || parseJwt(auth.token())?.plan || "").toLowerCase().trim()
    // Plans at or above ₹799: Ultra (₹799), Enterprise (₹1,999), Scale (₹49,999)
    // Until ₹799 (Free, Starter ₹299, Pro ₹499), users CANNOT see individual models!
    return /ultra|enterprise|scale|799|1999|49999/i.test(raw)
  })

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isUnlimited,
    usagePercent,
    planName,
    isFreePlan,
    canSeeModels,
  }
}
