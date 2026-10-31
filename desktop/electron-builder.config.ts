import { execFile } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const packageDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(packageDir, "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")
// The Electron 42 packaging update briefly installed Linux launchers/icons under
// "opencode-desktop". Keep that hidden desktop entry around so existing GNOME/KDE
// pins still resolve after the canonical app id changes to ai.m4spider.desktop.
const legacyDesktopEntry = path.join(packageDir, "resources", "linux", "opencode-desktop.desktop")
const legacyDesktopEntryFpm = `${legacyDesktopEntry}=/usr/share/applications/opencode-desktop.desktop`

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

const channel = (() => {
  const raw = process.env.M4SPIDER_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const APP_IDS = {
  dev: "ai.m4spider.desktop.dev",
  beta: "ai.m4spider.desktop.beta",
  prod: "ai.m4spider.desktop",
} as const

const getBase = (appId: string): Configuration => ({
  artifactName: "m4spider-notebook-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  // Linux launchers are .desktop files, so this is the desktop file name,
  // not just the app id. For prod, app id "ai.m4spider.desktop" becomes
  // "ai.m4spider.desktop.desktop".
  // https://developer.gnome.org/documentation/guidelines/maintainer/integrating.html
  // https://www.electron.build/docs/linux/
  extraMetadata: {
    desktopName: `${appId}.desktop`,
  },
  files: ["out/**/*", "resources/**/*", "spider-browser.html", "spider-browser-fullscreen.html"],
  extraResources: [
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
    {
      from: "spider-browser.html",
      to: "spider-browser.html",
    },
    {
      from: "spider-browser-fullscreen.html",
      to: "spider-browser-fullscreen.html",
    },
    {
      from: "resources/icons",
      to: "icons",
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signtoolOptions: {
      sign: signWindows,
    },
    target: ["nsis", "appx"],
    verifyUpdateCodeSignature: false,
  },
  appx: {
    identityName: "M4Spider.M4Spidernotebook",
    publisher: "CN=28E6B732-ABC5-4E63-80F8-8293EBEF56C2",
    applicationId: "M4Spidernotebook",
    displayName: "M4 Spider Notebook",
    publisherDisplayName: "M4 Spider",
    languages: ["en-US"],
    addAutoLaunchExtension: false,
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    uninstallDisplayName: "${productName}",
    allowElevation: true,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    executableName: appId,
    desktop: {
      entry: {
        // Match the installed .desktop file and hicolor icon basename so
        // Linux shells can associate the running Electron window with its launcher.
        StartupWMClass: appId,
      },
    },
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const appId = APP_IDS[channel]
  const base = getBase(appId)

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId,
        productName: "M4 Spider Notebook",
        protocols: { name: "M4 Spider Notebook", schemes: ["m4spider-dev"] },
        rpm: { packageName: "m4spider-dev" },
        nsis: { ...base.nsis, guid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567801" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId,
        productName: "M4 Spider Notebook",
        protocols: { name: "M4 Spider Notebook", schemes: ["m4spider-beta"] },
        publish: { provider: "github", owner: "M4SPIDER", repo: "spider-notebook", channel: "latest" },
        rpm: { packageName: "m4spider-beta" },
        nsis: { ...base.nsis, guid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567802" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId,
        productName: "M4 Spider Notebook",
        protocols: { name: "M4 Spider Notebook", schemes: ["m4spider"] },
        publish: { provider: "github", owner: "M4SPIDER", repo: "spider-notebook", channel: "latest" },
        deb: { fpm: [legacyDesktopEntryFpm] },
        rpm: { packageName: "m4spider", fpm: [legacyDesktopEntryFpm] },
        nsis: { ...base.nsis, guid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567803" },
      }
    }
  }
}

export default getConfig()
