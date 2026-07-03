import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WatermarkedImageProps {
  imageUrl: string;
  isPaid: boolean;
  onDownload: () => void;
  downloading?: boolean;
  downloadLabel?: string;
  title?: string;
  description?: string;
  cardClassName?: string;
  dataOcid?: string;
}

function drawWatermark(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  text: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = img.naturalWidth || 800;
  const cssHeight = img.naturalHeight || 600;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  ctx.scale(dpr, dpr);
  ctx.drawImage(img, 0, 0, cssWidth, cssHeight);

  const fontSize = Math.max(
    18,
    Math.round(Math.min(cssWidth, cssHeight) * 0.035),
  );
  ctx.font = `bold ${fontSize}px var(--font-display), serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const spacingX = cssWidth / 3.5;
  const spacingY = cssHeight / 4;

  for (let row = -2; row < 6; row++) {
    for (let col = -2; col < 6; col++) {
      const x = col * spacingX + (row % 2 === 0 ? 0 : spacingX / 2);
      const y = row * spacingY + spacingY / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((-30 * Math.PI) / 180);

      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillText(text, 2, 2);

      ctx.fillStyle = "rgba(220, 38, 38, 0.45)";
      ctx.fillText(text, 0, 0);

      ctx.restore();
    }
  }
}

export default function WatermarkedImage({
  imageUrl,
  isPaid,
  onDownload,
  downloading = false,
  downloadLabel = "Download Full Resolution",
  title = "Your Artwork is Ready!",
  description = "High-quality HD caricature artwork — watermark-free. Download your custom portrait now.",
  cardClassName = "",
  dataOcid,
}: WatermarkedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasLoaded, setCanvasLoaded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [error, setError] = useState(false);

  // For unpaid: draw watermarked canvas preview
  useEffect(() => {
    if (!imageUrl || isPaid) return;
    setCanvasLoaded(false);
    setError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (canvasRef.current) {
        drawWatermark(canvasRef.current, img, "Cherishables");
        setCanvasLoaded(true);
      }
    };
    img.onerror = () => setError(true);
    img.src = imageUrl;
  }, [imageUrl, isPaid]);

  // --- PAID STATE: clean full-size image, no watermark ---
  if (isPaid) {
    return (
      <Card
        className={`rounded-2xl shadow-soft border-accent/20 bg-accent/5 mb-8 animate-scale-in overflow-hidden ${cardClassName}`}
        data-ocid={dataOcid}
      >
        <CardContent className="p-0">
          <div className="w-full bg-muted/20 relative">
            {!imgLoaded && !error && (
              <div className="flex items-center justify-center aspect-[4/3]">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center aspect-[4/3] text-muted-foreground text-sm">
                Unable to load artwork
              </div>
            )}
            <img
              src={imageUrl}
              alt="Your artwork"
              onLoad={() => setImgLoaded(true)}
              onError={() => setError(true)}
              className={`w-full h-auto block transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ maxHeight: "80vh", objectFit: "contain" }}
            />
          </div>
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <svg
                className="h-4 w-4 text-green-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Payment Confirmed — Clean Artwork Unlocked
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
              {description}
            </p>
            <Button
              onClick={onDownload}
              disabled={downloading}
              size="lg"
              className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-warm px-8"
              data-ocid={`${dataOcid}.download_button`}
            >
              <Download className="mr-2 h-5 w-5" />
              {downloading ? "Downloading..." : downloadLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- UNPAID STATE: watermarked canvas preview + lock overlay ---
  return (
    <Card
      className={`rounded-2xl shadow-soft border-accent/20 bg-accent/5 mb-8 animate-scale-in overflow-hidden ${cardClassName}`}
      data-ocid={dataOcid}
    >
      <CardContent className="p-6 text-center">
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>

        <div className="relative mx-auto mb-6 w-full max-w-lg rounded-xl overflow-hidden border border-border bg-muted/30">
          {!canvasLoaded && !error && (
            <div className="flex items-center justify-center aspect-[4/3]">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center aspect-[4/3] text-muted-foreground text-sm">
              Unable to load preview
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`w-full h-auto transition-opacity duration-500 ${canvasLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          />
          {canvasLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <Lock className="h-10 w-10 text-white/90 mb-2 drop-shadow-md" />
              <p className="text-white font-semibold text-sm drop-shadow-md px-4 text-center">
                Complete payment to download the full resolution file
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 text-primary" />
          <span>Your artwork is ready! Complete payment to download.</span>
        </div>
      </CardContent>
    </Card>
  );
}
