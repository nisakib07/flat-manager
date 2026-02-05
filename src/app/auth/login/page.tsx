'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { Loader2, Home, Users, ShoppingCart, Zap } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, hsl(176 80% 20%) 0%, hsl(176 70% 30%) 50%, hsl(200 60% 25%) 100%)'
        }}
      >
        {/* Floating Orbs */}
        <div 
          className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, hsl(176 80% 50%), transparent 70%)' }}
        />
        <div 
          className="absolute bottom-32 right-16 w-96 h-96 rounded-full opacity-15"
          style={{ 
            background: 'radial-gradient(circle, hsl(200 80% 50%), transparent 70%)',
            animation: 'float 4s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(circle, hsl(40 80% 60%), transparent 70%)',
            animation: 'float 5s ease-in-out infinite'
          }}
        />
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Left Side - Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center items-center p-12 text-white relative">
        <div className="max-w-lg space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Home className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-black tracking-tight">
              Flat<span className="text-teal-300">Manager</span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              The smartest way to manage your shared living expenses. Track meals, shopping, utilities, and more.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Users, label: 'Multi-User' },
              { icon: ShoppingCart, label: 'Shopping Tracker' },
              { icon: Zap, label: 'Instant Sync' },
            ].map(({ icon: Icon, label }) => (
              <div 
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            {[
              { value: '1000+', label: 'Meals Tracked' },
              { value: '৳50K+', label: 'Managed' },
              { value: '99%', label: 'Accuracy' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black text-teal-300">{value}</div>
                <div className="text-sm text-white/60 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (shown only on mobile) */}
          <div className="text-center mb-8 lg:hidden">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Flat<span className="text-teal-300">Manager</span>
            </h1>
            <p className="text-white/70 mt-2">Sign in to manage your expenses</p>
          </div>

          {/* Login Card */}
          <div 
            className="rounded-3xl p-8 shadow-2xl"
            style={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account</p>
            </div>

            <form action={handleSubmit} className="space-y-5">
              {error && (
                <div 
                  className="p-4 rounded-xl text-sm font-medium flex items-center gap-2"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    style={{ width: 'auto' }}
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link 
                  href="/auth/reset-password" 
                  className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(176 80% 36%), hsl(176 70% 42%))'
                }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-white/50 text-xs mt-6">
            &copy; 2026 FlatManager. Made with ❤️ in Bangladesh.
          </p>
        </div>
      </div>
    </div>
  )
}
