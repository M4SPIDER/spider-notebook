// @refresh reload

import {
  ACCEPTED_FILE_EXTENSIONS,
  AppBaseProviders,
  AppInterface,
  handleNotificationClick,
  loadLocaleDict,
  normalizeLocale,
  type Locale,
  type Platform,
  PlatformProvider,
  ServerConnection,
  useCommand,
  useWslServers,
} from "@m4spider/app"
import { openBrowserWithUrl } from "@m4spider/app/context/browser-panel"
import type { UpdaterState } from "@m4spider/app/updater"
import * as Sentry from "@sentry/solid"
import type { AsyncStorage } from "@solid-primitives/storage"
import { MemoryRouter } from "@solidjs/router"
import { createEffect, createMemo, createResource, createSignal, onCleanup, onMount, Show } from "solid-js"
import { render } from "solid-js/web"
import pkg from "../../package.json"
import { initI18n, t } from "./i18n"
import { initializationData, initializationReady } from "./initialization"
import { resetZoom, setPinchZoomEnabled, webviewZoom, zoomIn, zoomOut } from "./webview-zoom"
import { availableStartupServer, readyWslConnections } from "./wsl/connections"
import { AuthProvider, useAuth } from "@m4spider/app/context/auth"
import { LoginPage } from "./login"
import { maskSensitiveText } from "./privacy-filter"
import "./styles.css"

import { useTheme } from "@m4spider/ui/theme/context"

const root = document.getElementById("root")
if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(t("error.dev.rootNotFound"))
}

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE ?? `desktop@${pkg.version}`,
    initialScope: {
      tags: {
        platform: "desktop",
      },
    },
    integrations: (integrations) => {
      return integrations.filter(
        (i) =>
          i.name !== "Breadcrumbs" &&
          !(
            import.meta.env.M4SPIDER_CHANNEL === "prod" &&
            (i.name === "GlobalHandlers" || i.name === "BrowserApiErrors")
          ),
      )
    },
  })
}

void initI18n()

const [updaterState, setUpdaterState] = createSignal<UpdaterState>({ status: "disabled" })
void window.api.updater.subscribe(setUpdaterState)

const deepLinkEvent = "m4spider:deep-link"

const emitDeepLinks = (urls: string[]) => {
  if (urls.length === 0) return
  window.__M4SPIDER__ ??= {}
  const pending = window.__M4SPIDER__.deepLinks ?? []
  window.__M4SPIDER__.deepLinks = [...pending, ...urls]
  window.dispatchEvent(new CustomEvent(deepLinkEvent, { detail: { urls } }))
}

const listenForDeepLinks = () => {
  void window.api.consumeInitialDeepLinks().then((urls) => emitDeepLinks(urls))
  return window.api.onDeepLink((urls) => emitDeepLinks(urls))
}

const createPlatform = (): Platform => {
  const os = (() => {
    const ua = navigator.userAgent
    if (ua.includes("Mac")) return "macos"
    if (ua.includes("Windows")) return "windows"
    if (ua.includes("Linux")) return "linux"
    return undefined
  })()

  const runDesktopMenuAction: Platform["runDesktopMenuAction"] = (action) => {
    switch (action) {
      case "view.resetZoom":
        resetZoom()
        return
      case "view.zoomIn":
        zoomIn()
        return
      case "view.zoomOut":
        zoomOut()
        return
    }

    return window.api.runDesktopMenuAction(action)
  }

  const storage = (() => {
    const cache = new Map<string, AsyncStorage>()

    const createStorage = (name: string) => {
      const api: AsyncStorage = {
        getItem: (key: string) => window.api.storeGet(name, key),
        setItem: (key: string, value: string) => window.api.storeSet(name, key, value),
        removeItem: (key: string) => window.api.storeDelete(name, key),
        clear: () => window.api.storeClear(name),
        key: async (index: number) => (await window.api.storeKeys(name))[index],
        getLength: () => window.api.storeLength(name),
        get length() {
          return api.getLength()
        },
      }
      return api
    }

    return (name = "default.dat") => {
      const cached = cache.get(name)
      if (cached) return cached
      const api = createStorage(name)
      cache.set(name, api)
      return api
    }
  })()

  const wslServersApi = os === "windows" ? window.api.wslServers : undefined

  return {
    platform: "desktop",
    os,
    version: pkg.version,

    async openDirectoryPickerDialog(opts) {
      return window.api.openDirectoryPicker({
        multiple: opts?.multiple ?? false,
        title: opts?.title ?? t("desktop.dialog.chooseFolder"),
      })
    },

    async openAttachmentPickerDialog(opts, onFile) {
      const result = await window.api.openFilePicker({
        multiple: opts?.multiple ?? false,
        title: opts?.title ?? t("desktop.dialog.chooseFile"),
        defaultPath: opts?.defaultPath,
        extensions: opts?.extensions ?? ACCEPTED_FILE_EXTENSIONS,
      })
      if (!result) return
      try {
        for (const file of result.files) {
          await onFile(new File([await window.api.readPickedFile(result.token, file.path)], file.name))
        }
      } finally {
        await window.api.releasePickedFiles(result.token)
      }
    },

    async saveFilePickerDialog(opts) {
      return window.api.saveFilePicker({
        title: opts?.title ?? t("desktop.dialog.saveFile"),
        defaultPath: opts?.defaultPath,
      })
    },

    openLink(url: string) {
      window.api.openLink(url)
    },
    async openPath(path: string, app?: string) {
      if (os === "windows") {
        const resolvedApp = app ? await window.api.resolveAppPath(app).catch(() => null) : null
        return window.api.openPath(path, resolvedApp ?? undefined)
      }
      return window.api.openPath(path, app)
    },

    back() {
      window.history.back()
    },

    forward() {
      window.history.forward()
    },

    storage,

    updater: {
      state: updaterState,
      check: () => window.api.updater.check(),
      install: () => window.api.updater.install(),
    },

    exportDebugLogs: () => window.api.exportDebugLogs(),

    recordFatalRendererError: (error) => window.api.recordFatalRendererError(error),

    restart: async () => {
      await window.api.killSidecar().catch(() => undefined)
      window.api.relaunch()
    },

    notify: async (title, description, href) => {
      const focused = await window.api.getWindowFocused().catch(() => document.hasFocus())
      if (focused) return

      const iconPath = await (window as any).api?.getIconPath?.()
      const notification = new Notification(title, {
        body: description ?? "",
        icon: iconPath || undefined,
      })
      notification.onclick = () => {
        void window.api.showWindow()
        void window.api.setWindowFocus()
        handleNotificationClick(href)
        notification.close()
      }
    },

    fetch: (input, init) => {
      if (input instanceof Request) return fetch(input)
      return fetch(input, init)
    },

    getDefaultServer: async () => {
      const url = await window.api.getDefaultServerUrl().catch(() => null)
      if (!url) return null
      return ServerConnection.Key.make(url)
    },

    setDefaultServer: async (url: string | null) => {
      await window.api.setDefaultServerUrl(url)
    },

    wslServers: wslServersApi,

    getDisplayBackend: async () => {
      return window.api.getDisplayBackend().catch(() => null)
    },

    setDisplayBackend: async (backend) => {
      await window.api.setDisplayBackend(backend)
    },

    parseMarkdown: (markdown: string) => window.api.parseMarkdownCommand(markdown),

    webviewZoom,

    getPinchZoomEnabled: () => window.api.getPinchZoomEnabled(),

    setPinchZoomEnabled,

    runDesktopMenuAction,

    checkAppExists: async (appName: string) => {
      return window.api.checkAppExists(appName)
    },

    async readClipboardImage() {
      const image = await window.api.readClipboardImage().catch(() => null)
      if (!image) return null
      const blob = new Blob([image.buffer], { type: "image/png" })
      return new File([blob], `pasted-image-${Date.now()}.png`, {
        type: "image/png",
      })
    },
  }
}

let menuTrigger = null as null | ((id: string) => void)
window.api.onMenuCommand((id) => {
  menuTrigger?.(id)
})
window.api.onOpenBrowserPanel((url) => {
  openBrowserWithUrl(url)
})
listenForDeepLinks()

render(() => {
  const platform = createPlatform()
  const loadLocale = async () => {
    const current = await platform.storage?.("m4spider.global.dat").getItem("language")
    const legacy = current ? undefined : await platform.storage?.().getItem("language.v1")
    const raw = current ?? legacy
    if (!raw) return
    const locale = raw.match(/"locale"\s*:\s*"([^"]+)"/)?.[1]
    if (!locale) return
    const next = normalizeLocale(locale)
    if (next !== "en") await loadLocaleDict(next)
    return next satisfies Locale
  }

  const [windowCount] = createResource(() => window.api.getWindowCount())

  // Fetch sidecar credentials (available immediately, before health check)
  const [sidecar] = createResource(() => window.api.awaitInitialization())

  const [defaultServer] = createResource(() => platform.getDefaultServer?.())
  const [locale] = createResource(loadLocale)

  function handleClick(e: MouseEvent) {
    const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
    if (!link?.href) return
    const href = link.getAttribute("href")
    if (!href) return
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("/")) return
    e.preventDefault()
    e.stopImmediatePropagation()
    let url = href
    if (!url.startsWith("http")) {
      url = url.includes(".") ? `https://${url}` : href
    }
    openBrowserWithUrl(url)
  }

  function Inner() {
    const cmd = useCommand()
    menuTrigger = (id) => cmd.trigger(id)

    const theme = useTheme()

    createEffect(() => {
      theme.themeId()
      theme.mode()
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--background-base").trim()
      if (bg) {
        void window.api.setBackgroundColor(bg)
      }
    })

    return null
  }

  function App() {
    const wslServers = useWslServers()
    const [authed, setAuthed] = createSignal(false)
    const [authChecked, setAuthChecked] = createSignal(false)
    const auth = useAuth()

    createResource(async () => {
      try {
        const [token, user] = await Promise.all([
          (window as any).api?.auth?.getToken?.(),
          (window as any).api?.auth?.getUser?.(),
        ])
        if (token) {
          auth.setToken(token)
          auth.setUser(user)
          setAuthed(true)
        }
      } catch {
        setAuthed(false)
      } finally {
        setAuthChecked(true)
      }
    })

    const splash = (
      <div class="h-dvh w-screen flex flex-col items-center justify-center bg-background-base">
        <div class="text-2xl font-black italic tracking-tight text-text-weak opacity-50 animate-pulse">M4 <span class="text-accent-base">SPIDER</span></div>
      </div>
    )

    const ready = createMemo(
      () => !defaultServer.loading && !sidecar.loading && !windowCount.loading && !locale.loading,
    )
    const servers = createMemo(() => {
      const data = initializationData(sidecar)
      const list: ServerConnection.Any[] = []
      if (data) {
        list.push({
          displayName: "Local Server",
          type: "sidecar",
          variant: "base",
          http: {
            url: data.url,
            username: data.username ?? undefined,
            password: data.password ?? undefined,
          },
        })
      }
      list.push(...readyWslConnections(wslServers.data))
      return list
    })
    const effectiveDefaultServer = createMemo(() =>
      ServerConnection.Key.make(availableStartupServer(defaultServer.latest, wslServers.data)),
    )

    const loadingSplash = (
      <div class="h-dvh w-screen flex flex-col items-center justify-center bg-background-base">
        <div class="text-2xl font-black italic tracking-tight text-text-weak opacity-50 animate-pulse">M4 <span class="text-accent-base">SPIDER</span></div>
        <div class="mt-3 text-xs text-text-weak opacity-60">Loading...</div>
      </div>
    )

    return (
      <Show when={authChecked()} fallback={splash}>
        <Show when={authed()} fallback={<LoginPage onLogin={() => setAuthed(true)} />}>
          <Show when={ready()} fallback={loadingSplash}>
            <Show when={effectiveDefaultServer()} keyed>
              {(key) => (
                <AppInterface defaultServer={key} servers={servers()} router={MemoryRouter}>
                  <Inner />
                </AppInterface>
              )}
            </Show>
          </Show>
        </Show>
      </Show>
    )
  }

  // Browser bridge — allows backend AI to control Spider Browser via HTTP
  ;(window as any).__browserBridge__ = async (cmd: any) => {
    // Wait for spider bridge to be ready
    let spider: any = null
    for (let i = 0; i < 10; i++) {
      spider = (window as any).__spiderBrowser__
      if (spider) break
      await new Promise(r => setTimeout(r, 500))
    }
    if (!spider) throw new Error("Spider Browser panel not open. Please open it with Ctrl+Shift+B.")

    // For navigate: call navigateTo first (triggers webview to render), then wait for it
    if (cmd.action === "navigate" && cmd.url && spider.navigateTo) {
      spider.navigateTo(cmd.url)
    }

    // Wait for webview to appear (Show renders it once URL !== HOME)
    let wv: any = null
    for (let i = 0; i < 20; i++) {
      wv = spider.getWebview?.() ?? document.querySelector("webview")
      if (wv) break
      await new Promise(r => setTimeout(r, 500))
    }
    if (!wv) throw new Error("No Spider Browser webview found. Please open the Spider Browser panel.")

    switch (cmd.action) {
      case "navigate": {
        if (!cmd.url) throw new Error("url required")
        // Already called navigateTo above for navigate action — just wait for load
        // Wait for page to actually load (up to 15 seconds)
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 500))
          try {
            const ready = await wv.executeJavaScript(`document.readyState`)
            if (ready === "complete" || ready === "interactive") break
          } catch { /* webview may be transitioning */ }
        }
        const title = await Promise.resolve(wv.getTitle()).catch(() => cmd.url)
        const rawText = await wv.executeJavaScript(`
          (() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const lines = []; let last = null;
            while (walker.nextNode()) {
              const t = walker.currentNode.textContent?.trim();
              if (!t) continue;
              const p = walker.currentNode.parentElement;
              if (p && p !== last) { if (last) lines.push(""); last = p; }
              lines.push(t);
            }
            return lines.join("\\n").replace(/\\n{3,}/g, "\\n\\n").trim().slice(0, 15000);
          })()
        `).catch(() => "")
        return { title, url: wv.getURL(), text: maskSensitiveText(rawText) }
      }
      case "screenshot": {
        // Inject privacy CSS to blur faces, QR codes, payment fields before capture
        await wv.insertCSS(`
          img[src*="avatar"], img[src*="profile"], img[src*="face"],
          img[class*="avatar"], img[class*="profile"], img[class*="face"],
          img[class*="Avatar"], img[class*="Profile"], img[class*="Face"],
          [data-testid*="avatar"], [data-testid*="profile"],
          .avatar, .profile-pic, .user-avatar, .face-detection {
            filter: blur(15px) !important; -webkit-filter: blur(15px) !important;
          }
          img[src*="qr"], img[src*="QR"], img[alt*="QR"], img[alt*="qr"],
          img[class*="qr"], img[class*="QR"], [data-testid*="qr"],
          .qr-code, .QRCode, [class*="qrcode"], [class*="QRCode"] {
            filter: blur(20px) !important; -webkit-filter: blur(20px) !important;
          }
          input[type="password"],
          input[name*="card"], input[name*="cc"], input[name*="credit"],
          input[name*="cvv"], input[name*="cvc"], input[name*="expiry"],
          input[name*="exp"], input[name*="pan"], input[name*="account"],
          input[autocomplete="cc-number"], input[autocomplete="cc-exp"],
          input[autocomplete="cc-csc"], input[autocomplete="payment"],
          input[placeholder*="card"], input[placeholder*="Card"],
          input[placeholder*="CVV"], input[placeholder*="cvv"],
          input[placeholder*="expir"], input[placeholder*="Expir"],
          input[placeholder*="account"], input[placeholder*="Account"],
          input[id*="card"], input[id*="Card"], input[id*="cvv"],
          input[id*="Cvv"], input[id*="payment"], input[id*="Payment"],
          [data-testid*="card"], [data-testid*="cvv"], [data-testid*="payment"],
          .card-input, .cvv-input, .payment-input,
          [class*="card-number"], [class*="cardNumber"], [class*="CardNumber"],
          [class*="cvv"], [class*="Cvv"], [class*="CVV"],
          [class*="payment"], [class*="Payment"] {
            filter: blur(10px) !important; -webkit-filter: blur(10px) !important;
          }
        `).catch(() => {})
        // Wait for CSS to render
        await new Promise(r => setTimeout(r, 200))
        const dataUrl = await wv.capturePage()
        const title = await Promise.resolve(wv.getTitle()).catch(() => "screenshot")
        const url = wv.getURL()
        // Remove privacy CSS after capture
        await wv.insertCSS(`
          img[src*="avatar"], img[src*="profile"], img[src*="face"],
          img[class*="avatar"], img[class*="profile"], img[class*="face"],
          img[class*="Avatar"], img[class*="Profile"], img[class*="Face"],
          [data-testid*="avatar"], [data-testid*="profile"],
          .avatar, .profile-pic, .user-avatar, .face-detection {
            filter: none !important; -webkit-filter: none !important;
          }
          img[src*="qr"], img[src*="QR"], img[alt*="QR"], img[alt*="qr"],
          img[class*="qr"], img[class*="QR"], [data-testid*="qr"],
          .qr-code, .QRCode, [class*="qrcode"], [class*="QRCode"] {
            filter: none !important; -webkit-filter: none !important;
          }
          input[type="password"],
          input[name*="card"], input[name*="cc"], input[name*="credit"],
          input[name*="cvv"], input[name*="cvc"], input[name*="expiry"],
          input[name*="exp"], input[name*="pan"], input[name*="account"],
          input[autocomplete="cc-number"], input[autocomplete="cc-exp"],
          input[autocomplete="cc-csc"], input[autocomplete="payment"],
          input[placeholder*="card"], input[placeholder*="Card"],
          input[placeholder*="CVV"], input[placeholder*="cvv"],
          input[placeholder*="expir"], input[placeholder*="Expir"],
          input[placeholder*="account"], input[placeholder*="Account"],
          input[id*="card"], input[id*="Card"], input[id*="cvv"],
          input[id*="Cvv"], input[id*="payment"], input[id*="Payment"],
          [data-testid*="card"], [data-testid*="cvv"], [data-testid*="payment"],
          .card-input, .cvv-input, .payment-input,
          [class*="card-number"], [class*="cardNumber"], [class*="CardNumber"],
          [class*="cvv"], [class*="Cvv"], [class*="CVV"],
          [class*="payment"], [class*="Payment"] {
            filter: none !important; -webkit-filter: none !important;
          }
        `).catch(() => {})
        return { title, url, screenshot: typeof dataUrl === "string" ? dataUrl : dataUrl.toDataURL?.() ?? "" }
      }
      case "text": {
        const rawText = await wv.executeJavaScript(`
          (() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const lines = []; let last = null;
            while (walker.nextNode()) {
              const t = walker.currentNode.textContent?.trim();
              if (!t) continue;
              const p = walker.currentNode.parentElement;
              if (p && p !== last) { if (last) lines.push(""); last = p; }
              lines.push(t);
            }
            return lines.join("\\n").replace(/\\n{3,}/g, "\\n\\n").trim().slice(0, 20000);
          })()
        `)
        const title = await Promise.resolve(wv.getTitle()).catch(() => "")
        return { title, url: wv.getURL(), text: maskSensitiveText(rawText) }
      }
      case "click": {
        if (!cmd.selector) throw new Error("selector required")
        await wv.executeJavaScript(`document.querySelector("${cmd.selector.replace(/"/g, '\\"')}")?.click()`)
        await new Promise((r) => setTimeout(r, 1000))
        return { ok: true, url: wv.getURL() }
      }
      case "type": {
        if (!cmd.selector || !cmd.text) throw new Error("selector and text required")
        await wv.executeJavaScript(`
          const el = document.querySelector("${cmd.selector.replace(/"/g, '\\"')}");
          if (el) { el.focus(); el.value = "${cmd.text.replace(/"/g, '\\"')}"; el.dispatchEvent(new Event("input", {bubbles:true})); }
        `)
        return { ok: true, url: wv.getURL() }
      }
      case "back": {
        wv.goBack()
        await new Promise((r) => setTimeout(r, 2000))
        return { url: wv.getURL(), title: await Promise.resolve(wv.getTitle()).catch(() => "") }
      }
      case "forward": {
        wv.goForward()
        await new Promise((r) => setTimeout(r, 2000))
        return { url: wv.getURL(), title: await Promise.resolve(wv.getTitle()).catch(() => "") }
      }
      case "scroll": {
        const amount = cmd.direction === "up" ? -500 : cmd.direction === "top" ? "-document.body.scrollHeight" : cmd.direction === "bottom" ? "document.body.scrollHeight" : "500"
        await wv.executeJavaScript(`window.scrollBy(0, ${amount})`)
        return { ok: true, url: wv.getURL() }
      }
      case "snapshot": {
        const rawText = await wv.executeJavaScript(`
          (() => {
            const els = document.querySelectorAll('a, button, input, [role="button"], [onclick], [role="link"], [role="tab"], video, [class*="play"], [class*="Play"]');
            const items = [];
            els.forEach((el, i) => {
              const tag = el.tagName.toLowerCase();
              const text = (el.textContent || '').trim().slice(0, 80);
              const href = el.href || '';
              const id = el.id ? '#' + el.id : '';
              const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(c => c && c.length < 30).slice(0, 2).join('.') : '';
              const sel = id || cls || tag;
              if (text || href) items.push('[e' + i + '] <' + sel + '> ' + (text || href).replace(/\\n/g, ' ').trim());
            });
            return items.slice(0, 80).join('\\n');
          })()
        `).catch(() => "")
        const title = await Promise.resolve(wv.getTitle()).catch(() => "")
        return { title, url: wv.getURL(), text: maskSensitiveText(rawText) }
      }
      case "press": {
        const key = cmd.text || "Enter"
        await wv.executeJavaScript(`
          document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {key: '${key}', code: '${key}', keyCode: 13, bubbles: true}));
          document.activeElement?.dispatchEvent(new KeyboardEvent('keyup', {key: '${key}', code: '${key}', keyCode: 13, bubbles: true}));
        `)
        await new Promise(r => setTimeout(r, 1000))
        return { ok: true, url: wv.getURL() }
      }
      default:
        throw new Error(`Unknown action: ${cmd.action}`)
    }
  }

  onMount(() => {
    // Override window.open to route through Spider Browser
    const originalOpen = window.open
    window.open = (url: string | URL, ...args: any[]) => {
      const u = typeof url === "string" ? url : url?.toString()
      if (u && !u.startsWith("about:") && !u.startsWith("javascript:")) {
        openBrowserWithUrl(u)
      }
      return null
    }

    // Capture phase to run before any SolidJS stopPropagation
    document.addEventListener("click", handleClick, true)
    onCleanup(() => {
      document.removeEventListener("click", handleClick, true)
      window.open = originalOpen
    })
  })

  return (
    <PlatformProvider value={platform}>
      <AppBaseProviders locale={locale.latest}>
        <AuthProvider>
          <Show when={true}>{(_) => <App />}</Show>
        </AuthProvider>
      </AppBaseProviders>
    </PlatformProvider>
  )
}, root!)
