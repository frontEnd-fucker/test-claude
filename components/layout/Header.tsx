'use client'

import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple" />
          <h1 className="text-xl font-bold tracking-tight">Vibe Coders PM</h1>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
            beta
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}