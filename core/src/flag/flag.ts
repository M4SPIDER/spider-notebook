import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["M4SPIDER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["M4SPIDER_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("M4SPIDER_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  M4SPIDER_AUTO_HEAP_SNAPSHOT: truthy("M4SPIDER_AUTO_HEAP_SNAPSHOT"),
  M4SPIDER_GIT_BASH_PATH: process.env["M4SPIDER_GIT_BASH_PATH"],
  M4SPIDER_CONFIG: process.env["M4SPIDER_CONFIG"],
  M4SPIDER_CONFIG_CONTENT: process.env["M4SPIDER_CONFIG_CONTENT"],
  M4SPIDER_DISABLE_AUTOUPDATE: truthy("M4SPIDER_DISABLE_AUTOUPDATE"),
  M4SPIDER_ALWAYS_NOTIFY_UPDATE: truthy("M4SPIDER_ALWAYS_NOTIFY_UPDATE"),
  M4SPIDER_DISABLE_PRUNE: truthy("M4SPIDER_DISABLE_PRUNE"),
  M4SPIDER_DISABLE_TERMINAL_TITLE: truthy("M4SPIDER_DISABLE_TERMINAL_TITLE"),
  M4SPIDER_SHOW_TTFD: truthy("M4SPIDER_SHOW_TTFD"),
  M4SPIDER_DISABLE_AUTOCOMPACT: truthy("M4SPIDER_DISABLE_AUTOCOMPACT"),
  M4SPIDER_DISABLE_MODELS_FETCH: truthy("M4SPIDER_DISABLE_MODELS_FETCH"),
  M4SPIDER_DISABLE_MOUSE: truthy("M4SPIDER_DISABLE_MOUSE"),
  M4SPIDER_FAKE_VCS: process.env["M4SPIDER_FAKE_VCS"],
  M4SPIDER_SERVER_PASSWORD: process.env["M4SPIDER_SERVER_PASSWORD"],
  M4SPIDER_SERVER_USERNAME: process.env["M4SPIDER_SERVER_USERNAME"],
  M4SPIDER_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("M4SPIDER_DISABLE_FFF"),

  // Experimental
  M4SPIDER_EXPERIMENTAL_FILEWATCHER: Config.boolean("M4SPIDER_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  M4SPIDER_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("M4SPIDER_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  M4SPIDER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("M4SPIDER_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  M4SPIDER_MODELS_URL: process.env["M4SPIDER_MODELS_URL"],
  M4SPIDER_MODELS_PATH: process.env["M4SPIDER_MODELS_PATH"],
  M4SPIDER_DB: process.env["M4SPIDER_DB"],

  M4SPIDER_WORKSPACE_ID: process.env["M4SPIDER_WORKSPACE_ID"],
  M4SPIDER_EXPERIMENTAL_WORKSPACES: enabledByExperimental("M4SPIDER_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get M4SPIDER_DISABLE_PROJECT_CONFIG() {
    return truthy("M4SPIDER_DISABLE_PROJECT_CONFIG")
  },
  get M4SPIDER_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("M4SPIDER_EXPERIMENTAL_REFERENCES")
  },
  get M4SPIDER_TUI_CONFIG() {
    return process.env["M4SPIDER_TUI_CONFIG"]
  },
  get M4SPIDER_CONFIG_DIR() {
    return process.env["M4SPIDER_CONFIG_DIR"]
  },
  get M4SPIDER_PURE() {
    return truthy("M4SPIDER_PURE")
  },
  get M4SPIDER_PERMISSION() {
    return process.env["M4SPIDER_PERMISSION"]
  },
  get M4SPIDER_PLUGIN_META_FILE() {
    return process.env["M4SPIDER_PLUGIN_META_FILE"]
  },
  get M4SPIDER_CLIENT() {
    return process.env["M4SPIDER_CLIENT"] ?? "cli"
  },
}
