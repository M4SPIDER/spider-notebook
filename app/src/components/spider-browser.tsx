import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { browserOpen, browserWidth, consumePendingUrl, pendingUrl, setBrowserWidth } from "@/context/browser-panel"

type Tab = {
  id: number
  title: string
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  history: string[]
  historyIndex: number
}

const HOME = "__home__"

const BOOKMARKS = [
  { name: "Google", url: "https://www.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Wikipedia", url: "https://en.wikipedia.org" },
]

const ENGINES = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duck: "https://duckduckgo.com/?q=",
}

export function SpiderBrowser(props: { onClose: () => void }) {
  const [tabs, setTabs] = createSignal<Tab[]>([
    {
      id: 1,
      title: "New Tab",
      url: HOME,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      history: [HOME],
      historyIndex: 0,
    },
  ])
  const [activeTabId, setActiveTabId] = createSignal(1)
  const [urlInput, setUrlInput] = createSignal("")
  const [engine, setEngine] = createSignal<keyof typeof ENGINES>("google")
  const [adBlockerOn, setAdBlockerOn] = createSignal(true)
  const [siteSecure, setSiteSecure] = createSignal(false)
  const [showSiteInfo, setShowSiteInfo] = createSignal(false)
  const [toast, setToast] = createSignal<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  let contentRef: HTMLDivElement | undefined
  let homePageRef: HTMLDivElement | undefined
  const webviews: Record<number, HTMLWebViewElement> = {}

  const activeTab = () => tabs().find((t) => t.id === activeTabId()) ?? tabs()[0]

  const getDomain = () => {
    try {
      return new URL(activeTab().url).hostname
    } catch {
      return ""
    }
  }

  const updateTab = (id: number, data: Partial<Tab>) =>
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))

  createEffect(on(pendingUrl, (url) => {
    if (url) {
      consumePendingUrl()
      navigateTo(url)
    }
  }))

  onMount(() => {
    window.api?.adBlocker?.getEnabled?.().then((enabled) => setAdBlockerOn(enabled))
    ;(window as any).__spiderBrowser__ = {
      navigateTo,
      getWebview: () => webviews[activeTabId()] ?? null,
    }
  })

  onCleanup(() => {
    delete (window as any).__spiderBrowser__
  })

  const renderContent = () => {
    if (!contentRef) return

    Object.values(webviews).forEach((w) => { w.style.display = "none" })

    const tab = activeTab()

    if (homePageRef) {
      homePageRef.style.display = tab.url === HOME ? "" : "none"
    }

    if (!tab || tab.url === HOME) return

    if (webviews[tab.id]) {
      webviews[tab.id].style.display = ""
    } else {
      const webview = document.createElement("webview")
      webview.setAttribute("src", tab.url)
      webview.setAttribute("partition", "persist:spider")
      webview.setAttribute("useragent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.69 Safari/537.36")
      webview.style.width = "100%"
      webview.style.height = "100%"
      webview.style.border = "none"
      webview.style.position = "absolute"
      webview.style.top = "0"
      webview.style.left = "0"
      contentRef.appendChild(webview)
      webviews[tab.id] = webview

      webview.addEventListener("new-window", (e: any) => {
        e.preventDefault()
        if (e.url) webview.src = e.url
      })
      webview.addEventListener("crashed", () => {
        const url = activeTab().url
        if (url !== HOME) setTimeout(() => { webview.src = url }, 1000)
      })
      webview.addEventListener("dom-ready", () => {
        updateTab(activeTabId(), { canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() })
      })
      webview.addEventListener("did-start-loading", () => {
        if (contentRef && !contentRef.querySelector(".loading-bar")) {
          contentRef.insertAdjacentHTML("afterbegin", '<div class="loading-bar"><div class="bar"></div></div>')
        }
      })
      webview.addEventListener("did-stop-loading", () => {
        if (contentRef) {
          const lb = contentRef.querySelector(".loading-bar")
          if (lb) lb.remove()
        }
        updateTab(activeTabId(), { isLoading: false, canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() })
      })
      webview.addEventListener("did-navigate", (e: any) => {
        const url = e.url || activeTab().url
        setSiteSecure(url.startsWith("https://"))
        updateTab(activeTabId(), { url })
        setUrlInput(url === HOME ? "" : url)
      })
      webview.addEventListener("did-navigate-in-page", (e: any) => {
        const url = e.url || activeTab().url
        setSiteSecure(url.startsWith("https://"))
        updateTab(activeTabId(), { url })
        setUrlInput(url === HOME ? "" : url)
      })
    }

    setUrlInput(tab.url)
    setSiteSecure(tab.url.startsWith("https://"))
  }

  const toggleAdBlocker = async () => {
    const next = !adBlockerOn()
    setAdBlockerOn(next)
    await window.api?.adBlocker?.setEnabled?.(next)
  }

  const googleSignIn = async () => {
    showToast("Opening Google sign-in in your browser...")
    try {
      const result = await window.api?.googleLogin?.sync?.()
      if (result?.imported > 0) {
        showToast(`Signed in! Imported ${result.imported} Google cookies.`)
        Object.values(webviews).forEach((wv) => wv.reload())
      } else if (result?.error) {
        showToast(result.error)
      }
    } catch {
      showToast("Google sign-in failed. Please try again.")
    }
  }

  const clearCookies = async () => {
    try {
      const wv = webviews[activeTab().id]
      if (wv) {
        await wv.session.clearStorageData({ storages: ["cookies"] })
        wv.reload()
      }
    } catch {}
    setShowSiteInfo(false)
  }

  const navigateTo = (raw: string) => {
    let url = raw.trim()
    if (!url) return
    if (!url.startsWith("http")) {
      if (/^(localhost|127\.0\.0\.1|::1|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/.test(url)) {
        url = `http://${url}`
      } else if (url.includes(".") && !url.includes(" ")) {
        url = `https://${url}`
      } else {
        url = `${ENGINES[engine()]}${encodeURIComponent(url)}`
      }
    }

    const tab = activeTab()
    const hist = tab.history.slice(0, tab.historyIndex + 1)
    hist.push(url)
    updateTab(tab.id, {
      url,
      title: url.split("/")[2] ?? url,
      isLoading: true,
      history: hist,
      historyIndex: hist.length - 1,
      canGoBack: true,
      canGoForward: false,
    })
    setUrlInput(url)

    if (webviews[tab.id]) {
      webviews[tab.id].src = url
    }
    setTimeout(renderContent, 10)
  }

  const createTab = () => {
    const id = Date.now()
    setTabs((prev) => [
      ...prev,
      { id, title: "New Tab", url: HOME, isLoading: false, canGoBack: false, canGoForward: false, history: [HOME], historyIndex: 0 },
    ])
    setActiveTabId(id)
    setTimeout(renderContent, 10)
  }

  const closeTab = (e: MouseEvent, id: number) => {
    e.stopPropagation()
    if (webviews[id]) {
      webviews[id].remove()
      delete webviews[id]
    }
    if (tabs().length === 1) {
      updateTab(id, { url: HOME, title: "New Tab", history: [HOME], historyIndex: 0 })
      setUrlInput("")
      setTimeout(renderContent, 10)
      return
    }
    const next = tabs().filter((t) => t.id !== id)
    setTabs(next)
    if (activeTabId() === id) setActiveTabId(next[next.length - 1].id)
    setTimeout(renderContent, 10)
  }

  const goBack = () => {
    const tab = activeTab()
    if (tab.historyIndex <= 0) {
      if (tab.url !== HOME) {
        updateTab(tab.id, { url: HOME, title: "New Tab", canGoBack: false, canGoForward: true })
        setUrlInput("")
        setTimeout(renderContent, 10)
      }
      return
    }
    const i = tab.historyIndex - 1
    const url = tab.history[i]
    updateTab(tab.id, {
      url,
      historyIndex: i,
      canGoBack: i > 0,
      canGoForward: true,
      title: url === HOME ? "New Tab" : url.split("/")[2] ?? "Page",
    })
    setUrlInput(url === HOME ? "" : url)
    const wv = webviews[tab.id]
    if (wv && url !== HOME) {
      wv.src = url
    } else {
      setTimeout(renderContent, 10)
    }
  }

  const goForward = () => {
    const tab = activeTab()
    if (tab.historyIndex >= tab.history.length - 1) return
    const i = tab.historyIndex + 1
    const url = tab.history[i]
    updateTab(tab.id, {
      url,
      historyIndex: i,
      canGoBack: true,
      canGoForward: i < tab.history.length - 1,
      title: url === HOME ? "New Tab" : url.split("/")[2] ?? "Page",
    })
    setUrlInput(url === HOME ? "" : url)
    const wv = webviews[tab.id]
    if (wv && url !== HOME) {
      wv.src = url
    } else {
      setTimeout(renderContent, 10)
    }
  }

  const openFullscreen = () => {
    const url = activeTab().url !== HOME ? activeTab().url : undefined
    window.api?.openBrowserFullscreen?.(url)
  }

  createEffect(() => {
    activeTabId()
    setTimeout(renderContent, 10)
  })

  const startResize = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = browserWidth()
    const onMouseMove = (ev: MouseEvent) => {
      if (ev.buttons !== 1) return
      const delta = startX - ev.clientX
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.6, startWidth + delta))
      setBrowserWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div class="flex flex-col h-full bg-background-base text-text-base select-none overflow-hidden relative">
      <div
        onMouseDown={startResize}
        class="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-base/40 active:bg-accent-base/60 transition z-10"
      />
      <div class="flex items-center gap-2 px-3 py-2 bg-surface-raised-base border-b border-border-weak-base shrink-0">
        <span class="text-accent-base font-bold text-sm">Spider Browser</span>
        <div class="flex-1" />
        <button
          onClick={openFullscreen}
          class="text-[10px] px-2 py-0.5 rounded bg-accent-base/20 text-accent-base hover:bg-accent-base/30 transition font-medium"
          title="Open fullscreen (Ctrl+Alt+B)"
        >
          Fullscreen
        </button>
        <IconButton onClick={props.onClose} variant="ghost" size="small">
          <Icon name="close" />
        </IconButton>
      </div>

      <div class="flex items-center bg-surface-raised-base border-b border-border-weak-base shrink-0">
        <div class="flex-1 flex items-end gap-0.5 overflow-x-auto h-9 px-2 pt-1">
          <For each={tabs()}>
            {(tab) => (
              <div
                onClick={() => {
                  setActiveTabId(tab.id)
                  setUrlInput(tab.url === HOME ? "" : tab.url)
                  setTimeout(renderContent, 10)
                }}
                class={`group relative flex items-center gap-1.5 px-2.5 py-1 min-w-[80px] max-w-[140px] text-[11px] cursor-pointer rounded-t-md transition-all ${
                  activeTabId() === tab.id
                    ? "bg-background-base text-text-strong border-x border-t border-border-weak-base"
                    : "text-text-weak hover:bg-surface-hover-base"
                }`}
              >
                <span class="truncate flex-1">{tab.title}</span>
                <button onClick={(e) => closeTab(e, tab.id)} class="p-0.5 rounded hover:bg-surface-hover-base opacity-0 group-hover:opacity-100 transition text-text-weak text-[9px]">
                  ✕
                </button>
              </div>
            )}
          </For>
          <button onClick={createTab} class="mb-1 p-1 rounded-md hover:bg-surface-hover-base text-text-weak text-xs">
            +
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 bg-surface-raised-base px-2 py-1.5 border-b border-border-weak-base shrink-0">
        <button disabled={!activeTab().canGoBack} onClick={goBack} class="p-1.5 rounded-md hover:bg-surface-hover-base disabled:opacity-25 transition text-sm">
          ←
        </button>
        <button disabled={!activeTab().canGoForward} onClick={goForward} class="p-1.5 rounded-md hover:bg-surface-hover-base disabled:opacity-25 transition text-sm">
          →
        </button>
        <button
          onClick={() => {
            const tab = activeTab()
            if (tab.url === HOME) return
            const wv = webviews[tab.id]
            if (wv) wv.reload()
          }}
          class="p-1.5 rounded-md hover:bg-surface-hover-base transition text-sm"
          title="Reload (F5)"
        >
          ↻
        </button>
        <div class="flex-1 relative">
          <div class="flex items-center bg-background-base border border-border-weak-base rounded-md focus-within:border-accent-base transition">
            <button
              onClick={() => activeTab().url !== HOME && setShowSiteInfo(!showSiteInfo())}
              class={`px-2 py-1 text-xs transition ${siteSecure() ? "text-accent-base" : "text-text-weak"}`}
              title={siteSecure() ? "Connection is secure" : "Connection is not secure"}
            >
              {activeTab().url === HOME ? "" : siteSecure() ? "🔒" : "⚠️"}
            </button>
            <input
              type="text"
              value={urlInput()}
              onInput={(e) => setUrlInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value
                  setUrlInput(val)
                  navigateTo(val)
                }
              }}
              class="flex-1 bg-transparent py-1 pr-2 text-xs focus:outline-none font-mono"
              placeholder="Search or enter URL..."
            />
          </div>
          <Show when={showSiteInfo() && activeTab().url !== HOME}>
            <div class="absolute top-full left-0 mt-1 bg-surface-raised-base border border-border-weak-base rounded-lg shadow-lg z-50 w-72 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-text-strong">{getDomain()}</span>
                <button onClick={() => setShowSiteInfo(false)} class="text-text-weak hover:text-text-base text-xs">✕</button>
              </div>
              <div class="flex items-center gap-2 mb-3">
                <span class={siteSecure() ? "text-accent-base" : "text-yellow-500"}>{siteSecure() ? "🔒" : "⚠️"}</span>
                <span class="text-[11px] text-text-weak">
                  {siteSecure() ? "Connection is secure (HTTPS)" : "Connection is not secure (HTTP)"}
                </span>
              </div>
              <div class="border-t border-border-weak-base pt-2">
                <button
                  onClick={clearCookies}
                  class="w-full text-left text-[11px] text-text-weak hover:text-red-400 transition py-1"
                >
                  Clear cookies for this site
                </button>
              </div>
            </div>
          </Show>
        </div>
        <select
          value={engine()}
          onChange={(e) => setEngine(e.currentTarget.value as keyof typeof ENGINES)}
          class="bg-surface-hover-base border-none text-[10px] rounded px-1.5 py-0.5 outline-none text-accent-base font-bold uppercase"
        >
          <option value="google">Google</option>
          <option value="bing">Bing</option>
          <option value="duck">Duck</option>
        </select>
        <button
          onClick={toggleAdBlocker}
          class={`p-1.5 rounded-md transition text-sm ${adBlockerOn() ? "text-accent-base bg-accent-base/20" : "text-text-weak opacity-50"}`}
          title={adBlockerOn() ? "Ad Blocker: ON (click to disable)" : "Ad Blocker: OFF (click to enable)"}
        >
          🛡️
        </button>
        <button
          onClick={googleSignIn}
          class="p-1.5 rounded-md hover:bg-surface-hover-base transition text-sm"
          title="Sign in with Google (opens system browser)"
        >
          🔑
        </button>
        <button
          onClick={clearCookies}
          class="p-1.5 rounded-md hover:bg-surface-hover-base transition text-sm text-text-weak"
          title="Clear all browser cookies"
        >
          🧹
        </button>
      </div>

      <div class="flex items-center gap-1 px-2 py-1 bg-surface-raised-base/50 border-b border-border-weak-base shrink-0 overflow-x-auto">
        <For each={BOOKMARKS}>
          {(b) => (
            <button
              onClick={() => navigateTo(b.url)}
              class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-text-weak hover:bg-surface-hover-base hover:text-text-base transition whitespace-nowrap"
            >
              🌐 {b.name}
            </button>
          )}
        </For>
      </div>

      <div ref={contentRef} class="flex-1 relative overflow-hidden">
        <style>{`
          .loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10; overflow: hidden; }
          .loading-bar .bar { height: 100%; background: var(--surface-brand-base); animation: load 1.5s ease-out infinite; transform-origin: left; }
          @keyframes load { 0% { transform: translateX(-100%) scaleX(0); } 50% { transform: translateX(-20%) scaleX(0.5); } 100% { transform: translateX(0%) scaleX(1); } }
        `}</style>
        <div ref={homePageRef} class="flex flex-col items-center justify-center h-full p-8">
          <div class="text-3xl font-bold text-text-strong mb-2">Spider Browser</div>
          <div class="text-xs text-text-weak mb-6">Search the web or enter a URL</div>
          <div class="grid grid-cols-4 gap-3 w-full max-w-sm">
            <For each={BOOKMARKS}>
              {(b) => (
                <button
                  onClick={() => navigateTo(b.url)}
                  class="flex flex-col items-center p-3 bg-surface-raised-base rounded-xl border border-border-weak-base hover:border-accent-base transition group"
                >
                  <div class="text-xl mb-1.5 group-hover:scale-110 transition">🌐</div>
                  <span class="text-[10px] font-bold text-text-weak group-hover:text-text-base truncate w-full text-center">{b.name}</span>
                </button>
              )}
            </For>
          </div>
          <div class="mt-4 text-[10px] text-text-weak text-center max-w-xs leading-relaxed">
            Click 🔑 to sign in with Google — opens in system browser
          </div>
          <button
            onClick={openFullscreen}
            class="mt-4 text-xs text-accent-base hover:underline"
          >
            Open in fullscreen browser →
          </button>
        </div>
      </div>
      <Show when={toast()}>
        <div class="fixed bottom-5 left-1/2 -translate-x-1/2 bg-accent-base text-background-base px-4 py-2 rounded-lg text-xs font-semibold z-50 shadow-lg animate-[fadeIn_0.2s_ease]">
          {toast()}
        </div>
      </Show>
    </div>
  )
}
