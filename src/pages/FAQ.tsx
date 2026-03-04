import Navbar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Orders are typically delivered within 2-7 business days depending on your location in Nigeria.",
  },
  {
    question: "Can I change my order after payment?",
    answer:
      "If your order has not been processed for shipping, contact us quickly and we will do our best to assist.",
  },
  {
    question: "Do you offer returns?",
    answer:
      "Yes. Eligible items can be returned within 7 days of delivery in original condition.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept secure payments via Paystack and supported cards or bank channels.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl space-y-10">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gold">Support</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently Asked Questions</h1>
              <p className="text-muted-foreground">
                Quick answers to the questions we receive most often.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((item) => (
                <article key={item.question} className="rounded-sm border border-border bg-card p-6 space-y-2">
                  <h2 className="text-xl font-semibold">{item.question}</h2>
                  <p className="text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
