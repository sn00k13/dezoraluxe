import { Button } from "@/components/ui/button";
import heroProduct from "@/assets/hero-product.jpg";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 animate-pulse-glow" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold opacity-0 animate-fade-up">
                Limited Edition 2025
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight opacity-0 animate-fade-up delay-100">
                Elevate Your
                <span className="block text-gradient-gold mt-2">Everyday</span>
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0 opacity-0 animate-fade-up delay-200">
              Discover our curated collection of premium essentials, designed for those who appreciate the finer details.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-fade-up delay-300">
              <Button variant="hero" size="xl" className="group">
                Shop Collection
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl">
                Explore Lookbook
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex gap-12 justify-center lg:justify-start pt-8 opacity-0 animate-fade-up delay-400">
              <div>
                <p className="text-3xl font-bold text-gradient-gold">50K+</p>
                <p className="text-sm text-muted-foreground mt-1">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gradient-gold">200+</p>
                <p className="text-sm text-muted-foreground mt-1">Premium Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gradient-gold">4.9</p>
                <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative flex items-center justify-center opacity-0 animate-scale-in delay-200">
            <div className="relative">
              {/* Floating product image */}
              <img
                src={heroProduct}
                alt="Premium Sneaker"
                className="w-full max-w-lg mx-auto animate-float drop-shadow-2xl"
              />
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-20 bg-gradient-to-t from-primary/20 to-transparent blur-2xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-in delay-600">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
