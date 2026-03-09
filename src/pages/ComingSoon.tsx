import { Clock3, Mail, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSettings } from "@/lib/settings";

const statusPoints = [
  {
    icon: Sparkles,
    title: "Building a better store",
    description: "We are upgrading the backend and refining the storefront for a stronger relaunch.",
  },
  {
    icon: Clock3,
    title: "Temporarily under construction",
    description: "The public store is paused while we complete essential work behind the scenes.",
  },
  {
    icon: ShieldCheck,
    title: "Support is still available",
    description: "If you need help with an order or inquiry, our team can still assist through the channels below.",
  },
];

const ComingSoon = () => {
  const settings = loadSettings();
  const whatsappNumber = settings.store.storePhone.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
  const emailUrl = `mailto:${settings.store.storeEmail}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-charcoal-deep text-cream">
      <div className="absolute inset-0 bg-gradient-glow opacity-40 animate-pulse-glow" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <main className="relative z-10 container mx-auto flex min-h-screen flex-col px-6 py-8">
        <header className="border-b border-cream/10 pb-6">
          <a href="/" className="inline-flex items-center">
            <img
              src="/images/DLX.png"
              alt={settings.store.storeName}
              className="h-10 w-auto object-contain"
            />
          </a>
        </header>

        <section className="flex flex-1 items-center py-12 md:py-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.3em] text-gold animate-fade-up">
                  Site Under Construction
                </p>
                <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight animate-fade-up delay-100 md:text-6xl lg:text-7xl">
                  We are building
                  <span className="mt-2 block text-gradient-gold"> something better for you.</span>
                </h1>
                <p className="max-w-2xl text-lg text-cream/70 animate-fade-up delay-200 md:text-xl">
                  Dezora Luxe is temporarily under construction while we work behind the scenes. We are
                  improving the backend, tightening performance, and preparing a smoother experience.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row animate-fade-up delay-300">
                <Button variant="hero" size="xl" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Contact on WhatsApp
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <a href={emailUrl}>
                    Email Support
                    <Mail className="h-5 w-5" />
                  </a>
                </Button>
              </div>

              <div className="grid gap-4 pt-4 md:grid-cols-3">
                {statusPoints.map((point, index) => (
                  <article
                    key={point.title}
                    className="rounded-sm border border-cream/10 bg-white/5 p-5 backdrop-blur-sm opacity-0 animate-fade-up"
                    style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: "forwards" }}
                  >
                    <point.icon className="mb-4 h-5 w-5 text-gold" />
                    <h2 className="mb-2 text-base font-semibold text-cream">{point.title}</h2>
                    <p className="text-sm leading-6 text-cream/65">{point.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-sm border border-cream/10 bg-white/5 p-6 shadow-card backdrop-blur-sm opacity-0 animate-scale-in delay-300 md:p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.3em] text-gold">Stay Connected</p>
                  <h2 className="text-2xl font-semibold text-cream md:text-3xl">
                    Need help while the site is offline?
                  </h2>
                  <p className="text-sm leading-6 text-cream/65">
                    For order updates, existing purchases, or partnership inquiries, reach us directly and we
                    will get back to you as soon as possible.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-sm border border-cream/10 bg-charcoal/60 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cream/50">Email</p>
                    <a
                      href={emailUrl}
                      className="mt-2 block text-base font-medium text-cream transition-colors hover:text-gold"
                    >
                      {settings.store.storeEmail}
                    </a>
                  </div>

                  <div className="rounded-sm border border-cream/10 bg-charcoal/60 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cream/50">Phone / WhatsApp</p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-base font-medium text-cream transition-colors hover:text-gold"
                    >
                      {settings.store.storePhone}
                    </a>
                  </div>
                </div>

                <div className="rounded-sm border border-gold/20 bg-gold/10 p-4">
                  <p className="text-sm font-medium text-cream">
                    Thank you for your patience while we rebuild. We will be back online soon.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ComingSoon;
