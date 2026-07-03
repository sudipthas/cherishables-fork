import { Link } from "@tanstack/react-router";
import { Mail, RefreshCw } from "lucide-react";

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ number, title, children }: SectionProps) {
  return (
    <div
      className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
      data-ocid={`return-policy.section.${number}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {number}
        </span>
        <h2 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight pt-1">
          {title}
        </h2>
      </div>
      <div className="text-foreground/80 leading-relaxed space-y-3 pl-0 md:pl-13">
        {children}
      </div>
    </div>
  );
}

export default function ReturnPolicyPage() {
  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      data-ocid="return-policy.page"
    >
      {/* Hero Banner */}
      <section className="w-full bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 py-16 md:py-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <span className="absolute top-8 left-8 text-5xl opacity-20 select-none">
            📦
          </span>
          <span className="absolute top-12 right-12 text-4xl opacity-20 select-none">
            ✨
          </span>
          <span className="absolute bottom-8 left-1/4 text-3xl opacity-15 select-none">
            🎁
          </span>
          <span className="absolute bottom-6 right-1/4 text-3xl opacity-15 select-none">
            🎁
          </span>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-primary/20 px-5 py-2 text-sm font-semibold text-primary mb-6 shadow-sm backdrop-blur-sm">
            <RefreshCw className="h-4 w-4" />
            Returns & Exchanges
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight max-w-3xl mx-auto">
            Return &amp; Exchange Policy
          </h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            We stand behind the quality of every product we dispatch — your
            satisfaction is our priority.
          </p>
          <p className="mt-5 inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            Effective Date: May 30, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="w-full py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-5">
            {/* 1. Our Quality Promise */}
            <PolicySection number="1" title="Our Quality Promise">
              <p>
                At <strong className="text-primary">Cherishables</strong>, we
                source our products directly from trusted vendors. Every product
                goes through a thorough Quality Check (QC) before it is
                dispatched to you — so you receive only the best.
              </p>
              <p>
                We take pride in ensuring that each item meets our high
                standards of quality before it ever leaves our hands.
              </p>
            </PolicySection>

            {/* 2. Dispatch Photo Confirmation */}
            <PolicySection number="2" title="Dispatch Photo Confirmation">
              <p>
                Before your order is shipped, we capture a photo of your product
                showing it is undamaged and QC-complete. This photo is sent to
                you via email through our platform so you have full confidence
                in what you are receiving.
              </p>
              <div className="mt-3 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
                <span className="text-xl mt-0.5">📸</span>
                <p className="text-sm">
                  You will receive a dispatch confirmation email with a photo of
                  your packaged product before it is handed over for delivery.
                </p>
              </div>
            </PolicySection>

            {/* 3. No Returns or Refunds */}
            <PolicySection number="3" title="No Returns or Refunds">
              <p>
                Because every product is{" "}
                <strong className="text-primary">
                  custom-made to your order
                </strong>{" "}
                and verified damage-free before dispatch, we are unable to
                accept returns or offer refunds once the order has been shipped.
              </p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "🎨",
                    text: "All artwork and physical products are uniquely personalised for you",
                  },
                  {
                    emoji: "✅",
                    text: "Every item is QC-checked and photographed before dispatch",
                  },
                  {
                    emoji: "🚫",
                    text: "Returns and refunds are not available once an order has been shipped",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </PolicySection>

            {/* 4. Exchange Policy */}
            <PolicySection number="4" title="Exchange Policy">
              <p>
                We do not offer product exchanges. However, if you would like
                any{" "}
                <strong className="text-primary">
                  changes or corrections to the artwork or drawing itself
                </strong>{" "}
                (e.g., adjustments to the artwork), we are happy to accommodate
                that.
              </p>
              <div className="mt-3 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
                <span className="text-xl mt-0.5">✏️</span>
                <p className="text-sm">
                  Please contact us <strong>within 7 days</strong> of receiving
                  your order with details of the changes needed. We will do our
                  best to make it perfect for you!
                </p>
              </div>
            </PolicySection>

            {/* 5. Contact Us */}
            <PolicySection number="5" title="Contact Us">
              <p>
                For any queries regarding your order or artwork corrections,
                please do not hesitate to reach out to us — we are here to help!
              </p>
              <div className="mt-4 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Email us at</p>
                  <a
                    href="mailto:orders@cherishables.in"
                    className="font-semibold text-primary hover:text-accent transition-colors"
                    data-ocid="return-policy.contact_email"
                  >
                    orders@cherishables.in
                  </a>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
                <span className="text-xl flex-shrink-0">💬</span>
                <div>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp us at
                  </p>
                  <a
                    href="https://wa.me/918431274009"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:text-accent transition-colors"
                    data-ocid="return-policy.contact_whatsapp"
                  >
                    +91 84312 74009
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We aim to respond to all queries within 2 working days.
              </p>
            </PolicySection>
          </div>

          {/* Back to home */}
          <div className="mt-10 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              data-ocid="return-policy.back_home_link"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
