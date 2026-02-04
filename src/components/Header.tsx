'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import type { User } from '@/types/database'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ModeToggle } from './mode-toggle'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog'
import { Lock, LogOut } from 'lucide-react'

interface HeaderProps {
  user: User | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/meals', label: 'Meals', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/shopping', label: 'Shopping', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/utilities', label: 'Utilities', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/common-expenses', label: 'Common', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/deposits', label: 'Deposits', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/users', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
] as const

function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  if (!user) return null

  return (
    <header className="hidden lg:block sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Logo Area */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg"
               style={{ background: 'var(--gradient-primary)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">
            Flat<span className="gradient-text">Manager</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 bg-muted/50 rounded-full px-1.5 py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "rounded-full px-3.5 h-8 gap-1.5 font-medium transition-all",
                  isActive 
                    ? "bg-background text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                )}
              >
                <Link href={item.href} prefetch={true}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                  </svg>
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </nav>

        {/* Right Area (Profile) */}
        <div className="flex items-center gap-4">
          <ModeToggle />
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 pl-4 border-l border-border/50 outline-none group hover:opacity-80 transition-opacity">
                 <div className="text-right hidden xl:block">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{user.role === 'super_admin' ? 'Super Admin' : user.role}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md ring-2 ring-background transition-transform group-active:scale-95"
                      style={{ 
                        background: 'var(--gradient-primary)',
                        color: 'white'
                      }}>
                    {user.name.charAt(0).toUpperCase()}
                 </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 mr-4" align="end">
              <div className="px-2 py-1.5 mb-1 border-b border-border/50 xl:hidden">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role === 'super_admin' ? 'Super Admin' : user.role}</p>
              </div>
              
              <div className="grid gap-1">
                <ChangePasswordDialog>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal cursor-pointer">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                </ChangePasswordDialog>
                
                <form action={signout}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>
    </header>
  )
}

// Export with memo to prevent unnecessary re-renders on parent updates
export default memo(Header)
