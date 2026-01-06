import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import Categories from "@/components/sections/Categories";
import Newsletter from "@/components/sections/Newsletter";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <FeaturedProducts />
        <Categories />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
