declare global {
  const OPENCODE_VERSION: string
  const M4SPIDER_CHANNEL: string
}

export const InstallationVersion = typeof OPENCODE_VERSION === "string" ? OPENCODE_VERSION : "local"
export const InstallationChannel = typeof M4SPIDER_CHANNEL === "string" ? M4SPIDER_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
