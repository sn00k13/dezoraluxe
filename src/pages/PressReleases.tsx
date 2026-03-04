import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

const PressReleases = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Newsroom</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Press Releases</h1>
              <p className="text-muted-foreground">
                Official announcements, product updates, and company milestones from Dezora Luxe.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-6 space-y-3">
              <h2 className="text-xl font-semibold">No releases yet</h2>
              <p className="text-muted-foreground">
                We are preparing our first press release. For media inquiries, contact press@dezoraluxe.com.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PressReleases;
