import { ArrowUpRight } from "lucide-react";

const categories = [
  {
    name: "Watches",
    count: 48,
    gradient: "from-amber-900/40 to-charcoal-deep",
  },
  {
    name: "Bags",
    count: 36,
    gradient: "from-stone-800/40 to-charcoal-deep",
  },
  {
    name: "Audio",
    count: 24,
    gradient: "from-zinc-800/40 to-charcoal-deep",
  },
  {
    name: "Eyewear",
    count: 32,
    gradient: "from-yellow-900/40 to-charcoal-deep",
  },
];

const Categories = () => {
  return (
    <section className="py-24 md:py-32 bg-charcoal">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Browse</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Shop by Category
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-muted transition-colors group"
          >
            View All Categories
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
        
        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <a
              key={category.name}
              href="#"
              className="group relative h-64 overflow-hidden rounded-sm opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-b ${category.gradient}`} />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-6">
                <div className="flex justify-end">
                  <div className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center group-hover:bg-cream group-hover:border-cream transition-all duration-300">
                    <ArrowUpRight className="h-5 w-5 text-cream group-hover:text-charcoal-deep transition-colors duration-300" />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-cream/60 mb-1">{category.count} Products</p>
                  <h3 className="text-2xl font-bold text-cream group-hover:text-gold transition-colors duration-300">
                    {category.name}
                  </h3>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
