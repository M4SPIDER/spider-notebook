import { randomUUID } from "node:crypto"
import { mkdirSync, rmSync } from "node:fs"
import * as http from "node:http"
import { createServer } from "node:net"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { getCACertificates, setDefaultCACertificates } from "node:tls"
import type { Event } from "electron"
import { app, BrowserWindow, globalShortcut, session } from "electron"

import { Deferred, Effect, Fiber } from "effect"
import contextMenu from "electron-context-menu"

import type { ServerReadyData } from "../preload/types"
import { checkAppExists, resolveAppPath } from "./apps"
import { CHANNEL } from "./constants"
import { registerIpcHandlers, sendDeepLinks, sendMenuCommand } from "./ipc"
import { forwardInitializationFailure } from "./initialization"
import { exportDebugLogs, initCrashReporter, initLogging, startNetLog, write as writeLog } from "./logging"
import { parseMarkdown } from "./markdown"
import { createMenu } from "./menu"
import {
  getDefaultServerUrl,
  preferAppEnv,
  setDefaultServerUrl,
  spawnLocalServer,
  type SidecarListener,
} from "./server"
import { setupAutoUpdater, showUpdaterDialog, checkForcedUpdate } from "./updater"
import {
  createMainWindow,
  createSpiderBrowserFullscreen,
  registerRendererProtocol,
  setRelaunchHandler,
  setBackgroundColor,
  setDockIcon,
} from "./windows"
import { createWslServersController } from "./wsl/servers"
import { registerWslIpcHandlers } from "./wsl/ipc"
import { spawnWslSidecar } from "./wsl/sidecar"
import { migrate } from "./migrate"
import { shouldBlockRequest, shouldUpgradeToHttps } from "./content-blocker"

const APP_NAMES: Record<string, string> = {
  dev: "M4 Spider Notebook",
  beta: "M4 Spider Notebook",
  prod: "M4 Spider Notebook",
}
const APP_IDS: Record<string, string> = {
 dev: "ai.m4spider.desktop.dev",
  beta: "ai.m4spider.desktop.beta",
  prod: "ai.m4spider.desktop",
}
const TEST_ONBOARDING = process.env.OPENCODE_TEST_ONBOARDING === "1"
const jsCallStackFeature = "DocumentPolicyIncludeJSCallStacksInCrashReports"

let logger: ReturnType<typeof initLogging>
let mainWindow: BrowserWindow | null = null
let server: SidecarListener | null = null

const pendingDeepLinks: string[] = []

function useEnvProxy() {
  try {
    // Electron 41.2 runs Node 24.14.1; latest @types/node@24 is 24.12.2.
    ;(http as any).setGlobalProxyFromEnv()
  } catch (error) {
    logger.warn("failed to load proxy environment", error)
  }
}

function emitDeepLinks(urls: string[]) {
  if (urls.length === 0) return
  pendingDeepLinks.push(...urls)
  if (mainWindow) sendDeepLinks(mainWindow, urls)
}

async function killSidecar() {
  if (!server) return
  const current = server
  server = null
  await current.stop()
}

function ensureLoopbackNoProxy() {
  const loopback = ["127.0.0.1", "localhost", "::1"]
  const upsert = (key: string) => {
    const items = (process.env[key] ?? "")
      .split(",")
      .map((value: string) => value.trim())
      .filter((value: string) => Boolean(value))

    for (const host of loopback) {
      if (items.some((value: string) => value.toLowerCase() === host)) continue
      items.push(host)
    }

    process.env[key] = items.join(",")
  }

  upsert("NO_PROXY")
  upsert("no_proxy")
}

const main = Effect.gen(function* () {
  contextMenu({ showSaveImageAs: true, showLookUpSelection: false, showSearchWithGoogle: false })

  // on macOS apps run in `/` which can cause issues with ripgrep
  try {
    process.chdir(homedir())
  } catch {}

  process.env.OPENCODE_DISABLE_EMBEDDED_WEB_UI = "true"

  const appId = app.isPackaged ? APP_IDS[CHANNEL] : "ai.m4spidernotebook"
  const onboardingTestRoot = ((): string | undefined => {
    if (!TEST_ONBOARDING) return

    const root = join(tmpdir(), `opencode-onboarding-${randomUUID()}`)
    rmSync(root, { recursive: true, force: true })
    ;["data", "config", "cache", "state", "desktop", "session"].forEach((dir) =>
      mkdirSync(join(root, dir), { recursive: true }),
    )
    process.env.OPENCODE_DB = ":memory:"
    process.env.XDG_DATA_HOME = join(root, "data")
    process.env.XDG_CONFIG_HOME = join(root, "config")
    process.env.XDG_CACHE_HOME = join(root, "cache")
    process.env.XDG_STATE_HOME = join(root, "state")
    return root
  })()
  app.setName(app.isPackaged ? APP_NAMES[CHANNEL] : "M4 Spider Notebook")
  app.setAppUserModelId(appId)
  app.setPath(
    "userData",
    onboardingTestRoot ? join(onboardingTestRoot, "desktop") : join(app.getPath("appData"), appId),
  )
  if (onboardingTestRoot) app.setPath("sessionData", join(onboardingTestRoot, "session"))
  logger = initLogging()
  initCrashReporter()

  const wslServers = createWslServersController(
    app.getVersion(),
    async (distro) => {
      logger.log("spawning wsl sidecar", { distro })
      return spawnWslSidecar(distro, {
        onLine: (line) => logger.log("wsl sidecar", { distro, stream: line.stream, text: line.text }),
      })
    },
    {
      logger: {
        log: (message, meta) => logger.log(message, meta),
        error: (message, meta) => logger.error(message, meta),
      },
    },
  )
  const stopSidecars = async () => {
    await killSidecar()
    wslServers.stopAll()
  }
  const relaunch = () => {
    void stopSidecars().finally(() => {
      app.relaunch()
      app.exit(0)
    })
  }

  try {
    setDefaultCACertificates([...new Set([...getCACertificates("default"), ...getCACertificates("system")])])
  } catch (error) {
    logger.warn("failed to load system certificates", error)
  }

  logger.log("app starting", {
    version: app.getVersion(),
    packaged: app.isPackaged,
    onboardingTest: Boolean(onboardingTestRoot),
  })

  ensureLoopbackNoProxy()
  useEnvProxy()
  app.commandLine.appendSwitch("proxy-bypass-list", "<-loopback>")
  app.commandLine.appendSwitch("enable-gpu-rasterization")
  app.commandLine.appendSwitch("enable-zero-copy")
  app.commandLine.appendSwitch("ignore-gpu-blocklist")
  // Media playback flags — prevent YouTube/video hanging
  app.commandLine.appendSwitch("enable-features", "VaapiVideoDecodeLinuxGL,VaapiVideoEncoder,MediaFoundationH264Encoding")
  app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling")
  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required")
  const features = app.commandLine.getSwitchValue("enable-features")
  app.commandLine.appendSwitch("enable-features", features ? `${jsCallStackFeature},${features}` : jsCallStackFeature)
  if (!app.isPackaged) app.commandLine.appendSwitch("remote-debugging-port", "9222")

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  preferAppEnv(app.getPath("userData"))

  app.on("second-instance", (_event: Event, argv: string[]) => {
    const protocolSchemes = ["m4spider://", "m4spider-dev://", "m4spider-beta://", "opencode://"]
    const urls = argv.filter((arg: string) => protocolSchemes.some((s) => arg.startsWith(s)))
    if (urls.length) {
      logger.log("deep link received via second-instance", { urls })
      emitDeepLinks(urls)
    }
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on("open-url", (event: Event, url: string) => {
    event.preventDefault()
    logger.log("deep link received via open-url", { url })
    emitDeepLinks([url])
  })

  app.on("before-quit", () => {
    void stopSidecars()
  })

  app.on("will-quit", () => {
    void stopSidecars()
    globalShortcut.unregisterAll()
  })

  app.on("child-process-gone", (_event, details) => {
    writeLog("utility", "child process gone", { details }, "error")
  })

  app.on("render-process-gone", (_event, webContents, details) => {
    writeLog("window", "app render process gone", { url: webContents.getURL(), details }, "error")
  })

  // Accept self-signed SSL certificates for localhost / local IPs (dev servers)
  app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
    try {
      const { hostname } = new URL(url)
      if (/^(localhost|127\.\d+\.\d+\.\d+|::1|0\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/i.test(hostname)) {
        event.preventDefault()
        callback(true)
        return
      }
    } catch {}
    callback(false)
  })

  setRelaunchHandler(() => {
    relaunch()
  })

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void stopSidecars().finally(() => app.exit(0))
    })
  }

  const serverReady = Deferred.makeUnsafe<ServerReadyData, unknown>()

  yield* Effect.promise(() => app.whenReady())

  if (!TEST_ONBOARDING) migrate()
  // Register unique protocol per channel to avoid conflicts with OpenCode
  const protocolSchemes: Record<string, string> = { dev: "m4spider-dev", beta: "m4spider-beta", prod: "m4spider" }
  app.setAsDefaultProtocolClient(protocolSchemes[CHANNEL] ?? "m4spider")
  registerRendererProtocol()
  setDockIcon()
  const updater = setupAutoUpdater(stopSidecars)
  registerIpcHandlers({
    killSidecar: () => killSidecar(),
    relaunch,
    awaitInitialization: Effect.fnUntraced(
      function* () {
        logger.log("awaiting server ready")
        const res = yield* Deferred.await(serverReady)
        logger.log("server ready", { url: res.url })
        return res
      },
      (e) => Effect.runPromise(e),
    ),
    consumeInitialDeepLinks: () => pendingDeepLinks.splice(0),
    getDefaultServerUrl: () => getDefaultServerUrl(),
    setDefaultServerUrl: (url) => setDefaultServerUrl(url),
    getDisplayBackend: async () => null,
    setDisplayBackend: async () => undefined,
    parseMarkdown: async (markdown) => parseMarkdown(markdown),
    checkAppExists: (appName) => checkAppExists(appName),
    resolveAppPath: async (appName) => resolveAppPath(appName),
    updater,
    showUpdater: () => showUpdaterDialog(updater, true),
    setBackgroundColor: (color) => setBackgroundColor(color),
    exportDebugLogs: () => exportDebugLogs(),
    recordFatalRendererError: (error) => writeLog("renderer", "fatal renderer error", { ...error }, "error"),
  })
  registerWslIpcHandlers(wslServers)

  // Brave-like content blocker for Spider Browser (ad/tracker blocking)
  const spiderSession = session.fromPartition("persist:spider")
  // Enable credential/password management for Google password sync
  spiderSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    // Grant all permissions needed for password managers and credential sync
    callback(true)
  })
  // Override User-Agent on all requests to remove "Electron" token
  // Google blocks Chromium-based embedded webviews; Firefox UA bypasses this
  spiderSession.webRequest.onBeforeSendHeaders(
    { urls: ["https://*/*"] },
    (details, callback) => {
      details.requestHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"
      callback({ requestHeaders: details.requestHeaders })
    },
  )
  spiderSession.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (details, callback) => {
      if (shouldBlockRequest(details.url, details.referrer)) {
        callback({ cancel: true })
        return
      }
      callback({ cancel: false })
    },
  )
  // HTTPS upgrade
  spiderSession.webRequest.onBeforeRequest(
    { urls: ["http://*/*"] },
    (details, callback) => {
      const upgraded = shouldUpgradeToHttps(details.url)
      if (upgraded) {
        callback({ redirectURL: upgraded })
        return
      }
      callback({ cancel: false })
    },
  )

  // Browser bridge HTTP server — allows backend AI tool to control Spider Browser
  const BROWSER_BRIDGE_PORT = 4098
  let browserPanelReady = false
  const browserBridge = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return }

    let body = ""
    for await (const chunk of req) body += chunk
    let cmd: any
    try { cmd = JSON.parse(body) } catch { res.writeHead(400); res.end(JSON.stringify({ error: "invalid JSON" })); return }

    // Forward command to the main window's renderer which controls the webview
    const wins = BrowserWindow.getAllWindows()
    const mainWin = wins.find(w => !w.isDestroyed() && w.getTitle().includes("M4 Spider")) ?? wins[0]
    if (!mainWin) { res.writeHead(503); res.end(JSON.stringify({ error: "no window" })); return }

    // Auto-open Spider Browser panel if not already open
    if (!browserPanelReady) {
      try {
        mainWin.webContents.send("open-browser-panel", "")
        await new Promise(resolve => setTimeout(resolve, 2000))
        browserPanelReady = true
      } catch {
        // Panel may already be open, continue anyway
      }
    }

    try {
      const result = await mainWin.webContents.executeJavaScript(
        `window.__browserBridge__ ? window.__browserBridge__(${JSON.stringify(cmd)}) : Promise.reject("no bridge")`
      )
      res.writeHead(200)
      res.end(JSON.stringify(result))
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      // If bridge says no webview, reset flag so next request re-opens panel
      if (msg.includes("no bridge") || msg.includes("No Spider Browser webview")) {
        browserPanelReady = false
      }
      // If bridge not ready yet, try once more after a short delay
      if (msg.includes("no bridge")) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
          const result2 = await mainWin.webContents.executeJavaScript(
            `window.__browserBridge__ ? window.__browserBridge__(${JSON.stringify(cmd)}) : Promise.reject("no bridge")`
          )
          res.writeHead(200)
          res.end(JSON.stringify(result2))
          return
        } catch (e2: any) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: "Spider Browser panel is not open. Please open it with Ctrl+Shift+B or the globe icon." }))
          return
        }
      }
      res.writeHead(500)
      res.end(JSON.stringify({ error: e?.message ?? String(e) }))
    }
  })
  browserBridge.listen(BROWSER_BRIDGE_PORT, "127.0.0.1", () => {
    writeLog("browser-bridge", "started", { port: BROWSER_BRIDGE_PORT })
  })
  browserBridge.unref()

  void updater.start()
  const forced = yield* Effect.promise(() => checkForcedUpdate(updater))
  if (forced) return
  const updateTimer = setInterval(() => void updater.check(), 10 * 60 * 1000)
  updateTimer.unref()
  app.once("will-quit", () => clearInterval(updateTimer))
  yield* Effect.promise(() => startNetLog()).pipe(
    Effect.catch((error) =>
      Effect.sync(() => {
        logger.warn("failed to start net log", error)
      }),
    ),
  )

  const port = yield* Effect.gen(function* () {
    const fromEnv = process.env.OPENCODE_PORT
    if (fromEnv) {
      const parsed = Number.parseInt(fromEnv, 10)
      if (!Number.isNaN(parsed)) return parsed
    }

    const res = yield* Deferred.make<number, unknown>()
    const server = createServer()
    server.on("error", (e) => Deferred.failSync(res, () => e))
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (typeof address !== "object" || !address) {
        server.close()
        Deferred.failSync(res, () => new Error("Failed to get port"))
        return
      }
      const port = address.port
      server.close(() => Effect.runSync(Deferred.succeed(res, port)))
    })

    return yield* Deferred.await(res)
  })
  const hostname = "127.0.0.1"
  const url = `http://${hostname}:${port}`
  const password = randomUUID()

  const loadingTask = yield* Effect.gen(function* () {
    logger.log("sidecar connection started", { url })

    ensureLoopbackNoProxy()
    useEnvProxy()

    logger.log("spawning sidecar", { url })
    const { listener, health } = yield* Effect.promise(() =>
      spawnLocalServer(hostname, port, password, {
        userDataPath: app.getPath("userData"),
        onStdout: (message) => writeLog("server", "stdout", { message }),
        onStderr: (message) => writeLog("server", "stderr", { message }, "warn"),
        onExit: (code) => writeLog("utility", "sidecar exited", { code }, "warn"),
      }),
    )
    server = listener
    yield* Deferred.succeed(serverReady, {
      url,
      username: "opencode",
      password,
    })

    if (process.platform === "win32") {
      void wslServers.initialize().catch((error) => logger.error("wsl server initialization failed", error))
    }

    yield* Effect.promise(() => health.wait).pipe(
      Effect.timeout("30 seconds"),
      Effect.catch((e) =>
        Effect.sync(() => {
          logger.error("sidecar health check failed", e.toString())
        }),
      ),
    )

    logger.log("loading task finished")
  }).pipe(forwardInitializationFailure(serverReady), Effect.forkChild)

  yield* Fiber.await(loadingTask)

  mainWindow = createMainWindow()

  // Register Ctrl+Alt+B for fullscreen browser
  globalShortcut.register("CommandOrControl+Alt+B", () => {
    createSpiderBrowserFullscreen()
  })

  if (mainWindow) {
    createMenu({
      trigger: (id) => {
        const win = BrowserWindow.getFocusedWindow() ?? mainWindow
        if (win) sendMenuCommand(win, id)
      },
      checkForUpdates: () => {
        void showUpdaterDialog(updater, true)
      },
      relaunch: () => {
        relaunch()
      },
    })
  }
})

Effect.runFork(main)
