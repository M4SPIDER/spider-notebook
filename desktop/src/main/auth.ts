import http from "node:http"
import { URL } from "node:url"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { shell, BrowserWindow } from "electron"
import { getStore } from "./store"

const AUTH_STORE = "auth"
const TOKEN_KEY = "token"
const USER_KEY = "user"
const REFRESH_TOKEN_KEY = "refreshToken"
const FIREBASE_API_KEY = "AIzaSyBVPRD-9jHR0NRzg61Cs2KXfwoqvlHz388"
const AUTH_BASE = "https://ai.m4spider.com/auth/desktop"
const CALLBACK_PATH = "/auth/callback"

export function syncTokenToOpencode(token: string | null, refreshToken?: string | null) {
  try {
    const xdgData = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share")
    const authDir = path.join(xdgData, "spider")
    const authPath = path.join(authDir, "auth.json")
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true })
    }
    let data: Record<string, any> = {}
    if (fs.existsSync(authPath)) {
      try {
        data = JSON.parse(fs.readFileSync(authPath, "utf8"))
      } catch {}
    }
    if (token) {
      const existingRef = data["m4spider"]?.refreshToken
      const ref = refreshToken ?? existingRef
      data["m4spider"] = { type: "api", key: token, refreshToken: ref }
      data["meta"] = { type: "api", key: token }
      delete data["opencode"]
      process.env.SPIDER_AUTH_TOKEN = token
      if (ref) {
        process.env.SPIDER_REFRESH_TOKEN = ref
      }
    } else {
      delete data["m4spider"]
      delete data["meta"]
      delete data["opencode"]
      delete process.env.SPIDER_AUTH_TOKEN
      delete process.env.SPIDER_REFRESH_TOKEN
    }
    fs.writeFileSync(authPath, JSON.stringify(data, null, 2), "utf8")
  } catch (err) {
    console.error("Failed to sync auth token to spider:", err)
  }
}

type AuthUser = {
  id?: string
  email?: string
  name?: string
  provider?: string
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const decoded = Buffer.from(payload, "base64").toString("utf-8")
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

let callbackServer: http.Server | null = null
let pendingResolve: ((token: string | null) => void) | null = null

export function getAuthStore() {
  return getStore(AUTH_STORE)
}

export function getAuthToken(): string | null {
  return getAuthStore().get(TOKEN_KEY, null) as string | null
}

export function getRefreshToken(): string | null {
  return getAuthStore().get(REFRESH_TOKEN_KEY, null) as string | null
}

export function getAuthUser(): AuthUser | null {
  const user = getAuthStore().get(USER_KEY, null) as AuthUser | null
  const token = getAuthToken()
  if (user) {
    if (!user.id && token) {
      const payload = decodeJwtPayload(token)
      if (payload) {
        user.id = (payload.user_id as string) ?? (payload.sub as string) ?? undefined
        getAuthStore().set(USER_KEY, user)
      }
    }
    return user
  }
  return null
}

export function setAuthToken(token: string, user?: AuthUser, refreshToken?: string) {
  getAuthStore().set(TOKEN_KEY, token)
  if (refreshToken) {
    getAuthStore().set(REFRESH_TOKEN_KEY, refreshToken)
  }
  if (user) {
    if (!user.id && token) {
      const payload = decodeJwtPayload(token)
      if (payload) {
        user.id = (payload.user_id as string) ?? (payload.sub as string) ?? undefined
      }
    }
    getAuthStore().set(USER_KEY, user)
  }
  const effectiveRefreshToken = refreshToken || getRefreshToken()
  syncTokenToOpencode(token, effectiveRefreshToken)
}

export function clearAuth() {
  getAuthStore().delete(TOKEN_KEY)
  getAuthStore().delete(USER_KEY)
  getAuthStore().delete(REFRESH_TOKEN_KEY)
  syncTokenToOpencode(null)
}

export function isTokenExpiringSoon(token: string, thresholdSeconds = 1800): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return false
  const expSec = Number(payload.exp)
  const nowSec = Math.floor(Date.now() / 1000)
  return expSec - nowSec <= thresholdSeconds
}

export function broadcastTokenUpdate(newToken: string) {
  try {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send("auth-token-updated", newToken)
      }
    }
  } catch {}
}

let isRefreshing = false

export async function refreshFirebaseSession(): Promise<string | null> {
  if (isRefreshing) return null
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  isRefreshing = true
  try {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    })

    if (!res.ok) {
      const txt = await res.text()
      console.warn("[Auth] Firebase token refresh returned:", res.status, txt)
      return null
    }

    const data = (await res.json()) as { id_token?: string; refresh_token?: string }
    const newIdToken = data.id_token
    if (newIdToken) {
      const newRefreshToken = data.refresh_token || refreshToken
      const user = getAuthUser() || undefined
      setAuthToken(newIdToken, user, newRefreshToken)
      console.log("[Auth] Successfully refreshed Firebase session token in background.")
      broadcastTokenUpdate(newIdToken)
      return newIdToken
    }
  } catch (err) {
    console.error("[Auth] Background token refresh error:", err)
  } finally {
    isRefreshing = false
  }
  return null
}

let backgroundTimer: NodeJS.Timeout | null = null

export function startBackgroundTokenRefresh() {
  if (backgroundTimer) return

  const check = async () => {
    const token = getAuthToken()
    const refreshToken = getRefreshToken()
    if (!refreshToken) return
    if (!token || isTokenExpiringSoon(token, 1800)) {
      console.log("[Auth] Token expiring in < 30m or expired. Performing background refresh...")
      await refreshFirebaseSession()
    }
  }

  // Run on startup
  void check()

  // Run every 5 minutes in background
  backgroundTimer = setInterval(() => {
    void check()
  }, 5 * 60 * 1000)
}

try {
  const initialToken = getAuthToken()
  const initialRefresh = getRefreshToken()
  if (initialToken) {
    syncTokenToOpencode(initialToken, initialRefresh)
  }
} catch {}

export function startAuthServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      callbackServer.close()
      callbackServer = null
    }

    callbackServer = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1`)
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404)
        res.end("Not found")
        return
      }

      const token = url.searchParams.get("token")
      const provider = url.searchParams.get("provider")
      const email = url.searchParams.get("email")
      const name = url.searchParams.get("name")
      const refreshToken = url.searchParams.get("refreshToken") || url.searchParams.get("refresh_token") || undefined

      if (token) {
        let userEmail = email ?? undefined
        let userName = name ?? undefined
        if (!userEmail || !userName) {
          const payload = decodeJwtPayload(token)
          if (payload) {
            if (!userEmail) userEmail = (payload.email as string) ?? undefined
            if (!userName) userName = (payload.name as string) ?? (payload.display_name as string) ?? undefined
          }
        }
        setAuthToken(token, { email: userEmail, name: userName, provider: provider ?? undefined }, refreshToken)
        res.writeHead(200, { "Content-Type": "text/html" })
        res.end(`
          <html><body style="background:#091E1E;color:#e0f2f1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <div style="font-size:32px;font-weight:900;font-style:italic;letter-spacing:-1px;margin-bottom:16px">M4 <span style="color:#00E5FF">SPIDER</span></div>
              <div style="color:#529E98;font-size:14px">Login successful! You can close this window.</div>
            </div>
          </body></html>
        `)
        pendingResolve?.(token)
        pendingResolve = null
      } else {
        res.writeHead(400, { "Content-Type": "text/html" })
        res.end(`
          <html><body style="background:#091E1E;color:#e0f2f1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <div style="font-size:32px;font-weight:900;font-style:italic;letter-spacing:-1px;margin-bottom:16px">M4 <span style="color:#00E5FF">SPIDER</span></div>
              <div style="color:#ef4444;font-size:14px">Login failed — no token received.</div>
            </div>
          </body></html>
        `)
        pendingResolve?.(null)
        pendingResolve = null
      }
    })

    callbackServer.listen(0, "127.0.0.1", () => {
      const addr = callbackServer!.address()
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to start auth server"))
        return
      }
      const port = addr.port
      const state = crypto.randomUUID()
      const redirectUri = `http://127.0.0.1:${port}${CALLBACK_PATH}`
      const authUrl = `${AUTH_BASE}?provider=google&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&source=spidernotebook`

      pendingResolve = resolve
      shell.openExternal(authUrl)

      // Timeout after 5 minutes
      setTimeout(() => {
        if (pendingResolve) {
          pendingResolve(null)
          pendingResolve = null
          callbackServer?.close()
          callbackServer = null
        }
      }, 5 * 60 * 1000)
    })

    callbackServer.on("error", (err) => {
      pendingResolve = null
      reject(err)
    })
  })
}

export function stopAuthServer() {
  if (callbackServer) {
    callbackServer.close()
    callbackServer = null
  }
  pendingResolve = null
}
