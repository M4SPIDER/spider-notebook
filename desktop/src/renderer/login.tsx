import { Component, createSignal, Show } from "solid-js"
import { useAuth } from "@m4spider/app/context/auth"

type LoginPageProps = {
  onLogin: () => void
}

export const LoginPage: Component<LoginPageProps> = (props) => {
  const auth = useAuth()
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")
  const [mode, setMode] = createSignal<"login" | "register">("login")
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")

  async function handleGoogleLogin() {
    setLoading(true)
    setError("")
    try {
      const result = await (window as any).api?.auth?.login?.()
      if (result) {
        const [token, user] = await Promise.all([
          (window as any).api?.auth?.getToken?.(),
          (window as any).api?.auth?.getUser?.(),
        ])
        if (token) auth.setToken(token)
        if (user) auth.setUser(user)
        props.onLogin()
      } else {
        setError("Login was cancelled or timed out.")
      }
    } catch (e: any) {
      setError(e?.message ?? "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: Event) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (mode() === "register") {
        await (window as any).api?.auth?.emailRegister?.({
          name: name(),
          email: email(),
          password: password(),
        })
      } else {
        await (window as any).api?.auth?.emailLogin?.({
          email: email(),
          password: password(),
        })
      }
      const [token, user] = await Promise.all([
        (window as any).api?.auth?.getToken?.(),
        (window as any).api?.auth?.getUser?.(),
      ])
      if (token) auth.setToken(token)
      if (user) auth.setUser(user)
      props.onLogin()
    } catch (e: any) {
      let msg = e?.message ?? "Failed. Please try again."
      // Strip Electron IPC wrapper: "Error invoking remote method '...': Error: <actual>"
      const match = msg.match(/Error:\s*(.+)$/s)
      if (match) msg = match[1].trim()
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="h-dvh w-screen flex items-center justify-center bg-background-base select-none overflow-hidden">
      <div class="w-full max-w-md mx-4">
        <div class="flex flex-col items-center mb-8">
          <div class="text-4xl font-black italic tracking-tight mb-2">
            M4 <span class="text-accent-base">SPIDER</span>
          </div>
          <div class="text-xs text-text-weak font-mono tracking-widest uppercase">Spider AI Notebook</div>
        </div>

        <div class="bg-surface-raised-base border border-border-weak-base rounded-2xl p-8">
          <div class="text-center mb-6">
            <h1 class="text-lg font-semibold text-text-strong mb-1">Sign in to continue</h1>
            <p class="text-sm text-text-weak">Login is required to use M4 Spider</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading()}
            class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div class="text-center text-[11px] text-text-weak mb-4">If you see "Not verified", click Advanced → Go to M4 Spider (unsafe)</div>

          <div class="relative mb-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-weak-base"></div>
            </div>
            <div class="relative flex justify-center text-[11px]">
              <span class="bg-surface-raised-base px-2 text-text-weak">M4 Spider login</span>
            </div>
          </div>

          <div class="flex gap-2 mb-4">
            <button
              onClick={() => setMode("login")}
              class={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition ${
                mode() === "login"
                  ? "bg-surface-base border border-border-base text-text-strong"
                  : "text-text-weak hover:text-text-strong"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              class={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition ${
                mode() === "register"
                  ? "bg-accent-base text-white"
                  : "bg-surface-base border border-border-base text-text-weak hover:text-text-strong"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} class="space-y-3">
            <Show when={mode() === "register"}>
              <input
                type="text"
                placeholder="Name"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                class="w-full py-3 px-4 rounded-xl bg-surface-base border border-border-base text-text-strong text-sm placeholder-text-weak outline-none focus:border-accent-base transition"
              />
            </Show>
            <input
              type="email"
              placeholder="Email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              class="w-full py-3 px-4 rounded-xl bg-surface-base border border-border-base text-text-strong text-sm placeholder-text-weak outline-none focus:border-accent-base transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              class="w-full py-3 px-4 rounded-xl bg-surface-base border border-border-base text-text-strong text-sm placeholder-text-weak outline-none focus:border-accent-base transition"
            />
            <button
              type="submit"
              disabled={loading()}
              class="w-full py-3 px-4 rounded-xl bg-accent-base text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode() === "register" ? "Create Account" : "Login"}
            </button>
          </form>

          <Show when={error()}>
            <div class="mt-4 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-center text-sm text-[#ef4444]">
              {error()}
            </div>
          </Show>
        </div>

        <div class="text-center mt-6">
          <p class="text-[11px] text-text-weak">
            Free chat stays open. Login is required for image generation, video creation, and Spider AI Pro.
          </p>
        </div>
      </div>
    </div>
  )
}
