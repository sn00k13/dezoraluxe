import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/database";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(16); // Show 16 featured products for better selection

        if (error) {
          console.error('Error loading featured products:', error);
          setProducts([]);
          return;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error loading featured products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-6">
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Shop Premium Essentials
          </h1>
          <p className="text-muted-foreground">
            Discover our curated collection
          </p>
        </div>
        
        {/* Products Grid - Larger, more prominent */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square bg-card rounded-sm animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
        
        {/* Single CTA */}
        {products.length > 0 && (
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-gold text-charcoal-deep font-semibold rounded-sm hover:shadow-glow transition-all duration-300"
            >
              View All Products
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
