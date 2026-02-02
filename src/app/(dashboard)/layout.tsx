import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import MobileNav from '@/components/MobileNav'
import type { User } from '@/types/database'

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
    <div className="min-h-screen bg-background text-foreground">
      <Header user={user} />
      <main className="container py-6">
        {children}
      </main>
      <MobileNav user={user} />
    </div>
  )
}
