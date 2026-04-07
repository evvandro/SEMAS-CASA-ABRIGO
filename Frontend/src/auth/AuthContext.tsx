import { Alert, Box, CircularProgress } from '@mui/material'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { PropsWithChildren } from 'react'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, api } from '../services/api'
import type {
  AuthUser,
  LoginPayload,
  LoginSuccessResponse,
  MeResponse,
} from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export { AuthContext }

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const boot = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
      const storedUserRaw = localStorage.getItem(AUTH_USER_KEY)

      if (!storedToken) {
        setIsLoading(false)
        return
      }

      setToken(storedToken)

      if (storedUserRaw) {
        try {
          setUser(JSON.parse(storedUserRaw) as AuthUser)
        } catch {
          localStorage.removeItem(AUTH_USER_KEY)
        }
      }

      try {
        const response = await api.get<MeResponse>('/me')
        const currentUser = response.data.data.user
        setUser(currentUser)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser))
      } catch {
        clearSession()
        setBootError('Sua sessão expirou. Faça login novamente.')
      } finally {
        setIsLoading(false)
      }
    }

    void boot()
  }, [clearSession])

  const login = useCallback(async (payload: LoginPayload): Promise<void> => {
    const response = await api.post<LoginSuccessResponse>('/login', payload)
    const nextToken = response.data.data.token
    const nextUser = response.data.data.user

    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser))

    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/logout')
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  )

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {bootError ? (
        <Box sx={{ p: 2, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1400 }}>
          <Alert severity="warning">{bootError}</Alert>
        </Box>
      ) : null}
      {children}
    </AuthContext.Provider>
  )
}
