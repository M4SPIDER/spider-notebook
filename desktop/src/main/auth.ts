import http from "node:http"
import { URL } from "node:url"
import { shell } from "electron"
import { getStore } from "./store"

const AUTH_STORE = "auth"
const TOKEN_KEY = "token"
const USER_KEY = "user"
const AUTH_BASE = "https://ai.m4spider.com/auth/desktop"
const CALLBACK_PATH = "/auth/callback"

type AuthUser = {
  email?: string
  name?: string
  provider?: string
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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

export function getAuthUser(): AuthUser | null {
  return getAuthStore().get(USER_KEY, null) as AuthUser | null
}

export function setAuthToken(token: string, user?: AuthUser) {
  getAuthStore().set(TOKEN_KEY, token)
  if (user) getAuthStore().set(USER_KEY, user)
}

export function clearAuth() {
  getAuthStore().delete(TOKEN_KEY)
  getAuthStore().delete(USER_KEY)
}

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
        setAuthToken(token, { email: userEmail, name: userName, provider: provider ?? undefined })
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
