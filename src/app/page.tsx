import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-primary)', opacity: 0.1 }}></div>
        <div className="container py-20 sm:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ background: 'var(--gradient-primary)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              <span className="gradient-text">Flat Manager</span>
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
              The easiest way to manage shared expenses with your flatmates.
              Track meals, utilities, shopping, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link href="/auth/login" className="btn btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
          Everything You Need
        </h2>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Meal Tracking</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Track daily meals with weighted portions. Fair distribution based on actual consumption.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Shopping List</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Keep track of who buys what. Never lose track of shared shopping expenses.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Utilities</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Split rent, electricity, Wi-Fi, and other utilities evenly among flatmates.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Common Expenses</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Shared items like cleaning supplies automatically split among everyone.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Deposits & Balance</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monthly deposits with carry-forward. Always know your balance.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Admin Rotation</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monthly admin rotation ensures fair responsibility sharing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container pb-20">
        <div className="card text-center py-12" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to simplify flat expenses?</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Join your flatmates and start tracking expenses together. It&apos;s free to get started.
          </p>
          <Link href="/auth/signup" className="btn text-lg px-8 py-3" style={{ background: 'white', color: 'var(--primary)' }}>
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid var(--card-border)' }}>
        <div className="container text-center" style={{ color: 'var(--text-muted)' }}>
          <p>© {new Date().getFullYear()} Flat Manager. Made with ❤️ for flatmates everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
