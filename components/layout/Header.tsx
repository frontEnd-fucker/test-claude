'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from '@/components/auth/UserMenu'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Projects',
    href: '/',
    icon: FolderKanban,
  },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple" />
            <h1 className="text-lg font-bold tracking-tight">Vibe Coders PM</h1>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
              beta
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              // Special handling for Projects link which redirects from / to /projects
              let isActive = pathname === item.href
              if (item.name === 'Projects') {
                isActive = pathname === '/' || pathname === '/projects' || pathname.startsWith('/project/')
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}