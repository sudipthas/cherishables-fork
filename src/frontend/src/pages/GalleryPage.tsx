import { useActiveGalleryImages } from "@/hooks/useGallery";
import { X, ZoomIn } from "lucide-react";
import { useState } from "react";

function LightboxOverlay({
  url,
  title,
  onClose,
}: { url: string; title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      // biome-ignore lint/a11y/useSemanticElements: backdrop div requires click + key on same element
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-ocid="gallery.dialog"
    >
      <button
        type="button"
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
        data-ocid="gallery.close_button"
      >
        <X className="h-5 w-5 text-white" />
      </button>
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <img
          src={url}
          alt={title}
          className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain"
        />
        {title && <p className="text-white/80 text-sm font-medium">{title}</p>}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { data: images, isLoading } = useActiveGalleryImages();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>("");

  const sorted = [...(images ?? [])].sort(
    (a, b) => Number(a.displayOrder) - Number(b.displayOrder),
  );

  return (
    <main className="min-h-[80vh] bg-background" data-ocid="gallery.page">
      {/* Hero banner */}
      <section className="relative py-16 md:py-20 bg-card border-b overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7f1d1d]/30 via-transparent to-[#d4a017]/20 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight"
            style={{ textShadow: "0 2px 8px rgba(212,160,23,0.25)" }}
          >
            Our <span className="text-[#dc2626]">Gallery</span>
          </h1>
          <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-[#dc2626] to-[#d4a017] mb-4" />
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A collection of our handcrafted portraits and keepsake creations —
            each piece made with love.
          </p>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="container mx-auto px-4 py-12">
        {isLoading && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            data-ocid="gallery.loading_state"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list with no reordering
                key={`skeleton-${i}`}
                className="aspect-square rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-ocid="gallery.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Gallery Coming Soon
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Our gallery is being curated. Check back soon to see our beautiful
              handcrafted creations!
            </p>
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            data-ocid="gallery.list"
          >
            {sorted.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-soft border border-border/50 hover:border-[#d4a017]/60 hover:shadow-warm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]"
                onClick={() => {
                  setLightboxUrl(img.imageUrl);
                  setLightboxTitle(img.title);
                }}
                data-ocid={`gallery.item.${i + 1}`}
                aria-label={`View ${img.title} full size`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                  <div className="p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 w-full">
                    <p className="text-white text-sm font-medium truncate drop-shadow">
                      {img.title}
                    </p>
                  </div>
                </div>
                {/* Zoom icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <ZoomIn className="h-3.5 w-3.5 text-[#dc2626]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxUrl && (
        <LightboxOverlay
          url={lightboxUrl}
          title={lightboxTitle}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </main>
  );
}
