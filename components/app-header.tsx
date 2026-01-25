"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, FileText, Layout } from "lucide-react"

export function AppHeader() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Template Builder</h1>
          <nav className="flex gap-0.5">
            <Link href="/templates">
              <Button variant={pathname.startsWith("/templates") ? "default" : "ghost"} size="sm" className="gap-1 h-7 text-xs px-2">
                <Layout className="w-3 h-3" />Templates
              </Button>
            </Link>
            <Link href="/notes">
              <Button variant={pathname.startsWith("/notes") ? "default" : "ghost"} size="sm" className="gap-1 h-7 text-xs px-2">
                <FileText className="w-3 h-3" />Notes
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user && <span className="text-xs text-muted-foreground">{user.name || user.email}</span>}
          <Button variant="outline" size="sm" onClick={logout} className="gap-1 h-7 text-xs px-2">
            <LogOut className="w-3 h-3" />Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
