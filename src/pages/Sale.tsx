import { useEffect, useState } from "react";
import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ProductCard";
import ProductSearchInput from "@/components/ProductSearchInput";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/database";
import { SlidersHorizontal } from "lucide-react";

const Sale = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadSaleProducts = async () => {
      try {
        let query = supabase
          .from("products")
          .select("*")
          .eq("on_sale", true)
          .order("updated_at", { ascending: false });

        if (searchQuery.trim()) {
          query = query.or(
            `name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading sale products:", error);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error("Error loading sale products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadSaleProducts();
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Limited Time</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Sale</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Explore special offers on selected Dezora Luxe pieces.
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="py-8 border-b border-border bg-card">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground shrink-0" />
              <ProductSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search sale items..."
                className="w-full md:max-w-sm"
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mb-8">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <>Loading...</>
                ) : searchQuery ? (
                  <>Showing {products.length} results for &quot;{searchQuery}&quot;</>
                ) : (
                  <>Showing {products.length} product{products.length !== 1 ? "s" : ""}</>
                )}
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-square bg-card rounded-sm animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? `No sale items matching "${searchQuery}"` : "No sale products available"}
                </p>
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

export default Sale;
