import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __M4SPIDER__?: {
      deepLinks?: string[]
    }
  }
}
