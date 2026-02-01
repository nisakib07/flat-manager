import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header user={user} />
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}
