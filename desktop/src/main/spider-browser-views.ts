import type { BrowserWindow } from "electron"

// Stub — Spider Browser uses <webview> elements in its own HTML,
// not Electron BrowserView/WebContentsView. These IPC handlers are
// retained for backwards compat with preload code but are no-ops.

let _parentWindow: BrowserWindow | null = null

export function setParentWindow(win: BrowserWindow) {
  _parentWindow = win
}

export function createView(_tabId: number, _url: string) {}
export function showView(_tabId: number) {}
export function hideAllViews() {}
export function destroyView(_tabId: number) {}
export function navigateView(_tabId: number, _url: string) {}
export function goBack(_tabId: number) {}
export function goForward(_tabId: number) {}
export function reloadView(_tabId: number) {}
export function canGoBack(_tabId: number): boolean { return false }
export function canGoForward(_tabId: number): boolean { return false }
export function setBounds(_bounds: { x: number; y: number; width: number; height: number }) {}
export function getCurrentTabId(): number { return 0 }
