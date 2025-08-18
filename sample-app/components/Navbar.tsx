"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AuthModal } from '@/components/AuthModal'
import { authService } from '@/lib/supabase'

export function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check for existing user on mount
    authService.getCurrentUser().then(setUser).catch(() => setUser(null))

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        setIsAuthModalOpen(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = () => {
    setAuthMode('login')
    setIsAuthModalOpen(true)
  }

  const handleSignup = () => {
    setAuthMode('signup')
    setIsAuthModalOpen(true)
  }

  const handleSignout = async () => {
    try {
      await authService.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary">StatsAI</div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors">
                About
              </a>
              <a href="#contact" className="text-foreground/80 hover:text-foreground transition-colors">
                Contact
              </a>
              <a href="#docs" className="text-foreground/80 hover:text-foreground transition-colors">
                Docs
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-foreground/80">
                    Welcome, {user.email}
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleSignout}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={handleLogin}>
                    Login
                  </Button>
                  <Button size="sm" onClick={handleSignup}>
                    Join up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  )
}
