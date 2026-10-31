import { createMemo } from "solid-js"
import { useSync } from "@/context/sync"
import { useSDK } from "@/context/sdk"
import { getFilename } from "@m4spider/core/util/path"

const MAIN_WORKTREE = "main"
const CREATE_WORKTREE = "create"
const ROOT_CLASS = "size-full flex flex-col"

interface NewSessionViewProps {
  worktree: string
}

export function NewSessionView(props: NewSessionViewProps) {
  const sync = useSync()
  const sdk = useSDK()

  const sandboxes = createMemo(() => sync.project?.sandboxes ?? [])
  const options = createMemo(() => [MAIN_WORKTREE, ...sandboxes(), CREATE_WORKTREE])
  const current = createMemo(() => {
    const selection = props.worktree
    if (options().includes(selection)) return selection
    return MAIN_WORKTREE
  })
  const projectName = createMemo(() => getFilename(sync.project?.worktree ?? sdk.directory) || "Spider")
  const isWorktree = createMemo(() => {
    const project = sync.project
    if (!project) return false
    return sdk.directory !== project.worktree
  })

  const label = (value: string) => {
    if (value === MAIN_WORKTREE) {
      if (isWorktree()) return "main"
      const branch = sync.data.vcs?.branch
      if (branch) return branch
      return "dev"
    }

    if (value === CREATE_WORKTREE) return "create"

    return getFilename(value)
  }

  return (
    <div class={ROOT_CLASS}>
      <div class="h-12 shrink-0" aria-hidden />
      <div class="flex-1 px-6 pb-30 flex items-center justify-center text-center">
        <div class="w-full max-w-[720px] flex flex-col items-center text-center">
          <h1 class="text-[28px] font-medium leading-tight text-[var(--text-base)]">What should we build in Spider?</h1>
          <div class="mt-3 text-[13px] font-medium text-[var(--text-weak)]">
            {projectName()} - {label(current())}
          </div>
        </div>
      </div>
    </div>
  )
}
