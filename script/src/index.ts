import { $ } from "bun"
import semver from "semver"
import path from "path"

const rootPkgPath = path.resolve(import.meta.dir, "../../../package.json")
const repoRoot = path.dirname(rootPkgPath)
const rootPkg = await Bun.file(rootPkgPath).json()
const expectedBunVersion = rootPkg.packageManager?.split("@")[1]

if (!expectedBunVersion) {
  throw new Error("packageManager field not found in root package.json")
}

// relax version requirement
const expectedBunVersionRange = `^${expectedBunVersion}`

if (!semver.satisfies(process.versions.bun, expectedBunVersionRange)) {
  throw new Error(`This script requires bun@${expectedBunVersionRange}, but you are using bun@${process.versions.bun}`)
}

const env = {
  M4SPIDER_CHANNEL: process.env["M4SPIDER_CHANNEL"],
  M4SPIDER_BUMP: process.env["M4SPIDER_BUMP"],
  M4SPIDER_VERSION: process.env["M4SPIDER_VERSION"],
  M4SPIDER_RELEASE: process.env["M4SPIDER_RELEASE"],
}
const CHANNEL = await (async () => {
  if (env.M4SPIDER_CHANNEL) return env.M4SPIDER_CHANNEL
  if (env.M4SPIDER_BUMP) return "latest"
  if (env.M4SPIDER_VERSION && !env.M4SPIDER_VERSION.startsWith("0.0.0-")) return "latest"
  const branch = await $`git -C ${repoRoot} branch --show-current`
    .text()
    .then((x) => x.trim())
    .catch(() => "")
  return branch || "dev"
})()
const IS_PREVIEW = CHANNEL !== "latest"

const VERSION = await (async () => {
  if (env.M4SPIDER_VERSION) return env.M4SPIDER_VERSION
  if (IS_PREVIEW) return `0.0.0-${CHANNEL}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`
  const version = await fetch("https://registry.npmjs.org/m4spider-ai/latest")
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then((data: any) => data.version)
  const [major, minor, patch] = version.split(".").map((x: string) => Number(x) || 0)
  const t = env.M4SPIDER_BUMP?.toLowerCase()
  if (t === "major") return `${major + 1}.0.0`
  if (t === "minor") return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
})()

const bot = ["actions-user", "m4spider", "m4spider-agent[bot]"]
const teamPath = path.resolve(import.meta.dir, "../../../.github/TEAM_MEMBERS")
const team = [
  ...(await Bun.file(teamPath)
    .text()
    .then((x) => x.split(/\r?\n/).map((x) => x.trim()))
    .then((x) => x.filter((x) => x && !x.startsWith("#")))),
  ...bot,
]

export const Script = {
  get channel() {
    return CHANNEL
  },
  get version() {
    return VERSION
  },
  get preview() {
    return IS_PREVIEW
  },
  get release(): boolean {
    return !!env.M4SPIDER_RELEASE
  },
  get team() {
    return team
  },
}
console.log(`m4spider script`, JSON.stringify(Script, null, 2))
