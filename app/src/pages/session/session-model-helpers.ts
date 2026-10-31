import type { UserMessage } from "@m4spider/sdk/v2"
import { isChinaOrLegacyBlocked } from "@/hooks/use-providers"

type Local = {
  session: {
    reset(): void
    restore(msg: UserMessage): void
  }
}

export const resetSessionModel = (local: Local) => {
  local.session.reset()
}

export const syncSessionModel = (local: Local, msg: UserMessage) => {
  if (msg.model && isChinaOrLegacyBlocked(msg.model.providerID)) {
    local.session.restore({
      ...msg,
      model: { ...msg.model, providerID: "m4spider", modelID: "glm-5.3-flash" },
    })
    return
  }
  local.session.restore(msg)
}
