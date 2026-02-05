'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { Loader2, LogOut, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignOutButtonProps {
  variant?: 'header' | 'mobile'
  className?: string
}

export default function SignOutButton({ variant = 'header', className }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signout()
    // If signout doesn't redirect (shouldn't happen), redirect manually
    router.push('/auth/login')
  }

  // Full-screen loading overlay during signout
  if (loading) {
    return (
      <>
        {/* Keep the button visible but disabled */}
        {variant === 'header' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            disabled
            className={cn("w-full justify-start gap-2 font-normal text-destructive", className)}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing out...
          </Button>
        ) : (
          <Button 
            variant="outline" 
            disabled
            className={cn("w-full gap-2.5 h-14 text-base font-medium rounded-xl", className)}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing out...
          </Button>
        )}
        
        {/* Full-screen overlay */}
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
          style={{
            background: 'linear-gradient(135deg, hsl(176 80% 20%) 0%, hsl(176 70% 30%) 50%, hsl(200 60% 25%) 100%)'
          }}
        >
          {/* Animated loader */}
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Home className="w-10 h-10 text-white" />
            </div>
            {/* Spinning ring around the logo */}
            <div 
              className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-teal-300 border-r-teal-300 animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Flat<span className="text-teal-300">Manager</span>
            </h2>
            <div className="flex items-center gap-2 text-white/80">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing you out...</span>
            </div>
          </div>
          
          {/* Decorative dots */}
          <div className="flex gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-teal-300 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </>
    )
  }

  return variant === 'header' ? (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleSignOut}
      className={cn("w-full justify-start gap-2 font-normal text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer", className)}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  ) : (
    <Button 
      variant="outline" 
      onClick={handleSignOut}
      className={cn("w-full gap-2.5 h-14 text-base font-medium rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30", className)}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Sign Out
    </Button>
  )
}
