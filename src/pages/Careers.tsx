import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Join the Team</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Careers</h1>
              <p className="text-muted-foreground">
                We are building a modern luxury brand with thoughtful products and exceptional customer care.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-6 space-y-3">
              <h2 className="text-xl font-semibold">Current Openings</h2>
              <p className="text-muted-foreground">
                There are no open roles at the moment. Please check back soon or send your portfolio to
                careers@dezoraluxe.com.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
