export function isChinaOrLegacyBlocked(id: string): boolean {
  if (!id) return true
  const lower = id.toLowerCase().trim()
  if (lower === "m4spider" || lower.startsWith("m4spider")) {
    return false
  }
  if (lower === "m4spider" || lower.startsWith("m4spider")) return false
  if (lower === "opencode" || lower.startsWith("opencode-") || lower.includes("opencode")) return true
  const chinaTerms = [
    "deepseek",
    "minimax",
    "moonshot",
    "kimi",
    "zhipu",
    "chatglm",
    "alibaba",
    "qwen",
    "dashscope",
    "aliyun",
    "modelscope",
    "stepfun",
    "siliconflow",
    "volcengine",
    "doubao",
    "bytedance",
    "tencent",
    "hunyuan",
    "sensenova",
    "sensetime",
    "xiaomi",
    "baichuan",
    "baidu",
    "ernie",
    "01-ai",
    "lingyi",
    "302ai",
    "jiekou",
    "vivgrid",
    "meganova",
    "qiniu",
    "qihang",
    "meituan",
    "kuae",
    "zai",
  ]
  if (lower.endsWith("-cn") || lower.includes("-cn-") || lower.includes(".cn") || lower.startsWith("cn-")) {
    return true
  }
  return chinaTerms.some((term) => lower.includes(term))
}

import { useServerSync } from "@/context/server-sync"
import { decode64 } from "@/utils/base64"
import { useParams } from "@solidjs/router"
import { Iterable, pipe } from "effect"
import { createMemo } from "solid-js"

// Providers shown in the desktop UI "popular" section.
export const popularProviders = [
  "m4spider",
  "anthropic",
  "github-copilot",
  "openai",
  "google",
  "openrouter",
  "ollama",
  "vercel",
]
const popularProviderSet = new Set(popularProviders)

export function useProviders() {
  const serverSync = useServerSync()
  const params = useParams()
  const dir = createMemo(() => decode64(params.dir) ?? "")
  const providers = () => {
    if (dir()) {
      const [projectStore] = serverSync.child(dir())
      if (projectStore.provider_ready) return projectStore.provider
    }
    return serverSync.data.provider
  }
  return {
    all: () => {
      const raw = providers().all
      const filtered = new Map()
      for (const [key, value] of raw.entries()) {
        if (!isChinaOrLegacyBlocked(key)) {
          filtered.set(key, value)
        }
      }
      return filtered
    },
    default: () => {
      const def = { ...providers().default }
      for (const key of Object.keys(def)) {
        if (isChinaOrLegacyBlocked(key)) {
          delete def[key]
        }
      }
      return def
    },
    popular: () =>
      pipe(
        providers().all,
        Iterable.filter(([id]) => !isChinaOrLegacyBlocked(id) && popularProviderSet.has(id)),
        Iterable.map(([, p]) => p),
        (v) => Array.from(v),
      ),
    connected: () => {
      const connected = new Set(providers().connected.filter((id) => !isChinaOrLegacyBlocked(id)))
      return pipe(
        providers().all,
        Iterable.filter(([id]) => !isChinaOrLegacyBlocked(id) && connected.has(id)),
        Iterable.map(([, p]) => p),
        (v) => Array.from(v),
      )
    },
    paid: () => {
      const connected = new Set(providers().connected.filter((id) => !isChinaOrLegacyBlocked(id)))
      return [
        ...Iterable.filter(
          providers().all,
          ([id]) =>
            !isChinaOrLegacyBlocked(id) &&
            connected.has(id) &&
            Object.values(providers().all.get(id)?.models ?? {}).some((m) => m.cost?.input),
        ),
      ]
    },
  }
}
