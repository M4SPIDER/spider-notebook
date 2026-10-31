import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { stat } from "node:fs/promises"
import { basename, join } from "node:path"
import { app, BrowserWindow, Notification, clipboard, dialog, ipcMain, net, shell } from "electron"
import type { IpcMainEvent, IpcMainInvokeEvent } from "electron"
import type { DesktopMenuAction } from "@m4spider/app/desktop-menu"

import type { FatalRendererError, ServerReadyData, TitlebarTheme } from "../preload/types"
import { runDesktopMenuAction } from "./desktop-menu-actions"
import { assertAttachmentBudget, createPickedFileAuthorizations } from "./attachment-picker"
import { getStore } from "./store"
import { getPinchZoomEnabled, setPinchZoomEnabled, setTitlebar, updateFullscreenBrowserTitlebar, sendFullscreenBrowserTheme, updateTitlebar } from "./windows"
import { isAdBlockerEnabled, setAdBlockerEnabled } from "./content-blocker"
import type { UpdaterController } from "./updater-controller"
import { createUpdaterSubscriptions } from "./updater-subscriptions"
import { resolveThemeColors } from "./theme-colors"

const AUTH_BASE = "https://ai.m4spider.com/auth/desktop"

const pickerFilters = (ext?: string[]) => {
  if (!ext || ext.length === 0) return undefined
  return [{ name: "Files", extensions: ext }]
}

const pickedFiles = createPickedFileAuthorizations()

type Deps = {
  killSidecar: () => Promise<void> | void
  relaunch: () => void
  awaitInitialization: () => Promise<ServerReadyData>
  consumeInitialDeepLinks: () => Promise<string[]> | string[]
  getDefaultServerUrl: () => Promise<string | null> | string | null
  setDefaultServerUrl: (url: string | null) => Promise<void> | void
  getDisplayBackend: () => Promise<string | null>
  setDisplayBackend: (backend: string | null) => Promise<void> | void
  parseMarkdown: (markdown: string) => Promise<string> | string
  checkAppExists: (appName: string) => Promise<boolean> | boolean
  resolveAppPath: (appName: string) => Promise<string | null>
  updater: UpdaterController
  showUpdater: () => Promise<void> | void
  setBackgroundColor: (color: string) => void
  exportDebugLogs: () => Promise<string>
  recordFatalRendererError: (error: FatalRendererError) => Promise<void> | void
}


export function registerIpcHandlers(deps: Deps) {
  const updaterSubscriptions = createUpdaterSubscriptions()
  app.once("will-quit", updaterSubscriptions.clear)

  ipcMain.handle("kill-sidecar", () => deps.killSidecar())
  ipcMain.handle("await-initialization", () => deps.awaitInitialization())
  ipcMain.handle("consume-initial-deep-links", () => deps.consumeInitialDeepLinks())
  ipcMain.handle("get-default-server-url", () => deps.getDefaultServerUrl())
  ipcMain.handle("set-default-server-url", (_event: IpcMainInvokeEvent, url: string | null) =>
    deps.setDefaultServerUrl(url),
  )
  ipcMain.handle("get-display-backend", () => deps.getDisplayBackend())
  ipcMain.handle("set-display-backend", (_event: IpcMainInvokeEvent, backend: string | null) =>
    deps.setDisplayBackend(backend),
  )
  ipcMain.handle("parse-markdown", (_event: IpcMainInvokeEvent, markdown: string) => deps.parseMarkdown(markdown))
  ipcMain.handle("check-app-exists", (_event: IpcMainInvokeEvent, appName: string) => deps.checkAppExists(appName))
  ipcMain.handle("resolve-app-path", (_event: IpcMainInvokeEvent, appName: string) => deps.resolveAppPath(appName))
  ipcMain.handle("updater-subscribe", (event) => {
    const id = event.sender.id
    updaterSubscriptions.set(
      id,
      deps.updater.subscribe((state) => {
        if (event.sender.isDestroyed()) return updaterSubscriptions.delete(id)
        event.sender.send("updater-state", state)
      }),
    )
    event.sender.once("destroyed", () => updaterSubscriptions.delete(id))
  })
  ipcMain.handle("updater-unsubscribe", (event) => updaterSubscriptions.delete(event.sender.id))
  ipcMain.handle("updater-check", () => deps.updater.check())
  ipcMain.handle("updater-install", () => deps.updater.install())
  ipcMain.handle("set-background-color", (_event: IpcMainInvokeEvent, color: string) => deps.setBackgroundColor(color))
  ipcMain.handle("export-debug-logs", () => deps.exportDebugLogs())
  ipcMain.handle("record-fatal-renderer-error", (_event: IpcMainInvokeEvent, error: FatalRendererError) =>
    deps.recordFatalRendererError(error),
  )
  ipcMain.handle("store-get", (_event: IpcMainInvokeEvent, name: string, key: string) => {
    try {
      const store = getStore(name)
      const value = store.get(key)
      if (value === undefined || value === null) return null
      return typeof value === "string" ? value : JSON.stringify(value)
    } catch {
      return null
    }
  })
  ipcMain.handle("store-set", (_event: IpcMainInvokeEvent, name: string, key: string, value: string) => {
    getStore(name).set(key, value)
  })
  ipcMain.handle("store-delete", (_event: IpcMainInvokeEvent, name: string, key: string) => {
    getStore(name).delete(key)
  })
  ipcMain.handle("store-clear", (_event: IpcMainInvokeEvent, name: string) => {
    getStore(name).clear()
  })
  ipcMain.handle("store-keys", (_event: IpcMainInvokeEvent, name: string) => {
    const store = getStore(name)
    return Object.keys(store.store)
  })
  ipcMain.handle("store-length", (_event: IpcMainInvokeEvent, name: string) => {
    const store = getStore(name)
    return Object.keys(store.store).length
  })

  ipcMain.handle(
    "open-directory-picker",
    async (_event: IpcMainInvokeEvent, opts?: { multiple?: boolean; title?: string; defaultPath?: string }) => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory", ...(opts?.multiple ? ["multiSelections" as const] : []), "createDirectory"],
        title: opts?.title ?? "Choose a folder",
        defaultPath: opts?.defaultPath,
      })
      if (result.canceled) return null
      return opts?.multiple ? result.filePaths : result.filePaths[0]
    },
  )

  ipcMain.handle(
    "open-file-picker",
    async (
      event: IpcMainInvokeEvent,
      opts?: { multiple?: boolean; title?: string; defaultPath?: string; extensions?: string[] },
    ) => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile", ...(opts?.multiple ? ["multiSelections" as const] : [])],
        title: opts?.title ?? "Choose a file",
        defaultPath: opts?.defaultPath,
        filters: pickerFilters(opts?.extensions),
      })
      if (result.canceled) return null
      const files = await Promise.all(
        result.filePaths.map(async (filePath) => ({
          path: filePath,
          name: basename(filePath),
          size: (await stat(filePath)).size,
        })),
      )
      assertAttachmentBudget(files)
      const token = pickedFiles.add(event.sender.id, result.filePaths)
      return { token, files }
    },
  )

  ipcMain.handle("read-picked-file", async (event: IpcMainInvokeEvent, token: string, filePath: string) => {
    return pickedFiles.read(event.sender.id, token, filePath)
  })

  ipcMain.handle("release-picked-files", (event: IpcMainInvokeEvent, token: string) => {
    pickedFiles.release(event.sender.id, token)
  })

  ipcMain.handle(
    "save-file-picker",
    async (_event: IpcMainInvokeEvent, opts?: { title?: string; defaultPath?: string }) => {
      const result = await dialog.showSaveDialog({
        title: opts?.title ?? "Save file",
        defaultPath: opts?.defaultPath,
      })
      if (result.canceled) return null
      return result.filePath ?? null
    },
  )

  ipcMain.on("open-link", (_event: IpcMainEvent, url: string) => {
    void shell.openExternal(url)
  })

  ipcMain.handle("open-external", (_event: IpcMainInvokeEvent, url: string) => {
    void shell.openExternal(url)
  })

  ipcMain.handle("open-browser-fullscreen", (_event: IpcMainInvokeEvent, url?: string) => {
    import("./windows").then((mod) => mod.createSpiderBrowserFullscreen(url))
  })

  ipcMain.handle("adblocker-get-enabled", () => {
    return isAdBlockerEnabled()
  })

  ipcMain.handle("adblocker-set-enabled", (_event: IpcMainInvokeEvent, enabled: boolean) => {
    setAdBlockerEnabled(enabled)
  })

  ipcMain.handle("auth-login", async () => {
    const { startAuthServer } = await import("./auth")
    return startAuthServer()
  })

  ipcMain.handle("auth-get-token", async () => {
    const { getAuthToken } = await import("./auth")
    return getAuthToken()
  })

  ipcMain.handle("auth-get-user", async () => {
    const { getAuthUser } = await import("./auth")
    return getAuthUser()
  })

  ipcMain.handle("auth-logout", async () => {
    const { clearAuth } = await import("./auth")
    clearAuth()
  })

  ipcMain.handle("auth-set-user", async (_event: IpcMainInvokeEvent, user: { email?: string; name?: string; provider?: string }) => {
    const { setAuthToken, getAuthToken } = await import("./auth")
    const token = getAuthToken()
    if (token) setAuthToken(token, user)
  })

  ipcMain.handle("auth-email-register", async (_event: IpcMainInvokeEvent, data: { name: string; email: string; password: string }) => {
    const FIREBASE_KEY = "AIzaSyBVPRD-9jHR0NRzg61Cs2KXfwoqvlHz388"
    const res = await net.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password, returnSecureToken: true }),
    })
    const text = await res.text()
    let body: any
    try { body = JSON.parse(text) } catch { body = { error: { message: text || "Registration failed" } } }
    if (!res.ok) {
      const code = body.error?.message || "UNKNOWN"
      const msg = code === "EMAIL_EXISTS" ? "An account with this email already exists"
        : code === "WEAK_PASSWORD" ? "Password must be at least 6 characters"
        : code === "INVALID_EMAIL" ? "Invalid email address"
        : code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Please try again later"
        : "Registration failed. Please try again."
      throw new Error(msg)
    }
    // Update Firebase displayName so it's available during future logins
    if (data.name) {
      await net.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: body.idToken, displayName: data.name, returnSecureToken: true }),
      })
    }
    const { setAuthToken } = await import("./auth")
    setAuthToken(body.idToken, { email: data.email, name: data.name, provider: "email" })
    return { token: body.idToken, email: data.email, name: data.name }
  })

  ipcMain.handle("auth-email-login", async (_event: IpcMainInvokeEvent, data: { email: string; password: string }) => {
    const FIREBASE_KEY = "AIzaSyBVPRD-9jHR0NRzg61Cs2KXfwoqvlHz388"
    const res = await net.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password, returnSecureToken: true }),
    })
    const text = await res.text()
    let body: any
    try { body = JSON.parse(text) } catch { body = { error: { message: text || "Login failed" } } }
    if (!res.ok) {
      const code = body.error?.message || "UNKNOWN"
      const msg = code === "INVALID_LOGIN_CREDENTIALS" ? "Invalid email or password"
        : code === "EMAIL_NOT_FOUND" ? "No account found with this email"
        : code === "INVALID_PASSWORD" ? "Invalid email or password"
        : code === "USER_DISABLED" ? "This account has been disabled"
        : code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Please try again later"
        : "Login failed. Please try again."
      throw new Error(msg)
    }
    const { setAuthToken } = await import("./auth")
    const name = body.displayName || undefined
    setAuthToken(body.idToken, { email: data.email, name, provider: "email" })
    return { token: body.idToken, email: data.email, name }
  })

  ipcMain.handle("auth-delete-account", async (_event: IpcMainInvokeEvent, email: string, password: string) => {
    const FIREBASE_KEY = "AIzaSyBVPRD-9jHR0NRzg61Cs2KXfwoqvlHz388"
    // First re-authenticate to get a fresh idToken (required for account deletion)
    const signInRes = await net.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    })
    const signInText = await signInRes.text()
    let signInBody: any
    try { signInBody = JSON.parse(signInText) } catch { signInBody = { error: { message: signInText || "Authentication failed" } } }
    if (!signInRes.ok) {
      const code = signInBody.error?.message || "UNKNOWN"
      const msg = code === "INVALID_LOGIN_CREDENTIALS" ? "Invalid email or password"
        : code === "EMAIL_NOT_FOUND" ? "No account found with this email"
        : code === "INVALID_PASSWORD" ? "Invalid email or password"
        : code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Please try again later"
        : "Authentication failed. Please try again."
      throw new Error(msg)
    }
    // Now delete the account using the fresh idToken
    const deleteRes = await net.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: signInBody.idToken }),
    })
    const deleteText = await deleteRes.text()
    let deleteBody: any
    try { deleteBody = JSON.parse(deleteText) } catch { deleteBody = { error: { message: deleteText || "Account deletion failed" } } }
    if (!deleteRes.ok) {
      const code = deleteBody.error?.message || "UNKNOWN"
      const msg = code === "USER_NOT_FOUND" ? "User not found"
        : code === "OPERATION_NOT_ALLOWED" ? "Account deletion is not allowed"
        : code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Please try again later"
        : "Account deletion failed. Please try again."
      throw new Error(msg)
    }
    const { clearAuth } = await import("./auth")
    clearAuth()
    return { success: true }
  })

  ipcMain.handle("google-login-sync", async () => {
    const { googleLoginAndSync } = await import("./google-session")
    return googleLoginAndSync()
  })

  ipcMain.handle("net-fetch", async (_event: IpcMainInvokeEvent, url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => {
    try {
      const res = await net.fetch(url, {
        method: init?.method ?? "GET",
        headers: init?.headers,
        body: init?.body,
      })
      const text = await res.text()
      return { ok: res.ok, status: res.status, statusText: res.statusText, body: text }
    } catch (err: any) {
      return { ok: false, status: 0, statusText: err?.message ?? "fetch failed", body: "" }
    }
  })

  ipcMain.handle("open-path", async (_event: IpcMainInvokeEvent, path: string, app?: string) => {
    if (!app) return shell.openPath(path)
    await new Promise<void>((resolve, reject) => {
      const [cmd, args] =
        process.platform === "darwin" ? (["open", ["-a", app, path]] as const) : ([app, [path]] as const)
      execFile(cmd, args, (err) => (err ? reject(err) : resolve()))
    })
  })

  ipcMain.handle("read-clipboard-image", () => {
    const image = clipboard.readImage()
    if (image.isEmpty()) return null
    const buffer = image.toPNG().buffer
    const size = image.getSize()
    return { buffer, width: size.width, height: size.height }
  })

  ipcMain.on("show-notification", (_event: IpcMainEvent, title: string, body?: string) => {
    const iconExt = process.platform === "win32" ? "ico" : "png"
    const iconDir = app.isPackaged ? join(process.resourcesPath, "icons") : join(app.getAppPath(), "resources", "icons")
    const iconFile = join(iconDir, `icon.${iconExt}`)
    new Notification({ title, body, icon: existsSync(iconFile) ? iconFile : undefined }).show()
  })

  ipcMain.handle("get-icon-path", () => {
    const iconDir = app.isPackaged ? join(process.resourcesPath, "icons") : join(app.getAppPath(), "resources", "icons")
    const iconFile = join(iconDir, "icon.png")
    return existsSync(iconFile) ? iconFile : ""
  })

  ipcMain.handle("get-theme-colors", () => {
    try {
      const store = getStore()
      const themeId = (store.get("themeId") as string) || "m4spider"
      return resolveThemeColors(themeId)
    } catch {
      return resolveThemeColors("m4spider")
    }
  })

  ipcMain.handle("set-theme-id", (_event: IpcMainInvokeEvent, themeId: string) => {
    try {
      const store = getStore()
      store.set("themeId", themeId)
    } catch {}
    sendFullscreenBrowserTheme(themeId)
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send("theme-changed", resolveThemeColors(themeId))
      }
    }
  })

  ipcMain.handle("get-window-count", () => BrowserWindow.getAllWindows().length)

  ipcMain.handle("get-window-focused", (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isFocused() ?? false
  })

  ipcMain.handle("set-window-focus", (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.focus()
  })

  ipcMain.handle("show-window", (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.show()
  })

  ipcMain.on("relaunch", () => {
    deps.relaunch()
  })

  ipcMain.handle("get-zoom-factor", (event: IpcMainInvokeEvent) => event.sender.getZoomFactor())
  ipcMain.handle("set-zoom-factor", (event: IpcMainInvokeEvent, factor: number) => {
    event.sender.setZoomFactor(factor)
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    updateTitlebar(win)
  })
  ipcMain.handle("get-pinch-zoom-enabled", () => getPinchZoomEnabled())
  ipcMain.handle("set-pinch-zoom-enabled", (_event: IpcMainInvokeEvent, enabled: boolean) => {
    setPinchZoomEnabled(enabled)
  })
  ipcMain.handle("set-titlebar", (event: IpcMainInvokeEvent, theme: TitlebarTheme) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    setTitlebar(win, theme)
  })
  ipcMain.handle("run-desktop-menu-action", (event: IpcMainInvokeEvent, action: DesktopMenuAction) => {
    runDesktopMenuAction(BrowserWindow.fromWebContents(event.sender), action, {
      checkForUpdates: () => void deps.showUpdater(),
      relaunch: deps.relaunch,
    })
  })
}

export function sendMenuCommand(win: BrowserWindow, id: string) {
  win.webContents.send("menu-command", id)
}

export function sendDeepLinks(win: BrowserWindow, urls: string[]) {
  win.webContents.send("deep-link", urls)
}


