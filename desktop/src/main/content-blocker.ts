// Built-in ad/tracker blocker — Brave-like free privacy
// Covers: ads, trackers, analytics, cryptominers, fingerprinters

let adBlockerEnabled = true

export function isAdBlockerEnabled(): boolean {
  return adBlockerEnabled
}

export function setAdBlockerEnabled(enabled: boolean) {
  adBlockerEnabled = enabled
}

const AD_DOMAINS = new Set([
  "doubleclick.net", "googlesyndication.com", "googleadservices.com", "google-analytics.com",
  "adnxs.com", "adsrvr.org", "advertising.com", "casalemedia.com", "demdex.net",
  "moatads.com", "quantserve.com", "scorecardresearch.com", "bluekai.com",
  "rubiconproject.com", "pubmatic.com", "openx.net", "serving-sys.com",
  "eyeota.net", "bidswitch.net", "sharethrough.com", "teads.tv",
  "outbrain.com", "taboola.com", "revcontent.com", "mgid.com",
  "criteo.com", "criteo.net", "media.net", "chitika.com",
  "amazon-adsystem.com", "aps.amazon.com",
  "vortex-win.nvidia.com", "moat.com",
])

const TRACKER_DOMAINS = new Set([
  "google-analytics.com", "googletagmanager.com", "hotjar.com", "mixpanel.com",
  "amplitude.com", "segment.com", "segment.io", "heap.io", "fullstory.com",
  "mouseflow.com", "luckyorange.com", "clicky.com", "piwik.pro",
  "matomo.org", "plausible.io", "fathom.analytics",
  "facebook.com", "facebook.net", "connect.facebook.net",
  "platform.twitter.com", "analytics.twitter.com",
  "linkedin.com", "snap.licdn.com",
  "pixel.pinterest.com", "analytics.tiktok.com",
  "fingerprint.com", "fpjs.io", "arkoselabs.com",
  "coinhive.com", "coin-hive.com", "jsecoin.com", "authedmine.com",
  "cryptoloot.pro", "crypto-loot.com", "webminepool.com",
])

const PATH_BLOCK_PATTERNS = [
  /\/ads?\//i, /\/advert/i, /\/banner\//i, /\/popup\//i,
  /\/track(?:er|ing)?\//i, /\/pixel\//i, /\/beacon\//i,
  /\/analytics/i, /\/metrics/i,
  /\.gif\?/i,
]

export function shouldBlockRequest(url: string): boolean {
  if (!adBlockerEnabled) return false

  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return false
  }

  for (const domain of AD_DOMAINS) {
    if (host === domain || host.endsWith("." + domain)) return true
  }

  for (const domain of TRACKER_DOMAINS) {
    if (host === domain || host.endsWith("." + domain)) return true
  }

  for (const pattern of PATH_BLOCK_PATTERNS) {
    if (pattern.test(url)) return true
  }

  return false
}

export function shouldUpgradeToHttps(url: string): string | null {
  if (!adBlockerEnabled) return null
  if (url.startsWith("http://")) {
    const host = url.slice(7).split("/")[0].split(":")[0]
    if (/^(localhost|127\.\d+\.\d+\.\d+|::1|0\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/i.test(host)) {
      return null
    }
    return "https://" + url.slice(7)
  }
  return null
}

export function getUserAgent(): string {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
}
