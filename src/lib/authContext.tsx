import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
} from './authApi'
import { fetchConfig } from './configApi'
import { setCachedConfig } from './storage'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  configReady: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  reloadConfig: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function hydrateConfig() {
  try {
    const config = await fetchConfig()
    setCachedConfig(config)
  } catch {
    setCachedConfig(null)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [configReady, setConfigReady] = useState(false)

  const reloadConfig = useCallback(async () => {
    await hydrateConfig()
    setConfigReady(true)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
      if (me) await hydrateConfig()
      else setCachedConfig(null)
    } catch {
      setUser(null)
      setCachedConfig(null)
    } finally {
      setConfigReady(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const next = await apiLogin(username, password)
    setUser(next)
    await hydrateConfig()
    setConfigReady(true)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setCachedConfig(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configReady,
      login,
      logout,
      refresh,
      reloadConfig,
    }),
    [user, loading, configReady, login, logout, refresh, reloadConfig],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

export function isStaff(role: AuthUser['role'] | undefined) {
  return role === 'admin' || role === 'superadmin'
}

export function roleLabel(role: AuthUser['role'] | undefined) {
  if (role === 'superadmin') return 'سوپر ادمین'
  if (role === 'admin') return 'ادمین'
  return 'کاربر'
}
