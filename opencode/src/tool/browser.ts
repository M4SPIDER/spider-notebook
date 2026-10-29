import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./browser.txt"

const BRIDGE_URL = "http://127.0.0.1:4098"

async function callBridge(cmd: Record<string, unknown>): Promise<any> {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Browser bridge error ${res.status}: ${text}`)
  }
  return res.json()
}

export const Parameters = Schema.Struct({
  action: Schema.Literals([
    "navigate", "screenshot", "click", "type", "scroll",
    "text", "back", "forward", "snapshot", "press",
  ]).annotate({
    description: "The browser action to perform",
  }),
  url: Schema.optional(Schema.String).annotate({
    description: "URL to navigate to (required for 'navigate' action)",
  }),
  selector: Schema.optional(Schema.String).annotate({
    description: "CSS selector for click/type actions (e.g. 'button.submit', '#search')",
  }),
  text: Schema.optional(Schema.String).annotate({
    description: "Text to type (required for 'type' action)",
  }),
  direction: Schema.optional(Schema.Literals(["up", "down", "top", "bottom"])).annotate({
    description: "Scroll direction (for 'scroll' action). Defaults to 'down'.",
  }),
})

type Metadata = Record<string, unknown>

export const BrowserTool = Tool.define(
  "browser",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params, ctx) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "browser",
            patterns: [params.url ?? "*"],
            always: ["*"],
            metadata: {
              action: params.action,
              url: params.url,
              selector: params.selector,
            },
          })

          const cmd: Record<string, unknown> = { action: params.action }
          if (params.url) cmd.url = params.url
          if (params.selector) cmd.selector = params.selector
          if (params.text) cmd.text = params.text
          if (params.direction) cmd.direction = params.direction

          const result = yield* Effect.tryPromise({
            try: () => callBridge(cmd),
            catch: (e) => new Error(`Browser error: ${String(e)}. Make sure Chrome panel is open (Ctrl+Shift+B).`),
          })

          switch (params.action) {
            case "navigate": {
              const attachments: any[] = []
              if (result.screenshot) {
                attachments.push({
                  type: "file" as const,
                  mime: "image/png",
                  url: result.screenshot.startsWith("data:") ? result.screenshot : `data:image/png;base64,${result.screenshot}`,
                })
              }
              return {
                title: `Navigated to: ${result.title || params.url}`,
                output: `Page: ${result.title}\nURL: ${result.url}\n\n${(result.text ?? "").slice(0, 15000)}`,
                metadata: {},
                ...(attachments.length ? { attachments } : {}),
              }
            }

            case "screenshot": {
              return {
                title: `Screenshot: ${result.title || result.url}`,
                output: `Screenshot of ${result.url} (${result.title})`,
                metadata: {},
                attachments: [
                  {
                    type: "file" as const,
                    mime: "image/png",
                    url: result.screenshot?.startsWith("data:") ? result.screenshot : `data:image/png;base64,${result.screenshot ?? ""}`,
                  },
                ],
              }
            }

            case "text": {
              return {
                title: `Text: ${result.title || result.url}`,
                output: (result.text ?? "").slice(0, 20000),
                metadata: {},
              }
            }

            case "click": {
              return {
                title: `Clicked: ${params.selector}`,
                output: `Clicked '${params.selector}' on ${result.url}`,
                metadata: {},
              }
            }

            case "type": {
              return {
                title: `Typed into: ${params.selector}`,
                output: `Typed '${params.text}' into '${params.selector}' on ${result.url}`,
                metadata: {},
              }
            }

            case "scroll": {
              return {
                title: `Scrolled: ${params.direction ?? "down"}`,
                output: `Scrolled ${params.direction ?? "down"} on ${result.url}`,
                metadata: {},
              }
            }

            case "back": {
              return {
                title: `Back: ${result.title || result.url}`,
                output: `Navigated back to ${result.url}\nPage title: ${result.title}`,
                metadata: {},
              }
            }

            case "forward": {
              return {
                title: `Forward: ${result.title || result.url}`,
                output: `Navigated forward to ${result.url}\nPage title: ${result.title}`,
                metadata: {},
              }
            }

            case "snapshot": {
              return {
                title: `Snapshot: ${result.title || result.url}`,
                output: result.text ?? "",
                metadata: {},
              }
            }

            case "press": {
              return {
                title: `Pressed: ${params.text || "Enter"}`,
                output: `Pressed key on ${result.url}`,
                metadata: {},
              }
            }

            default:
              throw new Error(`Unknown action: ${params.action}`)
          }
        }).pipe(Effect.orDie),
    }
  }),
)
