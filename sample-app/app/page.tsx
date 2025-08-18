import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Testimonials } from "@/components/Testimonials"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Testimonials />
    </div>
  )
}
