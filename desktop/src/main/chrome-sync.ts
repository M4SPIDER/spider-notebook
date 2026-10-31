import { execFile } from "node:child_process"
import { copyFile, readFile, unlink, mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { promisify } from "node:util"
import { session } from "electron"

const execFileAsync = promisify(execFile)

const CHROME_PROFILES = [
  "Default",
  "Profile 1",
  "Profile 2",
  "Profile 3",
  "Profile 4",
  "Profile 5",
]

function getChromeUserDataDir(): string {
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return ""
  return join(localAppData, "Google", "Chrome", "User Data")
}

function getChromeCookiesPath(profile: string): string {
  return join(getChromeUserDataDir(), profile, "Network", "Cookies")
}

function getChromeLocalStatePath(): string {
  return join(getChromeUserDataDir(), "Local State")
}

async function decryptWithDPAPI(encrypted: Buffer): Promise<Buffer | null> {
  try {
    // Use PowerShell to decrypt DPAPI-protected data
    const psScript = `
      Add-Type -AssemblyName System.Security
      $encrypted = [Convert]::FromBase64String('${encrypted.toString("base64")}')
      $decrypted = [System.Security.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
      [Convert]::ToBase64String($decrypted)
    `
    const { stdout } = await execFileAsync("powershell", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      psScript.trim(),
    ])
    return Buffer.from(stdout.trim(), "base64")
  } catch (err) {
    console.error("DPAPI decryption failed:", err)
    return null
  }
}

async function getChromeEncryptionKey(): Promise<Buffer | null> {
  try {
    const localStatePath = getChromeLocalStatePath()
    const localStateRaw = await readFile(localStatePath, "utf-8")
    const localState = JSON.parse(localStateRaw)
    const encryptedKeyB64 = localState?.os_crypt?.encrypted_key
    if (!encryptedKeyB64) {
      console.error("No os_crypt.encrypted_key found in Local State")
      return null
    }

    // Base64 decode the key (has "DPAPI" prefix + encrypted key)
    const encryptedKey = Buffer.from(encryptedKeyB64, "base64")

    // The first 5 bytes are "DPAPI" prefix — strip them, then decrypt the rest
    const dpapiData = encryptedKey.subarray(5)
    const decryptedKey = await decryptWithDPAPI(dpapiData)
    if (!decryptedKey) {
      console.error("Failed to decrypt Chrome encryption key")
      return null
    }

    // The decrypted data is a key prefix (19 bytes for v10/v11) + actual AES key (32 bytes)
    // For v10: first 3 bytes are version "v10", next 12 bytes are nonce, then AES key
    // Actually the decrypted key structure varies. Let me just return the raw decrypted buffer
    // and handle extraction in decryptCookieValue
    return decryptedKey
  } catch (err) {
    console.error("Failed to read Chrome encryption key:", err)
    return null
  }
}

async function decryptCookieValue(encryptedValue: Buffer, aesKey: Buffer): Promise<string> {
  // Chrome cookie values are encrypted with AES-256-GCM
  // Format: version(3 bytes "v10" or "v11") + nonce(12 bytes) + ciphertext + tag(16 bytes)
  if (encryptedValue.length < 3 + 12 + 16) return ""

  const version = encryptedValue.subarray(0, 3).toString("utf-8")
  if (version !== "v10" && version !== "v11") {
    console.warn(`Unsupported cookie encryption version: ${version}`)
    return ""
  }

  const nonce = encryptedValue.subarray(3, 15)
  const ciphertextWithTag = encryptedValue.subarray(15)
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16)
  const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16)

  try {
    // Use Node.js crypto for AES-256-GCM decryption
    const { createDecipheriv } = await import("node:crypto")
    const decipher = createDecipheriv("aes-256-gcm", aesKey, nonce)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString("utf-8")
  } catch (err) {
    console.error("Failed to decrypt cookie value:", err)
    return ""
  }
}

interface ChromeCookie {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  isSecure: boolean
  isHttpOnly: boolean
  sameSite: "no_restriction" | "lax" | "strict" | "unspecified"
}

async function readChromeCookiesFromDB(dbPath: string, aesKey: Buffer): Promise<ChromeCookie[]> {
  const tempDir = await mkdtemp(join(tmpdir(), "chrome-cookies-"))
  const tempDbPath = join(tempDir, "Cookies")

  try {
    // Copy the database to avoid lock issues
    await copyFile(dbPath, tempDbPath)

    // Read cookies using sqlite3 CLI
    const { stdout } = await execFileAsync("sqlite3", [
      "-json",
      tempDbPath,
      "SELECT name, encrypted_value, host_key, path, expires_utc, is_secure, is_httponly, samesite FROM cookies WHERE host_key LIKE '%google%' OR host_key LIKE '%youtube%' OR host_key LIKE '%github%' OR host_key LIKE '%twitter%' OR host_key LIKE '%facebook%' OR host_key LIKE '%microsoft%' OR host_key LIKE '%apple%' OR host_key LIKE '%amazon%' OR host_key LIKE '%linkedin%' OR host_key LIKE '%reddit%' OR host_key LIKE '%stackoverflow%' OR host_key LIKE '%npmjs%' OR host_key LIKE '%m4spider%' OR host_key LIKE '%m4spider%' LIMIT 500",
    ])

    if (!stdout.trim()) return []

    const rows = JSON.parse(stdout) as Array<{
      name: string
      encrypted_value: string
      host_key: string
      path: string
      expires_utc: number
      is_secure: number
      is_httponly: number
      samesite: number
    }>

    const cookies: ChromeCookie[] = []
    for (const row of rows) {
      const encryptedBuf = Buffer.from(row.encrypted_value, "latin1")
      let decryptedValue: string

      // Check if already plaintext (no encryption)
      if (encryptedBuf.length === 0 || encryptedBuf[0] === 0) {
        // Empty or zero-byte prefix = not encrypted (very old Chrome)
        decryptedValue = encryptedBuf.toString("utf-8").replace(/^\x00+/, "")
      } else {
        decryptedValue = await decryptCookieValue(encryptedBuf, aesKey)
      }

      if (!decryptedValue && encryptedBuf.length > 0) continue

      // Chrome stores timestamps as microseconds since 1601-01-01
      // Convert to Unix timestamp (seconds since 1970-01-01)
      const chromeEpochDiff = 11644473600 // seconds between 1601 and 1970
      const expiresUnix = row.expires_utc > 0
        ? Math.floor(row.expires_utc / 1000000) - chromeEpochDiff
        : 0

      const sameSiteMap: Record<number, ChromeCookie["sameSite"]> = {
        0: "no_restriction",
        1: "no_restriction",
        2: "lax",
        3: "strict",
      }

      cookies.push({
        name: row.name,
        value: decryptedValue,
        domain: row.host_key,
        path: row.path,
        expires: expiresUnix > 0 ? expiresUnix : -1,
        isSecure: row.is_secure === 1,
        isHttpOnly: row.is_httponly === 1,
        sameSite: sameSiteMap[row.samesite] ?? "unspecified",
      })
    }

    return cookies
  } finally {
    // Clean up temp files
    try { await unlink(tempDbPath) } catch {}
    try { await rm(tempDir, { recursive: true }) } catch {}
  }
}

export async function syncChromeCookies(): Promise<{ imported: number; total: number; error?: string }> {
  const userDataDir = getChromeUserDataDir()
  if (!userDataDir) {
    return { imported: 0, total: 0, error: "Could not find Chrome user data directory" }
  }

  const aesKey = await getChromeEncryptionKey()
  if (!aesKey) {
    return { imported: 0, total: 0, error: "Could not decrypt Chrome encryption key. Make sure Chrome is installed." }
  }

  let allCookies: ChromeCookie[] = []
  for (const profile of CHROME_PROFILES) {
    const dbPath = getChromeCookiesPath(profile)
    try {
      const cookies = await readChromeCookiesFromDB(dbPath, aesKey)
      allCookies = allCookies.concat(cookies)
    } catch (err) {
      // Profile might not exist, skip it
      continue
    }
  }

  if (allCookies.length === 0) {
    return { imported: 0, total: 0, error: "No cookies found in Chrome. Make sure you're logged into sites in Chrome." }
  }

  // Import into the spider session
  const ses = session.fromPartition("persist:spider")
  let imported = 0

  for (const cookie of allCookies) {
    try {
      const details: Electron.CookiesSetDetails = {
        url: `http${cookie.isSecure ? "s" : ""}://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.isSecure,
        httpOnly: cookie.isHttpOnly,
        sameSite: cookie.sameSite,
      }

      if (cookie.expires > 0) {
        details.expirationDate = cookie.expires
      }

      await ses.cookies.set(details)
      imported++
    } catch (err) {
      // Skip invalid cookies
      continue
    }
  }

  return { imported, total: allCookies.length }
}
