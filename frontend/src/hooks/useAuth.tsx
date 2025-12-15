'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, apiGet } from '@/lib/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_superadmin: boolean
  memberships?: {
    organization_id: string
    role: 'admin' | 'athlete'
  }[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
        return
      }
      const userData = await apiGet<User>('/users/me')
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const response = await apiPost<{ access_token: string; user: User }>(
      '/auth/login',
      { email, password }
    )
    localStorage.setItem('token', response.access_token)
    setUser(response.user)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }, [router])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.is_superadmin ?? false,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
