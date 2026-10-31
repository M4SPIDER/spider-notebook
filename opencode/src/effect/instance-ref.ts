import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@m4spider/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~m4spider/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~m4spider/WorkspaceRef", {
  defaultValue: () => undefined,
})
