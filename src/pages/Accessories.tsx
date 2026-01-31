import { useState, useEffect } from "react";
import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/database";

const Accessories = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadAccessories = async () => {
			try {
				const { data, error } = await supabase
					.from('products')
					.select('*')
					.eq('category', 'Accessories')
					.order('created_at', { ascending: false });

				if (error) {
					console.error('Error loading accessories:', error);
					setProducts([]);
				} else {
					setProducts(data || []);
				}
			} catch (error) {
				console.error('Error loading accessories:', error);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};

		loadAccessories();
	}, []);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">
                Complete Your Look
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Accessories
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Elevate your style with our curated selection of premium accessories, designed to complement your everyday essentials.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
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
                <p className="text-muted-foreground">No accessories available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Accessories;

