import type { UserMessage } from "@opencode-ai/sdk/v2"
import { isChinaOrOpencode } from "@/hooks/use-providers"

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
  if (msg.model && isChinaOrOpencode(msg.model.providerID)) {
    local.session.restore({
      ...msg,
      model: { ...msg.model, providerID: "m4spider", modelID: "spider-auto" },
    })
    return
  }
  local.session.restore(msg)
}
