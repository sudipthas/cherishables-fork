import { Link } from "@tanstack/react-router";
import { Mail, Shield } from "lucide-react";

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ number, title, children }: SectionProps) {
  return (
    <div
      className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
      data-ocid={`privacy.section.${number}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
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

export default function PrivacyPolicyPage() {
  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      data-ocid="privacy.page"
    >
      {/* Hero Banner */}
      <section className="w-full bg-gradient-to-br from-primary/15 via-secondary/20 to-accent/15 py-16 md:py-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <span className="absolute top-8 left-8 text-5xl opacity-20 select-none">
            🎨
          </span>
          <span className="absolute top-12 right-12 text-4xl opacity-20 select-none">
            ✨
          </span>
          <span className="absolute bottom-8 left-1/4 text-3xl opacity-15 select-none">
            🖌️
          </span>
          <span className="absolute bottom-6 right-1/4 text-3xl opacity-15 select-none">
            ✨
          </span>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-primary/20 px-5 py-2 text-sm font-semibold text-primary mb-6 shadow-sm backdrop-blur-sm ring-1 ring-primary/10">
            <Shield className="h-4 w-4" />
            Privacy & Data Protection
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight max-w-3xl mx-auto">
            Your Privacy Matters to Us
          </h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            We handle your personal information with care, respect, and
            transparency — always.
          </p>
          <p className="mt-5 inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/10">
            Effective Date: May 30, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="w-full py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-5">
            {/* 1. Introduction */}
            <PolicySection number="1" title="Introduction">
              <p>
                Welcome to{" "}
                <strong className="text-primary">Cherishables</strong>,
                accessible at{" "}
                <a
                  href="https://cherishables.shop"
                  className="text-primary underline hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cherishables.shop
                </a>
                . This Privacy Policy explains how we collect, use, and
                safeguard your personal information when you visit our website
                or place an order for a custom caricature portrait.
              </p>
              <p>
                By using our website, you agree to the practices described in
                this policy. We are committed to protecting your privacy and
                ensuring your data is handled responsibly.
              </p>
            </PolicySection>

            {/* 2. Information We Collect */}
            <PolicySection number="2" title="Information We Collect">
              <p>We may collect the following personal information:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  { emoji: "👤", text: "Full name" },
                  { emoji: "📧", text: "Email address" },
                  { emoji: "📱", text: "Phone number" },
                  {
                    emoji: "📍",
                    text: "Delivery address (optional — only when you order a physical printed product)",
                  },
                  {
                    emoji: "📸",
                    text: "Photos you upload for caricature creation",
                  },
                  {
                    emoji: "💳",
                    text: "Payment reference details (not card or UPI numbers — see Payment Processing)",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </PolicySection>

            {/* 3. How We Use Your Information */}
            <PolicySection number="3" title="How We Use Your Information">
              <p>We use the information you provide to:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "✅",
                    text: "Process and fulfil your caricature order",
                  },
                  {
                    emoji: "📬",
                    text: "Contact you with order updates, delivery status, and revisions",
                  },
                  {
                    emoji: "🚚",
                    text: "Arrange delivery of physical products where applicable",
                  },
                  {
                    emoji: "📊",
                    text: "Analyse and improve our website and services",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                We do not sell, rent, or share your personal information with
                third parties for marketing purposes.
              </p>
            </PolicySection>

            {/* 4. Payment Processing */}
            <PolicySection number="4" title="Payment Processing">
              <p>
                All payments are processed securely via{" "}
                <strong className="text-primary">Razorpay</strong>, supporting
                UPI, credit/debit cards, and net banking. We do{" "}
                <strong>not</strong> store your card numbers, UPI IDs, or any
                sensitive payment credentials on our servers. Razorpay handles
                payment data in accordance with their own privacy policy. You
                can review it at{" "}
                <a
                  href="https://razorpay.com/privacy/"
                  className="text-primary underline hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  razorpay.com/privacy
                </a>
                .
              </p>
            </PolicySection>

            {/* 5. Analytics & Tracking */}
            <PolicySection number="5" title="Analytics & Tracking">
              <p>
                We use the following tools to understand how visitors use our
                site and to improve your experience:
              </p>
              <ul className="list-none space-y-3 mt-3">
                <li className="flex items-start gap-2">
                  <span className="text-base mt-0.5">📈</span>
                  <span>
                    <strong className="text-primary">Google Analytics</strong>{" "}
                    (Tracking ID: G-1MCXXCZC1V) — collects anonymised usage data
                    such as pages visited, time on site, and device type.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-base mt-0.5">📣</span>
                  <span>
                    <strong className="text-primary">Meta Pixel</strong> (ID:
                    2175407679916000) — helps us measure the effectiveness of
                    advertising on Facebook and Instagram, and enables
                    retargeting campaigns based on your site visits.
                  </span>
                </li>
              </ul>
              <p className="mt-3">
                You can opt out of Google Analytics tracking via the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  className="text-primary underline hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                . You can manage Meta ad preferences at{" "}
                <a
                  href="https://www.facebook.com/settings/?tab=ads"
                  className="text-primary underline hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  facebook.com/settings
                </a>
                . You may also adjust your browser's cookie settings to limit
                tracking.
              </p>
            </PolicySection>

            {/* 5b. Lead Capture */}
            <PolicySection number="6" title="Lead Capture & Interest Form">
              <p>
                When you visit our site and express interest in placing an
                order, we may invite you to fill in a brief{" "}
                <strong className="text-primary">"Stay in Touch"</strong> form
                before proceeding to checkout. This form collects:
              </p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  { emoji: "👤", text: "Your name" },
                  { emoji: "📱", text: "Phone number" },
                  { emoji: "📧", text: "Email address" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                This information is stored securely and is visible to the site
                administrator in the admin portal. We use it solely to follow up
                on your interest, answer questions about our services, and
                potentially assist you in completing an order. You may choose to
                skip this form — it is entirely optional.
              </p>
              <p className="mt-2">
                We do not share lead data with any third parties or use it for
                unsolicited marketing.
              </p>
            </PolicySection>

            {/* 6. Artwork Delivery & Watermarking */}
            <PolicySection
              number="7"
              title="Artwork Delivery & Watermarked Preview"
            >
              <p>
                Once your caricature artwork is completed, a{" "}
                <strong className="text-primary">watermarked preview</strong> of
                your artwork will be made available on your order tracking page.
                The watermark ("Cherishables") is applied automatically and is
                visible on the preview image.
              </p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "🔓",
                    text: "Once your payment is confirmed (online or COD), the clean full-resolution artwork is unlocked for download.",
                  },
                  {
                    emoji: "🖼️",
                    text: "The watermarked preview is solely for identification purposes and does not represent the final quality of your artwork.",
                  },
                  {
                    emoji: "📩",
                    text: "Download links are available exclusively on your personal order tracking page.",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </PolicySection>

            {/* 7. Order Tracking */}
            <PolicySection number="8" title="Order Tracking">
              <p>
                After placing an order, you will receive an{" "}
                <strong className="text-primary">Order ID</strong> (e.g.
                CC-XXXXX) that you can use to track your order status at any
                time on our website.
              </p>
              <p className="mt-2">
                Your order progresses through the following stages:
              </p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "⏳",
                    text: "Pending — order placed, awaiting payment confirmation",
                  },
                  {
                    emoji: "✅",
                    text: "Paid — payment received and confirmed",
                  },
                  {
                    emoji: "🎨",
                    text: "Processing — artwork is being created by our artist",
                  },
                  {
                    emoji: "📦",
                    text: "Shipped — your physical product is on its way",
                  },
                  {
                    emoji: "🚚",
                    text: "Out for Delivery — your package is with the delivery agent",
                  },
                  {
                    emoji: "🎉",
                    text: "Delivered — your order has been successfully delivered",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                Order confirmation emails are sent automatically to your
                registered email address as soon as your order is placed,
                including for COD orders.
              </p>
            </PolicySection>

            {/* 8. Photo Uploads (renumbered) */}
            <PolicySection number="9" title="Photo Uploads">
              <p>
                Photos you upload are used{" "}
                <strong className="text-primary">solely</strong> to create your
                personalised caricature artwork.
              </p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "🔒",
                    text: "Your photos are not shared with any third parties",
                  },
                  {
                    emoji: "🚫",
                    text: "Your photos are never used for marketing, training AI models, or any other purpose",
                  },
                  {
                    emoji: "🗑️",
                    text: "You may request deletion of your uploaded photos at any time by contacting us",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </PolicySection>

            {/* 10. Data Retention */}
            <PolicySection number="10" title="Data Retention">
              <p>
                We retain your order details, contact information, and uploaded
                photos for as long as necessary to fulfil your order and
                maintain reasonable business records.
              </p>
              <p>
                If you would like your data to be deleted, please contact us at{" "}
                <a
                  href="mailto:orders@cherishables.in"
                  className="text-primary underline hover:text-accent transition-colors"
                >
                  orders@cherishables.in
                </a>{" "}
                and we will process your request promptly.
              </p>
            </PolicySection>

            {/* 11. Your Rights */}
            <PolicySection number="11" title="Your Rights">
              <p>You have the right to:</p>
              <ul className="list-none space-y-2 mt-2">
                {[
                  {
                    emoji: "👁️",
                    text: "Access the personal data we hold about you",
                  },
                  {
                    emoji: "✏️",
                    text: "Request correction of inaccurate or incomplete information",
                  },
                  {
                    emoji: "🗑️",
                    text: "Request deletion of your personal data",
                  },
                  {
                    emoji: "📤",
                    text: "Request a copy of your data in a portable format",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{item.emoji}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please email us at{" "}
                <a
                  href="mailto:orders@cherishables.in"
                  className="text-primary underline hover:text-accent transition-colors"
                >
                  orders@cherishables.in
                </a>
                .
              </p>
            </PolicySection>

            {/* 12. Contact Us */}
            <PolicySection number="12" title="Contact Us">
              <p>
                For any privacy-related queries, concerns, or requests, please
                reach out to us:
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 hover:bg-primary/10 transition-colors">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href="mailto:orders@cherishables.in"
                      className="font-semibold text-primary hover:text-accent transition-colors"
                      data-ocid="privacy.contact_email"
                    >
                      orders@cherishables.in
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 hover:bg-primary/10 transition-colors">
                  <span className="text-lg flex-shrink-0">📸</span>
                  <div>
                    <p className="text-sm text-muted-foreground">Instagram</p>
                    <a
                      href="https://instagram.com/cherishables.in"
                      className="font-semibold text-primary hover:text-accent transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="privacy.contact_instagram"
                    >
                      @cherishables.in
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 hover:bg-primary/10 transition-colors">
                  <span className="text-lg flex-shrink-0">💬</span>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <a
                      href="https://wa.me/918431274009"
                      className="font-semibold text-primary hover:text-accent transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="privacy.contact_whatsapp"
                    >
                      +91 84312 74009
                    </a>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We aim to respond to all privacy-related queries within 5
                working days.
              </p>
            </PolicySection>

            {/* 13. Updates to This Policy */}
            <PolicySection number="13" title="Updates to This Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, legal requirements, or services. When
                we make significant changes, we will update the effective date
                at the top of this page.
              </p>
              <p>
                Your continued use of{" "}
                <a
                  href="https://cherishables.shop"
                  className="text-primary underline hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cherishables.shop
                </a>{" "}
                after any changes constitutes your acceptance of the updated
                policy.
              </p>
            </PolicySection>
          </div>

          {/* Back to home */}
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 font-semibold hover:bg-accent transition-colors shadow-md ring-1 ring-primary/20"
              data-ocid="privacy.back_home_button"
            >
              ✨ Back to Cherishables
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
