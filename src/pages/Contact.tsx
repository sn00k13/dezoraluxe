import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { loadSettings } from "@/lib/settings";

const Contact = () => {
  const settings = loadSettings();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Get in Touch</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contact</h1>
              <p className="text-muted-foreground">
                Reach out to us for support, orders, partnerships, or general inquiries.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <article className="rounded-sm border border-border bg-card p-6 space-y-2">
                <h2 className="text-lg font-semibold">Email</h2>
                <p className="text-muted-foreground">{settings.store.storeEmail}</p>
              </article>
              <article className="rounded-sm border border-border bg-card p-6 space-y-2">
                <h2 className="text-lg font-semibold">Phone / WhatsApp</h2>
                <p className="text-muted-foreground">{settings.store.storePhone}</p>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
