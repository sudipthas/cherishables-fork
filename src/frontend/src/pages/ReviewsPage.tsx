import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadReviewImage } from "@/hooks/useAdmin";
import {
  useListPendingReviews,
  usePublicReviews,
  useSubmitReview,
} from "@/hooks/useQueries";
import { CheckCircle2, Loader2, Star, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function useScrollAnimate() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(
              "opacity-100",
              "translate-y-0",
            );
            (entry.target as HTMLElement).classList.remove(
              "opacity-0",
              "translate-y-6",
            );
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          data-ocid={`review.rating_star.${star}`}
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hover || value)
                ? "fill-[#d4a017] text-[#d4a017]"
                : "text-[#e5e7eb]"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-[#991b1b]">
        {value > 0 ? `${value} out of 5` : "Select a rating"}
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const { data: reviewsRaw, isLoading: reviewsLoading } = usePublicReviews();
  const reviews = (reviewsRaw ?? [])
    .map((entry) => entry[1])
    .sort((a, b) => Number(b.createdAt - a.createdAt));

  const ref = useScrollAnimate();

  // Submission form state
  const [formName, setFormName] = useState("");
  const [formText, setFormText] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submitReview = useSubmitReview();
  const uploadImage = useUploadReviewImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = "Please enter your name";
    if (!formText.trim()) e.text = "Please write your review";
    if (formText.trim().length < 10)
      e.text = "Review must be at least 10 characters";
    if (formRating === 0) e.rating = "Please select a star rating";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage.mutateAsync(files[i]);
        urls.push(url);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setFormImages((prev) => [...prev, ...urls]);
      toast.success(
        `${files.length} image${files.length > 1 ? "s" : ""} uploaded`,
      );
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await submitReview.mutateAsync({
        name: formName.trim(),
        text: formText.trim(),
        rating: BigInt(formRating),
        imageUrl: formImages.length > 0 ? formImages[0] : null,
      });
      setShowSuccess(true);
      setFormName("");
      setFormText("");
      setFormRating(0);
      setFormImages([]);
      setErrors({});
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      toast.error(
        `Submission failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return (
    <div className="flex flex-col" data-ocid="reviews.page">
      {/* Hero Banner */}
      <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#1a0000]">
        {/* Decorative gold border line */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4a017] to-transparent" />
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #d4a017 1px, transparent 1px), radial-gradient(circle at 80% 50%, #d4a017 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#d4a017]/20 border border-[#d4a017]/40 rounded-full px-4 py-1.5 mb-6">
            <Star className="h-4 w-4 fill-[#d4a017] text-[#d4a017]" />
            <span className="text-sm font-medium text-[#d4a017] tracking-wider uppercase">
              Customer Reviews
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            What Our Customers
            <span className="block text-[#d4a017]">Are Saying</span>
          </h1>
          <p className="text-[#fca5a5] text-lg max-w-xl mx-auto">
            Real stories from real customers who cherish their Cherishables
            creations.
          </p>
        </div>
      </section>

      {/* Submit Review Section */}
      <section className="w-full py-16 md:py-20 bg-[#fff8f0]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[#7f1d1d] mb-3">
                Share Your Experience
              </h2>
              <p className="text-[#b91c1c] text-lg">
                We would love to hear about your Cherishables creation
              </p>
            </div>

            {showSuccess ? (
              <Card className="rounded-2xl shadow-soft border-[#d4a017]/30 bg-[#fffbeb]">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4a017]/20">
                    <CheckCircle2 className="h-8 w-8 text-[#d4a017]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#7f1d1d] mb-2">
                    Thank You!
                  </h3>
                  <p className="text-[#991b1b]">
                    Your review has been submitted and is pending approval. It
                    will appear on this page once approved by our team.
                  </p>
                  <Button
                    onClick={() => setShowSuccess(false)}
                    className="mt-6 rounded-xl bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                    data-ocid="review.success.dismiss_button"
                  >
                    Submit Another Review
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-soft border-[#fecaca] bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="review-name"
                        className="text-[#7f1d1d] font-semibold"
                      >
                        Your Name
                      </Label>
                      <Input
                        id="review-name"
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          if (errors.name)
                            setErrors((prev) => {
                              const n = { ...prev };
                              n.name = undefined;
                              return n;
                            });
                        }}
                        placeholder="e.g. Priya Sharma"
                        className={`rounded-xl border-[#fecaca] focus-visible:ring-[#dc2626] ${errors.name ? "border-red-500 ring-1 ring-red-500" : ""}`}
                        data-ocid="review.name_input"
                      />
                      {errors.name && (
                        <p
                          className="text-sm text-red-600"
                          data-ocid="review.name.field_error"
                        >
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-2">
                      <Label className="text-[#7f1d1d] font-semibold">
                        Your Rating
                      </Label>
                      <StarRatingInput
                        value={formRating}
                        onChange={(v) => {
                          setFormRating(v);
                          if (errors.rating)
                            setErrors((prev) => {
                              const n = { ...prev };
                              n.rating = undefined;
                              return n;
                            });
                        }}
                      />
                      {errors.rating && (
                        <p
                          className="text-sm text-red-600"
                          data-ocid="review.rating.field_error"
                        >
                          {errors.rating}
                        </p>
                      )}
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="review-text"
                        className="text-[#7f1d1d] font-semibold"
                      >
                        Your Review
                      </Label>
                      <textarea
                        id="review-text"
                        value={formText}
                        onChange={(e) => {
                          setFormText(e.target.value);
                          if (errors.text)
                            setErrors((prev) => {
                              const n = { ...prev };
                              n.text = undefined;
                              return n;
                            });
                        }}
                        placeholder="Tell us about your experience with Cherishables..."
                        rows={4}
                        className={`w-full rounded-xl border border-[#fecaca] bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] ${errors.text ? "border-red-500 ring-1 ring-red-500" : ""}`}
                        data-ocid="review.text_input"
                      />
                      {errors.text && (
                        <p
                          className="text-sm text-red-600"
                          data-ocid="review.text.field_error"
                        >
                          {errors.text}
                        </p>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-[#7f1d1d] font-semibold">
                        Photos of Your Creation{" "}
                        <span className="text-[#b91c1c]/60 font-normal text-sm">
                          (optional)
                        </span>
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        data-ocid="review.image_input"
                      />
                      <div className="flex flex-wrap gap-3">
                        {formImages.map((url, idx) => (
                          <div
                            key={url}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#fecaca] group"
                            data-ocid={`review.image_preview.${idx + 1}`}
                          >
                            <img
                              src={url}
                              alt={`Uploaded ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-[#1a0000]/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              data-ocid={`review.image_remove.${idx + 1}`}
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-[#fecaca] flex flex-col items-center justify-center text-[#b91c1c] hover:border-[#dc2626] hover:text-[#dc2626] transition-colors disabled:opacity-50"
                          data-ocid="review.upload_button"
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 mb-1" />
                              <span className="text-[10px]">Add Photo</span>
                            </>
                          )}
                        </button>
                      </div>
                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-[#b91c1c]">
                            <span>Uploading…</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-[#fee2e2] rounded-full h-2">
                            <div
                              className="bg-[#dc2626] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={submitReview.isPending || isUploading}
                      className="w-full rounded-xl bg-[#dc2626] text-white hover:bg-[#b91c1c] h-12 text-base font-semibold"
                      data-ocid="review.submit_button"
                    >
                      {submitReview.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section
        className="w-full py-20 md:py-28 bg-[#fef2f2]"
        ref={ref}
        data-ocid="reviews.list"
      >
        <div className="container mx-auto px-4">
          {reviewsLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 rounded-full border-4 border-[#dc2626] border-t-transparent animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20" data-ocid="reviews.empty_state">
              <Star className="h-14 w-14 text-[#dc2626]/30 mx-auto mb-4" />
              <p className="text-[#991b1b] text-lg font-medium">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <>
              <div
                className="text-center mb-14 opacity-0 translate-y-6 transition-all duration-700"
                data-animate
              >
                <p className="text-[#b91c1c] max-w-xl mx-auto text-lg">
                  {reviews.length} happy customer
                  {reviews.length !== 1 ? "s" : ""} and counting
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review, idx) => (
                  <div
                    key={review.id}
                    className="opacity-0 translate-y-6 transition-all duration-700 bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-elevated hover:-translate-y-1"
                    style={{ transitionDelay: `${idx * 80}ms` }}
                    data-animate
                    data-ocid={`reviews.item.${idx + 1}`}
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
                        {Array.from({ length: Number(review.rating) }).map(
                          (_, j) => (
                            <Star
                              key={`star-${review.id}-${j}`}
                              className="h-4 w-4 fill-[#dc2626] text-[#dc2626]"
                            />
                          ),
                        )}
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
