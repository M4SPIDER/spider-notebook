import { createContext, createSignal, useContext, type Accessor, type JSX } from "solid-js"

export type AuthUser = {
  email?: string
  name?: string
  provider?: string
}

export type AuthContextType = {
  user: Accessor<AuthUser | null>
  token: Accessor<string | null>
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  deleteAccount: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: () => null,
  token: () => null,
  setUser: () => {},
  setToken: () => {},
  logout: () => {},
  deleteAccount: async () => {},
})

export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<AuthUser | null>(null)
  const [token, setToken] = createSignal<string | null>(null)

  function logout() {
    setUser(null)
    setToken(null)
    window.api?.auth?.logout?.().catch(() => {})
    window.location.reload()
  }

  async function deleteAccount(email: string, password: string) {
    await window.api?.auth?.deleteAccount(email, password)
    setUser(null)
    setToken(null)
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, logout, deleteAccount }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
