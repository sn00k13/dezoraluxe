import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Stay Connected</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Join the Inner Circle
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Get early access to new arrivals, exclusive offers, and curated style guides.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-14 px-6 bg-secondary border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
              required
            />
            <Button type="submit" variant="hero" size="xl" className="group">
              Subscribe
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
