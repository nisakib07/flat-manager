import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import MobileNav from '@/components/MobileNav'
import type { User } from '@/types/database'

// Extended caching - 5 minutes for instant tab switching
// Data stays cached during active use, revalidates when stale
export const revalidate = 300

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let user: User | null = null
  
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    user = data
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 w-full">
        {children}
      </main>
      <MobileNav user={user} />
    </div>
  )
}
