import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import productWatch from "@/assets/product-watch.jpg";
import productBag from "@/assets/product-bag.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productSunglasses from "@/assets/product-sunglasses.jpg";

const products = [
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
];

const FeaturedProducts = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Curated Selection</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Featured Products
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Handpicked essentials that define modern luxury
          </p>
        </div>
        
        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-muted transition-colors group"
          >
            View All Products
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
