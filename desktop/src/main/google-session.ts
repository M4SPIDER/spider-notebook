import { execFile } from "node:child_process"
import { copyFile, readFile, unlink, mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { promisify } from "node:util"
import { session, shell, BrowserWindow } from "electron"

const execFileAsync = promisify(execFile)

function getChromeUserDataDir(): string {
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return ""
  return join(localAppData, "Google", "Chrome", "User Data")
}

async function decryptWithDPAPI(encrypted: Buffer): Promise<Buffer | null> {
  try {
    const psScript = `
      Add-Type -AssemblyName System.Security
      $encrypted = [Convert]::FromBase64String('${encrypted.toString("base64")}')
      $decrypted = [System.Security.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
      [Convert]::ToBase64String($decrypted)
    `
    const { stdout } = await execFileAsync("powershell", [
      "-NoProfile", "-NonInteractive", "-Command", psScript.trim(),
    ])
    return Buffer.from(stdout.trim(), "base64")
  } catch {
    return null
  }
}

async function getChromeEncryptionKey(): Promise<Buffer | null> {
  try {
    const localStatePath = join(getChromeUserDataDir(), "Local State")
    const localState = JSON.parse(await readFile(localStatePath, "utf-8"))
    const encryptedKeyB64 = localState?.os_crypt?.encrypted_key
    if (!encryptedKeyB64) return null
    const encryptedKey = Buffer.from(encryptedKeyB64, "base64")
    return await decryptWithDPAPI(encryptedKey.subarray(5))
  } catch {
    return null
  }
}

async function decryptCookieValue(encryptedValue: Buffer, aesKey: Buffer): Promise<string> {
  if (encryptedValue.length < 3 + 12 + 16) return ""
  const version = encryptedValue.subarray(0, 3).toString("utf-8")
  if (version !== "v10" && version !== "v11") return ""
  const nonce = encryptedValue.subarray(3, 15)
  const ciphertextWithTag = encryptedValue.subarray(15)
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16)
  const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16)
  try {
    const { createDecipheriv } = await import("node:crypto")
    const decipher = createDecipheriv("aes-256-gcm", aesKey, nonce)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8")
  } catch {
    return ""
  }
}

const GOOGLE_DOMAINS = [
  "%google.com%", "%youtube.com%", "%googleapis.com%",
  "%gstatic.com%", "%google.co%", "%googleapis.com%",
  "%accounts.google%",
]

export async function syncGoogleSession(): Promise<{ imported: number; error?: string }> {
  const userDataDir = getChromeUserDataDir()
  if (!userDataDir) return { imported: 0, error: "Chrome not found" }

  const aesKey = await getChromeEncryptionKey()
  if (!aesKey) return { imported: 0, error: "Cannot decrypt Chrome keys. Close Chrome and try again." }

  const profiles = ["Default", "Profile 1", "Profile 2", "Profile 3"]
  const whereClause = GOOGLE_DOMAINS.map((d) => `host_key LIKE '${d}'`).join(" OR ")
  let imported = 0

  for (const profile of profiles) {
    const dbPath = join(userDataDir, profile, "Network", "Cookies")
    const tempDir = await mkdtemp(join(tmpdir(), "google-cookies-"))
    const tempDb = join(tempDir, "Cookies")
    try {
      await copyFile(dbPath, tempDb)
      const { stdout } = await execFileAsync("sqlite3", [
        "-json", tempDb,
        `SELECT name, encrypted_value, host_key, path, expires_utc, is_secure, is_httponly, samesite FROM cookies WHERE ${whereClause} LIMIT 200`,
      ])
      if (!stdout.trim()) continue
      const rows = JSON.parse(stdout)
      const spiderSession = session.fromPartition("persist:spider")
      for (const row of rows) {
        const encBuf = Buffer.from(row.encrypted_value, "latin1")
        let value = ""
        if (encBuf.length === 0 || encBuf[0] === 0) {
          value = encBuf.toString("utf-8").replace(/^\x00+/, "")
        } else {
          value = await decryptCookieValue(encBuf, aesKey)
        }
        if (!value && encBuf.length > 0) continue
        const chromeEpochDiff = 11644473600
        const expires = row.expires_utc > 0 ? Math.floor(row.expires_utc / 1000000) - chromeEpochDiff : 0
        const sameSiteMap: Record<number, string> = { 0: "no_restriction", 1: "no_restriction", 2: "lax", 3: "strict" }
        try {
          await spiderSession.cookies.set({
            url: `http${row.is_secure ? "s" : ""}://${row.host_key}${row.path}`,
            name: row.name,
            value,
            domain: row.host_key,
            path: row.path,
            secure: row.is_secure === 1,
            httpOnly: row.is_httponly === 1,
            sameSite: (sameSiteMap[row.samesite] ?? "unspecified") as any,
            ...(expires > 0 ? { expirationDate: expires } : {}),
          })
          imported++
        } catch { continue }
      }
    } catch { continue }
    finally {
      try { await unlink(tempDb) } catch {}
      try { await rm(tempDir, { recursive: true }) } catch {}
    }
  }

  return { imported }
}

let googleLoginServer: import("node:http").Server | null = null
let googleLoginResolve: ((value: { token?: string; email?: string; name?: string } | null) => void) | null = null

export function startGoogleLoginInSystemBrowser(): Promise<{ token?: string; email?: string; name?: string } | null> {
  return new Promise((resolve) => {
    if (googleLoginServer) {
      googleLoginServer.close()
      googleLoginServer = null
    }

    const http = require("node:http")
    const { URL } = require("node:url")

    googleLoginServer = http.createServer((req: any, res: any) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      if (url.pathname !== "/google-callback") {
        res.writeHead(404)
        res.end("Not found")
        return
      }
      const token = url.searchParams.get("token")
      const email = url.searchParams.get("email")
      const name = url.searchParams.get("name")
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`<html><body style="background:#091E1E;color:#e0f2f1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><div style="font-size:24px;font-weight:900;margin-bottom:12px">M4 <span style="color:#00E5FF">SPIDER</span></div><div style="color:#529E98;font-size:14px">Google login successful! You can close this tab.</div></div></body></html>`)
      googleLoginResolve?.({ token: token ?? undefined, email: email ?? undefined, name: name ?? undefined })
      googleLoginResolve = null
      googleLoginServer?.close()
      googleLoginServer = null
    })

    googleLoginServer.listen(0, "127.0.0.1", () => {
      const addr = googleLoginServer!.address()
      if (!addr || typeof addr === "string") {
        resolve(null)
        return
      }
      const port = addr.port
      const redirectUri = `http://127.0.0.1:${port}/google-callback`
      const authUrl = `https://ai.m4spider.com/auth/desktop?provider=google&redirect_uri=${encodeURIComponent(redirectUri)}&state=${crypto.randomUUID()}&source=spidernotebook`
      googleLoginResolve = resolve
      shell.openExternal(authUrl)
      setTimeout(() => {
        if (googleLoginResolve) {
          googleLoginResolve(null)
          googleLoginResolve = null
          googleLoginServer?.close()
          googleLoginServer = null
        }
      }, 5 * 60 * 1000)
    })

    googleLoginServer.on("error", () => {
      googleLoginResolve = null
      resolve(null)
    })
  })
}

export async function googleLoginAndSync(): Promise<{ imported: number; error?: string; user?: { email?: string; name?: string } }> {
  // Step 1: Import Google cookies from Chrome
  const cookieResult = await syncGoogleSession()
  if (cookieResult.imported > 0) {
    return { ...cookieResult, user: undefined }
  }
  // Step 2: If no Chrome cookies, open system browser for login
  const loginResult = await startGoogleLoginInSystemBrowser()
  if (loginResult?.token) {
    return { imported: 0, error: undefined, user: { email: loginResult.email, name: loginResult.name } }
  }
  return { imported: 0, error: cookieResult.error ?? "Login failed or cancelled" }
}
