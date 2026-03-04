import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

const Shipping = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Delivery Information</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Shipping</h1>
            </div>

            <div className="space-y-6 text-muted-foreground">
              <p>
                We currently ship across Nigeria. Shipping fees and estimated delivery windows are shown at checkout before
                payment.
              </p>
              <p>
                Standard delivery usually takes 2-7 business days. During peak periods, processing and transit may take
                slightly longer.
              </p>
              <p>
                Once your order ships, you will receive an update with delivery details. If you need help tracking an order,
                contact our support team.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Shipping;
