import { createSignal } from "solid-js"

const [browserOpen, setBrowserOpen] = createSignal(false)
const [pendingUrl, setPendingUrl] = createSignal<string | null>(null)
const [browserWidth, setBrowserWidth] = createSignal(500)

export function toggleBrowser() {
  setBrowserOpen((prev) => !prev)
}

export function openBrowser() {
  setBrowserOpen(true)
}

export function openBrowserWithUrl(url: string) {
  setPendingUrl(url)
  setBrowserOpen(true)
}

export function consumePendingUrl(): string | null {
  const url = pendingUrl()
  if (url) setPendingUrl(null)
  return url
}

export function closeBrowser() {
  setBrowserOpen(false)
}

export { browserOpen, pendingUrl, browserWidth, setBrowserWidth }
