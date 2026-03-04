import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

const Returns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Customer Care</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Returns</h1>
            </div>

            <div className="space-y-6 text-muted-foreground">
              <p>
                Eligible products can be returned within 7 days of delivery, provided they are unused and in original
                packaging.
              </p>
              <p>
                To request a return, contact us with your order number and reason for return. Our team will guide you through
                the next steps.
              </p>
              <p>
                Refunds are processed to the original payment method after inspection and approval of the returned item.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Returns;
