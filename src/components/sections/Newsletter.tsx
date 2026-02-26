import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'An unexpected error occurred';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the subscribe_email function for better error handling
      const { data, error } = await supabase.rpc('subscribe_email', {
        email_address: email.trim().toLowerCase()
      });

      if (error) {
        // Fallback to direct insert if function doesn't exist
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          // Try direct insert with conflict handling
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert({ 
              email: email.trim().toLowerCase(),
              status: 'active'
            })
            .select();

          if (insertError) {
            // Check if it's a duplicate email error
            if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
              toast.info('You are already subscribed to our newsletter!');
              setEmail("");
              setIsSubmitting(false);
              return;
            }
            throw insertError;
          }

          toast.success('Successfully subscribed to our newsletter!');
          setEmail("");
        } else {
          throw error;
        }
      } else if (data) {
        // Function executed successfully
        if (data.success) {
          toast.success(data.message || 'Successfully subscribed to our newsletter!');
        } else {
          toast.info(data.message || 'You are already subscribed!');
        }
        setEmail("");
      }
    } catch (error: unknown) {
      console.error('Subscription error:', error);
      toast.error(getErrorMessage(error) || 'Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
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
            <Button 
              type="submit" 
              variant="hero" 
              size="xl" 
              className="group"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
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
