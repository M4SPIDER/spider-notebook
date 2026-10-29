import { createEffect, createMemo, createSignal, onCleanup, Show, type Accessor, type JSX } from "solid-js"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd"
import { ConstrainDragXAxis } from "@/utils/solid-dnd"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip, TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { type LocalProject } from "@/context/layout"
import { toggleBrowser, openBrowserWithUrl } from "@/context/browser-panel"
import { useSpiderUsage } from "@/context/spider-usage"
import { useAuth } from "@/context/auth"

export const SidebarContent = (props: {
  mobile?: boolean
  opened: Accessor<boolean>
  aimMove: (event: MouseEvent) => void
  projects: Accessor<LocalProject[]>
  renderProject: (project: LocalProject) => JSX.Element
  handleDragStart: (event: unknown) => void
  handleDragEnd: () => void
  handleDragOver: (event: DragEvent) => void
  openProjectLabel: JSX.Element
  openProjectKeybind: Accessor<string | undefined>
  onOpenProject: () => void
  onNewChat: () => void
  onSearchChats: () => void
  onSpiderLens: () => void
  onArchived: () => void
  renderProjectOverlay: () => JSX.Element
  settingsLabel: Accessor<string>
  settingsKeybind: Accessor<string | undefined>
  onOpenSettings: () => void
  helpLabel: Accessor<string>
  onOpenHelp: () => void
  onClearAllChats?: () => void
  renderPanel: () => JSX.Element
}): JSX.Element => {
  const expanded = createMemo(() => !!props.mobile || props.opened())
  const placement = () => (props.mobile ? "bottom" : "right")
  const userLabel = createMemo(() => {
    const project = props.projects()[0]
    return project?.name || "m4spider"
  })
  let panel: HTMLDivElement | undefined
  const [profileOpen, setProfileOpen] = createSignal(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = createSignal(false)
  const [deletePassword, setDeletePassword] = createSignal("")
  const [deleteError, setDeleteError] = createSignal("")
  const [deleteLoading, setDeleteLoading] = createSignal(false)
  const [newChatMenuOpen, setNewChatMenuOpen] = createSignal(false)
  const auth = useAuth()
  const usage = useSpiderUsage()
  let profileContainer: HTMLDivElement | undefined

  function formatMetricNum(n: number | undefined): string {
    if (n === undefined || n === null) return "0"
    if (n < 0) return "∞"
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M"
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K"
    return n.toLocaleString()
  }

  createEffect(() => {
    if (!profileOpen()) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false)
    }
    const handleClick = (e: MouseEvent) => {
      if (profileContainer && !profileContainer.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    window.addEventListener("mousedown", handleClick)
    onCleanup(() => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("mousedown", handleClick)
    })
  })
  const authUser = auth.user
  const logout = auth.logout

  const displayName = createMemo(() => {
    const name = authUser()?.name
    const email = authUser()?.email
    if (name && name !== email) return name
    return userLabel() || "User"
  })
  const displayEmail = createMemo(() => authUser()?.email || "")
  const initial = createMemo(() => (displayName() ?? "M").charAt(0).toUpperCase())

  async function handleDeleteAccount() {
    if (!deletePassword()) {
      setDeleteError("Please enter your password to confirm.")
      return
    }
    const user = authUser()
    if (!user?.email) {
      setDeleteError("No email found for this account.")
      return
    }
    setDeleteLoading(true)
    setDeleteError("")
    try {
      await auth.deleteAccount(user.email, deletePassword())
    } catch (e: any) {
      const msg = (e?.message ?? "Failed to delete account.").replace(/^Error invoking remote method '[^']+':\s*/s, "").replace(/^Error:\s*/, "")
      setDeleteError(msg)
      setDeleteLoading(false)
    }
  }

  createEffect(() => {
    const el = panel
    if (!el) return
    if (expanded()) {
      el.removeAttribute("inert")
      return
    }
    el.setAttribute("inert", "")
  })

  return (
    <div class="flex h-full w-full min-w-0 overflow-hidden" style={{ "background-color": "var(--background-base)", color: "var(--text-base)" }}>
      <div
        ref={(el) => {
          panel = el
        }}
        data-component="sidebar-panel"
        classList={{
          "flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden border-r transition-[width,opacity] duration-200": true,
          "opacity-100": expanded(),
          "w-0 opacity-0 pointer-events-none": !expanded(),
        }}
        style={{ "border-color": "var(--surface-weaker)", "background-color": "var(--background-base)" }}
        aria-hidden={!expanded()}
        onMouseMove={props.aimMove}
      >
        <div class="shrink-0 px-3 pb-3 pt-4">
          <nav class="flex flex-col gap-1">
            <div class="flex items-center">
              <SidebarAction icon="new-session" label="New chat" onClick={props.onNewChat} class="flex-1" />
              <div class="relative">
                <IconButton
                  icon="dot-grid"
                  variant="ghost"
                  class="size-8 rounded-md"
                  style={{ color: "var(--text-weak)" }}
                  onClick={() => setNewChatMenuOpen((open) => !open)}
                  aria-label="New chat options"
                />
                <Show when={newChatMenuOpen()}>
                  <div
                    class="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg p-1 shadow-lg"
                    style={{ "background-color": "var(--surface-base)", border: "1px solid var(--surface-weaker)" }}
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition"
                      style={{ color: "var(--text-base)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => {
                        setNewChatMenuOpen(false)
                        props.onNewChat()
                      }}
                    >
                      <Icon name="new-session" size="small" style={{ color: "var(--text-weak)" }} />
                      New chat
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition"
                      style={{ color: "var(--text-base)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => {
                        setNewChatMenuOpen(false)
                        props.onSearchChats()
                      }}
                    >
                      <Icon name="magnifying-glass" size="small" style={{ color: "var(--text-weak)" }} />
                      Search chats
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition"
                      style={{ color: "var(--text-base)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => {
                        setNewChatMenuOpen(false)
                        props.onArchived()
                      }}
                    >
                      <Icon name="archive" size="small" style={{ color: "var(--text-weak)" }} />
                      Archived
                    </button>
                  </div>
                </Show>
              </div>
            </div>
            <SidebarAction icon="magnifying-glass" label="Search chats" onClick={props.onSearchChats} />
            <SidebarAction icon="photo" label="Spider Lens" onClick={props.onSpiderLens} />
            <SidebarAction icon="folder" label="Projects" onClick={props.onOpenProject} />
            <SidebarAction icon="archive" label="Archived" onClick={props.onArchived} />
            <SidebarAction icon="globe" label="Spider Browser" onClick={toggleBrowser} />
          </nav>
        </div>

        <div class="shrink-0 px-3 py-3" style={{ "border-top": "1px solid var(--surface-weaker)" }}>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-weak)" }}>Today</span>
            <TooltipKeybind placement={placement()} title={props.settingsLabel()} keybind={props.settingsKeybind() ?? ""}>
              <IconButton
                icon="settings-gear"
                variant="ghost"
                class="size-7 rounded-md"
                style={{ color: "var(--text-weak)" }}
                onClick={props.onOpenSettings}
                aria-label={props.settingsLabel()}
              />
            </TooltipKeybind>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden">
          <DragDropProvider
            onDragStart={props.handleDragStart}
            onDragEnd={props.handleDragEnd}
            onDragOver={props.handleDragOver}
            collisionDetector={closestCenter}
          >
            <DragDropSensors />
            <ConstrainDragXAxis />
            <div class="h-full min-h-0 px-3">{props.renderPanel()}</div>
            <DragOverlay>{props.renderProjectOverlay()}</DragOverlay>
          </DragDropProvider>
        </div>

        <div
          ref={(el) => {
            profileContainer = el
          }}
          class="relative shrink-0 px-3 py-3"
          style={{ "border-top": "1px solid var(--surface-weaker)" }}
        >
          {/* User Profile Button in Sidebar (Clean & Compact to leave full room for chats) */}
          <button
            type="button"
            class="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition"
            style={{
              color: "var(--text-base)",
              "background-color": profileOpen() ? "var(--surface-weak)" : "transparent",
            }}
            aria-expanded={profileOpen()}
            onClick={() => setProfileOpen((open) => !open)}
            onMouseEnter={(e) => {
              if (!profileOpen()) e.currentTarget.style.backgroundColor = "var(--surface-weak)"
            }}
            onMouseLeave={(e) => {
              if (!profileOpen()) e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            <div class="relative shrink-0">
              <div
                class="flex size-8 items-center justify-center rounded-full text-[13px] font-bold shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #E5C158 0%, #8C6D1F 100%)",
                  color: "#031516",
                }}
              >
                {initial()}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--background-base)] bg-emerald-400 shadow-sm" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="truncate text-[13px] font-semibold">{displayName()}</span>
                <span
                  class="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    "background-color": usage.isFreePlan()
                      ? "rgba(212, 175, 55, 0.12)"
                      : "rgba(16, 185, 129, 0.15)",
                    color: usage.isFreePlan() ? "#D4AF37" : "#10b981",
                    border: usage.isFreePlan()
                      ? "1px solid rgba(212, 175, 55, 0.28)"
                      : "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  {usage.planName()}
                </span>
              </div>
              <div class="truncate text-[11px]" style={{ color: "var(--text-weak)" }}>{displayEmail()}</div>
            </div>

            <div
              class="shrink-0 transition-transform duration-200"
              style={{
                transform: profileOpen() ? "rotate(180deg)" : "rotate(0deg)",
                color: "var(--text-weak)",
              }}
            >
              <Icon name="chevron-down" size="small" />
            </div>
          </button>

          {/* Redesigned Floating Popup Card — Only Shown When Profile Icon is Pressed */}
          <Show when={profileOpen()}>
            <div
              class="absolute bottom-[calc(100%+8px)] left-3 right-3 z-50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl"
              style={{
                "background-color": "var(--surface-base)",
                border: "1px solid var(--surface-weaker)",
                "box-shadow": "0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.18)",
              }}
            >
              {/* Header inside popup */}
              <div
                class="flex items-center gap-2.5 rounded-xl p-2 mb-2"
                style={{ "background-color": "rgba(255, 255, 255, 0.03)" }}
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, #E5C158 0%, #8C6D1F 100%)",
                    color: "#031516",
                  }}
                >
                  {initial()}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[13px] font-semibold" style={{ color: "var(--text-base)" }}>
                    {displayName()}
                  </div>
                  <div class="truncate text-[11px]" style={{ color: "var(--text-weak)" }}>
                    {displayEmail()}
                  </div>
                </div>
                <span
                  class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    "background-color": usage.isFreePlan()
                      ? "rgba(212, 175, 55, 0.12)"
                      : "rgba(16, 185, 129, 0.15)",
                    color: usage.isFreePlan() ? "#D4AF37" : "#10b981",
                    border: usage.isFreePlan()
                      ? "1px solid rgba(212, 175, 55, 0.28)"
                      : "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  {usage.planName()}
                </span>
              </div>

              {/* Plan & Usage Meter Inside Popup Card */}
              <div
                class="mb-2.5 rounded-xl p-2.5"
                style={{
                  "background-color": "rgba(212, 175, 55, 0.05)",
                  border: "1px solid rgba(212, 175, 55, 0.22)",
                }}
              >
                {/* Quota Header & Sync */}
                <div class="flex items-center justify-between text-[11px] mb-1.5" style={{ color: "var(--text-weak)" }}>
                  <span class="font-medium" style={{ color: "#D4AF37" }}>Usage Quota</span>
                  <div class="flex items-center gap-1.5">
                    <Show when={usage.data()?.resetsInDays !== undefined}>
                      <span class="text-[10px]">{usage.data()!.resetsInDays}d until reset</span>
                    </Show>
                    <button
                      type="button"
                      title="Sync latest usage from AI Studio"
                      class="p-1 rounded hover:bg-white/5 transition flex items-center justify-center"
                      onClick={() => usage.refresh()}
                    >
                      <Icon
                        name="reset"
                        size="small"
                        classList={{ "animate-spin": usage.loading() }}
                        style={{ color: "#D4AF37" }}
                      />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  class="h-1.5 w-full overflow-hidden rounded-full my-1.5"
                  style={{ "background-color": "rgba(255, 255, 255, 0.08)" }}
                >
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    style={{
                      width: usage.isUnlimited() ? "100%" : `${Math.min(100, Math.max(usage.usagePercent(), 3))}%`,
                      background: usage.isUnlimited()
                        ? "linear-gradient(90deg, #10b981, #D4AF37)"
                        : usage.usagePercent() >= 90
                        ? "linear-gradient(90deg, #ef4444, #f43f5e)"
                        : usage.usagePercent() >= 75
                        ? "linear-gradient(90deg, #f59e0b, #eab308)"
                        : "linear-gradient(90deg, #B8860B, #E5C158)",
                    }}
                  />
                </div>

                {/* Tokens and Requests breakdown */}
                <div class="flex items-center justify-between text-[11px]" style={{ color: "var(--text-weak)" }}>
                  <div>
                    <span class="font-medium" style={{ color: "var(--text-base)" }}>
                      {formatMetricNum(usage.data()?.tokensUsed ?? 0)}
                    </span>
                    <span> / {formatMetricNum(usage.data()?.tokenLimit ?? 100)} tokens</span>
                  </div>
                  <div class="font-semibold">
                    <Show when={!usage.isUnlimited()} fallback={<span style={{ color: "#10b981" }}>Unlimited</span>}>
                      <span style={{ color: usage.usagePercent() >= 90 ? "#ef4444" : "var(--text-base)" }}>
                        {usage.usagePercent()}%
                      </span>
                    </Show>
                  </div>
                </div>

                <div class="mt-1 flex items-center justify-between text-[10.5px]" style={{ color: "var(--text-weak)" }}>
                  <span>Reqs: {formatMetricNum(usage.data()?.totalRequests ?? 0)} / {formatMetricNum(usage.data()?.requestLimit ?? 10)}</span>
                  <Show when={usage.loading()}>
                    <span style={{ color: "#D4AF37" }}>Syncing...</span>
                  </Show>
                </div>
              </div>

              {/* Upgrade & Manage Plan Button */}
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-medium transition mb-2"
                style={{
                  "background-color": "rgba(212, 175, 55, 0.10)",
                  color: "#D4AF37",
                  border: "1px solid rgba(212, 175, 55, 0.32)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.20)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.10)")}
                onClick={() => {
                  setProfileOpen(false)
                  openBrowserWithUrl("https://aistudio.m4spider.com")
                }}
              >
                <span>Upgrade & Manage Plan</span>
                <span style={{ "font-size": "12px" }}>↗</span>
              </button>

              <div class="my-1.5 h-px" style={{ "background-color": "var(--surface-weaker)" }} />

              {/* Navigation Actions */}
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition"
                style={{ color: "var(--text-base)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                onClick={() => {
                  setProfileOpen(false)
                  props.onOpenSettings()
                }}
              >
                <div class="flex items-center gap-2.5">
                  <Icon name="settings-gear" size="small" style={{ color: "var(--text-weak)" }} />
                  <span>Settings</span>
                </div>
                <Show when={props.settingsKeybind()}>
                  <kbd
                    class="rounded px-1.5 py-0.5 text-[10px] font-mono"
                    style={{ "background-color": "var(--surface-weaker)", color: "var(--text-weak)" }}
                  >
                    {props.settingsKeybind()}
                  </kbd>
                </Show>
              </button>

              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition"
                style={{ color: "var(--text-base)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                onClick={() => {
                  setProfileOpen(false)
                  props.onOpenHelp()
                }}
              >
                <Icon name="help" size="small" style={{ color: "var(--text-weak)" }} />
                <span>Help & Documentation</span>
              </button>

              <div class="my-1.5 h-px" style={{ "background-color": "var(--surface-weaker)" }} />

              {/* Danger Actions */}
              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition"
                style={{ color: "var(--text-base)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
                  e.currentTarget.style.color = "#ef4444"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "var(--text-base)"
                }}
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                }}
              >
                <span style={{ "font-size": "14px", transform: "scaleX(-1)", display: "inline-block" }}>➔</span>
                <span>Sign out</span>
              </button>

              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition"
                style={{ color: "#ef4444" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                onClick={() => {
                  setProfileOpen(false)
                  setDeleteConfirmOpen(true)
                }}
              >
                <Icon name="trash" size="small" style={{ color: "#ef4444" }} />
                <span>Delete account</span>
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Show when={deleteConfirmOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center"
          style={{ "background-color": "rgba(0,0,0,0.6)" }}
          onClick={() => {
            setDeleteConfirmOpen(false)
            setDeletePassword("")
            setDeleteError("")
          }}
        >
          <div
            class="w-full max-w-sm mx-4 rounded-2xl p-6 shadow-xl"
            style={{ "background-color": "var(--surface-base)", border: "1px solid var(--surface-weaker)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 class="text-lg font-semibold mb-2" style={{ color: "var(--text-base)" }}>Delete account?</h2>
            <p class="text-sm mb-4" style={{ color: "var(--text-weak)" }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>

            <div class="mb-1">
              <input
                type="password"
                value={deletePassword()}
                onInput={(e) => setDeletePassword(e.currentTarget.value)}
                placeholder="Enter your password to confirm"
                class="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  "background-color": "var(--background-base)",
                  border: "1px solid var(--surface-weaker)",
                  color: "var(--text-base)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDeleteAccount()
                }}
              />
            </div>

            <Show when={deleteError()}>
              <div class="mb-3 text-[12px]" style={{ color: "#ef4444" }}>
                {deleteError()}
              </div>
            </Show>

            <div class="flex gap-2 mt-4">
              <button
                type="button"
                class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
                style={{
                  "background-color": "transparent",
                  color: "var(--text-weak)",
                  border: "1px solid var(--surface-weaker)",
                }}
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setDeletePassword("")
                  setDeleteError("")
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  "background-color": "#ef4444",
                  color: "#fff",
                }}
                disabled={deleteLoading() || !deletePassword()}
                onClick={handleDeleteAccount}
              >
                {deleteLoading() ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!expanded()}>
        <div
          data-component="sidebar-collapsed-rail"
          class="flex h-full w-12 shrink-0 flex-col items-center py-3"
          style={{ "border-right": "1px solid var(--surface-weaker)", "background-color": "var(--background-base)" }}
          onMouseMove={props.aimMove}
        >
          <Tooltip placement={placement()} value="New chat">
            <IconButton icon="new-session" variant="ghost" size="large" aria-label="New chat" />
          </Tooltip>
          <div class="mt-auto flex flex-col items-center gap-2">
            <Tooltip placement={placement()} value="Spider Browser">
              <IconButton
                icon="globe"
                variant="ghost"
                size="large"
                onClick={toggleBrowser}
                aria-label="Spider Browser"
              />
            </Tooltip>
            <TooltipKeybind placement={placement()} title={props.settingsLabel()} keybind={props.settingsKeybind() ?? ""}>
              <IconButton
                icon="settings-gear"
                variant="ghost"
                size="large"
                onClick={props.onOpenSettings}
                aria-label={props.settingsLabel()}
              />
            </TooltipKeybind>
            <Tooltip placement={placement()} value={props.helpLabel()}>
              <IconButton icon="help" variant="ghost" size="large" onClick={props.onOpenHelp} aria-label={props.helpLabel()} />
            </Tooltip>
          </div>
        </div>
      </Show>
    </div>
  )
}

const SidebarAction = (props: {
  icon: Parameters<typeof Icon>[0]["name"]
  label: string
  onClick?: () => void
  class?: string
}): JSX.Element => (
  <button
    type="button"
    class={`flex h-10 w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg px-2 text-left text-[14px] font-medium transition disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent ${props.class ?? ""}`}
    style={{ color: "var(--text-base)" }}
    disabled={!props.onClick}
    onClick={() => props.onClick?.()}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-weak)")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
  >
    <Icon name={props.icon} size="small" style={{ color: "var(--text-weak)" }} class="shrink-0" />
    <span class="min-w-0 flex-1 truncate">{props.label}</span>
  </button>
)
