import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Camera, Shield, Sparkles, Smartphone, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import heroImage from "@/assets/hero-image.jpg"

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Your Drive, Your Control",
      description: "Photos stay in your Google Drive. We never store your memories on our servers."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Organization",
      description: "Smart tagging and face detection using free, client-side AI technology."
    },
    {
      icon: Smartphone,
      title: "Beautiful Everywhere",
      description: "Responsive design that looks stunning on desktop, tablet, and mobile."
    }
  ]

  const benefits = [
    "Unlimited storage (your Google Drive)",
    "Privacy-first approach",
    "Smart AI organization",
    "Beautiful photo presentation",
    "Easy sharing with friends",
    "No subscription required"
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-Powered • Privacy-First
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-serif font-bold tracking-tight">
                  Your Photos,{" "}
                  <span className="text-gradient">Beautifully</span>{" "}
                  Organized
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Create stunning photo albums with AI-powered organization. 
                  Your memories stay secure in your Google Drive while Memora 
                  provides intelligent tagging and elegant presentation.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-base px-8">
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-base px-8">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-success" />
                  Free to use
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-success" />
                  No storage limits
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-success" />
                  Privacy-first
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-elevated">
                <img 
                  src={heroImage} 
                  alt="Beautiful photo album showcasing organized memories with AI-powered features"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-gallery-float" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-gallery-float" style={{ animationDelay: "2s" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-serif font-bold">
              Why Choose Memora?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe your memories should stay with you, not on our servers.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-card transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-serif font-bold">
                  Everything You Need for Perfect Photo Albums
                </h2>
                <p className="text-lg text-muted-foreground">
                  Memora combines the privacy of Google Drive with the intelligence 
                  of modern AI to create the perfect photo organization experience.
                </p>
              </div>
              
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl bg-gradient-soft p-8 text-center space-y-6">
                <Camera className="h-16 w-16 text-primary mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold">Ready to Start?</h3>
                  <p className="text-muted-foreground">
                    Create your first album in minutes
                  </p>
                </div>
                <Button size="lg" asChild className="w-full">
                  <Link to="/signup">
                    Create Your First Album
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg font-semibold">Memora</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Memora. Your photos, beautifully organized.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index
