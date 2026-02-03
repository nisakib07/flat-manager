'use client'

import { memo, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import type { User } from '@/types/database'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  user: User | null
}

// Move static data outside component to prevent recreation
const mainTabs = [
  { name: 'Home', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Meals', href: '/meals', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { name: 'Shopping', href: '/shopping', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
] as const

const menuItems = [
  { name: 'Utilities', href: '/utilities', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'hsl(38 92% 50%)' },
  { name: 'Common', href: '/common-expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'hsl(160 84% 39%)' },
  { name: 'Deposits', href: '/deposits', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'hsl(200 85% 45%)' },
  { name: 'Members', href: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'hsl(280 65% 55%)' },
] as const

function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Memoize callback to prevent recreation
  const handleClose = useCallback(() => setOpen(false), [])

  if (!user) return null

  return (
    <>
      <div className="h-20 lg:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Floating glass nav container */}
        <div className="mx-3 mb-3 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-around h-16">
            {mainTabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  prefetch={true}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-0.5 font-medium",
                    isActive && "font-semibold"
                  )}>{tab.name}</span>
                </Link>
              )
            })}
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all",
                    open ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-2 rounded-xl transition-all",
                    open && "bg-primary/10"
                  )}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={open ? 2.5 : 2}>
                      {open ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </div>
                  <span className={cn(
                    "text-[10px] mt-0.5 font-medium",
                    open && "font-semibold"
                  )}>Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-8 h-[85vh]">
                <SheetHeader className="px-6 pb-4 border-b border-border/50">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="overflow-y-auto px-6 py-6 h-full pb-24">
                  {/* Profile Section */}
                  <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-md"
                         style={{ 
                           background: 'var(--gradient-primary)',
                           color: 'white'
                         }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1.5">{user.name}</h3>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                            style={{
                              background: 'hsl(var(--primary) / 0.1)',
                              color: 'hsl(var(--primary))'
                            }}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Grid Links */}
                  <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        prefetch={true}
                        onClick={handleClose}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all active:scale-95"
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                          style={{ 
                            color: item.color, 
                            background: `${item.color}15` 
                          }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <span className="font-semibold text-sm">{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8">
                    <form action={signout}>
                      <Button variant="outline" className="w-full gap-2.5 h-14 text-base font-medium rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </Button>
                    </form>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  )
}

// Export with memo to prevent unnecessary re-renders
export default memo(MobileNav)
