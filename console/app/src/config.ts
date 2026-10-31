/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://m4spider.com",

  // GitHub
  github: {
    repoUrl: "https://github.com/anomalyco/m4spider",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/m4spider",
    discord: "https://discord.gg/m4spider",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
