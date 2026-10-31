import path from "path"
import { Context, Duration, Effect, Layer, Option, Schedule, Schema } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http"
import { Global } from "./global"
import { Flag } from "./flag/flag"
import { Flock } from "./util/flock"
import { Hash } from "./util/hash"
import { FSUtil } from "./fs-util"
import { InstallationChannel, InstallationVersion } from "./installation/version"
import { EventV2 } from "./event"
import { LayerNode } from "./effect/layer-node"
import { httpClient } from "./effect/layer-node-platform"

export function isChinaOrLegacyBlocked(id: string): boolean {
  if (!id) return true
  const lower = id.toLowerCase().trim()
  if (lower === "m4spider" || lower.startsWith("m4spider")) {
    return false
  }
  if (lower === "opencode" || lower.startsWith("opencode-") || lower.includes("opencode")) {
    return true
  }
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

export const CatalogModelStatus = Schema.Literals(["alpha", "beta", "deprecated"])
export type CatalogModelStatus = typeof CatalogModelStatus.Type

const USER_AGENT = `m4spider/${InstallationChannel}/${InstallationVersion}/${Flag.M4SPIDER_CLIENT}`

const CostTier = Schema.Struct({
  input: Schema.Finite,
  output: Schema.Finite,
  cache_read: Schema.optional(Schema.Finite),
  cache_write: Schema.optional(Schema.Finite),
  tier: Schema.Struct({
    type: Schema.Literal("context"),
    size: Schema.Finite,
  }),
})

const Cost = Schema.Struct({
  input: Schema.Finite,
  output: Schema.Finite,
  cache_read: Schema.optional(Schema.Finite),
  cache_write: Schema.optional(Schema.Finite),
  tiers: Schema.optional(Schema.Array(CostTier)),
  context_over_200k: Schema.optional(
    Schema.Struct({
      input: Schema.Finite,
      output: Schema.Finite,
      cache_read: Schema.optional(Schema.Finite),
      cache_write: Schema.optional(Schema.Finite),
    }),
  ),
})

export const Model = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: Schema.optional(Schema.String),
  release_date: Schema.String,
  attachment: Schema.Boolean,
  reasoning: Schema.Boolean,
  temperature: Schema.Boolean,
  tool_call: Schema.Boolean,
  interleaved: Schema.optional(
    Schema.Union([
      Schema.Literal(true),
      Schema.Struct({
        field: Schema.Literals(["reasoning", "reasoning_content", "reasoning_details"]),
      }),
    ]),
  ),
  cost: Schema.optional(Cost),
  limit: Schema.Struct({
    context: Schema.Finite,
    input: Schema.optional(Schema.Finite),
    output: Schema.Finite,
  }),
  modalities: Schema.optional(
    Schema.Struct({
      input: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
      output: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
    }),
  ),
  experimental: Schema.optional(
    Schema.Struct({
      modes: Schema.optional(
        Schema.Record(
          Schema.String,
          Schema.Struct({
            cost: Schema.optional(Cost),
            provider: Schema.optional(
              Schema.Struct({
                body: Schema.optional(Schema.Record(Schema.String, Schema.MutableJson)),
                headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
              }),
            ),
          }),
        ),
      ),
    }),
  ),
  status: Schema.optional(CatalogModelStatus),
  provider: Schema.optional(
    Schema.Struct({ npm: Schema.optional(Schema.String), api: Schema.optional(Schema.String) }),
  ),
})
export type Model = Schema.Schema.Type<typeof Model>

export const Provider = Schema.Struct({
  api: Schema.optional(Schema.String),
  name: Schema.String,
  env: Schema.Array(Schema.String),
  id: Schema.String,
  npm: Schema.optional(Schema.String),
  models: Schema.Record(Schema.String, Model),
})

export type Provider = Schema.Schema.Type<typeof Provider>

export const Event = {
  Refreshed: EventV2.define({
    type: "models-dev.refreshed",
    schema: {},
  }),
}

declare const M4SPIDER_MODELS_DEV: Record<string, Provider> | undefined

export interface Interface {
  readonly get: () => Effect.Effect<Record<string, Provider>>
  readonly refresh: (force?: boolean) => Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@m4spider/ModelsDev") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service
    const events = yield* EventV2.Service
    const http = HttpClient.filterStatusOk(
      (yield* HttpClient.HttpClient).pipe(
        HttpClient.retryTransient({
          retryOn: "errors-and-responses",
          times: 2,
          schedule: Schedule.exponential(200).pipe(Schedule.jittered),
        }),
      ),
    )

    const source = Flag.M4SPIDER_MODELS_URL || "https://models.dev"
    const filepath = path.join(
      Global.Path.cache,
      source === "https://models.dev" ? "models.json" : `models-${Hash.fast(source)}.json`,
    )
    const ttl = Duration.minutes(5)
    const lockKey = `models-dev:${filepath}`

    const fresh = Effect.fnUntraced(function* () {
      const stat = yield* fs.stat(filepath).pipe(Effect.catch(() => Effect.succeed(undefined)))
      if (!stat) return false
      const mtime = Option.getOrElse(stat.mtime, () => new Date(0)).getTime()
      return Date.now() - mtime < Duration.toMillis(ttl)
    })

    const fetchApi = Effect.fn("ModelsDev.fetchApi")(function* () {
      return yield* HttpClientRequest.get(`${source}/api.json`).pipe(
        HttpClientRequest.setHeader("User-Agent", USER_AGENT),
        http.execute,
        Effect.flatMap((res) => res.text),
        Effect.timeout("10 seconds"),
      )
    })

    const loadFromDisk = fs.readJson(Flag.M4SPIDER_MODELS_PATH ?? filepath).pipe(
      Effect.catch((error) => {
        if (
          Flag.M4SPIDER_MODELS_PATH === undefined &&
          error._tag === "FileSystemError" &&
          error.method === "readJson"
        ) {
          return fs.remove(filepath, { force: true }).pipe(Effect.ignore, Effect.as(undefined))
        }
        return Effect.succeed(undefined)
      }),
      Effect.map((v) => v as Record<string, Provider> | undefined),
    )

    const loadSnapshot = Effect.sync(() =>
      typeof M4SPIDER_MODELS_DEV === "undefined" ? undefined : M4SPIDER_MODELS_DEV,
    )

    const fetchAndWrite = Effect.fn("ModelsDev.fetchAndWrite")(function* () {
      const text = yield* fetchApi()
      const tempfile = `${filepath}.${process.pid}.${Date.now()}.tmp`
      yield* fs.writeWithDirs(tempfile, text).pipe(
        Effect.andThen(fs.rename(tempfile, filepath)),
        Effect.catch((error) =>
          Effect.gen(function* () {
            yield* fs.remove(tempfile, { force: true }).pipe(Effect.ignore)
            return yield* Effect.fail(error)
          }),
        ),
      )
      return text
    })

    const sanitizeProviders = (raw: Record<string, Provider> | undefined): Record<string, Provider> => {
      if (!raw) return {}
      if (!raw["m4spider"]) {
        const base = raw["opencode"] || {
          id: "m4spider",
          name: "M4 Spider AI Gateway",
          env: ["OPENCODE_API_KEY", "M4SPIDER_API_KEY"],
          npm: "@ai-sdk/openai-compatible",
          api: "https://opencode.ai/inference/openai/v1",
          models: {},
        }
        raw["m4spider"] = {
          ...base,
          id: "m4spider",
          name: "M4 Spider AI Gateway",
          models: { ...(base.models || {}) },
        }
      }
      if (raw["m4spider"]) {
        const autoModel = {
  "id": "spider-auto",
  "name": "M4 Spider Auto Mode",
  "description": "Intelligent auto-router that automatically selects the best model for each task with optimal reasoning, speed, and latency",
  "family": "m4spider",
  "attachment": true,
  "reasoning": true,
  "reasoning_options": [
    {
      "type": "effort",
      "values": [
        "low",
        "medium",
        "high"
      ]
    }
  ],
  "tool_call": true,
  "structured_output": true,
  "temperature": true,
  "knowledge": "2026-03",
  "release_date": "2026-03-01",
  "last_updated": "2026-10-31",
  "modalities": {
    "input": [
      "text",
      "image"
    ],
    "output": [
      "text"
    ]
  },
  "open_weights": false,
  "limit": {
    "context": 200000,
    "output": 128000
  },
  "status": "active",
  "provider": {
    "api": "https://opencode.ai/inference/openai/v1"
  },
  "cost": {
    "input": 0,
    "output": 0,
    "cache_read": 0
  },
  "canonical_model_id": "deepseek-v4-flash-free"
};
        const autoAlias = { ...autoModel, id: "auto", name: "M4 Spider Auto Mode" };
        raw["m4spider"].models = {
          "spider-auto": autoModel as any,
          "auto": autoAlias as any,
          ...raw["m4spider"].models,
        };
      }
      const clean: Record<string, Provider> = {}
      for (const [key, provider] of Object.entries(raw)) {
        if (!isChinaOrLegacyBlocked(key)) {
          clean[key] = provider
        }
      }
      return clean
    }

    const populate = Effect.gen(function* () {
      const fromDisk = yield* loadFromDisk
      if (fromDisk) return sanitizeProviders(fromDisk)
      const snapshot = yield* loadSnapshot
      if (snapshot) return sanitizeProviders(snapshot)
      if (Flag.M4SPIDER_DISABLE_MODELS_FETCH) return {}
      // Flock is cross-process: concurrent m4spider CLIs can race on this cache file.
      const text = yield* Effect.scoped(
        Effect.gen(function* () {
          yield* Flock.effect(lockKey)
          return yield* fetchAndWrite()
        }),
      )
      return sanitizeProviders(JSON.parse(text) as Record<string, Provider>)
    }).pipe(Effect.withSpan("ModelsDev.populate"), Effect.orDie)

    const [cachedGet, invalidate] = yield* Effect.cachedInvalidateWithTTL(populate, Duration.infinity)

    const get = (): Effect.Effect<Record<string, Provider>> => cachedGet

    const refresh = Effect.fn("ModelsDev.refresh")(function* (force = false) {
      if (!force && (yield* fresh())) return
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* Flock.effect(lockKey)
          // Re-check under the lock: another process may have refreshed between
          // our outer check and lock acquisition.
          if (!force && (yield* fresh())) return
          yield* fetchAndWrite()
          yield* invalidate
          yield* events.publish(Event.Refreshed, {})
        }),
      ).pipe(
        Effect.tapCause((cause) => Effect.logError("Failed to fetch models.dev", { cause: cause })),
        Effect.ignore,
      )
    })

    if (!Flag.M4SPIDER_DISABLE_MODELS_FETCH && !process.argv.includes("--get-yargs-completions")) {
      // Schedule.spaced runs the effect once, then waits between completions.
      yield* Effect.forkScoped(refresh().pipe(Effect.repeat(Schedule.spaced("60 minutes")), Effect.ignore))
    }

    return Service.of({ get, refresh })
  }),
)

export const defaultLayer = layer.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(FSUtil.defaultLayer),
  Layer.provide(EventV2.defaultLayer),
)
export const node = LayerNode.make(layer, [FSUtil.node, EventV2.node, httpClient])

export * as ModelsDev from "./models-dev"
