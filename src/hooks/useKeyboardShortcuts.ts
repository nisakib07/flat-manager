'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcutOptions {
  onSave?: () => void
  onCancel?: () => void
  enabled?: boolean
}

/**
 * Custom hook for keyboard shortcuts
 * - Ctrl/Cmd + S: Save
 * - Escape: Cancel/Close modal
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  const { onSave, onCancel, enabled = true } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ctrl/Cmd + S for Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      onSave?.()
    }

    // Escape for Cancel
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel?.()
    }
  }, [enabled, onSave, onCancel])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
