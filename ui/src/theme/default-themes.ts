import type { DesktopTheme } from "./types"
import darkAmoledThemeJson from "./themes/dark-amoled.json"
import m4spiderThemeJson from "./themes/m4spider.json"
import pureWhiteThemeJson from "./themes/pure-white.json"

export const darkAmoledTheme = darkAmoledThemeJson as DesktopTheme
export const m4spiderTheme = m4spiderThemeJson as DesktopTheme
export const pureWhiteTheme = pureWhiteThemeJson as DesktopTheme

export const DEFAULT_THEMES: Record<string, DesktopTheme> = {
  "dark-amoled": darkAmoledTheme,
  m4spider: m4spiderTheme,
  "pure-white": pureWhiteTheme,
}
