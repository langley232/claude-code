"use client"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative h-screen flex items-end justify-start overflow-hidden">
      {/* Unicorn.studio Interactive Background Placeholder */}
      <div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
        aria-label="unicorn.studio interactive background element"
      >
        {/* This div will eventually contain the unicorn.studio interactive background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl text-muted-foreground/20 font-mono">
            unicorn.studio
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight tracking-tight text-foreground">
            INTELLIGENT ANALYTICS, FINALLY.
          </h1>
          <div className="mt-8">
            <Button size="lg" className="text-lg px-8 py-6 h-auto">
              Try it out
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
