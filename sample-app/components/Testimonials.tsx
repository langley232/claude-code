"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    company: "TechFlow Inc",
    quote: "StatsAI transformed our analytics completely. We're seeing insights we never had before.",
    avatar: "SC"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    company: "DataDrive",
    quote: "The AI-powered insights are game-changing. Our conversion rates improved by 40%.",
    avatar: "MR"
  },
  {
    id: 3,
    name: "Emily Watson",
    company: "GrowthLab",
    quote: "Finally, analytics that actually make sense. StatsAI is a must-have tool.",
    avatar: "EW"
  },
  {
    id: 4,
    name: "David Kim",
    company: "ScaleUp",
    quote: "The predictive analytics feature alone has saved us countless hours of manual analysis.",
    avatar: "DK"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    company: "InnovateCorp",
    quote: "StatsAI's interface is intuitive and the insights are incredibly accurate.",
    avatar: "LT"
  },
  {
    id: 6,
    name: "James Wilson",
    company: "FutureTech",
    quote: "We've tried many analytics tools, but StatsAI is in a league of its own.",
    avatar: "JW"
  },
  {
    id: 7,
    name: "Anna Patel",
    company: "DigitalFirst",
    quote: "The real-time data visualization and AI recommendations are outstanding.",
    avatar: "AP"
  },
  {
    id: 8,
    name: "Robert Taylor",
    company: "SmartScale",
    quote: "StatsAI helped us identify patterns we never would have seen otherwise.",
    avatar: "RT"
  },
  {
    id: 9,
    name: "Jennifer Lee",
    company: "NextGen",
    quote: "The customer support is exceptional and the platform is incredibly reliable.",
    avatar: "JL"
  },
  {
    id: 10,
    name: "Michael Brown",
    company: "InnovateHub",
    quote: "StatsAI has become an essential part of our daily decision-making process.",
    avatar: "MB"
  }
]

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <Card className="w-80 flex-shrink-0 bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {testimonial.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-foreground">{testimonial.name}</div>
            <div className="text-sm text-muted-foreground">{testimonial.company}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 leading-relaxed">
          "{testimonial.quote}"
        </p>
      </CardContent>
    </Card>
  )
}

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers are saying about StatsAI
          </p>
        </div>

        {/* Top Row - Animate Left */}
        <div className="mb-8">
          <div className="flex animate-marquee-left">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="mx-4">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {testimonials.map((testimonial) => (
              <div key={`duplicate-${testimonial.id}`} className="mx-4">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row - Animate Right */}
        <div>
          <div className="flex animate-marquee-right">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="mx-4">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {testimonials.map((testimonial) => (
              <div key={`duplicate-${testimonial.id}`} className="mx-4">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
