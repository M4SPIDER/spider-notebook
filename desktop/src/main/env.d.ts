interface ImportMetaEnv {
  readonly M4SPIDER_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:m4spider-server" {
  export namespace Server {
    export const listen: typeof import("../../../m4spider/dist/types/src/node").Server.listen
    export type Listener = import("../../../m4spider/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../m4spider/dist/types/src/node").Config.get
    export type Info = import("../../../m4spider/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../m4spider/dist/types/src/node").bootstrap
}
