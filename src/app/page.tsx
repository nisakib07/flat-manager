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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-60" style={{
          background: `
            radial-gradient(at 20% 30%, hsl(160 84% 50% / 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 20%, hsl(38 92% 60% / 0.1) 0px, transparent 40%),
            radial-gradient(at 40% 80%, hsl(200 85% 55% / 0.08) 0px, transparent 50%)
          `
        }} />
        
        <div className="container py-32 sm:py-44 lg:py-52 relative">
          <div className="text-center max-w-3xl mx-auto animate-fadeIn">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-10 shadow-xl glow"
                 style={{ background: 'var(--gradient-primary)' }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tight text-foreground">
              <span className="gradient-text">Flat Manager</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl mb-12 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The easiest way to manage shared expenses with your flatmates.
              Track meals, utilities, shopping, and more.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/auth/signup" className="btn btn-primary text-lg px-10 py-5">
                Get Started Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/auth/login" className="btn btn-secondary text-lg px-10 py-5">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-28 lg:py-36">
        <div className="text-center mb-20 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Everything You Need
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Powerful features designed to make shared living simpler
          </p>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 - Meal Tracking */}
          <div className="card group p-8" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(160 84% 39% / 0.1)' }}>
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Meal Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track daily meals with weighted portions. Fair distribution based on actual consumption.
            </p>
          </div>

          {/* Feature 2 - Shopping */}
          <div className="card group p-8" style={{ animationDelay: '0.15s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(200 85% 45% / 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'hsl(200 85% 45%)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Shopping List</h3>
            <p className="text-muted-foreground leading-relaxed">
              Keep track of who buys what. Never lose track of shared shopping expenses.
            </p>
          </div>

          {/* Feature 3 - Utilities */}
          <div className="card group p-8" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(38 92% 50% / 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'hsl(38 92% 50%)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Utilities</h3>
            <p className="text-muted-foreground leading-relaxed">
              Split rent, electricity, Wi-Fi, and other utilities evenly among flatmates.
            </p>
          </div>

          {/* Feature 4 - Common Expenses */}
          <div className="card group p-8" style={{ animationDelay: '0.25s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(280 65% 55% / 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'hsl(280 65% 55%)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Common Expenses</h3>
            <p className="text-muted-foreground leading-relaxed">
              Shared items like cleaning supplies automatically split among everyone.
            </p>
          </div>

          {/* Feature 5 - Deposits */}
          <div className="card group p-8" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(166 72% 50% / 0.1)' }}>
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Deposits & Balance</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monthly deposits with carry-forward. Always know your balance.
            </p>
          </div>

          {/* Feature 6 - Admin */}
          <div className="card group p-8" style={{ animationDelay: '0.35s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-transform group-hover:scale-110"
                 style={{ background: 'hsl(340 75% 55% / 0.1)' }}>
              <svg className="w-8 h-8" style={{ color: 'hsl(340 75% 55%)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Admin Rotation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monthly admin rotation ensures fair responsibility sharing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container pb-28 lg:pb-36">
        <div className="relative rounded-3xl overflow-hidden p-12 sm:p-20"
             style={{ background: 'var(--gradient-primary)' }}>
          {/* Shine overlay */}
          <div className="absolute inset-0 opacity-20"
               style={{ background: 'linear-gradient(135deg, white 0%, transparent 50%, transparent 100%)' }} />
          
          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to simplify flat expenses?
            </h2>
            <p className="text-white/80 mb-10 text-lg sm:text-xl leading-relaxed">
              Join your flatmates and start tracking expenses together. It&apos;s free to get started.
            </p>
            <Link href="/auth/signup" 
                  className="btn text-lg px-10 py-5 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              Create Free Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container text-center text-muted-foreground">
          <p className="text-base">© {new Date().getFullYear()} Flat Manager. Made with ❤️ for flatmates everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
