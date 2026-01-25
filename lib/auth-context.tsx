"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, clearToken } from "@/lib/utils/token"

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = getToken()
    
    if (token) {
      setIsAuthenticated(true)
      setUser({ token })
    } else {
      setIsAuthenticated(false)
      setUser(null)
      
      const publicPaths = ["/sign-in", "/sign-up", "/forgot-password"]
      if (!publicPaths.includes(pathname)) {
        router.push("/sign-in")
      }
    }
    
    setLoading(false)
  }, [pathname, router])

  const logout = () => {
    clearToken()
    localStorage.clear()
    setIsAuthenticated(false)
    setUser(null)
    router.push("/sign-in")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
