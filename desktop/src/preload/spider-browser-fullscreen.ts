import { contextBridge, ipcRenderer } from "electron"

const themeCallbacks = new Set<(colors: Record<string, string>) => void>()
let themeHandler: ((_: unknown, colors: Record<string, string>) => void) | undefined

const api = {
  adBlocker: {
    getEnabled: () => ipcRenderer.invoke("adblocker-get-enabled"),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke("adblocker-set-enabled", enabled),
  },
  googleLogin: {
    sync: () => ipcRenderer.invoke("google-login-sync"),
  },
  getThemeColors: () => ipcRenderer.invoke("get-theme-colors"),
  setThemeId: (themeId: string) => ipcRenderer.invoke("set-theme-id", themeId),
  onThemeChanged: (callback: (colors: Record<string, string>) => void) => {
    themeCallbacks.add(callback)
    if (!themeHandler) {
      themeHandler = (_: unknown, colors: Record<string, string>) => {
        themeCallbacks.forEach((cb) => cb(colors))
      }
      ipcRenderer.on("theme-changed", themeHandler)
    }
    return () => {
      themeCallbacks.delete(callback)
      if (themeCallbacks.size === 0 && themeHandler) {
        ipcRenderer.removeListener("theme-changed", themeHandler)
        themeHandler = undefined
      }
    }
  },
}

contextBridge.exposeInMainWorld("api", api)
