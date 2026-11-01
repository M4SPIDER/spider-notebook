import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { DateTime } from "luxon"
import { filter, firstBy, flat, groupBy, mapValues, pipe, uniqueBy, values } from "remeda"
import { createSimpleContext } from "@m4spider/ui/context"
import { useProviders, isChinaOrLegacyBlocked } from "@/hooks/use-providers"
import { Persist, persisted } from "@/utils/persist"

export type ModelKey = { providerID: string; modelID: string }

type Visibility = "show" | "hide"
type User = ModelKey & { visibility: Visibility; favorite?: boolean }
type Store = {
  user: User[]
  recent: ModelKey[]
  variant?: Record<string, string | undefined>
}

const RECENT_LIMIT = 5

function modelKey(model: ModelKey) {
  return `${model.providerID}:${model.modelID}`
}

export const { use: useModels, provider: ModelsProvider } = createSimpleContext({
  name: "Models",
  gate: false,
  init: () => {
    const providers = useProviders()

    const migrate = (value: unknown): Store => {
      if (!value || typeof value !== "object") return { user: [], recent: [], variant: {} }
      const item = value as Store
      return {
        user: (item.user ?? []).filter((u) => !isChinaOrLegacyBlocked(u.providerID) && u.modelID !== "auto"),
        recent: (item.recent ?? []).filter((r) => !isChinaOrLegacyBlocked(r.providerID) && r.modelID !== "auto"),
        variant: item.variant ?? {},
      }
    }

    const [store, setStore, _, ready] = persisted(
      {
        ...Persist.global("model", ["model.v1"]),
        migrate,
      },
      createStore<Store>({
        user: [],
        recent: [],
        variant: {},
      }),
    )

    const available = createMemo(() =>
      providers
        .connected()
        .filter((p) => !isChinaOrLegacyBlocked(p.id))
        .flatMap((p) =>
          Object.values(p.models).map((m) => ({
            ...m,
            provider: p,
          })),
        ),
    )

    const release = createMemo(
      () =>
        new Map(
          available().map((model) => {
            const parsed = DateTime.fromISO(model.release_date)
            return [modelKey({ providerID: model.provider.id, modelID: model.id }), parsed] as const
          }),
        ),
    )

    const latest = createMemo(() =>
      pipe(
        available(),
        filter(
          (x) =>
            Math.abs(
              (release().get(modelKey({ providerID: x.provider.id, modelID: x.id })) ?? DateTime.invalid("invalid"))
                .diffNow()
                .as("months"),
            ) < 6,
        ),
        groupBy((x) => x.provider.id),
        mapValues((models) =>
          pipe(
            models,
            groupBy((x) => x.family),
            values(),
            (groups) =>
              groups.flatMap((g) => {
                const first = firstBy(g, [(x) => x.release_date, "desc"])
                return first ? [{ modelID: first.id, providerID: first.provider.id }] : []
              }),
          ),
        ),
        values(),
        flat(),
      ),
    )

    const latestSet = createMemo(() => new Set(latest().map((x) => modelKey(x))))

    const visibility = createMemo(() => {
      const map = new Map<string, Visibility>()
      for (const item of store.user) map.set(`${item.providerID}:${item.modelID}`, item.visibility)
      return map
    })

    const freeOrder = [
      "spider-auto",
      "glm-5.3-flash",
      "nvidia/nemotron-3.5-super-vl:free",
      "qwen-3.7-flash",
      "muse-spark-1.3-contributor",
    ]

    const list = createMemo(() => {
      const items = available()
        .filter((m) => {
          if (m.provider.id === "m4spider" || m.provider.id === "opencode") {
            const isPaid = providers.paid().some((p) => p[0] === m.provider.id)
            if (!isPaid) {
              // On Free tier, ONLY M4 Spider Auto Mode is visible!
              // Free users should NOT see the underlying models!
              return m.id === "spider-auto" || m.id === "auto"
            }
          }
          return true
        })
        .map((m) => ({
          ...m,
          name: m.name.replace("(latest)", "").trim(),
          latest: m.name.includes("(latest)"),
        }))
      items.sort((a, b) => {
        const orderA = a.provider.id === "m4spider" ? freeOrder.indexOf(a.id) : -1
        const orderB = b.provider.id === "m4spider" ? freeOrder.indexOf(b.id) : -1
        if (orderA !== -1 && orderB !== -1) return orderA - orderB
        if (orderA !== -1) return -1
        if (orderB !== -1) return 1
        return 0
      })
      return items
    })

    const find = (key: ModelKey) => list().find((m) => m.id === key.modelID && m.provider.id === key.providerID)

    function update(model: ModelKey, state: Visibility) {
      const index = store.user.findIndex((x) => x.modelID === model.modelID && x.providerID === model.providerID)
      if (index >= 0) {
        setStore("user", index, (current) => ({ ...current, visibility: state }))
        return
      }
      setStore("user", store.user.length, { ...model, visibility: state })
    }

    const visible = (model: ModelKey) => {
      const key = modelKey(model)
      const state = visibility().get(key)
      if (state === "hide") return false
      if (state === "show") return true
      if (model.providerID === "m4spider" || model.providerID === "opencode") {
        if (model.modelID === "spider-auto" || model.modelID === "auto") {
          return true
        }
        return false
      }
      if (latestSet().has(key)) return true
      const date = release().get(key)
      if (!date?.isValid) return true
      return false
    }

    const setVisibility = (model: ModelKey, state: boolean) => {
      update(model, state ? "show" : "hide")
    }

    const push = (model: ModelKey) => {
      const uniq = uniqueBy([model, ...store.recent], (x) => `${x.providerID}:${x.modelID}`)
      if (uniq.length > RECENT_LIMIT) uniq.pop()
      setStore("recent", uniq)
    }

    const variantKey = (model: ModelKey) => `${model.providerID}/${model.modelID}`
    const getVariant = (model: ModelKey) => store.variant?.[variantKey(model)]

    const setVariant = (model: ModelKey, value: string | undefined) => {
      const key = variantKey(model)
      if (!store.variant) {
        setStore("variant", { [key]: value })
        return
      }
      setStore("variant", key, value)
    }

    return {
      ready,
      list,
      find,
      visible,
      setVisibility,
      recent: {
        list: createMemo(() => store.recent),
        push,
      },
      variant: {
        get: getVariant,
        set: setVariant,
      },
    }
  },
})
