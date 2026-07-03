import type { AddonProduct } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListProducts } from "@/hooks/useAdmin";
import { usePublicReviews } from "@/hooks/useQueries";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  Brush,
  ChevronDown,
  Clock,
  Frame,
  Gift,
  Heart,
  Palette,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Upload,
  User,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to document.execCommand
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};
import { useCartContext } from "@/context/CartContext";
import { useCartAdd } from "@/hooks/useCart";
import { useActiveGalleryImages } from "../hooks/useGallery";
import {
  resolveVideoPlatform,
  useActiveHeroVideos,
  useHeroVideoSettings,
} from "../hooks/useHeroVideos";

/* ------------------------------------------------------------------ */
/*  Scroll-triggered animation hook                                   */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function HeroSection() {
  const videosQuery = useActiveHeroVideos();
  const settingsQuery = useHeroVideoSettings();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const settings = settingsQuery.data ?? {
    keepVolumeOn: true,
    autoplay: true,
    loopEnabled: true,
    muted: false,
  };

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

  const allVideos = videosQuery.data ?? [];
  const filteredVideos = allVideos.filter((v) => {
    const p = resolveVideoPlatform(v.platform);
    return isMobile
      ? p === "Mobile" || p === "Both"
      : p === "Website" || p === "Both";
  });

  useEffect(() => {
    setIsMuted(!settings.keepVolumeOn);
  }, [settings.keepVolumeOn]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || filteredVideos.length === 0) return;
    vid.muted = isMuted;
    const src = filteredVideos[currentVideoIndex]?.videoUrl;
    if (src && vid.src !== src) {
      vid.src = src;
    }
    if (settings.autoplay) {
      vid.play().catch(() => {
        // Browser blocked autoplay with sound — mute and retry
        setIsMuted(true);
        vid.muted = true;
        vid.play().catch(() => {});
      });
    }
  }, [currentVideoIndex, filteredVideos, settings.autoplay, isMuted]);

  function handleVideoEnded() {
    if (filteredVideos.length > 1) {
      setCurrentVideoIndex((i) => (i + 1) % filteredVideos.length);
    } else {
      videoRef.current?.play().catch(() => {});
    }
  }

  function toggleMute() {
    setIsMuted((m) => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ minHeight: "100svh" }}
      data-ocid="hero.section"
    >
      {/* Background video */}
      {filteredVideos.length > 0 ? (
        <video
          ref={videoRef}
          key={filteredVideos[currentVideoIndex]?.id ?? "novid"}
          src={filteredVideos[currentVideoIndex]?.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={settings.autoplay}
          loop={filteredVideos.length === 1 && settings.loopEnabled}
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnded}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7f1d1d] via-[#dc2626] to-[#92400e]" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[100svh] px-4 py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1
            className="font-display text-4xl md:text-6xl font-bold text-white drop-shadow-lg leading-tight"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
          >
            <span className="text-[#d4a017]">Cherishables</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/order-portrait"
              data-ocid="hero.order_portrait_button"
              className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <User className="h-5 w-5" />
              Order Portrait
            </Link>
            <Link
              to="/order-gift"
              data-ocid="hero.order_gift_button"
              className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Gift className="h-5 w-5" />
              Order Gift
            </Link>
            <Link
              to="/order-3d-model"
              data-ocid="hero.order_3d_button"
              className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Box className="h-5 w-5" />
              Order 3D Model
            </Link>
            <Link
              to="/order-available-models"
              data-ocid="hero.order_available_models_button"
              className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-5 w-5" />
              Available Models
            </Link>
          </div>
        </div>
      </div>

      {/* Sound toggle */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        data-ocid="hero.sound_toggle"
        className="absolute bottom-6 right-6 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200"
      >
        {isMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </section>
  );
}

function useScrollAnimate() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            entry.target.classList.remove("opacity-0", "translate-y-6");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    const children = el.querySelectorAll("[data-animate]");
    for (const child of children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const pricingPlans = [
  {
    title: "Single Portrait",
    price: "₹499",
    subtitle: "",
    emoji: "👤",
    description: "One person, one beautiful portrait.",
    popular: false,
  },
  {
    title: "Couple Portrait",
    price: "₹799",
    subtitle: "",
    emoji: "💑",
    description: "Romantic couple portraits for anniversaries & gifts.",
    popular: true,
  },
  {
    title: "Family Portrait",
    price: "₹1,299",
    subtitle: "",
    emoji: "👨‍👩‍👧‍👦",
    description: "Capture the whole family in one adorable artwork.",
    popular: false,
  },
  {
    title: "Group Portrait",
    price: "₹699",
    subtitle: "per head",
    emoji: "👥",
    description: "Friends, teams, or events — priced per person.",
    popular: false,
  },
];

const _galleryItems = [
  {
    src: "/assets/images/portrait1.jpg",
    alt: "Stylish Single Portrait",
    category: "Single",
    style: "Stylish Single Portrait",
  },
  {
    src: "/assets/images/portrait2.jpg",
    alt: "Cute Cartoon Portrait",
    category: "Single",
    style: "Cute Cartoon Portrait",
  },
  {
    src: "/assets/images/portrait3.jpg",
    alt: "Professional Couple Portrait",
    category: "Couple",
    style: "Professional Couple Portrait",
  },
  {
    src: "/assets/images/portrait4.jpg",
    alt: "Soft Aesthetic Portrait",
    category: "Single",
    style: "Soft Aesthetic Portrait",
  },
  {
    src: "/assets/images/portrait5.jpg",
    alt: "Family Portrait",
    category: "Family",
    style: "Family Portrait",
  },
  {
    src: "/assets/images/portrait6.jpg",
    alt: "Funny Portrait",
    category: "Fun",
    style: "Funny Portrait",
  },
  {
    src: "/assets/images/portrait7.jpg",
    alt: "Chibi Style Portrait",
    category: "Single",
    style: "Chibi Style Portrait",
  },
  {
    src: "/assets/images/portrait8.jpg",
    alt: "Couple Illustration",
    category: "Couple",
    style: "Couple Illustration",
  },
  {
    src: "/assets/images/portrait9.jpg",
    alt: "Single Portrait",
    category: "Single",
    style: "Single Portrait",
  },
  {
    src: "/assets/images/portrait10.jpg",
    alt: "Custom Style Portrait",
    category: "Fun",
    style: "Custom Style Portrait",
  },
  {
    src: "/assets/images/portrait11.jpg",
    alt: "Funny Exaggerated Portrait",
    category: "Fun",
    style: "Funny Exaggerated Portrait",
  },
  {
    src: "/assets/images/portrait12.jpg",
    alt: "Full Body Portrait",
    category: "Single",
    style: "Full Body Portrait",
  },
];

const howItWorksSteps = [
  {
    number: "01",
    title: "Upload Your Photo",
    description:
      "Share a clear photo of yourself, your partner, family, or friends.",
    icon: Upload,
    color: "bg-[#fee2e2] border-[#fca5a5]",
    numberColor: "bg-primary text-white",
  },
  {
    number: "02",
    title: "Choose Your Style",
    description:
      "Pick from cute cartoon, professional, chibi, or funny exaggerated.",
    icon: Palette,
    color: "bg-[#fef2f2] border-[#fca5a5]",
    numberColor: "bg-primary text-white",
  },
  {
    number: "03",
    title: "Artist Creates",
    description: "Sharon handcrafts your unique artwork with care and detail.",
    icon: Brush,
    color: "bg-[#fef2f2] border-[#fca5a5]",
    numberColor: "bg-primary text-white",
  },
  {
    number: "04",
    title: "Receive Your Art",
    description:
      "Get your high-resolution digital artwork delivered in 4–5 days.",
    icon: Sparkles,
    color: "bg-[#fef2f2] border-[#fca5a5]",
    numberColor: "bg-primary text-white",
  },
];

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Portraits are delivered within 4–5 working days. Gift keepsakes take 4–5 days, and 3D miniature orders take 4–5 days.",
  },
  {
    q: "What file format will I receive?",
    a: "You will receive a high-resolution PNG/JPG digital file (300 DPI, print-ready) via digital download.",
  },
  {
    q: "Can I request changes?",
    a: "Yes! One free revision is included with every order. Just reply to your delivery email with your feedback.",
  },
  {
    q: "Which portrait types do you offer?",
    a: "We offer Single, Couple, Family, and Group portraits. Custom quotes are available for large groups.",
  },
  {
    q: "How do I pay?",
    a: "India customers: scan the UPI QR code at checkout. International customers: place your order and we'll email you a PayPal or bank transfer link within a few hours.",
  },
  {
    q: "Do you accept international orders?",
    a: "Yes! We accept orders from anywhere in the world. Select 'International' at checkout and we'll send you payment instructions via email (PayPal or bank transfer).",
  },
  {
    q: "How do I send my photo?",
    a: "Upload your photo directly on the order page. Make sure it's clear and well-lit for the best results.",
  },
];

const _categoryBadgeColors: Record<string, string> = {
  Couple: "bg-primary text-white",
  Single: "bg-primary text-white",
  Family: "bg-primary text-white",
  Fun: "bg-primary text-white",
};

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */
function FaqItem({
  question,
  answer,
  index,
}: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const bgColors = [
    "bg-[#fee2e2]/50",
    "bg-[#fef2f2]/50",
    "bg-[#e8f5e9]/50",
    "bg-[#f3e5f5]/50",
  ];
  const borderColors = [
    "border-[#fca5a5]/40",
    "border-[#fca5a5]/40",
    "border-[#81c784]/40",
    "border-[#ce93d8]/40",
  ];
  const bg = bgColors[index % bgColors.length];
  const border = borderColors[index % borderColors.length];

  return (
    <div className={`rounded-2xl border ${border} ${bg} mb-3 overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-6 text-left group"
        data-ocid="faq.question_button"
      >
        <span className="text-base font-semibold text-foreground group-hover:text-[#dc2626] transition-smooth pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-48 opacity-100 pb-5 px-6" : "max-h-0 opacity-0"}`}
      >
        <p className="text-muted-foreground leading-relaxed text-sm">
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decorative SVGs                                                  */
/* ------------------------------------------------------------------ */
function HandDrawnUnderline() {
  return (
    <svg
      className="w-32 h-4 mx-auto mt-2"
      viewBox="0 0 120 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12 Q30 2 60 10 T118 8"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function PaintbrushDoodle() {
  return (
    <svg
      className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 hidden lg:block"
      viewBox="0 0 800 16"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 8 Q100 2 200 8 T400 8 T600 8 T800 8"
        stroke="#dc2626"
        strokeWidth="2"
        strokeDasharray="8 6"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

function StarDecoration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 2 L19 12 L30 12 L21 19 L24 30 L16 23 L8 30 L11 19 L2 12 L13 12 Z"
        fill="#dc2626"
        opacity="0.8"
      />
    </svg>
  );
}

function SparkleDecoration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
        fill="#dc2626"
        opacity="0.7"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */
function ShowcaseStripSection() {
  const allPortraits = [
    { src: "/assets/images/portrait1.jpg", caption: "Stylish Single Portrait" },
    { src: "/assets/images/portrait2.jpg", caption: "Cute Cartoon Portrait" },
    {
      src: "/assets/images/portrait3.jpg",
      caption: "Professional Couple Portrait",
    },
    { src: "/assets/images/portrait4.jpg", caption: "Soft Aesthetic Portrait" },
    { src: "/assets/images/portrait5.jpg", caption: "Family Portrait" },
    { src: "/assets/images/portrait6.jpg", caption: "Funny Portrait" },
    { src: "/assets/images/portrait7.jpg", caption: "Chibi Style Portrait" },
    { src: "/assets/images/portrait8.jpg", caption: "Couple Illustration" },
    { src: "/assets/images/portrait9.jpg", caption: "Single Portrait" },
    { src: "/assets/images/portrait10.jpg", caption: "Custom Style Portrait" },
    {
      src: "/assets/images/portrait11.jpg",
      caption: "Funny Exaggerated Portrait",
    },
    { src: "/assets/images/portrait12.jpg", caption: "Full Body Portrait" },
  ];

  const borderColors = [
    "border-[#dc2626]",
    "border-[#dc2626]",
    "border-[#b91c1c]",
    "border-[#e91e63]",
    "border-[#4caf50]",
    "border-[#9c27b0]",
  ];

  const track1 = (
    <>
      {allPortraits.map((p) => (
        <div key={`t1-${p.src}`} className="flex-shrink-0 group relative">
          <div
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${borderColors[allPortraits.indexOf(p) % borderColors.length]} overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-110 bg-white`}
          >
            <img
              src={p.src}
              alt={p.caption}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#dc2626]/20">
            {p.caption}
          </div>
        </div>
      ))}
    </>
  );

  const track2 = (
    <>
      {allPortraits.map((p) => (
        <div key={`t2-${p.src}`} className="flex-shrink-0 group relative">
          <div
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${borderColors[allPortraits.indexOf(p) % borderColors.length]} overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-110 bg-white`}
          >
            <img
              src={p.src}
              alt={p.caption}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 text-xs font-bold text-[#991b1b] shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#dc2626]/20">
            {p.caption}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <section className="w-full py-12 bg-background overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[#991b1b] inline-flex items-center gap-2">
          🎨 Our Artwork
        </h2>
        <HandDrawnUnderline />
      </div>
      <div className="relative">
        <div className="marquee-track">
          {track1}
          {track2}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useScrollAnimate();

  return (
    <section className="w-full py-20 md:py-28 bg-background relative" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b]">
            How It Works
          </h2>
          <p className="mt-3 text-[#b91c1c] max-w-xl mx-auto">
            Four simple steps to your perfect artwork.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PaintbrushDoodle />
          {howItWorksSteps.map((step) => (
            <Card
              key={step.number}
              className={`rounded-3xl shadow-soft border-2 ${step.color} hover:shadow-elevated hover:-translate-y-2 transition-smooth opacity-0 translate-y-6 artist-card`}
              data-animate
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div
                  className={`h-14 w-14 rounded-full ${step.numberColor} flex items-center justify-center font-bold text-xl shadow-md`}
                >
                  {step.number}
                </div>
                <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <step.icon className="h-6 w-6 text-[#991b1b]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#991b1b]">
                  {step.title}
                </h3>
                <p className="text-sm text-[#b91c1c] leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const ref = useScrollAnimate();
  const { data: backendImages, isLoading } = useActiveGalleryImages();

  const activeImages = backendImages
    ? backendImages
        .slice()
        .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder))
        .slice(0, 6)
    : [];

  const hasImages = activeImages.length > 0;

  return (
    <section
      id="gallery"
      className="w-full py-20 md:py-28 bg-[#fef2f2] relative"
      ref={ref}
    >
      {/* Decorative stars */}
      <StarDecoration className="absolute top-12 left-8 animate-wiggle" />
      <SparkleDecoration className="absolute top-20 right-12 animate-wiggle [animation-delay:0.5s]" />
      <StarDecoration className="absolute bottom-16 right-8 animate-wiggle [animation-delay:1s]" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-10 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b] inline-flex items-center gap-3">
            <Star className="h-8 w-8 text-[#dc2626] fill-[#dc2626]" />
            Gallery of Smiles
            <Star className="h-8 w-8 text-[#dc2626] fill-[#dc2626]" />
          </h2>
          <p className="mt-3 text-[#b91c1c] max-w-xl mx-auto">
            A glimpse of the styles and quality you can expect.
          </p>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            data-ocid="gallery.loading_state"
          >
            {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
              <div
                key={key}
                className="aspect-square rounded-2xl bg-[#fca5a5]/30 animate-pulse"
              />
            ))}
          </div>
        ) : hasImages ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {activeImages.map((img, idx) => (
              <Link
                key={img.id}
                to="/gallery"
                className="group relative aspect-square rounded-2xl shadow-soft overflow-hidden opacity-0 translate-y-6 artist-card block"
                data-animate
                data-ocid={`gallery.item.${idx + 1}`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-sm truncate">
                    {img.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-12 opacity-0 translate-y-6"
            data-animate
            data-ocid="gallery.empty_state"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fee2e2] mb-4">
              <Star className="h-8 w-8 text-[#dc2626]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#991b1b] mb-2">
              Gallery Coming Soon
            </h3>
            <p className="text-[#b91c1c] max-w-md mx-auto mb-6">
              We are curating beautiful portraits for our gallery. Check back
              soon or visit the full gallery page.
            </p>
            <Link to="/gallery" data-ocid="gallery.empty_state_cta">
              <Button
                variant="outline"
                className="rounded-full border-[#dc2626]/40 hover:bg-[#dc2626] hover:text-white text-[#991b1b] font-semibold transition-smooth"
              >
                View Full Gallery
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingSection() {
  const ref = useScrollAnimate();

  return (
    <section className="w-full py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b]">
            Simple Pricing
          </h2>
          <p className="mt-3 text-[#b91c1c] max-w-xl mx-auto">
            Transparent pricing for every occasion.
          </p>
          <p className="mt-2 text-sm text-[#b91c1c]">
            Prices shown in ₹ INR.{" "}
            <span className="text-[#dc2626] font-semibold">
              International orders accepted
            </span>
            {" — contact us for USD pricing."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`rounded-3xl shadow-soft border-2 border-[#dc2626]/10 hover:shadow-elevated hover:-translate-y-2 transition-smooth opacity-0 translate-y-6 artist-card overflow-visible ${plan.popular ? "border-[#dc2626]/60 relative" : ""}`}
              data-animate
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#dc2626] text-[#991b1b] text-xs font-bold px-4 py-1.5 rounded-full shadow-md z-10">
                  Most Popular
                </div>
              )}
              {/* Gradient header strip */}
              <div className="h-3 bg-gradient-to-r from-[#dc2626] via-[#dc2626] to-[#dc2626]" />
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="text-5xl" role="img" aria-label={plan.title}>
                  {plan.emoji}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#991b1b]">
                    {plan.title}
                  </h3>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-[#dc2626]">
                      {plan.price}
                    </span>
                    {plan.subtitle && (
                      <span className="text-sm text-[#b91c1c]">
                        {plan.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#b91c1c] leading-relaxed">
                  {plan.description}
                </p>
                <Link
                  to="/order-portrait"
                  className="w-full"
                  data-ocid={`pricing.${plan.title.toLowerCase().replace(/\s+/g, "_")}.button`}
                >
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-[#dc2626]/40 hover:bg-[#dc2626] hover:text-white text-[#991b1b] font-semibold transition-smooth"
                  >
                    Book Now
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection({
  reviews,
  reviewsLoading,
}: {
  reviews: {
    id: string;
    name: string;
    text: string;
    rating: number;
    imageUrl?: [] | [string] | string | null;
    createdAt: bigint;
  }[];
  reviewsLoading: boolean;
}) {
  const ref = useScrollAnimate();

  if (reviewsLoading) {
    return (
      <section className="w-full py-20 md:py-28 bg-[#fef2f2]">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-[#dc2626] border-t-transparent animate-spin" />
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="w-full py-20 md:py-28 bg-[#fef2f2]" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b]">
            Customer Reviews
          </h2>
          <p className="mt-3 text-[#b91c1c] max-w-xl mx-auto">
            See what our happy customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="opacity-0 translate-y-6 bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-elevated transition-smooth"
              data-animate
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                {(() => {
                  const imgUrl = Array.isArray(review.imageUrl)
                    ? review.imageUrl[0]
                    : review.imageUrl;
                  return imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Artwork for ${review.name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#fee2e2] flex items-center justify-center">
                      <span className="text-5xl font-bold text-[#dc2626]">
                        {review.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: Number(review.rating) }).map((_, j) => (
                    <Star
                      key={`rating-star-${review.id}-${j}`}
                      className="h-4 w-4 fill-[#f87171] text-[#f87171]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#991b1b] leading-relaxed italic mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#991b1b]">
                    {review.name}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Verified Customer
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Static product list — always shown, backend overrides image URLs  */
/* ------------------------------------------------------------------ */
interface StaticProduct {
  id: string;
  name: string;
  price: number; // in INR (display value)
  category: string;
  image: string;
}

const _STATIC_PRODUCTS: StaticProduct[] = [
  // Merchandise
  {
    id: "sp_1",
    name: "Custom Printed T-Shirts",
    price: 699,
    category: "Merchandise",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
  },
  {
    id: "sp_2",
    name: "Personalized Coffee Mugs",
    price: 399,
    category: "Merchandise",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
  },
  {
    id: "sp_3",
    name: "Custom Tote Bags",
    price: 599,
    category: "Merchandise",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  },
  // Prints & Frames
  {
    id: "sp_4",
    name: "Premium HD Portrait Print",
    price: 799,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
  },
  {
    id: "sp_5",
    name: "Matte Finish Portrait Frame",
    price: 1299,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
  },
  {
    id: "sp_6",
    name: "Glossy Finish Portrait Print",
    price: 1499,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80",
  },
  {
    id: "sp_7",
    name: "Canvas Print with Wooden Frame",
    price: 2199,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1561839561-b13bfe5ac5a7?w=400&q=80",
  },
  {
    id: "sp_8",
    name: "Black Matte Wooden Frame",
    price: 1999,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&q=80",
  },
  {
    id: "sp_9",
    name: "White Glossy Modern Frame",
    price: 1999,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
  },
  {
    id: "sp_10",
    name: "Vintage Wooden Portrait Frame",
    price: 2499,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1555487505-8603a1a69755?w=400&q=80",
  },
  {
    id: "sp_11",
    name: "Floating Frame Wall Art",
    price: 2799,
    category: "Prints & Frames",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
  },
  // LED & Glass
  {
    id: "sp_12",
    name: "3D Wooden Frame with LED Lights",
    price: 4499,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80",
  },
  {
    id: "sp_13",
    name: "Neon Light Portrait Frame",
    price: 5499,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
  },
  {
    id: "sp_14",
    name: "Personalized Night Lamp Frame",
    price: 3499,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80",
  },
  {
    id: "sp_15",
    name: "LED Light Frame",
    price: 4299,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  {
    id: "sp_16",
    name: "Acrylic Glass Frame",
    price: 3299,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1614521084980-57a0c5f0f0a6?w=400&q=80",
  },
  {
    id: "sp_17",
    name: "Neon Light Frame",
    price: 5299,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1608229351831-d72e0e3e21d9?w=400&q=80",
  },
  {
    id: "sp_18",
    name: "Crystal Glass Block",
    price: 4999,
    category: "LED & Glass",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  },
  // 3D Models
  {
    id: "sp_19",
    name: "Custom Bobblehead 3D Model",
    price: 6999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
  },
  {
    id: "sp_20",
    name: "Bobblehead Model",
    price: 5999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
  },
  {
    id: "sp_21",
    name: "Mini Figurine",
    price: 3999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&q=80",
  },
  {
    id: "sp_22",
    name: "Couple Miniature",
    price: 8999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
  },
  {
    id: "sp_23",
    name: "Wedding Miniature",
    price: 12999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80",
  },
  {
    id: "sp_24",
    name: "Family Miniature (4 Members)",
    price: 14999,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=400&q=80",
  },
  {
    id: "sp_25",
    name: "Pet Miniature",
    price: 4499,
    category: "3D Models",
    image:
      "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=400&q=80",
  },
];

const CATEGORY_PLACEHOLDER_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  Merchandise: { bg: "bg-[#dc2626]", text: "text-white" },
  "Prints & Frames": { bg: "bg-[#dc2626]", text: "text-white" },
  "LED & Glass": { bg: "bg-[#a855f7]", text: "text-white" },
  "3D Models": { bg: "bg-[#f97316]", text: "text-white" },
};

function ProductImagePlaceholder({
  name,
  category,
}: { name: string; category: string }) {
  const colors = CATEGORY_PLACEHOLDER_COLORS[category] ?? {
    bg: "bg-[#dc2626]",
    text: "text-white",
  };
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={`w-full aspect-square flex items-center justify-center ${colors.bg} ${colors.text} font-display text-2xl font-bold select-none`}
    >
      {initials}
    </div>
  );
}

function ProductImageWithFallback({
  src,
  name,
  category,
}: { src: string; name: string; category: string }) {
  const [failed, setFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (failed) {
    return <ProductImagePlaceholder name={name} category={category} />;
  }
  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isLoaded && (
        <div className="bg-gradient-to-br from-red-100 to-red-200 animate-pulse w-full h-full rounded-lg absolute inset-0" />
      )}
      <img
        src={src}
        alt={name}
        className="w-full aspect-square object-cover group-hover:scale-105 transition-smooth"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setFailed(true);
        }}
      />
    </div>
  );
}

function PrintableProductsSection() {
  const ref = useScrollAnimate();
  const navigate = useNavigate();
  const { data: backendProducts, isLoading } = useListProducts();

  const categories: {
    title: string;
    icon: React.ElementType;
    gradient: string;
    borderColor: string;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      title: "Merchandise",
      icon: ShoppingBag,
      gradient: "from-[#fee2e2] to-[#fef2f2]",
      borderColor: "border-[#dc2626]/20",
      iconBg: "bg-[#dc2626]/10",
      iconColor: "text-[#dc2626]",
    },
    {
      title: "Prints & Frames",
      icon: Frame,
      gradient: "from-[#fee2e2] to-[#fee2e2]",
      borderColor: "border-[#dc2626]/20",
      iconBg: "bg-[#dc2626]/10",
      iconColor: "text-[#dc2626]",
    },
    {
      title: "LED & Glass",
      icon: Sparkles,
      gradient: "from-[#fef2f2] to-[#fee2e2]",
      borderColor: "border-[#dc2626]/20",
      iconBg: "bg-[#dc2626]/10",
      iconColor: "text-[#dc2626]",
    },
    {
      title: "3D Models",
      icon: Box,
      gradient: "from-[#fef2f2] to-[#fee2e2]",
      borderColor: "border-[#b91c1c]/20",
      iconBg: "bg-[#b91c1c]/10",
      iconColor: "text-[#991b1b]",
    },
  ];

  const grouped = categories.map((cat) => ({
    ...cat,
    products: (backendProducts ?? []).filter(
      (p: AddonProduct) => p.category === cat.title,
    ),
  }));

  return (
    <section className="w-full py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b]">
            Bring Your Artwork to Life
          </h2>
          <p className="mt-3 text-[#b91c1c] max-w-xl mx-auto">
            Turn your digital artwork into a premium physical keepsake
          </p>
          {isLoading && (
            <p className="mt-2 text-xs text-[#b91c1c]/60 animate-pulse">
              Loading latest products…
            </p>
          )}
        </div>

        <div className="space-y-10">
          {grouped.map((cat) => (
            <div
              key={cat.title}
              className={`rounded-2xl border-2 ${cat.borderColor} bg-gradient-to-br ${cat.gradient} p-6 opacity-0 translate-y-6 hover:shadow-elevated transition-smooth`}
              data-animate
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}
                  >
                    <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#991b1b]">
                    {cat.title}
                  </h3>
                </div>
                <Link
                  to="/order-gift"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-[#dc2626] hover:text-[#dc2626] transition-smooth"
                  data-ocid="printable.add_to_order_link"
                >
                  Browse All Gifts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Product Grid */}
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {cat.products.map((product: AddonProduct) => {
                    const productUrl = `${window.location.origin}/product/${product.id}`;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className="flex flex-col h-full rounded-xl bg-white/80 border border-[#dc2626]/20 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-smooth group cursor-pointer text-left w-full"
                        data-ocid={`printable.product.${product.id}`}
                        onClick={() =>
                          navigate({
                            to: "/product/$id",
                            params: { id: product.id },
                          })
                        }
                      >
                        <div className="w-full aspect-square overflow-hidden relative">
                          {product.imageUrl ? (
                            <ProductImageWithFallback
                              src={product.imageUrl}
                              name={product.name}
                              category={cat.title}
                            />
                          ) : (
                            <ProductImagePlaceholder
                              name={product.name}
                              category={cat.title}
                            />
                          )}
                          {/* Share button */}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const success = await copyToClipboard(productUrl);
                              if (success) {
                                toast.success("Product link copied!");
                              } else {
                                toast.error("Failed to copy link");
                              }
                            }}
                            aria-label={`Share ${product.name}`}
                            className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-[#dc2626] rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            data-ocid={`printable.product.${product.id}.share_button`}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="p-2 flex flex-col flex-1">
                          <p className="text-xs font-semibold text-[#991b1b] leading-snug line-clamp-2 flex-1">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="mt-1 text-[10px] text-[#b91c1c]/80 leading-snug line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs font-bold text-[#dc2626]">
                            ₹
                            {Number(product.price / 100n).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 sm:hidden">
                <Link
                  to="/order-gift"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#dc2626] hover:text-[#dc2626] transition-smooth"
                  data-ocid="printable.mobile_add_to_order_link"
                >
                  Browse All Gifts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const ref = useScrollAnimate();

  return (
    <section className="w-full py-20 md:py-28 bg-background relative" ref={ref}>
      {/* Big question mark decoration */}
      <div className="absolute top-8 right-8 text-[120px] font-display font-bold text-[#dc2626]/10 leading-none select-none pointer-events-none hidden md:block">
        ?
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-14 opacity-0 translate-y-6" data-animate>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#991b1b]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-[#b91c1c]">
            Everything you need to know before ordering.
          </p>
        </div>

        <div className="opacity-0 translate-y-6" data-animate>
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} question={faq.q} answer={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTASection() {
  const ref = useScrollAnimate();

  return (
    <section
      className="w-full py-20 md:py-28 bg-gradient-to-br from-[#fee2e2] via-[#fee2e2] to-[#fef2f2] relative overflow-hidden"
      ref={ref}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div
          className="max-w-2xl mx-auto text-center opacity-0 translate-y-6"
          data-animate
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-[#991b1b] leading-tight">
            Ready to See Yourself as{" "}
            <span className="gradient-text-coral">Artwork?</span>
          </h2>
          <p className="mt-4 text-[#b91c1c] text-lg">
            Your custom artwork is just a few clicks away.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <Link
              to="/order"
              search={{ flow: "portrait" }}
              data-ocid="cta.order_portrait_button"
            >
              <Button
                size="lg"
                className="bg-[#dc2626] text-white hover:bg-[#dc2626] shadow-warm rounded-full px-10 py-7 text-lg font-bold transition-smooth hover:animate-bounce-hover"
              >
                Order Your Portrait
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link
              to="/order"
              search={{ flow: "gift" }}
              data-ocid="cta.order_gift_button"
            >
              <Button
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-bold bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg hover:shadow-xl transition-smooth"
              >
                <Gift className="h-5 w-5 mr-2" />
                Order a Gift
              </Button>
            </Link>
            <Link
              to="/order"
              search={{ flow: "3d" }}
              data-ocid="cta.order_3d_button"
            >
              <Button
                size="lg"
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-lg hover:shadow-xl hover:scale-105 rounded-full px-10 py-7 text-lg font-bold transition-all duration-300"
              >
                <Box className="h-5 w-5 mr-2" />
                Order 3D Model
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { data: reviewsRaw, isLoading: reviewsLoading } = usePublicReviews();
  const reviews = (reviewsRaw ?? [])
    .map((entry) => entry[1])
    .sort((a, b) => Number(b.createdAt - a.createdAt));

  return (
    <div className="flex flex-col">
      <HeroSection />
      <ShowcaseStripSection />
      <HowItWorksSection />
      <GallerySection />
      <PricingSection />
      <PrintableProductsSection />
      <ReviewsSection reviews={reviews} reviewsLoading={reviewsLoading} />
      <FAQSection />
      <ContactCTASection />
    </div>
  );
}
