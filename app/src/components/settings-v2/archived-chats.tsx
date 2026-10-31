import { Component, createResource, createMemo, For, Show, createSignal, on } from "solid-js"
import { useLanguage } from "@/context/language"
import { useNavigate } from "@solidjs/router"
import { base64Encode } from "@m4spider/core/util/encode"
import { Icon } from "@m4spider/ui/icon"
import { ButtonV2 } from "@m4spider/ui/v2/button-v2"
import { IconButtonV2 } from "@m4spider/ui/v2/icon-button-v2"
import { MenuV2 } from "@m4spider/ui/v2/menu-v2"
import { DateTime } from "luxon"
import { sessionTitle } from "@/utils/session-title"
import { showToast } from "@/utils/toast"
import { displayName } from "@/pages/layout/helpers"
import { useGlobal } from "@/context/global"
import { useServer } from "@/context/server"
import { useServerSync } from "@/context/server-sync"
import type { Session } from "@m4spider/sdk/v2/client"
import type { LocalProject } from "@/context/layout"
import { Spinner } from "@m4spider/ui/spinner"

type ArchivedSessionRecord = {
  session: Session
  project: LocalProject
  projectName: string
  directory: string
}

export const SettingsArchivedChats: Component = () => {
  const language = useLanguage()
  const sync = useServerSync()
  const navigate = useNavigate()
  const global = useGlobal()
  const server = useServer()
  const [deleted, setDeleted] = createSignal(0)

  const [sessions, { refetch }] = createResource(
    () => [sync.data.project, deleted()] as const,
    async ([projects, _]) => {
      const s = server.current
      if (!s) return []

      const ctx = global.createServerCtx(s)
      const sdk = ctx.sdk
      const results: ArchivedSessionRecord[] = []

      for (const project of projects) {
        try {
          const res = await sdk.client.session.list({
            directory: project.worktree,
            archived: true,
          })
          const list = res.data ?? []
          for (const session of list) {
            if (session.parentID) continue
            results.push({
              session,
              project,
              projectName: displayName(project),
              directory: project.worktree,
            })
          }
        } catch {
          // skip projects that fail
        }
      }

      return results.sort((a, b) => (b.session.time.archived ?? 0) - (a.session.time.archived ?? 0))
    },
  )

  const groupedByProject = createMemo(() => {
    const list = sessions() ?? []
    const groups = new Map<string, { projectName: string; sessions: ArchivedSessionRecord[] }>()

    for (const record of list) {
      const key = record.directory
      const existing = groups.get(key)
      if (existing) {
        existing.sessions.push(record)
      } else {
        groups.set(key, { projectName: record.projectName, sessions: [record] })
      }
    }

    return Array.from(groups.values())
  })

  function openSession(session: Session, directory: string) {
    const href = `/${base64Encode(directory)}/session/${session.id}`
    navigate(href)
  }

  async function restoreSession(record: ArchivedSessionRecord) {
    const s = server.current
    if (!s) return

    const sdk = global.createServerCtx(s).sdk
    await sdk.client.session.update({
      sessionID: record.session.id,
      directory: record.directory,
      time: { archived: 0 },
    })
    await sync.project.loadSessions(record.directory, { force: true })

    showToast({
      title: language.t("command.session.restore"),
      description: sessionTitle(record.session.title),
    })
    setDeleted((n) => n + 1)
  }

  async function deleteSession(record: ArchivedSessionRecord) {
    const s = server.current
    if (!s) return

    const sdk = global.createServerCtx(s).sdk
    await sdk.client.session.delete({
      sessionID: record.session.id,
    })
    await sync.project.loadSessions(record.directory, { force: true })

    showToast({
      title: "Session deleted",
      description: sessionTitle(record.session.title),
    })
    setDeleted((n) => n + 1)
  }

  function formatDate(timestamp: number | undefined) {
    if (!timestamp) return ""
    return DateTime.fromMillis(timestamp).toFormat("MMM d, yyyy, h:mm a")
  }

  return (
    <div class="flex min-h-0 flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{language.t("settings.archivedChats.title")}</h2>
        <Show when={(sessions()?.length ?? 0) > 0}>
          <ButtonV2
            variant="destructive"
            size="small"
            onClick={async () => {
              const s = server.current
              if (!s) return

              const sdk = global.createServerCtx(s).sdk
              const list = sessions() ?? []
              const directories = new Set<string>()

              for (const record of list) {
                directories.add(record.directory)
                await sdk.client.session.delete({
                  sessionID: record.session.id,
                }).catch(() => undefined)
              }

              await Promise.all(
                Array.from(directories, (directory) => sync.project.loadSessions(directory, { force: true }).catch(() => undefined)),
              )

              showToast({
                title: "All archived chats deleted",
              })
              setDeleted((n) => n + 1)
            }}
          >
            <Icon name="trash" />
            {language.t("settings.archivedChats.deleteAll")}
          </ButtonV2>
        </Show>
      </div>

      <Show when={!sessions.loading} fallback={<div class="flex justify-center py-12"><Spinner /></div>}>
        <Show
          when={(sessions()?.length ?? 0) > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12 text-v2-text-text-muted">
              <Icon name="archive" size="large" />
              <p class="mt-2 text-sm">{language.t("settings.archivedChats.empty")}</p>
            </div>
          }
        >
          <div class="flex min-h-0 flex-col gap-4">
            <For each={groupedByProject()}>
              {(group) => (
                <div class="flex flex-col rounded-lg border border-v2-border-border-muted bg-v2-background-bg-layer-01">
                  <div class="flex items-center justify-between border-b border-v2-border-border-muted px-4 py-2">
                    <div class="flex items-center gap-2 text-sm font-medium text-v2-text-text-base">
                      <Icon name="folder" size="small" />
                      {group.projectName}
                    </div>
                    <span class="text-xs text-v2-text-text-muted">
                      {group.sessions.length} {group.sessions.length === 1 ? "chat" : "chats"}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <For each={group.sessions}>
                      {(record) => (
                        <div class="flex items-center justify-between border-b border-v2-border-border-muted px-4 py-3 last:border-b-0 hover:bg-v2-background-bg-layer-02">
                          <button
                            class="flex flex-1 flex-col gap-1 text-left"
                            onClick={() => openSession(record.session, record.directory)}
                          >
                            <span class="text-sm font-medium text-v2-text-text-base">
                              {sessionTitle(record.session.title)}
                            </span>
                            <span class="text-xs text-v2-text-text-muted">
                              {formatDate(record.session.time.archived)}
                            </span>
                          </button>
                          <MenuV2>
                            <MenuV2.Trigger>
                              <IconButtonV2
                                variant="ghost-muted"
                                size="small"
                                icon={<Icon name="dot-grid" size="small" />}
                              />
                            </MenuV2.Trigger>
                            <MenuV2.Content>
                              <MenuV2.Item onSelect={() => restoreSession(record)}>
                                <Icon name="arrow-back" size="small" />
                                {language.t("common.restore")}
                              </MenuV2.Item>
                              <MenuV2.Item onSelect={() => deleteSession(record)} class="text-destructive">
                                <Icon name="trash" size="small" class="text-destructive" />
                                {language.t("common.delete")}
                              </MenuV2.Item>
                            </MenuV2.Content>
                          </MenuV2>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
