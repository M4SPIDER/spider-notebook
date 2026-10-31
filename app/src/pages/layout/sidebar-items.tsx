import type { Session } from "@m4spider/sdk/v2/client"
import { Avatar } from "@m4spider/ui/avatar"
import { Icon } from "@m4spider/ui/icon"
import { IconButton } from "@m4spider/ui/icon-button"
import { Spinner } from "@m4spider/ui/spinner"
import { Tooltip } from "@m4spider/ui/tooltip"
import { DropdownMenu } from "@m4spider/ui/dropdown-menu"
import { getFilename } from "@m4spider/core/util/path"
import { A, useParams } from "@solidjs/router"
import { type Accessor, createMemo, For, type JSX, Match, Show, Switch } from "solid-js"
import { useServerSync } from "@/context/server-sync"
import { useServerSDK } from "@/context/server-sdk"
import { useLanguage } from "@/context/language"
import { getAvatarColors, type LocalProject, useLayout } from "@/context/layout"
import { useNotification } from "@/context/notification"
import { usePermission } from "@/context/permission"
import { messageAgentColor } from "@/utils/agent"
import { sessionTitle } from "@/utils/session-title"
import { showToast } from "@/utils/toast"
import { sessionPermissionRequest } from "../session/composer/session-request-tree"
import { childSessionOnPath, getProjectAvatarSource, hasProjectPermissions } from "./helpers"

export const ProjectIcon = (props: {
  project: LocalProject
  class?: string
  notify?: boolean
  working?: boolean
}): JSX.Element => {
  const serverSync = useServerSync()
  const notification = useNotification()
  const permission = usePermission()
  const dirs = createMemo(() => [props.project.worktree, ...(props.project.sandboxes ?? [])])
  const unseenCount = createMemo(() =>
    dirs().reduce((total, directory) => total + notification.project.unseenCount(directory), 0),
  )
  const hasError = createMemo(() => dirs().some((directory) => notification.project.unseenHasError(directory)))
  const hasPermissions = createMemo(() =>
    dirs().some((directory) => {
      const [store] = serverSync.child(directory, { bootstrap: false })
      return hasProjectPermissions(store.permission, (item) => !permission.autoResponds(item, directory))
    }),
  )
  const notify = createMemo(() => props.notify && (hasPermissions() || unseenCount() > 0))
  const name = createMemo(() => props.project.name || getFilename(props.project.worktree))
  const colors = createMemo(() => getAvatarColors(props.project.icon?.color))

  return (
    <div class={`relative size-8 shrink-0 ${props.class ?? ""}`}>
      <div class="size-full rounded-[6px] overflow-hidden">
        <Show
          when={getProjectAvatarSource(props.project.id, props.project.icon)}
          fallback={
            <div
              class="size-full rounded-[6px] flex items-center justify-center"
              style={{ border: "1px solid var(--surface-weaker)", "background-color": "var(--surface-base)", color: "var(--text-base)" }}
            >
              <Icon name="folder-add-left" size="normal" style={{ color: "var(--text-base)" }} />
            </div>
          }
        >
          {(src) => (
            <Avatar
              fallback={name()}
              src={src()}
              {...colors()}
              class="size-full rounded"
              classList={{ "badge-mask": notify() }}
            />
          )}
        </Show>
      </div>
      <Show when={notify()}>
        <div
          classList={{
            "absolute top-px right-px size-1.5 rounded-full z-10": true,
            "bg-surface-warning-strong": hasPermissions(),
            "bg-icon-critical-base": !hasPermissions() && hasError(),
            "bg-text-interactive-base": !hasPermissions() && !hasError(),
          }}
        />
      </Show>
      <Show when={props.working}>
        <div
          class="absolute bottom-px right-px size-3 rounded-full z-10 flex items-center justify-center"
          style={{ "background-color": "var(--background-base)" }}
        >
          <Spinner class="size-[9px]" />
        </div>
      </Show>
    </div>
  )
}

export type SessionItemProps = {
  session: Session
  list: Session[]
  navList?: Accessor<Session[]>
  slug: string
  mobile?: boolean
  dense?: boolean
  showTooltip?: boolean
  showChild?: boolean
  showFolder?: boolean
  level?: number
  sidebarExpanded: Accessor<boolean>
  clearHoverProjectSoon: () => void
  prefetchSession: (session: Session, priority?: "high" | "low") => void
  archiveSession: (session: Session) => Promise<void>
  unarchiveSession?: (session: Session) => Promise<void>
}

const SessionRow = (props: {
  session: Session
  slug: string
  mobile?: boolean
  dense?: boolean
  tint: Accessor<string | undefined>
  isWorking: Accessor<boolean>
  hasPermissions: Accessor<boolean>
  hasError: Accessor<boolean>
  unseenCount: Accessor<number>
  clearHoverProjectSoon: () => void
  sidebarOpened: Accessor<boolean>
  warmPress: () => void
  warmFocus: () => void
  showFolder?: boolean
}): JSX.Element => {
  const title = () => sessionTitle(props.session.title)
  const folderName = () => getFilename(props.session.directory)

  return (
    <A
      href={`/${props.slug}/session/${props.session.id}`}
      class={`flex items-center gap-2 min-w-0 w-full text-left focus:outline-none ${props.dense ? "py-0.5" : "py-1"}`}
      style={{ color: "var(--text-base)" }}
      onPointerDown={props.warmPress}
      onFocus={props.warmFocus}
      onClick={() => {
        if (props.sidebarOpened()) return
        props.clearHoverProjectSoon()
      }}
    >
      <Show when={props.isWorking() || props.hasPermissions() || props.hasError() || props.unseenCount() > 0}>
        <div class="shrink-0 size-6 flex items-center justify-center" style={{ color: props.tint() ?? "var(--icon-brand-base)" }}>
          <Switch>
            <Match when={props.isWorking()}>
              <Spinner class="size-[15px]" />
            </Match>
            <Match when={props.hasPermissions()}>
              <div class="size-1.5 rounded-full" style={{ "background-color": "#f5a742" }} />
            </Match>
            <Match when={props.hasError()}>
              <div class="size-1.5 rounded-full" style={{ "background-color": "#e06c75" }} />
            </Match>
            <Match when={props.unseenCount() > 0}>
              <div class="size-1.5 rounded-full" style={{ "background-color": "var(--surface-brand-base)" }} />
            </Match>
          </Switch>
        </div>
      </Show>
      <div class="min-w-0 flex-1 truncate">
        <span class="text-14-regular block truncate">{title()}</span>
        <Show when={props.showFolder && folderName()}>
          <span class="text-12-regular block truncate" style={{ color: "#6B8A87" }}>{folderName()}</span>
        </Show>
      </div>
    </A>
  )
}

export const SessionItem = (props: SessionItemProps): JSX.Element => {
  const params = useParams()
  const layout = useLayout()
  const language = useLanguage()
  const notification = useNotification()
  const permission = usePermission()
  const serverSync = useServerSync()
  const serverSDK = useServerSDK()
  const unseenCount = createMemo(() => notification.session.unseenCount(props.session.id))
  const hasError = createMemo(() => notification.session.unseenHasError(props.session.id))
  const [sessionStore, setSessionStore] = serverSync.child(props.session.directory)
  const hasPermissions = createMemo(() => {
    return !!sessionPermissionRequest(sessionStore.session, sessionStore.permission, props.session.id, (item) => {
      return !permission.autoResponds(item, props.session.directory)
    })
  })
  const isWorking = createMemo(() => {
    if (hasPermissions()) return false
    return sessionStore.session_working(props.session.id)
  })

  const tint = createMemo(() => messageAgentColor(sessionStore.message[props.session.id], sessionStore.agent))
  const tooltip = createMemo(() => props.showTooltip ?? (props.mobile || !props.sidebarExpanded()))
  const currentChild = createMemo(() => {
    if (!props.showChild) return
    return childSessionOnPath(sessionStore.session, props.session.id, params.id)
  })

  const warm = (span: number, priority: "high" | "low") => {
    const nav = props.navList?.()
    const list = nav?.some((item) => item.id === props.session.id && item.directory === props.session.directory)
      ? nav
      : props.list

    props.prefetchSession(props.session, priority)

    const idx = list.findIndex((item) => item.id === props.session.id && item.directory === props.session.directory)
    if (idx === -1) return

    for (let step = 1; step <= span; step++) {
      const next = list[idx + step]
      if (next) props.prefetchSession(next, step === 1 ? "high" : priority)

      const prev = list[idx - step]
      if (prev) props.prefetchSession(prev, step === 1 ? "high" : priority)
    }
  }

  const item = (
    <SessionRow
      session={props.session}
      slug={props.slug}
      mobile={props.mobile}
      dense={props.dense}
      tint={tint}
      isWorking={isWorking}
      hasPermissions={hasPermissions}
      hasError={hasError}
      unseenCount={unseenCount}
      clearHoverProjectSoon={props.clearHoverProjectSoon}
      sidebarOpened={layout.sidebar.opened}
      warmPress={() => warm(2, "high")}
      warmFocus={() => warm(2, "high")}
      showFolder={props.showFolder}
    />
  )

  const editSession = async () => {
    const next = window.prompt(language.t("common.edit"), sessionTitle(props.session.title))?.trim()
    if (!next) return
    await serverSDK.client.session
      .update({ sessionID: props.session.id, title: next })
      .then(() => {
        setSessionStore("session", (sessions) =>
          sessions.map((session) => (session.id === props.session.id ? { ...session, title: next } : session)),
        )
      })
      .catch((err) => {
        showToast({
          variant: "error",
          title: language.t("common.requestFailed"),
          description: err instanceof Error ? err.message : String(err),
        })
      })
  }

  const deleteSession = async () => {
    if (!window.confirm(language.t("session.delete.confirm", { name: sessionTitle(props.session.title) }))) return
    await serverSDK.client.session
      .delete({ sessionID: props.session.id })
      .then(() => {
        setSessionStore("session", (sessions) => sessions.filter((session) => session.id !== props.session.id))
      })
      .catch((err) => {
        showToast({
          variant: "error",
          title: language.t("session.delete.failed.title"),
          description: err instanceof Error ? err.message : String(err),
        })
      })
  }

  return (
    <>
      <div
        data-session-id={props.session.id}
        class="group/session relative w-full min-w-0 rounded-md cursor-default pr-3 transition-colors"
        style={{ "padding-left": `${8 + (props.level ?? 0) * 16}px` }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <div class="flex min-w-0 items-center gap-1">
          <div class="min-w-0 flex-1">
            <Show
              when={!tooltip()}
              fallback={
                <Tooltip
                  placement={props.mobile ? "bottom" : "right"}
                  value={sessionTitle(props.session.title)}
                  gutter={10}
                  class="min-w-0 w-full"
                >
                  {item}
                </Tooltip>
              }
            >
              {item}
            </Show>
          </div>

          <Show when={!props.level}>
            <div
              class="shrink-0 overflow-hidden transition-[width,opacity]"
              classList={{
                "w-6 opacity-100 pointer-events-auto": !!props.mobile,
                "w-0 opacity-0 pointer-events-none": !props.mobile,
                "group-hover/session:w-6 group-hover/session:opacity-100 group-hover/session:pointer-events-auto": true,
                "group-focus-within/session:w-6 group-focus-within/session:opacity-100 group-focus-within/session:pointer-events-auto": true,
              }}
            >
              <DropdownMenu>
                <DropdownMenu.Trigger
                  as={IconButton}
                  icon="dot-grid"
                  variant="ghost"
                  class="size-6 rounded-md"
                  style={{ color: "var(--text-weak)" }}
                  aria-label={language.t("common.moreOptions")}
                  onClick={(event: MouseEvent) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                />
                <DropdownMenu.Portal>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onSelect={() => void editSession()}>
                      <DropdownMenu.ItemLabel>{language.t("common.edit")}</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <Show
                      when={props.session.time?.archived && props.unarchiveSession}
                      fallback={
                        <DropdownMenu.Item onSelect={() => void props.archiveSession(props.session)}>
                          <DropdownMenu.ItemLabel>{language.t("common.archive")}</DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>
                      }
                    >
                      <DropdownMenu.Item onSelect={() => void props.unarchiveSession!(props.session)}>
                        <DropdownMenu.ItemLabel>{language.t("common.restore")}</DropdownMenu.ItemLabel>
                      </DropdownMenu.Item>
                    </Show>
                    <DropdownMenu.Item onSelect={() => void deleteSession()}>
                      <DropdownMenu.ItemLabel>{language.t("common.delete")}</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            </div>
          </Show>
        </div>
      </div>
      <Show when={currentChild()} keyed>
        {(child) => (
          <div class="w-full">
            <SessionItem {...props} session={child} level={(props.level ?? 0) + 1} />
          </div>
        )}
      </Show>
    </>
  )
}

export const NewSessionItem = (props: {
  slug: string
  mobile?: boolean
  dense?: boolean
  sidebarExpanded: Accessor<boolean>
  clearHoverProjectSoon: () => void
}): JSX.Element => {
  const layout = useLayout()
  const language = useLanguage()
  const label = language.t("command.session.new")
  const tooltip = () => props.mobile || !props.sidebarExpanded()
  const item = (
    <A
      href={`/${props.slug}/session`}
      end
      class={`flex items-center gap-2 min-w-0 w-full text-left focus:outline-none ${props.dense ? "py-0.5" : "py-1"}`}
      style={{ color: "var(--text-base)" }}
      onClick={() => {
        if (layout.sidebar.opened()) return
        props.clearHoverProjectSoon()
      }}
    >
      <div class="shrink-0 size-6 flex items-center justify-center">
        <Icon name="new-session" size="small" style={{ color: "var(--text-weak)" }} />
      </div>
      <span class="text-14-regular min-w-0 flex-1 truncate">{label}</span>
    </A>
  )

  return (
    <div
      class="group/session relative w-full min-w-0 rounded-md cursor-default transition-colors pl-2 pr-3"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <Show
        when={!tooltip()}
        fallback={
          <Tooltip placement={props.mobile ? "bottom" : "right"} value={label} gutter={10} class="min-w-0 w-full">
            {item}
          </Tooltip>
        }
      >
        {item}
      </Show>
    </div>
  )
}

export const SessionSkeleton = (props: { count?: number }): JSX.Element => {
  const items = Array.from({ length: props.count ?? 4 }, (_, index) => index)
  return (
    <div class="flex flex-col gap-1">
      <For each={items}>
        {() => <div class="h-8 w-full rounded-md opacity-60 animate-pulse" style={{ "background-color": "var(--surface-weak)" }} />}
      </For>
    </div>
  )
}
