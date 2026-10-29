import windowState from "electron-window-state"
import { resolveThemeVariant } from "@opencode-ai/ui/theme/resolve"
import type { DesktopTheme } from "@opencode-ai/ui/theme/types"
import pureWhiteThemeJson from "../../../ui/src/theme/themes/pure-white.json"
import { app, BrowserWindow, dialog, net, nativeImage, nativeTheme, protocol, screen } from "electron"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { TitlebarTheme } from "../preload/types"
import { exportDebugLogs, write as writeLog } from "./logging"
import { getStore } from "./store"
import { PINCH_ZOOM_ENABLED_KEY } from "./store-keys"
import { createUnresponsiveSampler } from "./unresponsive"
import { resolveThemeColors } from "./theme-colors"

const root = dirname(fileURLToPath(import.meta.url))
const rendererRoot = join(root, "../renderer")
const rendererProtocol = "oc"
const rendererHost = "renderer"
const clipboardWritePermission = "clipboard-sanitized-write"
const notificationPermission = "notifications"
const rendererPermissions = new Set([clipboardWritePermission, notificationPermission])
const pureWhiteTheme = pureWhiteThemeJson as DesktopTheme
const defaultBackground = {
  light: resolveThemeVariant(pureWhiteTheme.light, false)["background-base"],
  dark: resolveThemeVariant(pureWhiteTheme.dark, true)["background-base"],
}
const documentPolicyHeader = "Document-Policy"
const jsCallStacksDocumentPolicy = "include-js-call-stacks-in-crash-reports"

protocol.registerSchemesAsPrivileged([
  {
    scheme: rendererProtocol,
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
])

let backgroundColor: string | undefined
let relaunchHandler = () => {
  app.relaunch()
  app.exit(0)
}
const titlebarThemes = new WeakMap<BrowserWindow, Partial<TitlebarTheme>>()
const pinchZoomEnabled = new WeakMap<BrowserWindow, boolean>()
const titlebarHeight = 40
const maxZoomLevel = 10
const minZoomLevel = 0.2

export function setRelaunchHandler(handler: () => void) {
  relaunchHandler = handler
}

export function setBackgroundColor(color: string) {
  backgroundColor = color
  BrowserWindow.getAllWindows().forEach((win) => win.setBackgroundColor(color))
}

export function getBackgroundColor(): string | undefined {
  return backgroundColor
}

function iconsDir() {
  return app.isPackaged ? join(process.resourcesPath, "icons") : join(root, "../../resources/icons")
}

function iconPath() {
  const ext = process.platform === "win32" ? "ico" : "png"
  return join(iconsDir(), `icon.${ext}`)
}

function tone() {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light"
}

function defaultBackgroundColor() {
  return defaultBackground[tone()]
}

function overlay(theme: Partial<TitlebarTheme> = {}, zoom = 1) {
  const mode = theme.mode ?? tone()
  return {
    color: "#00000000",
    symbolColor: mode === "dark" ? "white" : "black",
    height: Math.max(titlebarHeight, Math.round(titlebarHeight * zoom)),
  }
}

export function setTitlebar(win: BrowserWindow, theme: Partial<TitlebarTheme> = {}) {
  titlebarThemes.set(win, theme)
  updateTitlebar(win)
}

export function updateTitlebar(win: BrowserWindow) {
  if (process.platform !== "win32") return
  win.setTitleBarOverlay(overlay(titlebarThemes.get(win), win.webContents.getZoomFactor()))
}

export function setPinchZoomEnabled(enabled: boolean) {
  getStore().set(PINCH_ZOOM_ENABLED_KEY, enabled)
  for (const win of BrowserWindow.getAllWindows()) {
    pinchZoomEnabled.set(win, enabled)
    win.webContents.send("pinch-zoom-enabled-changed", enabled)
    if (!enabled && win.webContents.getZoomFactor() !== 1) win.webContents.setZoomFactor(1)
    updateZoom(win)
  }
}

export function getPinchZoomEnabled() {
  return getStore().get(PINCH_ZOOM_ENABLED_KEY) === true
}

export function setDockIcon() {
  if (process.platform !== "darwin") return
  const icon = nativeImage.createFromPath(join(iconsDir(), "dock.png"))
  if (!icon.isEmpty()) app.dock?.setIcon(icon)
}

export function createMainWindow() {
  const state = windowState({
    defaultWidth: 1280,
    defaultHeight: 800,
  })

  const mode = tone()
  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    show: false,
    autoHideMenuBar: true,
    title: "M4 Spider Notebook",
    icon: iconPath(),
    backgroundColor: backgroundColor ?? defaultBackgroundColor(),
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hidden" as const,
          trafficLightPosition: { x: 12, y: 14 },
        }
      : {}),
    ...(process.platform === "win32"
      ? {
          frame: false,
          titleBarStyle: "hidden" as const,
          titleBarOverlay: overlay({ mode }),
        }
      : {}),
    webPreferences: {
      preload: join(root, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      webviewPreferences: {
        partition: "persist:spider",
        disablewebsecurity: false,
        webSecurity: true,
      },
    },
  })

  allowRendererPermissions(win)
  wireWindowRecovery(win, "main")

  win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders } = details
    upsertKeyValue(requestHeaders, "Access-Control-Allow-Origin", ["*"])
    callback({ requestHeaders })
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders = {} } = details
    addRendererHeaders(details.url, responseHeaders)
    callback({ responseHeaders })
  })

  state.manage(win)

  // Intercept target="_blank" links and route to Spider Browser instead of new windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url && !url.startsWith("oc://")) {
      win.webContents.send("open-browser-panel", url)
    }
    return { action: "deny" }
  })

  // Also intercept navigation attempts to external URLs
  win.webContents.on("will-navigate", (event, url) => {
    const current = win.webContents.getURL()
    if (url === current) return
    // Allow internal navigation
    if (url.startsWith("oc://")) return
    if (current.includes("localhost") && url.includes("localhost")) return
    // Block external navigation and route to Spider Browser
    event.preventDefault()
    win.webContents.send("open-browser-panel", url)
  })

  loadWindow(win, "index.html")
  wireZoom(win)

  win.once("ready-to-show", () => {
    win.show()
  })

  return win
}

export function registerRendererProtocol() {
  if (protocol.isProtocolHandled(rendererProtocol)) return

  protocol.handle(rendererProtocol, async (request) => {
    const url = new URL(request.url)
    if (url.host !== rendererHost) {
      writeLog("protocol", "rejected host", { url: request.url }, "warn")
      return new Response("Not found", { status: 404 })
    }

    const file = resolve(rendererRoot, `.${decodeURIComponent(url.pathname)}`)
    const rel = relative(rendererRoot, file)
    if (rel.startsWith("..") || isAbsolute(rel)) {
      writeLog("protocol", "rejected path", { url: request.url, file }, "warn")
      return new Response("Not found", { status: 404 })
    }

    try {
      const response = await net.fetch(pathToFileURL(file).toString())
      if (response.status >= 400) {
        writeLog(
          "protocol",
          "fetch failed",
          {
            url: request.url,
            file,
            status: response.status,
            statusText: response.statusText,
          },
          "error",
        )
      }
      return addDocumentPolicy(response, file)
    } catch (error) {
      writeLog("protocol", "fetch error", { url: request.url, file, error }, "error")
      return new Response("Not found", { status: 404 })
    }
  })
}

function loadWindow(win: BrowserWindow, html: string) {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (devUrl) {
    const url = new URL(html, devUrl)
    void win.loadURL(url.toString())
    return
  }

  void win.loadURL(`${rendererProtocol}://${rendererHost}/${html}`)
}

function wireWindowRecovery(win: BrowserWindow, name: string) {
  let showing = false
  const sampler = createUnresponsiveSampler(win, name)

  const handle = async (button: string | undefined, wait: boolean) => {
    if (button === "Export Logs") {
      const sampling = sampler.stopAndFlush()
      await exportDebugLogs().catch((error) => writeLog("main", "failed to export debug logs", { error }, "error"))
      if (wait && sampling) sampler.start()
      return true
    }
    if (button === "Relaunch") {
      sampler.stopAndFlush()
      relaunchHandler()
      return false
    }
    if (button === "Quit") {
      sampler.stopAndFlush()
      app.quit()
    }
    return false
  }

  const show = async (message: string, detail: string, wait: boolean) => {
    if (showing || win.isDestroyed()) return
    showing = true
    try {
      while (!win.isDestroyed()) {
        const buttons = wait ? ["Relaunch", "Export Logs", "Keep Waiting"] : ["Relaunch", "Export Logs", "Quit"]
        const result = await dialog.showMessageBox(win, {
          type: "warning",
          buttons,
          defaultId: 0,
          cancelId: 2,
          message,
          detail,
        })
        if (await handle(buttons[result.response], wait)) continue
        return
      }
    } finally {
      showing = false
    }
  }

  const failed = (
    event: string,
    errorCode: number,
    errorDescription: string,
    validatedURL: string,
    isMainFrame: boolean,
  ) => {
    writeLog(
      "window",
      "renderer load failed",
      {
        window: name,
        event,
        errorCode,
        errorDescription,
        validatedURL,
        currentURL: win.webContents.getURL(),
        isMainFrame,
      },
      "error",
    )

    if (!isMainFrame || errorCode === -3) return
    void show(
      "M4 Spider Notebook failed to load",
      [`Window: ${name}`, `URL: ${validatedURL}`, `Error: ${errorCode} ${errorDescription}`].join("\n"),
      false,
    )
  }

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    failed("did-fail-load", errorCode, errorDescription, validatedURL, isMainFrame)
  })
  win.webContents.on("did-fail-provisional-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    failed("did-fail-provisional-load", errorCode, errorDescription, validatedURL, isMainFrame)
  })
  win.webContents.on("render-process-gone", (_event, details) => {
    sampler.stopAndFlush()
    writeLog(
      "window",
      "renderer process gone",
      { window: name, currentURL: win.webContents.getURL(), details },
      "error",
    )
    void show(
      "M4 Spider Notebook window terminated unexpectedly",
      [`Window: ${name}`, `Reason: ${details.reason}`, `Code: ${details.exitCode ?? "<unknown>"}`].join("\n"),
      false,
    )
  })
  win.on("unresponsive", () => {
    writeLog("window", "renderer unresponsive", { window: name, currentURL: win.webContents.getURL() }, "error")
    sampler.start()
    void show("M4 Spider Notebook is not responding", "You can relaunch the app, open the logs, or keep waiting.", true)
  })
  win.on("responsive", () => {
    writeLog("window", "renderer responsive", { window: name, currentURL: win.webContents.getURL() }, "error")
    sampler.stopAndFlush()
  })
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (message.toLowerCase().includes("terminal") || sourceId.toLowerCase().includes("terminal")) {
      writeLog("pty", "console", { window: name, level, message, line, sourceId })
    }
  })
  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    writeLog("preload", "preload error", { window: name, preloadPath, error }, "error")
  })
}

function addDocumentPolicy(response: Response, file: string) {
  if (!file.toLowerCase().endsWith(".html")) return response
  const headers = new Headers(response.headers)
  headers.set(documentPolicyHeader, jsCallStacksDocumentPolicy)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function allowRendererPermissions(win: BrowserWindow) {
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    callback(
      rendererPermissions.has(permission) &&
        isTrustedRendererUrl(details.requestingUrl) &&
        webContents.id === win.webContents.id,
    )
  })
  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (!rendererPermissions.has(permission)) return false
    if (webContents && webContents.id !== win.webContents.id) return false
    return isTrustedRendererUrl(details.requestingUrl) || isTrustedRendererUrl(requestingOrigin)
  })
}

function isTrustedRendererUrl(value?: string) {
  return isRendererUrl(value)
}

function addRendererHeaders(value: string, headers: Record<string, any>) {
  upsertKeyValue(headers, "Access-Control-Allow-Origin", ["*"])
  upsertKeyValue(headers, "Access-Control-Allow-Headers", ["*"])
  if (isRendererUrl(value, true)) upsertKeyValue(headers, documentPolicyHeader, [jsCallStacksDocumentPolicy])
}

function isRendererUrl(value?: string, html = false) {
  if (!value || !URL.canParse(value)) return false
  const url = new URL(value)
  if (html && !url.pathname.endsWith(".html")) return false
  if (url.protocol === `${rendererProtocol}:` && url.host === rendererHost) return true
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (!devUrl || !URL.canParse(devUrl)) return false
  return url.origin === new URL(devUrl).origin
}

function wireZoom(win: BrowserWindow) {
  pinchZoomEnabled.set(win, getPinchZoomEnabled())
  win.webContents.setZoomFactor(1)
  win.webContents.on("zoom-changed", (event, zoomDirection) => {
    event.preventDefault()
    if (pinchZoomEnabled.get(win)) {
      win.webContents.setZoomFactor(clampZoom(win.webContents.getZoomFactor() + (zoomDirection === "in" ? 0.2 : -0.2)))
      updateZoom(win)
      return
    }
    if (win.webContents.getZoomFactor() !== 1) win.webContents.setZoomFactor(1)
    updateZoom(win)
  })
}

function clampZoom(value: number) {
  return Math.min(Math.max(value, minZoomLevel), maxZoomLevel)
}

function updateZoom(win: BrowserWindow) {
  updateTitlebar(win)
  win.webContents.send("zoom-factor-changed", win.webContents.getZoomFactor())
}

function upsertKeyValue(obj: Record<string, any>, keyToChange: string, value: any) {
  const keyToChangeLower = keyToChange.toLowerCase()
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value
      // Done
      return
    }
  }
  // Insert at end instead
  obj[keyToChange] = value
}

let fullscreenBrowserWin: BrowserWindow | null = null

const titlebarOverlayByTheme: Record<string, { color: string; symbolColor: string }> = {
  "pure-white": { color: "#ffffff", symbolColor: "#1a1a1a" },
  "dark-amoled": { color: "#000000", symbolColor: "#f1f5f9" },
  m4spider: { color: "#0B2A2A", symbolColor: "#e0f2f1" },
}

export function updateFullscreenBrowserTitlebar(themeId: string) {
  if (!fullscreenBrowserWin || fullscreenBrowserWin.isDestroyed()) return
  if (process.platform !== "win32") return
  const overlay = titlebarOverlayByTheme[themeId]
  if (!overlay) return
  fullscreenBrowserWin.setTitleBarOverlay({ color: overlay.color, symbolColor: overlay.symbolColor })
}

let fullscreenBrowserThemeCssId: string | undefined

export function sendFullscreenBrowserTheme(themeId: string) {
  if (!fullscreenBrowserWin || fullscreenBrowserWin.isDestroyed()) return
  const colors = resolveThemeColors(themeId)
  const json = JSON.stringify(colors)
  fullscreenBrowserWin.webContents
    .executeJavaScript(
      `(function(){var r=document.documentElement;var c=${json};for(var k in c){r.style.setProperty(k,c[k]);}})()`
    )
    .catch(() => {})
  const cssDecl = Object.entries(colors)
    .map(([k, v]) => `${k}:${v} !important`)
    .join(";")
  const css = `:root{${cssDecl}}`
  if (fullscreenBrowserThemeCssId) {
    fullscreenBrowserWin.webContents.removeCSS(fullscreenBrowserThemeCssId).catch(() => {})
  }
  fullscreenBrowserWin.webContents
    .insertCSS(css, { cssOrigin: "author" })
    .then((id) => { fullscreenBrowserThemeCssId = id })
    .catch(() => {})
  updateFullscreenBrowserTitlebar(themeId)
}

export function createSpiderBrowserFullscreen(initialUrl?: string) {
  if (fullscreenBrowserWin && !fullscreenBrowserWin.isDestroyed()) {
    fullscreenBrowserWin.focus()
    if (initialUrl) {
      const escaped = initialUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      fullscreenBrowserWin.webContents.executeJavaScript(`typeof navigate === "function" && navigate("${escaped}")`).catch(() => {})
    }
    return fullscreenBrowserWin
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const winWidth = Math.round(screenWidth * 0.8)
  const winHeight = Math.round(screenHeight * 0.8)

  const currentThemeId = (getStore().get("themeId") as string) || "m4spider"
  const initialOverlay = titlebarOverlayByTheme[currentThemeId] || titlebarOverlayByTheme.m4spider
  const initialBg = currentThemeId === "pure-white" ? "#f8f7f7" : currentThemeId === "dark-amoled" ? "#000000" : "#0B2A2A"

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    show: false,
    title: "Spider Browser",
    icon: iconPath(),
    backgroundColor: initialBg,
    autoHideMenuBar: true,
    ...(process.platform === "win32"
      ? {
          titleBarStyle: "hidden" as const,
          titleBarOverlay: {
            color: initialOverlay.color,
            symbolColor: initialOverlay.symbolColor,
            height: 36,
          },
        }
      : process.platform === "darwin"
        ? {
            titleBarStyle: "hiddenInset" as const,
            trafficLightPosition: { x: 12, y: 10 },
          }
        : {}),
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      partition: "persist:spider",
      preload: join(root, "../preload/spider-browser-fullscreen.js"),
      webviewPreferences: {
        partition: "persist:spider",
      },
    },
  })

  fullscreenBrowserWin = win
  win.setMenu(null)

  let pendingNavigate: string | null = null

  const applyThemeToBrowser = () => {
    if (!fullscreenBrowserWin || fullscreenBrowserWin.isDestroyed()) return
    try {
      const store = getStore()
      const themeId = (store.get("themeId") as string) || "m4spider"
      sendFullscreenBrowserTheme(themeId)
    } catch {}
  }

  const navigatePending = () => {
    if (!pendingNavigate) return
    const url = pendingNavigate
    pendingNavigate = null
    const escaped = url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    win.webContents.executeJavaScript(`typeof navigate === "function" && navigate("${escaped}")`).catch(() => {})
  }

  win.webContents.on("did-finish-load", () => {
    applyThemeToBrowser()
    navigatePending()
  })
  win.webContents.on("did-navigate", applyThemeToBrowser)
  win.on("focus", applyThemeToBrowser)

  const htmlPath = app.isPackaged
    ? join(process.resourcesPath, "spider-browser-fullscreen.html")
    : join(app.getAppPath(), "spider-browser-fullscreen.html")

  if (initialUrl) {
    pendingNavigate = initialUrl
  }
  win.loadFile(htmlPath)

  win.once("ready-to-show", () => {
    win.show()
  })

  win.on("closed", () => { fullscreenBrowserWin = null })

  return win
}
