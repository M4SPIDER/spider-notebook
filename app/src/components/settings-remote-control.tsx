import { createSignal, onMount, Show, type Component } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import QRCode from "qrcode"

export const SettingsRemoteControl: Component = () => {
  const [remoteInfo, setRemoteInfo] = createSignal<{
    ip: string
    port: number
    pin: string
    url: string
    active: boolean
  }>({
    ip: "192.168.0.109",
    port: 4098,
    pin: "SPIDER-8492",
    url: "http://192.168.0.109:4098/remote",
    active: true,
  })

  const [qrCodeData, setQrCodeData] = createSignal<string>("")
  const [copied, setCopied] = createSignal<boolean>(false)
  const [loading, setLoading] = createSignal<boolean>(true)

  async function loadInfo() {
    setLoading(true)
    try {
      if ((window as any).api?.getRemoteInfo) {
        const info = await (window as any).api.getRemoteInfo()
        if (info && info.url) {
          setRemoteInfo(info)
        }
      } else {
        const hostname = window.location.hostname || "192.168.0.109"
        setRemoteInfo({
          ip: hostname,
          port: 4098,
          pin: "SPIDER-8492",
          url: `http://${hostname}:4098/remote`,
          active: true,
        })
      }
    } catch {
      // Fallback to defaults
    }

    try {
      const url = remoteInfo().url
      const qr = await QRCode.toDataURL(url, {
        margin: 2,
        width: 240,
        color: {
          dark: "#0a0a0c",
          light: "#FFFFFF",
        },
      })
      setQrCodeData(qr)
    } catch (e) {
      console.error("Failed to generate QR code:", e)
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void loadInfo()
  })

  function handleCopy() {
    navigator.clipboard.writeText(remoteInfo().url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenBrowser() {
    window.open(remoteInfo().url, "_blank")
  }

  return (
    <div class="flex flex-col gap-5 p-6 max-w-2xl text-[var(--text-base)]">
      {/* Header */}
      <div class="flex items-center justify-between pb-3 border-b border-[var(--surface-weaker)]">
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span>Phone Remote Control</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </h2>
          <p class="text-xs text-[var(--text-weak)] mt-1">
            Scan the QR code with your mobile camera or browser to control M4 Spider Notebook from your phone on the same Wi-Fi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadInfo()}
          class="p-2 rounded-lg text-xs font-medium transition hover:bg-[var(--surface-weak)] text-[var(--text-weak)] flex items-center gap-1.5"
          title="Refresh connection status and QR code"
        >
          <Icon name="reset" size="small" classList={{ "animate-spin": loading() }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* QR Code Container */}
        <div
          class="flex flex-col items-center p-5 rounded-2xl shadow-lg border"
          style={{
            "background-color": "var(--surface-base)",
            "border-color": "var(--surface-weaker)",
          }}
        >
          <div class="bg-white p-3 rounded-xl shadow-md border border-neutral-200 flex items-center justify-center">
            <Show when={qrCodeData()} fallback={<div class="size-[200px] flex items-center justify-center text-xs text-neutral-400">Generating QR...</div>}>
              <img src={qrCodeData()} alt="Scan with phone" class="size-[200px] block" />
            </Show>
          </div>

          <div class="mt-4 text-center w-full">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-weak)]">
              Scan with phone camera
            </span>
            <div class="mt-2 flex items-center justify-center gap-2 w-full">
              <button
                type="button"
                onClick={handleCopy}
                class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition border flex items-center justify-center gap-1.5"
                style={{
                  "background-color": copied() ? "rgba(16, 185, 129, 0.15)" : "var(--surface-weak)",
                  "border-color": copied() ? "rgba(16, 185, 129, 0.3)" : "var(--surface-weaker)",
                  color: copied() ? "#10b981" : "var(--text-base)",
                }}
              >
                <Icon name={copied() ? "checkmark" : "copy"} size="small" />
                <span>{copied() ? "Link Copied!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenBrowser}
                class="py-1.5 px-3 rounded-lg text-xs font-semibold transition border flex items-center justify-center gap-1"
                style={{
                  "background-color": "var(--surface-weak)",
                  "border-color": "var(--surface-weaker)",
                  color: "var(--text-base)",
                }}
                title="Test link in local browser"
              >
                <span>↗ Open</span>
              </button>
            </div>
          </div>
        </div>

        {/* Connection Details & Security Card */}
        <div class="flex flex-col gap-3.5">
          {/* Connection Specs */}
          <div
            class="p-4 rounded-xl border flex flex-col gap-2.5"
            style={{
              "background-color": "var(--surface-base)",
              "border-color": "var(--surface-weaker)",
            }}
          >
            <div class="flex items-center justify-between text-xs">
              <span class="text-[var(--text-weak)]">Local IP Address</span>
              <span class="font-mono font-semibold">{remoteInfo().ip}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-[var(--text-weak)]">Bridge Port</span>
              <span class="font-mono font-semibold">{remoteInfo().port}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-[var(--text-weak)]">Access PIN</span>
              <span class="font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-weak)] text-[#D4AF37] border border-[#D4AF37]/30">
                {remoteInfo().pin}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-[var(--text-weak)]">Network</span>
              <span class="text-xs font-medium text-emerald-500">Wi-Fi (Same Subnet)</span>
            </div>
          </div>

          {/* Quick Guide */}
          <div
            class="p-4 rounded-xl border flex flex-col gap-2 text-xs"
            style={{
              "background-color": "var(--surface-base)",
              "border-color": "var(--surface-weaker)",
            }}
          >
            <span class="font-semibold text-xs text-[var(--text-base)]">How to connect:</span>
            <div class="flex items-start gap-2 text-[var(--text-weak)]">
              <span class="font-bold text-[var(--text-base)]">1.</span>
              <span>Ensure your phone is connected to the same Wi-Fi router.</span>
            </div>
            <div class="flex items-start gap-2 text-[var(--text-weak)]">
              <span class="font-bold text-[var(--text-base)]">2.</span>
              <span>Point your iPhone or Android camera at the QR code.</span>
            </div>
            <div class="flex items-start gap-2 text-[var(--text-weak)]">
              <span class="font-bold text-[var(--text-base)]">3.</span>
              <span>Tap the prompt to open the M4 Spider mobile controller in your phone browser.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
