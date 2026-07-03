import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListPendingReviews } from "@/hooks/useQueries";
import type { Review, ReviewStatus } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, ImagePlus, Star, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReviewsAdminPanelProps {
  reviewsData: Array<[string, Review]> | undefined;
  reviewImageInputRef: React.RefObject<HTMLInputElement | null>;
  reviewImageUploading: boolean;
  uploadReviewImageFn: {
    mutateAsync: (file: File) => Promise<string>;
  };
  setReviewImageUploading: (v: boolean) => void;
  setReviewForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      text: string;
      rating: number;
      imageUrl: string;
      status: string;
    }>
  >;
  setSelectedReview: React.Dispatch<
    React.SetStateAction<[string, Review] | null>
  >;
  setIsReviewDialogOpen: (v: boolean) => void;
  setIsDeleteReviewDialogOpen: (v: boolean) => void;
  addReviewMutation: { isPending: boolean };
  updateReviewMutation: { isPending: boolean };
  deleteReviewMutation: { isPending: boolean };
}

export default function ReviewsAdminPanel({
  reviewsData,
  reviewImageInputRef,
  uploadReviewImageFn,
  setReviewImageUploading,
  setReviewForm,
  setSelectedReview,
  setIsReviewDialogOpen,
  setIsDeleteReviewDialogOpen,
}: ReviewsAdminPanelProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingReviews } = useListPendingReviews();

  const approveReview = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review approved successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve review");
    },
    onSettled: () => setProcessingId(null),
  });

  const rejectReview = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review rejected");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject review");
    },
    onSettled: () => setProcessingId(null),
  });

  const handleApprove = (id: string) => {
    setProcessingId(id);
    approveReview.mutate(id);
  };

  const handleReject = (id: string) => {
    setProcessingId(id);
    rejectReview.mutate(id);
  };

  const handleAddReview = () => {
    setSelectedReview(null);
    setReviewForm({
      name: "",
      text: "",
      rating: 5,
      imageUrl: "",
      status: "Approved" as ReviewStatus,
    });
    setIsReviewDialogOpen(true);
  };

  const handleEditReview = (id: string, review: Review) => {
    const imgUrl = Array.isArray(review.imageUrl)
      ? review.imageUrl[0]
      : review.imageUrl;
    setSelectedReview([id, review]);
    setReviewForm({
      name: review.name,
      text: review.text,
      rating: Number(review.rating),
      imageUrl: imgUrl || "",
      status: review.status || "Approved",
    });
    setIsReviewDialogOpen(true);
  };

  const handleDeleteReview = (id: string, review: Review) => {
    setSelectedReview([id, review]);
    setIsDeleteReviewDialogOpen(true);
  };

  const renderStars = (rating: number, prefix: string) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={`${prefix}-star-${i + 1}`}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  const renderReviewCard = (
    id: string,
    review: Review,
    showActions = true,
    isPending = false,
  ) => {
    const imgUrl = Array.isArray(review.imageUrl)
      ? review.imageUrl[0]
      : review.imageUrl;
    const initials = review.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const dateStr = review.createdAt
      ? new Date(Number(review.createdAt) / 1_000_000).toLocaleDateString(
          "en-IN",
          { year: "numeric", month: "short", day: "numeric" },
        )
      : "";

    return (
      <Card
        key={id}
        className={`border transition-all hover:shadow-md ${
          isPending ? "border-yellow-200 bg-yellow-50/30" : "border-border"
        }`}
        data-ocid={`admin.review.item.${id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={review.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/20">
                  {initials || <User className="h-6 w-6" />}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-foreground">
                  {review.name}
                </span>
                {renderStars(Number(review.rating), `review-${id}`)}
                {dateStr && (
                  <span className="text-xs text-muted-foreground">
                    {dateStr}
                  </span>
                )}
                {isPending && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs"
                  >
                    Pending Approval
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {review.text}
              </p>
            </div>
            {showActions && (
              <div className="flex gap-2 flex-shrink-0">
                {isPending ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      onClick={() => handleApprove(id)}
                      disabled={processingId === id}
                      data-ocid="admin.review.approve_button"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {processingId === id && approveReview.isPending
                        ? "..."
                        : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleReject(id)}
                      disabled={processingId === id}
                      data-ocid="admin.review.reject_button"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {processingId === id && rejectReview.isPending
                        ? "..."
                        : "Reject"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditReview(id, review)}
                      data-ocid="admin.review.edit_button"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteReview(id, review)}
                      data-ocid="admin.review.delete_button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hidden file input for image upload */}
      <input
        ref={reviewImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setReviewImageUploading(true);
          try {
            const url = await uploadReviewImageFn.mutateAsync(file);
            setReviewForm((f) => ({ ...f, imageUrl: url }));
          } finally {
            setReviewImageUploading(false);
            if (reviewImageInputRef.current)
              reviewImageInputRef.current.value = "";
          }
        }}
      />

      {/* Pending Approval Section */}
      {pendingReviews && pendingReviews.length > 0 && (
        <section
          className="space-y-4"
          data-ocid="admin.reviews.pending_section"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground font-display">
                Pending Approval
              </h2>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-300"
              >
                {pendingReviews.length} pending
              </Badge>
            </div>
          </div>
          <div className="grid gap-4">
            {pendingReviews.map(([id, review]) =>
              renderReviewCard(id, review, true, true),
            )}
          </div>
        </section>
      )}

      {/* Approved Reviews Section */}
      <section className="space-y-4" data-ocid="admin.reviews.approved_section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground font-display">
            Customer Reviews
          </h2>
          <Button
            onClick={handleAddReview}
            className="rounded-xl bg-primary hover:bg-primary/90"
            data-ocid="admin.review.add_button"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        </div>

        {!reviewsData || reviewsData.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No reviews yet. Add your first review!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reviewsData.map(([id, review]) =>
              renderReviewCard(id, review, true, false),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
