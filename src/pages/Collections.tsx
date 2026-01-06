import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import productWatch from "@/assets/product-watch.jpg";
import productBag from "@/assets/product-bag.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productSunglasses from "@/assets/product-sunglasses.jpg";

const collections = [
  {
    name: "Time & Precision",
    description: "Masterfully crafted timepieces for the discerning individual",
    image: productWatch,
    count: 48,
    gradient: "from-amber-900/40 to-charcoal-deep",
  },
  {
    name: "Carry Essentials",
    description: "Sophisticated bags and accessories for modern life",
    image: productBag,
    count: 36,
    gradient: "from-stone-800/40 to-charcoal-deep",
  },
  {
    name: "Audio Excellence",
    description: "Premium sound systems for immersive experiences",
    image: productHeadphones,
    count: 24,
    gradient: "from-zinc-800/40 to-charcoal-deep",
  },
  {
    name: "Vision Refined",
    description: "Elegant eyewear that combines style and function",
    image: productSunglasses,
    count: 32,
    gradient: "from-yellow-900/40 to-charcoal-deep",
  },
];

const Collections = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">
                Curated Collections
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Our Collections
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Explore our carefully curated collections, each designed with a distinct vision and uncompromising quality.
              </p>
            </div>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              {collections.map((collection, index) => (
                <div
                  key={collection.name}
                  className="group relative h-[500px] overflow-hidden rounded-sm opacity-0 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-b ${collection.gradient}`} />
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-8 md:p-12">
                    <div className="flex justify-end">
                      <div className="w-12 h-12 rounded-full border border-cream/20 flex items-center justify-center group-hover:bg-cream group-hover:border-cream transition-all duration-300">
                        <ArrowRight className="h-6 w-6 text-cream group-hover:text-charcoal-deep transition-colors duration-300" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-cream/60">
                        {collection.count} Products
                      </p>
                      <h2 className="text-3xl md:text-4xl font-bold text-cream group-hover:text-gold transition-colors duration-300">
                        {collection.name}
                      </h2>
                      <p className="text-cream/80 max-w-md">
                        {collection.description}
                      </p>
                      <Button
                        variant="hero-outline"
                        className="mt-4 border-cream/40 text-cream hover:bg-cream hover:text-charcoal-deep"
                      >
                        Explore Collection
                      </Button>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Collections;

