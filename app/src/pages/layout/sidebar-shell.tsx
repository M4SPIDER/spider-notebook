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
import { useTheme } from "@opencode-ai/ui/theme/context"

const AVATAR_PALETTE = [
  "#2563EB", // Royal Blue
  "#7C3AED", // Vivid Purple
  "#DB2777", // Bright Rose
  "#EA580C", // Warm Orange
  "#059669", // Emerald Green
  "#0891B2", // Cyan Teal
  "#D97706", // Deep Amber
  "#4F46E5", // Indigo
  "#DC2626", // Crimson Red
  "#9333EA", // Violet
  "#0D9488", // Teal
  "#C026D3", // Fuchsia
]

function getInitialColor(seed: string): string {
  if (!seed) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}

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
  const theme = useTheme()
  const isDark = createMemo(() => theme.mode() === "dark")
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
  const initialColor = createMemo(() => getInitialColor(displayEmail() || displayName() || "User"))

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
                class="flex size-8 items-center justify-center font-bold shadow-sm"
                style={{
                  background: "#FFFFFF",
                  color: initialColor(),
                  "border-radius": "9999px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  "box-shadow": "0 2px 6px rgba(0, 0, 0, 0.12)",
                  "font-size": "14px",
                }}
              >
                {initial()}
              </div>
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
              <div class="truncate text-[11px]" style={{ color: isDark() ? "#9CA3AF" : "#374151" }}>{displayEmail()}</div>
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
              class="absolute bottom-[calc(100%+8px)] left-3 right-3 z-50 p-3 shadow-2xl backdrop-blur-xl"
              style={{
                "background-color": isDark() ? "#121214" : "#FFFFFF",
                border: isDark() ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.12)",
                "border-radius": "22px",
                "box-shadow": isDark()
                  ? "0 18px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)"
                  : "0 14px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--surface-weaker)",
                color: "var(--text-base)",
              }}
            >
              {/* Header inside popup */}
              <div
                class="flex items-center gap-2.5 p-2 mb-2"
                style={{
                  "background-color": isDark() ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                  "border-radius": "14px",
                }}
              >
                <div
                  class="flex size-9 shrink-0 items-center justify-center font-bold shadow-sm"
                  style={{
                    background: "#FFFFFF",
                    color: initialColor(),
                    "border-radius": "9999px",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.15)",
                    "font-size": "15px",
                  }}
                >
                  {initial()}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[13px] font-semibold" style={{ color: "var(--text-base)" }}>
                    {displayName()}
                  </div>
                  <div class="truncate text-[11px]" style={{ color: isDark() ? "#9CA3AF" : "#374151" }}>
                    {displayEmail()}
                  </div>
                </div>
                <span
                  class="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    "border-radius": "8px",
                    "background-color": isDark()
                      ? (usage.isFreePlan() ? "#141417" : "rgba(16, 185, 129, 0.15)")
                      : (usage.isFreePlan() ? "rgba(212, 175, 55, 0.12)" : "rgba(16, 185, 129, 0.15)"),
                    color: isDark()
                      ? (usage.isFreePlan() ? "#FBE49D" : "#10b981")
                      : (usage.isFreePlan() ? "#996515" : "#059669"),
                    border: usage.isFreePlan()
                      ? (isDark() ? "1px solid rgba(212, 175, 55, 0.45)" : "1px solid rgba(212, 175, 55, 0.35)")
                      : "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  {usage.planName()}
                </span>
              </div>

              {/* Plan & Usage Meter Inside Popup Card */}
              <div
                class="mb-2.5 p-3"
                style={{
                  background: isDark()
                    ? "linear-gradient(160deg, #121216 0%, #08080a 100%)"
                    : "#FFFDF0",
                  border: isDark() ? "1px solid #D4AF37" : "1px solid rgba(212, 175, 55, 0.38)",
                  "border-radius": "16px",
                  "box-shadow": isDark()
                    ? "0 6px 20px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 223, 115, 0.2), 0 0 14px rgba(212, 175, 55, 0.15)"
                    : "0 4px 14px rgba(212, 175, 55, 0.08)",
                }}
              >
                {/* Quota Header & Sync */}
                <div class="flex items-center justify-between text-[11px] mb-2">
                  <span
                    class="font-bold tracking-wide text-[11.5px]"
                    style={{
                      color: isDark() ? "#FBE49D" : "#996515",
                      "text-shadow": isDark() ? "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(243, 210, 120, 0.35)" : "none",
                    }}
                  >
                    Usage Quota
                  </span>
                  <div class="flex items-center gap-1.5">
                    <Show when={usage.data()?.resetsInDays !== undefined}>
                      <span class="text-[10px]" style={{ color: isDark() ? "#C5A059" : "#7A5C1E" }}>
                        {usage.data()!.resetsInDays}d until reset
                      </span>
                    </Show>
                    <button
                      type="button"
                      title="Sync latest usage from AI Studio"
                      class="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center justify-center"
                      onClick={() => usage.refresh()}
                    >
                      <Icon
                        name="reset"
                        size="small"
                        classList={{ "animate-spin": usage.loading() }}
                        style={{ color: isDark() ? "#FBE49D" : "#996515" }}
                      />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  class="h-2 w-full overflow-hidden my-2"
                  style={{
                    "border-radius": "9999px",
                    "background-color": isDark() ? "#040405" : "rgba(0, 0, 0, 0.06)",
                    border: isDark() ? "1px solid rgba(212, 175, 55, 0.35)" : "1px solid rgba(212, 175, 55, 0.25)",
                  }}
                >
                  <div
                    class="h-full transition-all duration-500"
                    style={{
                      "border-radius": "9999px",
                      width: usage.isUnlimited() ? "100%" : `${Math.min(100, Math.max(usage.usagePercent(), 3))}%`,
                      background: usage.isUnlimited()
                        ? (isDark() ? "linear-gradient(90deg, #10b981, #FBE49D)" : "linear-gradient(90deg, #059669, #D4AF37)")
                        : usage.usagePercent() >= 90
                        ? "linear-gradient(90deg, #ef4444, #f43f5e)"
                        : usage.usagePercent() >= 75
                        ? "linear-gradient(90deg, #f59e0b, #eab308)"
                        : isDark()
                        ? "linear-gradient(90deg, #8C6D1F 0%, #D4AF37 35%, #FFF0B8 70%, #D4AF37 100%)"
                        : "linear-gradient(90deg, #D4AF37 0%, #B8860B 100%)",
                      "box-shadow": isDark() ? "0 0 10px rgba(243, 210, 120, 0.5)" : "none",
                    }}
                  />
                </div>

                {/* Tokens and Requests breakdown */}
                <div
                  class="flex items-center justify-between text-[11px]"
                  style={{ color: isDark() ? "rgba(255, 255, 255, 0.75)" : "var(--text-weak)" }}
                >
                  <div>
                    <span class="font-bold" style={{ color: isDark() ? "#FFFFFF" : "var(--text-base)" }}>
                      {formatMetricNum(usage.data()?.tokensUsed ?? 0)}
                    </span>
                    <span style={{ color: isDark() ? "#C5A059" : "#7A5C1E" }}>
                      {" "}
                      / {formatMetricNum(usage.data()?.tokenLimit ?? 100)} tokens
                    </span>
                  </div>
                  <div class="font-bold">
                    <Show when={!usage.isUnlimited()} fallback={<span style={{ color: isDark() ? "#10b981" : "#059669" }}>Unlimited</span>}>
                      <span style={{ color: usage.usagePercent() >= 90 ? "#ef4444" : (isDark() ? "#FBE49D" : "#996515") }}>
                        {usage.usagePercent()}%
                      </span>
                    </Show>
                  </div>
                </div>

                <div
                  class="mt-1.5 flex items-center justify-between text-[10.5px]"
                  style={{ color: isDark() ? "rgba(255, 255, 255, 0.6)" : "var(--text-weak)" }}
                >
                  <span>
                    Reqs: <strong class="font-medium" style={{ color: isDark() ? "#FFFFFF" : "var(--text-base)" }}>{formatMetricNum(usage.data()?.totalRequests ?? 0)}</strong>{" "}
                    <span style={{ color: isDark() ? "#C5A059" : "#7A5C1E" }}>/ {formatMetricNum(usage.data()?.requestLimit ?? 10)}</span>
                  </span>
                  <Show when={usage.loading()}>
                    <span style={{ color: isDark() ? "#FBE49D" : "#996515" }}>Syncing...</span>
                  </Show>
                </div>
              </div>

              {/* Upgrade & Manage Plan Button */}
              <button
                type="button"
                class="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] font-bold tracking-wide transition-all mb-2"
                style={{
                  background: isDark()
                    ? "linear-gradient(180deg, #1c1c22 0%, #0a0a0d 100%)"
                    : "#FFFDF0",
                  color: isDark() ? "#FBE49D" : "#996515",
                  "border-radius": "14px",
                  border: isDark() ? "1px solid #D4AF37" : "1px solid rgba(212, 175, 55, 0.38)",
                  "box-shadow": isDark()
                    ? "0 3px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 223, 115, 0.25)"
                    : "0 2px 6px rgba(212, 175, 55, 0.08)",
                }}
                onMouseEnter={(e) => {
                  if (isDark()) {
                    e.currentTarget.style.background = "linear-gradient(180deg, #2a2a33 0%, #131318 100%)"
                    e.currentTarget.style.borderColor = "#FFF0B8"
                    e.currentTarget.style.boxShadow = "0 0 16px rgba(212, 175, 55, 0.5), inset 0 0 6px rgba(255, 223, 115, 0.2)"
                  } else {
                    e.currentTarget.style.background = "rgba(212, 175, 55, 0.16)"
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.5)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDark()) {
                    e.currentTarget.style.background = "linear-gradient(180deg, #1c1c22 0%, #0a0a0d 100%)"
                    e.currentTarget.style.borderColor = "#D4AF37"
                    e.currentTarget.style.boxShadow = "0 3px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 223, 115, 0.25)"
                  } else {
                    e.currentTarget.style.background = "#FFFDF0"
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.38)"
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(212, 175, 55, 0.08)"
                  }
                }}
                onClick={() => {
                  setProfileOpen(false)
                  openBrowserWithUrl("https://aistudio.m4spider.com")
                }}
              >
                <span>Upgrade & Manage Plan</span>
                <span style={{ "font-size": "13px", color: isDark() ? "#FFF0B8" : "#996515" }}>↗</span>
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
                }}>
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
                }}>
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
                }}>
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
                <Icon name="trash" size="small" style={{ color: "#f87171" }} />
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
