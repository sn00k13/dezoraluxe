import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ProductCard";
import productWatch from "@/assets/product-watch.jpg";
import productBag from "@/assets/product-bag.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productSunglasses from "@/assets/product-sunglasses.jpg";

const newArrivals = [
  {
    id: 1,
    name: "Signature Timepiece",
    category: "Watches",
    price: 2499,
    image: productWatch,
  },
  {
    id: 2,
    name: "Executive Tote",
    category: "Bags",
    price: 899,
    image: productBag,
  },
  {
    id: 3,
    name: "Studio Pro Max",
    category: "Audio",
    price: 549,
    image: productHeadphones,
  },
  {
    id: 4,
    name: "Aviator Classic",
    category: "Eyewear",
    price: 329,
    image: productSunglasses,
  },
  {
    id: 5,
    name: "Elite Chronograph",
    category: "Watches",
    price: 3299,
    image: productWatch,
  },
  {
    id: 6,
    name: "Minimalist Backpack",
    category: "Bags",
    price: 649,
    image: productBag,
  },
  {
    id: 7,
    name: "Wireless Studio",
    category: "Audio",
    price: 449,
    image: productHeadphones,
  },
  {
    id: 8,
    name: "Retro Shades",
    category: "Eyewear",
    price: 279,
    image: productSunglasses,
  },
];

const NewArrivals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">
                Latest Releases
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                New Arrivals
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Discover our newest additions to the collection, featuring the latest in premium design and craftsmanship.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {newArrivals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewArrivals;

