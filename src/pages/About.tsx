import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Award, Users, Heart, Sparkles } from "lucide-react";

const values = [
  {
    icon: Award,
    title: "Craftsmanship",
    description: "Every product is meticulously crafted with attention to detail and uncompromising quality standards.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We believe in building lasting relationships with our customers, creating a community of discerning individuals.",
  },
  {
    icon: Heart,
    title: "Sustainability",
    description: "Committed to ethical practices and sustainable materials, ensuring a better future for generations to come.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "Continuously pushing boundaries to bring you cutting-edge designs that blend form and function seamlessly.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">
                Our Story
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                About Dezora Luxe
              </h1>
              <p className="text-muted-foreground text-lg">
                We are dedicated to curating premium essentials that elevate your everyday experience.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-8 text-center">
              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  Founded with a vision to redefine luxury, Dezora Luxe represents a commitment to excellence in every detail. 
                  We believe that true luxury lies not in excess, but in the thoughtful curation of essentials that enhance your daily life.
                </p>
                <p className="text-lg leading-relaxed">
                  Our journey began with a simple question: What if everyday objects could be elevated to works of art? 
                  This philosophy drives everything we do, from selecting our materials to designing our products and crafting 
                  the experiences we offer.
                </p>
                <p className="text-lg leading-relaxed">
                  Today, we continue to push boundaries, collaborating with master craftspeople and innovative designers 
                  to bring you collections that stand the test of time—both in durability and in style.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-charcoal">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">
                What We Stand For
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Our Values
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="text-center space-y-4 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border mb-4">
                    <value.icon className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-gradient-gold">
                  50K+
                </p>
                <p className="text-muted-foreground">Happy Customers</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-gradient-gold">
                  200+
                </p>
                <p className="text-muted-foreground">Premium Products</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-bold text-gradient-gold">
                  4.9
                </p>
                <p className="text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;

