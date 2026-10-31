declare global {
  const M4SPIDER_VERSION: string
  const M4SPIDER_CHANNEL: string
}

export const InstallationVersion = typeof M4SPIDER_VERSION === "string" ? M4SPIDER_VERSION : "local"
export const InstallationChannel = typeof M4SPIDER_CHANNEL === "string" ? M4SPIDER_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
