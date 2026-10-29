export type ConfigInvalidError = {
  name: "ConfigInvalidError"
  data: {
    path?: string
    message?: string
    issues?: Array<{ message: string; path: string[] }>
  }
}

export type ProviderModelNotFoundError = {
  name: "ProviderModelNotFoundError"
  data: {
    providerID: string
    modelID: string
    suggestions?: string[]
  }
}

type Translator = (key: string, vars?: Record<string, string | number>) => string

function tr(translator: Translator | undefined, key: string, text: string, vars?: Record<string, string | number>) {
  if (!translator) return text
  const out = translator(key, vars)
  if (!out || out === key) return text
  return out
}

export function formatServerError(error: unknown, translate?: Translator, fallback?: string) {
  const unwrapped = unwrapNamedError(error)
  if (isConfigInvalidErrorLike(unwrapped)) return parseReadableConfigInvalidError(unwrapped, translate)
  if (isProviderModelNotFoundErrorLike(unwrapped)) return parseReadableProviderModelNotFoundError(unwrapped, translate)
  const named = parseReadableNamedMessage(unwrapped)
  if (named) return named
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  if (fallback) return fallback
  return tr(translate, "error.chain.unknown", "Unknown error")
}

function unwrapNamedError(error: unknown): unknown {
  if (error instanceof Error && isRecord(error.cause) && "body" in error.cause) {
    return error.cause.body
  }
  return error
}

function parseReadableNamedMessage(error: unknown) {
  if (!isRecord(error)) return
  if (typeof error.name !== "string") return
  const data = isRecord(error.data) ? error.data : undefined
  const responseBody = typeof data?.responseBody === "string" ? parseProviderMessage(data.responseBody) : undefined
  const message = typeof data?.message === "string" ? parseProviderMessage(data.message) : undefined
  return responseBody ?? message
}

function parseProviderMessage(message: string) {
  const text = message.replace(/^Error:\s*/, "").trim()
  const parsed = parseEmbeddedJson(text)
  if (!parsed) return text

  const error = isRecord(parsed.error) ? parsed.error : undefined
  if (error) {
    const type = typeof error.type === "string" ? error.type : undefined
    const msg = typeof error.message === "string" ? error.message : undefined
    if (type && msg) return `${type}: ${msg}`
    if (msg) return msg
    if (type) return type
    const code = typeof error.code === "string" ? error.code : undefined
    if (code) return code
  }

  const msg = typeof parsed.message === "string" ? parsed.message : undefined
  if (msg) return msg

  const reason = typeof parsed.error === "string" ? parsed.error : undefined
  if (reason) return reason

  return text
}

function parseEmbeddedJson(text: string) {
  const direct = parseJson(text)
  if (direct) return direct

  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end <= start) return
  return parseJson(text.slice(start, end + 1))
}

function parseJson(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(text) as unknown
    if (typeof parsed === "string") return parseJson(parsed.trim())
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function isConfigInvalidErrorLike(error: unknown): error is ConfigInvalidError {
  if (!isRecord(error)) return false
  return error.name === "ConfigInvalidError" && isRecord(error.data)
}

function isProviderModelNotFoundErrorLike(error: unknown): error is ProviderModelNotFoundError {
  if (!isRecord(error)) return false
  return error.name === "ProviderModelNotFoundError" && isRecord(error.data)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function parseReadableConfigInvalidError(errorInput: ConfigInvalidError, translator?: Translator) {
  const file = errorInput.data.path && errorInput.data.path !== "config" ? errorInput.data.path : "config"
  const detail = errorInput.data.message?.trim() ?? ""
  const issues = (errorInput.data.issues ?? [])
    .map((issue) => {
      const msg = issue.message.trim()
      if (!issue.path.length) return msg
      return `${issue.path.join(".")}: ${msg}`
    })
    .filter(Boolean)
  const msg = issues.length ? issues.join("\n") : detail
  if (!msg) return tr(translator, "error.chain.configInvalid", `Config file at ${file} is invalid`, { path: file })
  return tr(translator, "error.chain.configInvalidWithMessage", `Config file at ${file} is invalid: ${msg}`, {
    path: file,
    message: msg,
  })
}

function parseReadableProviderModelNotFoundError(errorInput: ProviderModelNotFoundError, translator?: Translator) {
  const p = errorInput.data.providerID.trim()
  const m = errorInput.data.modelID.trim()
  const list = (errorInput.data.suggestions ?? []).map((v) => v.trim()).filter(Boolean)
  const body = tr(translator, "error.chain.modelNotFound", `Model not found: ${p}/${m}`, { provider: p, model: m })
  const tail = tr(translator, "error.chain.checkConfig", "Check your config (opencode.json) provider/model names")
  if (list.length) {
    const suggestions = list.slice(0, 5).join(", ")
    return [body, tr(translator, "error.chain.didYouMean", `Did you mean: ${suggestions}`, { suggestions }), tail].join(
      "\n",
    )
  }
  return [body, tail].join("\n")
}
