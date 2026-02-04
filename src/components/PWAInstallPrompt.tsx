'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show install toast
      toast(
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-teal-600" />
          <div className="flex-1">
            <p className="font-semibold">Install Flat Manager</p>
            <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
          </div>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => handleInstallClick(e)}
          >
            Install
          </Button>
        </div>,
        {
          duration: 10000,
          id: 'pwa-install',
        }
      )
    }

    const handleInstallClick = async (e: BeforeInstallPromptEvent) => {
      toast.dismiss('pwa-install')
      await e.prompt()
      const { outcome } = await e.userChoice
      if (outcome === 'accepted') {
        toast.success('App installed successfully! 🎉')
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success('Flat Manager installed! 🎉')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // This component doesn't render anything visible - it just handles the install prompt
  return null
}
