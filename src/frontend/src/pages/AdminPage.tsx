import {
  ArtStyle,
  type OrderItem,
  OrderStatus,
  PaymentStatus,
  PortraitType,
  type ReviewStatus,
  createActor,
} from "@/backend";
import type {
  HeroVideo,
  MobileWebAppSettings,
  Order,
  WebsiteSettings,
} from "@/backend";
import { NotificationBell } from "@/components/NotificationBell";
import ReviewsAdminPanel from "@/components/ReviewsAdminPanel";
import TeamMembersAdminPanel from "@/components/admin/TeamMembersAdminPanel";
import CommunicationsPanel from "@/components/communications/CommunicationsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AddonProduct } from "@/hooks/useAdmin";
import {
  useAddProduct,
  useAddReview,
  useAddSalesRep,
  useAssignLeadToRep,
  useCartLeads,
  useDeleteCartLead,
  useDeleteOrder,
  useDeleteProduct,
  useDeleteReview,
  useGetRazorpayKeyId,
  useIsCallerAdmin,
  useListAllOrders,
  useListProducts,
  useListReviews,
  useListSalesReps,
  useMoveProductDown,
  useMoveProductUp,
  useRemoveSalesRep,
  useSaveRazorpayKeys,
  useSendPaymentReminder,
  useSetAdminEmail,
  useToggleProductCOD,
  useUpdateCartLeadStatus,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUpdateProductImage,
  useUpdateReview,
  useUploadFinalArtwork,
  useUploadProductImage,
  useUploadReviewImage,
} from "@/hooks/useAdmin";
import {
  useApproveReview,
  useListPendingReviews,
  useRejectReview,
  useUpdatePaymentStatus,
} from "@/hooks/useQueries";
import {
  useMobileWebAppSettings,
  useUpdateMobileWebAppSettings,
  useUpdateWebsiteSettings,
  useWebsiteSettings,
} from "@/hooks/useSettings";
import { AVAILABLE_MODELS_CATEGORY, type Review } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Globe,
  ImageOff,
  Images,
  Lock,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Smartphone,
  Trash2,
  Upload,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  uploadGalleryImage,
  useAddGalleryImage,
  useDeleteGalleryImage,
  useGalleryImages,
  useUpdateGalleryImage,
} from "../hooks/useGallery";
import {
  resolveVideoPlatform,
  uploadHeroVideo,
  useAddHeroVideo,
  useAddHeroVideoForPlatform,
  useDeleteHeroVideo,
  useHeroVideoSettings,
  useHeroVideos,
  useUpdateHeroVideo,
  useUpdateHeroVideoSettings,
} from "../hooks/useHeroVideos";

function WebsiteMobileSettingsPanel() {
  const websiteQuery = useWebsiteSettings();
  const mobileQuery = useMobileWebAppSettings();
  const updateWebsite = useUpdateWebsiteSettings();
  const updateMobile = useUpdateMobileWebAppSettings();
  const heroVideosQuery = useHeroVideos();
  const deleteHeroVideoMutation = useDeleteHeroVideo();
  const addVideoForPlatform = useAddHeroVideoForPlatform();

  // Website hero video upload state
  const [wsHvTitle, setWsHvTitle] = useState("");
  const [wsHvFile, setWsHvFile] = useState<File | null>(null);
  const [wsHvProgress, setWsHvProgress] = useState(0);
  const [wsHvUploading, setWsHvUploading] = useState(false);

  // Mobile hero video upload state
  const [mobHvTitle, setMobHvTitle] = useState("");
  const [mobHvFile, setMobHvFile] = useState<File | null>(null);
  const [mobHvProgress, setMobHvProgress] = useState(0);
  const [mobHvUploading, setMobHvUploading] = useState(false);

  const allVideos = heroVideosQuery.data ?? [];
  const websiteVideos = [...allVideos]
    .filter((v) => {
      const p = resolveVideoPlatform(v.platform);
      return p === "Website" || p === "Both";
    })
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  const mobileVideos = [...allVideos]
    .filter((v) => {
      const p = resolveVideoPlatform(v.platform);
      return p === "Mobile" || p === "Both";
    })
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

  async function handleWebsiteVideoUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!wsHvFile) return toast.error("Please select a video file");
    if (!wsHvTitle.trim()) return toast.error("Please enter a title");
    setWsHvUploading(true);
    setWsHvProgress(10);
    try {
      const videoUrl = await uploadHeroVideo(wsHvFile);
      setWsHvProgress(80);
      await addVideoForPlatform.mutateAsync({
        title: wsHvTitle.trim(),
        videoUrl,
        platform: "Website",
      });
      setWsHvProgress(100);
      toast.success("Website hero video uploaded!");
      setWsHvTitle("");
      setWsHvFile(null);
      setWsHvProgress(0);
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setWsHvUploading(false);
    }
  }

  async function handleMobileVideoUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!mobHvFile) return toast.error("Please select a video file");
    if (!mobHvTitle.trim()) return toast.error("Please enter a title");
    setMobHvUploading(true);
    setMobHvProgress(10);
    try {
      const videoUrl = await uploadHeroVideo(mobHvFile);
      setMobHvProgress(80);
      await addVideoForPlatform.mutateAsync({
        title: mobHvTitle.trim(),
        videoUrl,
        platform: "Mobile",
      });
      setMobHvProgress(100);
      toast.success("Mobile hero video uploaded!");
      setMobHvTitle("");
      setMobHvFile(null);
      setMobHvProgress(0);
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setMobHvUploading(false);
    }
  }

  function handleDeleteVideo(video: HeroVideo) {
    if (window.confirm(`Delete video "${video.title}"?`)) {
      deleteHeroVideoMutation.mutate(video.id, {
        onSuccess: () => toast.success("Video deleted"),
        onError: (err) =>
          toast.error(
            `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
      });
    }
  }

  const [ws, setWs] = useState<WebsiteSettings>({
    siteName: "Cherishables",
    logoUrl: "/assets/logo.png",
    primaryColor: "#dc2626",
    secondaryColor: "#d4a017",
    contactEmail: "orders@cherishables.in",
    contactPhone: "+91 84312 74009",
    instagramUrl: "https://instagram.com/cherishables.in",
    whatsappNumber: "+91 84312 74009",
    heroVideoIds: [],
  });
  const [ms, setMs] = useState<MobileWebAppSettings>({
    appName: "Cherishables",
    splashScreenUrl: "/assets/logo.png",
    primaryColor: "#dc2626",
    secondaryColor: "#d4a017",
    heroVideoIds: [],
  });

  useEffect(() => {
    if (websiteQuery.data) setWs(websiteQuery.data);
  }, [websiteQuery.data]);

  useEffect(() => {
    if (mobileQuery.data) setMs(mobileQuery.data);
  }, [mobileQuery.data]);

  function handleSaveWebsite() {
    updateWebsite.mutate(ws, {
      onSuccess: () => toast.success("Website settings saved!"),
      onError: () => toast.error("Failed to save website settings."),
    });
  }

  function handleSaveMobile() {
    updateMobile.mutate(ms, {
      onSuccess: () => toast.success("Mobile app settings saved!"),
      onError: () => toast.error("Failed to save mobile settings."),
    });
  }

  function VideoList({
    videos,
    emptyOcid,
    itemOcidPrefix,
  }: {
    videos: HeroVideo[];
    emptyOcid: string;
    itemOcidPrefix: string;
  }) {
    if (heroVideosQuery.isLoading)
      return <p className="text-xs text-muted-foreground">Loading videos…</p>;
    if (videos.length === 0)
      return (
        <p className="text-xs text-muted-foreground" data-ocid={emptyOcid}>
          No videos uploaded yet.
        </p>
      );
    return (
      <div className="space-y-2">
        {videos.map((video, idx) => (
          <div
            key={video.id}
            className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2"
            data-ocid={`${itemOcidPrefix}.item.${idx + 1}`}
          >
            <video
              src={video.videoUrl}
              muted
              className="w-16 h-10 object-cover rounded-lg bg-muted flex-shrink-0"
            />
            <span className="flex-1 text-sm font-medium truncate">
              {video.title}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                video.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {video.isActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              aria-label="Delete video"
              onClick={() => handleDeleteVideo(video)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              data-ocid={`${itemOcidPrefix}.delete_button.${idx + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Top row: Website Settings + Mobile Web App Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Website Settings Card */}
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              Website Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ws-siteName">Site Name</Label>
                <Input
                  id="ws-siteName"
                  value={ws.siteName}
                  onChange={(e) =>
                    setWs((p) => ({ ...p, siteName: e.target.value }))
                  }
                  className="rounded-xl"
                  data-ocid="admin.settings.website.site_name_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-logoUrl">Logo URL</Label>
                <Input
                  id="ws-logoUrl"
                  placeholder="/assets/logo.png"
                  value={ws.logoUrl}
                  onChange={(e) =>
                    setWs((p) => ({ ...p, logoUrl: e.target.value }))
                  }
                  className="rounded-xl"
                  data-ocid="admin.settings.website.logo_url_input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ws-primaryColor">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="ws-primaryColor"
                    value={ws.primaryColor}
                    onChange={(e) =>
                      setWs((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border"
                    data-ocid="admin.settings.website.primary_color_input"
                  />
                  <Input
                    value={ws.primaryColor}
                    onChange={(e) =>
                      setWs((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-secondaryColor">
                  Secondary / Gold Color
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="ws-secondaryColor"
                    value={ws.secondaryColor}
                    onChange={(e) =>
                      setWs((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border"
                    data-ocid="admin.settings.website.secondary_color_input"
                  />
                  <Input
                    value={ws.secondaryColor}
                    onChange={(e) =>
                      setWs((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ws-contactEmail">Contact Email</Label>
                <Input
                  id="ws-contactEmail"
                  type="email"
                  value={ws.contactEmail}
                  onChange={(e) =>
                    setWs((p) => ({ ...p, contactEmail: e.target.value }))
                  }
                  className="rounded-xl"
                  data-ocid="admin.settings.website.contact_email_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-contactPhone">Contact Phone</Label>
                <Input
                  id="ws-contactPhone"
                  value={ws.contactPhone}
                  onChange={(e) =>
                    setWs((p) => ({ ...p, contactPhone: e.target.value }))
                  }
                  className="rounded-xl"
                  data-ocid="admin.settings.website.contact_phone_input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-instagramUrl">Instagram URL</Label>
              <Input
                id="ws-instagramUrl"
                value={ws.instagramUrl}
                onChange={(e) =>
                  setWs((p) => ({ ...p, instagramUrl: e.target.value }))
                }
                className="rounded-xl"
                data-ocid="admin.settings.website.instagram_url_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-whatsapp">WhatsApp Number</Label>
              <Input
                id="ws-whatsapp"
                value={ws.whatsappNumber}
                onChange={(e) =>
                  setWs((p) => ({ ...p, whatsappNumber: e.target.value }))
                }
                className="rounded-xl"
                data-ocid="admin.settings.website.whatsapp_number_input"
              />
            </div>
            <Button
              onClick={handleSaveWebsite}
              disabled={updateWebsite.isPending}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="admin.settings.website.save_button"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateWebsite.isPending ? "Saving..." : "Save Website Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Mobile Web App Settings Card */}
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" />
              Mobile Web App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ms-appName">App Name</Label>
              <Input
                id="ms-appName"
                value={ms.appName}
                onChange={(e) =>
                  setMs((p) => ({ ...p, appName: e.target.value }))
                }
                className="rounded-xl"
                data-ocid="admin.settings.mobile.app_name_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-splashScreen">Splash Screen URL</Label>
              <Input
                id="ms-splashScreen"
                placeholder="/assets/logo.png"
                value={ms.splashScreenUrl}
                onChange={(e) =>
                  setMs((p) => ({ ...p, splashScreenUrl: e.target.value }))
                }
                className="rounded-xl"
                data-ocid="admin.settings.mobile.splash_screen_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ms-primaryColor">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="ms-primaryColor"
                    value={ms.primaryColor}
                    onChange={(e) =>
                      setMs((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border"
                    data-ocid="admin.settings.mobile.primary_color_input"
                  />
                  <Input
                    value={ms.primaryColor}
                    onChange={(e) =>
                      setMs((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-secondaryColor">Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="ms-secondaryColor"
                    value={ms.secondaryColor}
                    onChange={(e) =>
                      setMs((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-border"
                    data-ocid="admin.settings.mobile.secondary_color_input"
                  />
                  <Input
                    value={ms.secondaryColor}
                    onChange={(e) =>
                      setMs((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
              These settings control how the app appears when installed as a PWA
              on mobile devices. The splash screen is shown on launch before the
              app loads.
            </div>
            <Button
              onClick={handleSaveMobile}
              disabled={updateMobile.isPending}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="admin.settings.mobile.save_button"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMobile.isPending ? "Saving..." : "Save Mobile Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Website Hero Videos + Mobile Hero Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Website Hero Videos Card */}
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-accent" />
              Website Hero Videos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Videos displayed in the hero section on the desktop/website.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleWebsiteVideoUpload}
              className="flex flex-wrap gap-3 items-end"
            >
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label htmlFor="ws-hv-title">Video Title</Label>
                <Input
                  id="ws-hv-title"
                  value={wsHvTitle}
                  onChange={(e) => setWsHvTitle(e.target.value)}
                  placeholder="e.g. Welcome Video"
                  className="rounded-xl"
                  data-ocid="admin.settings.website_video.title_input"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label htmlFor="ws-hv-file">Video File</Label>
                <Input
                  id="ws-hv-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setWsHvFile(e.target.files?.[0] ?? null)}
                  className="rounded-xl"
                  data-ocid="admin.settings.website_video.file_input"
                />
              </div>
              <Button
                type="submit"
                disabled={wsHvUploading}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl whitespace-nowrap"
                data-ocid="admin.settings.website_video.upload_button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {wsHvUploading ? "Uploading…" : "Upload Video"}
              </Button>
            </form>
            {wsHvUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{wsHvProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${wsHvProgress}%` }}
                  />
                </div>
              </div>
            )}
            <VideoList
              videos={websiteVideos}
              emptyOcid="admin.settings.website_video.empty_state"
              itemOcidPrefix="admin.settings.website_video"
            />
          </CardContent>
        </Card>

        {/* Mobile Web App Hero Videos Card */}
        <Card className="rounded-2xl shadow-soft border-border">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" />
              Mobile Web App Hero Videos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Videos displayed in the hero section on mobile devices.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleMobileVideoUpload}
              className="flex flex-wrap gap-3 items-end"
            >
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label htmlFor="mob-hv-title">Video Title</Label>
                <Input
                  id="mob-hv-title"
                  value={mobHvTitle}
                  onChange={(e) => setMobHvTitle(e.target.value)}
                  placeholder="e.g. Mobile Welcome"
                  className="rounded-xl"
                  data-ocid="admin.settings.mobile_video.title_input"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label htmlFor="mob-hv-file">Video File</Label>
                <Input
                  id="mob-hv-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setMobHvFile(e.target.files?.[0] ?? null)}
                  className="rounded-xl"
                  data-ocid="admin.settings.mobile_video.file_input"
                />
              </div>
              <Button
                type="submit"
                disabled={mobHvUploading}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl whitespace-nowrap"
                data-ocid="admin.settings.mobile_video.upload_button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {mobHvUploading ? "Uploading…" : "Upload Video"}
              </Button>
            </form>
            {mobHvUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{mobHvProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mobHvProgress}%` }}
                  />
                </div>
              </div>
            )}
            <VideoList
              videos={mobileVideos}
              emptyOcid="admin.settings.mobile_video.empty_state"
              itemOcidPrefix="admin.settings.mobile_video"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusBadgeVariant(
  status: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case OrderStatus.Received:
      return "secondary";
    case OrderStatus.InProgress:
      return "default";
    case OrderStatus.Shipped:
      return "secondary";
    case OrderStatus.OutForDelivery:
      return "secondary";
    case OrderStatus.Completed:
      return "outline";
    case OrderStatus.Delivered:
      return "default";
    default:
      return "secondary";
  }
}

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Shipped:
      return "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    case OrderStatus.OutForDelivery:
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    default:
      return "";
  }
}

/**
 * Safely extract the payment status string from a Candid-deserialized value.
 * The backend returns PaymentStatus as an enum string in the generated bindings,
 * but in case the Candid deserialization returns a variant object like { Paid: null },
 * we normalise it here.
 */
function resolvePaymentStatus(raw: unknown): PaymentStatus {
  if (typeof raw === "string") {
    const normalized = raw.replace(/^#/, "");
    if (normalized === "Paid") return PaymentStatus.Paid;
    if (normalized === "Pending") return PaymentStatus.Pending;
    if (normalized === "Failed") return PaymentStatus.Failed;
    if (normalized === "AdvancePaid") return PaymentStatus.AdvancePaid;
  }
  // Candid variant object: { Paid: null } | { Pending: null } | { Failed: null } | { AdvancePaid: null }
  // Also handles Motoko #Paid style deserialized as { "#Paid": null }
  if (raw && typeof raw === "object") {
    const keys = Object.keys(raw as object);
    for (const k of keys) {
      const norm = k.replace(/^#/, "");
      if (norm === "Paid") return PaymentStatus.Paid;
      if (norm === "Pending") return PaymentStatus.Pending;
      if (norm === "Failed") return PaymentStatus.Failed;
      if (norm === "AdvancePaid") return PaymentStatus.AdvancePaid;
    }
  }
  return PaymentStatus.Pending;
}

function paymentBadgeVariant(
  raw: unknown,
): "default" | "secondary" | "destructive" | "outline" {
  const status = resolvePaymentStatus(raw);
  switch (status) {
    case PaymentStatus.Paid:
      return "default";
    case PaymentStatus.Pending:
      return "secondary";
    case PaymentStatus.Failed:
      return "destructive";
    case PaymentStatus.AdvancePaid:
      return "outline";
    default:
      return "secondary";
  }
}

function paymentBadgeClass(raw: unknown): string {
  const status = resolvePaymentStatus(raw);
  if (status === PaymentStatus.Paid)
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === PaymentStatus.Pending)
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === PaymentStatus.Failed)
    return "bg-red-100 text-red-800 border-red-200";
  if (status === PaymentStatus.AdvancePaid)
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function paymentStatusLabel(raw: unknown): string {
  return resolvePaymentStatus(raw);
}

/**
 * Safely get the direct URL from a photo key that may be an ExternalBlob instance
 * or a plain deserialized Candid object.
 */
function getPhotoUrl(photoKey: unknown): string | null {
  if (!photoKey) return null;
  if (typeof photoKey === "string") return photoKey;
  const key = photoKey as Record<string, unknown>;
  if (typeof key.getDirectURL === "function") {
    return (key.getDirectURL as () => string)();
  }
  if (typeof key.directURL === "string" && key.directURL) {
    return key.directURL;
  }
  return null;
}

function handleCopyLink(orderId: string) {
  const url = `${window.location.origin}/order-status/${orderId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Tracking link copied to clipboard!"))
    .catch(() => toast.error("Failed to copy link"));
}

function handleCopyProductLink(productId: string) {
  const url = `${window.location.origin}/product/${productId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Product link copied to clipboard!"))
    .catch(() => toast.error("Failed to copy link"));
}

function artStyleLabel(style: ArtStyle): string {
  switch (style) {
    case ArtStyle.CuteCartoon:
      return "Cute Cartoon";
    case ArtStyle.ProfessionalPortrait:
      return "Professional Portrait";
    case ArtStyle.SoftAesthetic:
      return "Soft Aesthetic";
    case ArtStyle.FunnyExaggerated:
      return "Funny Exaggerated";
    case ArtStyle.CoupleIllustration:
      return "Couple Illustration";
    case ArtStyle.Chibi:
      return "Chibi";
    default:
      return style;
  }
}

function portraitTypeLabel(type: PortraitType): string {
  switch (type) {
    case PortraitType.Single:
      return "Single";
    case PortraitType.Couple:
      return "Couple";
    case PortraitType.Family:
      return "Family";
    case PortraitType.Group:
      return "Group Portrait";
    default:
      return type;
  }
}

const CART_LEAD_STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Contacted", label: "Contacted" },
  { value: "Converted", label: "Converted" },
  { value: "Not Interested", label: "Not Interested" },
  { value: "Not Now", label: "Not Now" },
  { value: "Lang Barrier", label: "Lang Barrier" },
  { value: "Callback Scheduled", label: "Callback Scheduled" },
  { value: "Wrong Number", label: "Wrong Number" },
  { value: "Voicemail Left", label: "Voicemail Left" },
  { value: "Lost", label: "Lost" },
] as const;

function cartLeadStatusBadgeClass(status: string): string {
  switch (status) {
    case "Converted":
      return "bg-green-100 text-green-700";
    case "Contacted":
      return "bg-blue-100 text-blue-700";
    case "Not Now":
      return "bg-amber-100 text-amber-700";
    case "Not Interested":
      return "bg-red-100 text-red-700";
    case "Lang Barrier":
      return "bg-orange-100 text-orange-700";
    case "Callback Scheduled":
      return "bg-indigo-100 text-indigo-700";
    case "Wrong Number":
      return "bg-rose-100 text-rose-700";
    case "Voicemail Left":
      return "bg-cyan-100 text-cyan-700";
    case "Lost":
      return "bg-muted text-muted-foreground";
    case "New":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function CartLeadStatusSelect({
  lead,
}: {
  lead: { id: bigint; status?: string };
}) {
  const updateCartLeadStatus = useUpdateCartLeadStatus();
  const currentStatus = lead.status ?? "New";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    updateCartLeadStatus.mutate({ id: lead.id, status: newStatus });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cartLeadStatusBadgeClass(
          currentStatus,
        )}`}
      >
        {currentStatus}
      </span>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={updateCartLeadStatus.isPending}
        data-ocid="admin.lead.status_select"
        className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer disabled:opacity-60 hover:border-primary transition-colors"
      >
        {/* If the lead's stored status is not in the new options list (legacy
            values like "New" or "Lost"), render it first so it stays visible. */}
        {!CART_LEAD_STATUS_OPTIONS.some(
          (opt) => opt.value === currentStatus,
        ) && <option value={currentStatus}>{currentStatus}</option>}
        {CART_LEAD_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function leadTypeBadgeClass(leadType: string): string {
  switch (leadType) {
    case "Checkout":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "CartAbandon":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Browse":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function leadTypeLabel(leadType: string): string {
  switch (leadType) {
    case "Checkout":
      return "Checkout";
    case "CartAbandon":
      return "Cart Abandon";
    case "Browse":
      return "Browse Lead";
    default:
      return "Cart Abandon";
  }
}

function SalesRepAllowlistPanel() {
  const { data: salesReps = [], isLoading } = useListSalesReps();
  const addSalesRep = useAddSalesRep();
  const removeSalesRep = useRemoveSalesRep();
  const [principalText, setPrincipalText] = useState("");
  const [emailText, setEmailText] = useState("");
  const [nameText, setNameText] = useState("");
  const [phoneText, setPhoneText] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = emailText.trim();
    const trimmedPrincipal = principalText.trim();
    const trimmedName = nameText.trim();
    const trimmedPhone = phoneText.trim();
    if (!trimmedEmail && !trimmedPrincipal) {
      toast.error("Enter at least an email to invite a sales rep");
      return;
    }
    addSalesRep.mutate(
      {
        principal: trimmedPrincipal,
        email: trimmedEmail || null,
        name: trimmedName || undefined,
        phone: trimmedPhone || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Sales rep added to allowlist");
          setPrincipalText("");
          setEmailText("");
          setNameText("");
          setPhoneText("");
        },
        onError: (err) =>
          toast.error(
            `Add failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
      },
    );
  }

  function handleRemove(principal: string) {
    if (
      !window.confirm(
        "Remove this sales rep from the allowlist? They will lose /team access.",
      )
    ) {
      return;
    }
    removeSalesRep.mutate(principal, {
      onSuccess: () => toast.success("Sales rep removed from allowlist"),
      onError: (err) =>
        toast.error(
          `Remove failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Sales Rep Allowlist
        </h3>
        <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
          {salesReps.length} rep{salesReps.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card className="rounded-2xl border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-xl">
            Add Sales Rep
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Invite a sales rep by email. They will be able to log in to the
            /team portal. Add their Internet Identity principal too if they have
            already logged in once. Name and phone are optional but enable
            click-to-call from the Leads panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-4"
            data-ocid="admin.team.add_form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sales-rep-name" className="text-foreground">
                  Name{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="sales-rep-name"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="rounded-xl"
                  data-ocid="admin.team.name_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-rep-phone" className="text-foreground">
                  Phone{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="sales-rep-phone"
                  type="tel"
                  value={phoneText}
                  onChange={(e) => setPhoneText(e.target.value)}
                  placeholder="e.g. +91 84312 74009"
                  className="rounded-xl"
                  data-ocid="admin.team.phone_input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales-rep-email" className="text-foreground">
                Email <span className="text-primary">*</span>
              </Label>
              <Input
                id="sales-rep-email"
                type="email"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="e.g. rep@cherishables.in"
                className="rounded-xl"
                data-ocid="admin.team.email_input"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="sales-rep-principal"
                className="text-muted-foreground"
              >
                Internet Identity principal{" "}
                <span className="text-xs">(optional)</span>
              </Label>
              <Input
                id="sales-rep-principal"
                value={principalText}
                onChange={(e) => setPrincipalText(e.target.value)}
                placeholder="e.g. 2vxsx-f... or full II principal"
                className="rounded-xl font-mono text-sm"
                data-ocid="admin.team.principal_input"
              />
            </div>
            <Button
              type="submit"
              disabled={
                addSalesRep.isPending ||
                (emailText.trim() === "" && principalText.trim() === "")
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl self-start"
              data-ocid="admin.team.add_button"
            >
              {addSalesRep.isPending ? "Adding..." : "Add Sales Rep"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading sales reps...
        </div>
      ) : salesReps.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.team.empty_state"
        >
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No sales reps yet</p>
          <p className="text-sm mt-1">
            Add a sales rep above to invite them to the /team portal
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">
                  Added At
                </TableHead>
                <TableHead className="text-muted-foreground w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesReps.map((rep, idx) => (
                <TableRow
                  key={rep.principal}
                  data-ocid={`admin.team.row.${idx + 1}`}
                >
                  <TableCell className="max-w-[200px]">
                    {rep.name ? (
                      <span className="font-medium text-foreground text-sm break-words">
                        {rep.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    {rep.phone ? (
                      <a
                        href={`tel:${rep.phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                        data-ocid={`admin.team.phone_link.${idx + 1}`}
                      >
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        {rep.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {rep.email ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground text-sm break-all">
                          {rep.email}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground break-all">
                          {rep.principal}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground break-all">
                        {rep.principal}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(rep.addedAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(rep.principal)}
                      disabled={removeSalesRep.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      data-ocid={`admin.team.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function LeadsPanel() {
  const { data: leads = [], isLoading } = useCartLeads();
  const { data: salesReps = [] } = useListSalesReps();
  const deleteCartLead = useDeleteCartLead();
  const assignLeadToRep = useAssignLeadToRep();

  // Map rep principal -> rep object for quick lookup
  const repByPrincipal = new Map(salesReps.map((r) => [r.principal, r]));

  function handleDelete(lead: { id: bigint; name: string }) {
    if (
      window.confirm(`Delete lead for "${lead.name}"? This cannot be undone.`)
    ) {
      deleteCartLead.mutate(lead.id, {
        onSuccess: () => toast.success("Lead deleted"),
        onError: (err) =>
          toast.error(
            `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
      });
    }
  }

  function handleAssign(leadId: bigint, repPrincipal: string) {
    assignLeadToRep.mutate(
      { cartLeadId: leadId, repPrincipal },
      {
        onSuccess: () =>
          repPrincipal
            ? toast.success("Lead assigned to rep")
            : toast.success("Lead unassigned"),
        onError: (err) =>
          toast.error(
            `Assign failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Leads</h3>
        <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </span>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.lead.empty_state"
        >
          <p className="text-lg font-medium">No leads yet</p>
          <p className="text-sm mt-1">
            Leads will appear here when visitors interact with your store
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">
                  Product Name
                </TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">
                  Product Interest
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Recipient
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Date & Time
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">
                  Assigned Rep
                </TableHead>
                <TableHead className="text-muted-foreground w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, i) => {
                const isBrowse = (lead.leadType ?? "CartAbandon") === "Browse";
                const assignedRep = lead.assignedRep
                  ? repByPrincipal.get(lead.assignedRep)
                  : undefined;
                return (
                  <TableRow
                    key={String(lead.id)}
                    className="transition-smooth hover:bg-muted/50"
                    data-ocid={`admin.lead.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.productName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${leadTypeBadgeClass(lead.leadType ?? "CartAbandon")}`}
                        data-ocid={`admin.lead.type_badge.${i + 1}`}
                      >
                        {leadTypeLabel(lead.leadType ?? "CartAbandon")}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      data-ocid={`admin.lead.product_interest.${i + 1}`}
                    >
                      {isBrowse && lead.productInterest
                        ? lead.productInterest
                        : "—"}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      data-ocid={`admin.lead.recipient.${i + 1}`}
                    >
                      {isBrowse && lead.recipient ? lead.recipient : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateTime(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <CartLeadStatusSelect lead={lead} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={lead.assignedRep ?? ""}
                          onChange={(e) =>
                            handleAssign(lead.id, e.target.value)
                          }
                          disabled={assignLeadToRep.isPending}
                          data-ocid={`admin.lead.assigned_rep_select.${i + 1}`}
                          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer disabled:opacity-60 hover:border-primary transition-colors max-w-[160px]"
                        >
                          <option value="">Unassigned</option>
                          {salesReps.map((rep) => (
                            <option key={rep.principal} value={rep.principal}>
                              {rep.name?.trim()
                                ? rep.name
                                : (rep.email ?? rep.principal)}
                            </option>
                          ))}
                        </select>
                        {assignedRep?.phone && (
                          <a
                            href={`tel:${assignedRep.phone.replace(/\s+/g, "")}`}
                            aria-label={`Call assigned rep ${assignedRep.name ?? assignedRep.phone}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                            data-ocid={`admin.lead.call_rep_button.${i + 1}`}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        aria-label="Delete lead"
                        onClick={() => handleDelete(lead)}
                        disabled={deleteCartLead.isPending}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        data-ocid={`admin.lead.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function GalleryPanel() {
  const galleryImages = useGalleryImages();
  const addMutation = useAddGalleryImage();
  const updateMutation = useUpdateGalleryImage();
  const deleteMutation = useDeleteGalleryImage();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select an image file");
      return;
    }
    if (!uploadTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const imageUrl = await uploadGalleryImage(uploadFile);
      setUploadProgress(80);
      await addMutation.mutateAsync({
        title: uploadTitle.trim(),
        imageUrl,
      });
      setUploadProgress(100);
      toast.success("Image uploaded successfully!");
      setShowUploadForm(false);
      setUploadTitle("");
      setUploadFile(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsUploading(false);
    }
  }

  const sortedImages = [...(galleryImages.data ?? [])].sort(
    (a, b) => Number(a.displayOrder) - Number(b.displayOrder),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Gallery Images
        </h2>
        <Button
          type="button"
          onClick={() => setShowUploadForm((v) => !v)}
          className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2"
          data-ocid="admin.gallery.upload_button"
        >
          <Upload className="h-4 w-4" />
          {showUploadForm ? "Cancel" : "Upload New Image"}
        </Button>
      </div>

      {showUploadForm && (
        <form
          onSubmit={handleUploadSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-soft"
        >
          <div className="space-y-2">
            <Label htmlFor="gallery-title">Image Title</Label>
            <Input
              id="gallery-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Family Portrait"
              className="rounded-xl"
              data-ocid="admin.gallery.title_input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallery-file">Image File</Label>
            <Input
              id="gallery-file"
              type="file"
              accept="image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="rounded-xl"
              data-ocid="admin.gallery.file_input"
            />
          </div>
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isUploading}
              className="bg-primary text-white hover:bg-primary/90 rounded-xl"
              data-ocid="admin.gallery.submit_button"
            >
              {isUploading ? "Uploading…" : "Upload Image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowUploadForm(false);
                setUploadTitle("");
                setUploadFile(null);
                setUploadProgress(0);
              }}
              className="rounded-xl border-primary text-primary hover:bg-primary/10"
              data-ocid="admin.gallery.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {galleryImages.isLoading ? (
        <p className="text-muted-foreground text-center py-8">
          Loading images…
        </p>
      ) : sortedImages.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.gallery.empty_state"
        >
          <Images className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No gallery images yet</p>
          <p className="text-sm mt-1">
            Upload images to display in your gallery section
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedImages.map((image, idx) => (
            <div
              key={image.id}
              className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft"
              data-ocid={`admin.gallery.item.${idx + 1}`}
            >
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-20 h-16 object-cover rounded-lg bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {image.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Order: {Number(image.displayOrder)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch
                  checked={image.isActive}
                  onCheckedChange={(v) =>
                    updateMutation.mutate({
                      id: image.id,
                      title: image.title,
                      isActive: v,
                      displayOrder: BigInt(Number(image.displayOrder)),
                    })
                  }
                  data-ocid={`admin.gallery.active_switch.${idx + 1}`}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() =>
                    updateMutation.mutate({
                      id: image.id,
                      title: image.title,
                      isActive: image.isActive,
                      displayOrder: BigInt(
                        Math.max(0, Number(image.displayOrder) - 1),
                      ),
                    })
                  }
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  data-ocid={`admin.gallery.up_button.${idx + 1}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={idx === sortedImages.length - 1}
                  onClick={() =>
                    updateMutation.mutate({
                      id: image.id,
                      title: image.title,
                      isActive: image.isActive,
                      displayOrder: BigInt(Number(image.displayOrder) + 1),
                    })
                  }
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  data-ocid={`admin.gallery.down_button.${idx + 1}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Delete image"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete image "${image.title}"? This cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate(image.id, {
                      onSuccess: () => toast.success("Image deleted"),
                      onError: (err) =>
                        toast.error(
                          `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
                        ),
                    });
                  }
                }}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                data-ocid={`admin.gallery.delete_button.${idx + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const { actor } = useActor(createActor);
  const { login, loginStatus } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetchOrders,
  } = useListAllOrders();

  const [orderFilter, setOrderFilter] = useState<
    "all" | "balance_due" | "pending" | "paid" | "failed"
  >("all");
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const uploadArtwork = useUploadFinalArtwork();
  const uploadProductImage = useUploadProductImage();
  const updateProductImage = useUpdateProductImage();
  const setAdminEmail = useSetAdminEmail();
  const saveRazorpayKeys = useSaveRazorpayKeys();
  const { data: savedKeyId } = useGetRazorpayKeyId();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<OrderStatus>(
    OrderStatus.Received,
  );
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const deleteOrder = useDeleteOrder();
  const sendPaymentReminder = useSendPaymentReminder();
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [adminEmail, setAdminEmailValue] = useState("");
  const [rzpKeyId, setRzpKeyId] = useState("");
  const [rzpKeySecret, setRzpKeySecret] = useState("");
  const [rzpSaveSuccess, setRzpSaveSuccess] = useState(false);
  const [rzpSaveError, setRzpSaveError] = useState<string | null>(null);

  // Products state
  const { data: rawProducts = [], isLoading: productsLoading } =
    useListProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const moveProductUp = useMoveProductUp();
  const moveProductDown = useMoveProductDown();
  const toggleProductCOD = useToggleProductCOD();
  const [productSortMode, setProductSortMode] = useState<
    "order" | "name" | "category" | "price"
  >("order");
  const [movingProductId, setMovingProductId] = useState<string | null>(null);

  const products: AddonProduct[] = (() => {
    const list = [...rawProducts];
    if (productSortMode === "name")
      return list.sort((a, b) => a.name.localeCompare(b.name));
    if (productSortMode === "category")
      return list.sort((a, b) => a.category.localeCompare(b.category));
    if (productSortMode === "price")
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    return list.sort(
      (a, b) => Number(a.displayOrder ?? 0n) - Number(b.displayOrder ?? 0n),
    );
  })();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AddonProduct | null>(
    null,
  );
  const [productDeleteConfirming, setProductDeleteConfirming] = useState<
    string | null
  >(null);
  const [productForm, setProductForm] = useState({
    codEnabled: false,
    name: "",
    category: "Prints & Frames",
    priceRupees: "",
    imageUrl: "",
    description: "",
  });
  const [imagePickerLoading, setImagePickerLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedReview, setSelectedReview] = useState<[string, any] | null>(
    null,
  );
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDeleteReviewDialogOpen, setIsDeleteReviewDialogOpen] =
    useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    text: "",
    rating: 5,
    imageUrl: "",
    status: "Approved" as string,
  });
  const [reviewImageUploading, setReviewImageUploading] = useState(false);
  const { data: rawReviewsData } = useListReviews();
  // Convert backend bigint rating to number for frontend compatibility
  const reviewsData: Array<[string, Review]> | undefined = rawReviewsData?.map(
    ([id, review]) => [
      id,
      {
        ...review,
        rating: Number(review.rating),
        status: review.status as unknown as ReviewStatus,
      },
    ],
  ) as Array<[string, Review]> | undefined;
  const addReviewMutation = useAddReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();
  const uploadReviewImageFn = useUploadReviewImage();

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "Prints & Frames",
      priceRupees: "",
      imageUrl: "",
      codEnabled: false,
      description: "",
    });
    setProductDialogOpen(true);
  }

  function openEditProduct(p: AddonProduct) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      priceRupees: String(Number(p.price) / 100),
      imageUrl: p.imageUrl,
      codEnabled: !!p.codEnabled,
      description: p.description || "",
    });
    setProductDialogOpen(true);
  }

  function handleProductSubmit() {
    const priceRupees = Number(productForm.priceRupees);
    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (
      !productForm.priceRupees ||
      Number.isNaN(priceRupees) ||
      priceRupees <= 0
    ) {
      toast.error("Enter a valid price in ₹");
      return;
    }
    const priceInPaise = BigInt(Math.round(priceRupees * 100));
    if (editingProduct) {
      updateProduct.mutate(
        {
          id: editingProduct.id,
          name: productForm.name.trim(),
          price: priceInPaise,
          category: productForm.category,
          imageUrl: productForm.imageUrl.trim(),
          codEnabled: productForm.codEnabled,
          description: productForm.description.trim(),
        },
        {
          onSuccess: () => {
            if (
              productForm.imageUrl.trim() &&
              productForm.imageUrl.startsWith("http")
            ) {
              updateProductImage.mutate({
                id: editingProduct.id,
                imageUrl: productForm.imageUrl.trim(),
              });
            }
            setProductDialogOpen(false);
            toast.success("Product updated!");
          },
          onError: (e: Error) => toast.error(e.message || "Update failed"),
        },
      );
    } else {
      addProduct.mutate(
        {
          name: productForm.name.trim(),
          price: priceInPaise,
          category: productForm.category,
          imageUrl: productForm.imageUrl.trim(),
          description: productForm.description.trim(),
        },
        {
          onSuccess: (newId: string) => {
            if (
              productForm.imageUrl.trim() &&
              productForm.imageUrl.startsWith("http")
            ) {
              updateProductImage.mutate({
                id: newId,
                imageUrl: productForm.imageUrl.trim(),
              });
            }
            setProductDialogOpen(false);
            toast.success("Product added!");
          },
          onError: (e: Error) => toast.error(e.message || "Add failed"),
        },
      );
    }
  }

  function handleProductDelete(id: string) {
    if (productDeleteConfirming !== id) {
      setProductDeleteConfirming(id);
      return;
    }
    deleteProduct.mutate(id, {
      onSuccess: () => {
        setProductDeleteConfirming(null);
        toast.success("Product deleted");
      },
      onError: (e: Error) => {
        toast.error(e.message || "Delete failed");
        setProductDeleteConfirming(null);
      },
    });
  }

  const isAuthenticated = !!actor;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) =>
      o.orderStatus === OrderStatus.Received ||
      o.orderStatus === OrderStatus.InProgress,
  ).length;
  const completedOrders = orders.filter(
    (o) =>
      o.orderStatus === OrderStatus.Completed ||
      o.orderStatus === OrderStatus.Delivered,
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    const ps = resolvePaymentStatus(o.paymentStatus);
    if (orderFilter === "balance_due") return ps === PaymentStatus.AdvancePaid;
    if (orderFilter === "pending") return ps === PaymentStatus.Pending;
    if (orderFilter === "paid") return ps === PaymentStatus.Paid;
    if (orderFilter === "failed") return ps === PaymentStatus.Failed;
    return true;
  });

  function openOrderDialog(order: Order) {
    setSelectedOrder(order);
    setStatusValue(order.orderStatus);
    setArtworkFile(null);
    setDialogOpen(true);
  }

  function handleUpdateStatus() {
    if (!selectedOrder) return;
    updateStatus.mutate(
      { orderId: selectedOrder.orderId, status: statusValue },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setSelectedOrder(null);
        },
      },
    );
  }

  function handleUploadArtwork() {
    if (!selectedOrder || !artworkFile) return;
    uploadArtwork.mutate(
      { orderId: selectedOrder.orderId, file: artworkFile },
      {
        onSuccess: () => {
          setArtworkFile(null);
        },
      },
    );
  }

  function handleDeleteOrder() {
    if (!selectedOrder) return;
    if (!deleteConfirming) {
      setDeleteConfirming(true);
      return;
    }
    deleteOrder.mutate(selectedOrder.orderId, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedOrder(null);
        setDeleteConfirming(false);
        toast.success("Order deleted successfully");
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to delete order");
        setDeleteConfirming(false);
      },
    });
  }

  function handleSaveEmail() {
    setAdminEmail.mutate(adminEmail);
  }

  function handleSaveRazorpayKeys() {
    setRzpSaveSuccess(false);
    setRzpSaveError(null);
    if (!rzpKeyId.trim() || !rzpKeySecret.trim()) {
      setRzpSaveError("Both Key ID and Key Secret are required.");
      return;
    }
    saveRazorpayKeys.mutate(
      { keyId: rzpKeyId.trim(), keySecret: rzpKeySecret.trim() },
      {
        onSuccess: () => {
          setRzpSaveSuccess(true);
          setRzpKeySecret("");
          toast.success("Razorpay settings saved successfully!");
        },
        onError: (err: Error) => {
          setRzpSaveError(err.message || "Failed to save Razorpay settings.");
        },
      },
    );
  }

  useEffect(() => {
    if (savedKeyId) {
      const masked =
        savedKeyId.length > 8
          ? `${savedKeyId.slice(0, 4)}****...****${savedKeyId.slice(-4)}`
          : "****";
      setRzpKeyId(masked);
    }
  }, [savedKeyId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-soft border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Please authenticate with Internet Identity to access the admin
              dashboard.
            </p>
            <Button
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
              className="w-full rounded-xl"
              data-ocid="admin.login_button"
            >
              {loginStatus === "logging-in"
                ? "Authenticating..."
                : "Login with Internet Identity"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking admin privileges...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-soft border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              Unauthorized
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You do not have admin access. Please contact the site
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-semibold text-foreground">
            Cherishables
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell
              onNavigateToOrders={() => setActiveTab("orders")}
              onNavigateToCommunications={() => setActiveTab("communications")}
            />
            <Badge variant="outline" className="font-mono text-xs">
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-2xl shadow-soft border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalOrders}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-soft border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-semibold text-foreground">
                  {pendingOrders}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-soft border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-foreground">
                  {completedOrders}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="mb-6 bg-card border border-border rounded-xl p-1">
            <TabsTrigger
              value="orders"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.orders_tab"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.products_tab"
            >
              Products
            </TabsTrigger>

            <TabsTrigger
              value="gallery"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.gallery_tab"
            >
              <Images className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.settings_tab"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.leads_tab"
            >
              <svg
                aria-hidden={true}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 1 0 7.75" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Leads
            </TabsTrigger>
            <TabsTrigger
              value="communications"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.communications_tab"
            >
              <Mail className="h-4 w-4" />
              Communications
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.reviews_tab"
            >
              <Volume2 className="h-4 w-4" />
              Reviews
              {reviewsData && reviewsData.length > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {reviewsData.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="admin.team_tab"
            >
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                All Orders
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchOrders()}
                className="rounded-xl gap-2 border-primary text-primary hover:bg-primary/10"
                data-ocid="admin.orders.refresh_button"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Payment filter toggles */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: "all", label: "All" },
                { key: "balance_due", label: "Balance Due" },
                { key: "pending", label: "Pending" },
                { key: "paid", label: "Paid" },
                { key: "failed", label: "Failed" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setOrderFilter(f.key as typeof orderFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    orderFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                  }`}
                  data-ocid={`admin.orders.filter_${f.key}`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""}
              </span>
            </div>

            {ordersLoading ? (
              <p className="text-muted-foreground">Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <Card className="rounded-2xl shadow-soft border-border p-8 text-center">
                <p className="text-muted-foreground">
                  No orders match the selected filter.
                </p>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Tracking ID
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Customer
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Portrait
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Style
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Payment
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Payment Ref
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order, idx) => {
                        const hasAddress =
                          !!order.deliveryAddress?.addressLine1;
                        const hasAddOns =
                          Array.isArray(order.selectedAddOns) &&
                          order.selectedAddOns.length > 0;
                        const ps = resolvePaymentStatus(order.paymentStatus);
                        const isBalanceDue = ps === PaymentStatus.AdvancePaid;
                        return (
                          <TableRow
                            key={order.orderId}
                            className="cursor-pointer transition-smooth hover:bg-muted/50"
                            onClick={() => openOrderDialog(order)}
                            data-ocid={`admin.order.item.${idx + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-1.5">
                                <span>{order.orderId.slice(0, 8)}...</span>
                                <button
                                  type="button"
                                  className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(order.orderId);
                                  }}
                                  data-ocid={`admin.order.copy_link_button.${idx + 1}`}
                                  aria-label="Copy tracking link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-1">
                                <span>{order.customerName}</span>
                                <div className="flex gap-1 flex-wrap">
                                  {hasAddOns && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
                                      + Add-Ons
                                    </span>
                                  )}
                                  {hasAddress && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                      Address
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {portraitTypeLabel(order.portraitType)}
                            </TableCell>
                            <TableCell>
                              {artStyleLabel(order.artStyle)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant={paymentBadgeVariant(
                                    order.paymentStatus,
                                  )}
                                  className={paymentBadgeClass(
                                    order.paymentStatus,
                                  )}
                                >
                                  {paymentStatusLabel(order.paymentStatus)}
                                </Badge>
                                {isBalanceDue && (
                                  <Badge
                                    variant="outline"
                                    className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0"
                                  >
                                    Balance Due
                                  </Badge>
                                )}
                                {ps === PaymentStatus.AdvancePaid && (
                                  <button
                                    type="button"
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePaymentStatus.mutate(
                                        {
                                          orderId: order.orderId,
                                          paymentStatus: PaymentStatus.Paid,
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success("Marked as Paid"),
                                          onError: (err: Error) =>
                                            toast.error(
                                              err.message || "Failed to update",
                                            ),
                                        },
                                      );
                                    }}
                                    data-ocid={`admin.order.mark_paid_button.${idx + 1}`}
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {order.razorpayPaymentId
                                ? order.razorpayPaymentId.length > 15
                                  ? `${order.razorpayPaymentId.slice(0, 15)}...`
                                  : order.razorpayPaymentId
                                : order.upiRef
                                  ? order.upiRef.length > 15
                                    ? `${order.upiRef.slice(0, 15)}...`
                                    : order.upiRef
                                  : order.paymentRef
                                    ? order.paymentRef.length > 15
                                      ? `${order.paymentRef.slice(0, 15)}...`
                                      : order.paymentRef
                                    : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={statusBadgeVariant(order.orderStatus)}
                                className={statusBadgeClass(order.orderStatus)}
                              >
                                {order.orderStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(order.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredOrders.map((order, idx) => {
                    const hasAddress = !!order.deliveryAddress?.addressLine1;
                    const hasAddOns =
                      Array.isArray(order.selectedAddOns) &&
                      order.selectedAddOns.length > 0;
                    const ps = resolvePaymentStatus(order.paymentStatus);
                    const isBalanceDue = ps === PaymentStatus.AdvancePaid;
                    return (
                      <Card
                        key={order.orderId}
                        className="rounded-2xl shadow-soft border-border cursor-pointer transition-smooth active:scale-[0.98]"
                        onClick={() => openOrderDialog(order)}
                        data-ocid={`admin.order.item.${idx + 1}`}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">
                                {order.orderId.slice(0, 8)}...
                              </span>
                              <button
                                type="button"
                                className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(order.orderId);
                                }}
                                data-ocid={`admin.order.copy_link_button.${idx + 1}`}
                                aria-label="Copy tracking link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={paymentBadgeVariant(
                                  order.paymentStatus,
                                )}
                                className={paymentBadgeClass(
                                  order.paymentStatus,
                                )}
                              >
                                {paymentStatusLabel(order.paymentStatus)}
                              </Badge>
                              {isBalanceDue && (
                                <Badge
                                  variant="outline"
                                  className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0"
                                >
                                  Balance Due
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="font-medium text-foreground">
                            {order.customerName}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {hasAddOns && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
                                + Add-Ons
                              </span>
                            )}
                            {hasAddress && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                Address
                              </span>
                            )}
                          </div>
                          {ps === PaymentStatus.AdvancePaid && (
                            <button
                              type="button"
                              className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePaymentStatus.mutate(
                                  {
                                    orderId: order.orderId,
                                    paymentStatus: PaymentStatus.Paid,
                                  },
                                  {
                                    onSuccess: () =>
                                      toast.success("Marked as Paid"),
                                    onError: (err: Error) =>
                                      toast.error(
                                        err.message || "Failed to update",
                                      ),
                                  },
                                );
                              }}
                              data-ocid={`admin.order.mark_paid_button.${idx + 1}`}
                            >
                              Mark as Paid
                            </button>
                          )}
                          <p className="font-mono text-xs text-muted-foreground">
                            {order.razorpayPaymentId
                              ? order.razorpayPaymentId.length > 15
                                ? `${order.razorpayPaymentId.slice(0, 15)}...`
                                : order.razorpayPaymentId
                              : order.upiRef
                                ? order.upiRef.length > 15
                                  ? `${order.upiRef.slice(0, 15)}...`
                                  : order.upiRef
                                : order.paymentRef
                                  ? order.paymentRef.length > 15
                                    ? `${order.paymentRef.slice(0, 15)}...`
                                    : order.paymentRef
                                  : "—"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{portraitTypeLabel(order.portraitType)}</span>
                            <span>·</span>
                            <span>{artStyleLabel(order.artStyle)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={statusBadgeVariant(order.orderStatus)}
                            >
                              {order.orderStatus}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                Manage Products
              </h2>
              <Button
                onClick={openAddProduct}
                className="rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-ocid="admin.products.add_button"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Sort controls */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground font-medium">
                Sort by:
              </span>
              {[
                { label: "Name (A-Z)", mode: "name" as const },
                { label: "Category", mode: "category" as const },
                { label: "Price (Low to High)", mode: "price" as const },
              ].map(({ label, mode }) => (
                <Button
                  key={mode}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductSortMode(mode)}
                  className={`rounded-lg h-7 px-3 text-xs border-primary/40 hover:bg-primary/10 hover:text-primary ${
                    productSortMode === mode
                      ? "bg-primary/10 text-primary border-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                  data-ocid={`admin.products.sort_${mode}`}
                >
                  {label}
                </Button>
              ))}
              {productSortMode !== "order" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductSortMode("order")}
                  className="rounded-lg h-7 px-3 text-xs border-primary/40 hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  data-ocid="admin.products.sort_reset"
                >
                  Reset Order
                </Button>
              )}
            </div>

            {productsLoading ? (
              <p className="text-muted-foreground">Loading products...</p>
            ) : products.length === 0 ? (
              <Card
                className="rounded-2xl shadow-soft border-border p-8 text-center"
                data-ocid="admin.products.empty_state"
              >
                <Box className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No products yet. Add your first add-on product.
                </p>
              </Card>
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground w-14">
                        Image
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Category
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-muted-foreground text-center">
                        COD
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        data-ocid={`admin.product.item.${idx + 1}`}
                      >
                        <TableCell>
                          {p.imageUrl && !p.imageUrl.startsWith("blob:") ? (
                            <div className="relative w-10 h-10">
                              <div className="absolute inset-0 rounded-lg bg-red-100 animate-pulse" />
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                decoding="async"
                                loading="lazy"
                                className="relative w-10 h-10 rounded-lg object-cover border border-border bg-muted opacity-0 transition-opacity duration-200"
                                onLoad={(e) => {
                                  (
                                    e.target as HTMLImageElement
                                  ).classList.remove("opacity-0");
                                  (e.target as HTMLImageElement).classList.add(
                                    "opacity-100",
                                  );
                                  const skeleton = (
                                    e.target as HTMLImageElement
                                  )
                                    .previousElementSibling as HTMLElement | null;
                                  if (skeleton) skeleton.style.display = "none";
                                }}
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  t.style.display = "none";
                                  const skeleton =
                                    t.previousElementSibling as HTMLElement | null;
                                  if (skeleton) skeleton.style.display = "none";
                                  const placeholder =
                                    document.createElement("div");
                                  placeholder.className =
                                    "w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-400";
                                  placeholder.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                  t.parentNode?.appendChild(placeholder);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center">
                              <ImageOff className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {p.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          ₹{(Number(p.price) / 100).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.codEnabled ? (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                              COD
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                              No COD
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {productSortMode === "order" && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={
                                    idx === 0 || movingProductId === p.id
                                  }
                                  onClick={async () => {
                                    setMovingProductId(p.id);
                                    try {
                                      await moveProductUp.mutateAsync(p.id);
                                    } finally {
                                      setMovingProductId(null);
                                    }
                                  }}
                                  className="rounded-lg h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                                  data-ocid={`admin.product.move_up.${idx + 1}`}
                                  aria-label="Move up"
                                >
                                  {movingProductId === p.id ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={
                                    idx === products.length - 1 ||
                                    movingProductId === p.id
                                  }
                                  onClick={async () => {
                                    setMovingProductId(p.id);
                                    try {
                                      await moveProductDown.mutateAsync(p.id);
                                    } finally {
                                      setMovingProductId(null);
                                    }
                                  }}
                                  className="rounded-lg h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                                  data-ocid={`admin.product.move_down.${idx + 1}`}
                                  aria-label="Move down"
                                >
                                  {movingProductId === p.id ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditProduct(p)}
                              className="rounded-lg h-8 px-3 gap-1.5 border-primary text-primary hover:bg-primary/10"
                              data-ocid={`admin.product.edit_button.${idx + 1}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyProductLink(p.id)}
                              className="rounded-lg h-8 px-3 gap-1.5 border-primary text-primary hover:bg-primary/10"
                              data-ocid={`admin.product.copy_link_button.${idx + 1}`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleProductCOD.mutate({
                                  id: p.id,
                                  codEnabled: !p.codEnabled,
                                })
                              }
                              className="rounded-lg h-8 px-3 gap-1.5 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                              data-ocid={`admin.product.toggle_cod_button.${idx + 1}`}
                            >
                              {p.codEnabled ? "Disable COD" : "Enable COD"}
                            </Button>
                            {productDeleteConfirming === p.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleProductDelete(p.id)}
                                  disabled={deleteProduct.isPending}
                                  className="rounded-lg h-8 px-3"
                                  data-ocid={`admin.product.confirm_delete_button.${idx + 1}`}
                                >
                                  {deleteProduct.isPending ? "..." : "Yes"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setProductDeleteConfirming(null)
                                  }
                                  className="rounded-lg h-8 px-3 border-primary text-primary hover:bg-primary/10"
                                  data-ocid={`admin.product.cancel_delete_button.${idx + 1}`}
                                >
                                  No
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProductDelete(p.id)}
                                className="rounded-lg h-8 px-3 gap-1.5 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                data-ocid={`admin.product.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <GalleryPanel />
          </TabsContent>

          <TabsContent value="settings">
            <WebsiteMobileSettingsPanel />
            <TeamMembersAdminPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="rounded-2xl shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="font-[family-name:var(--font-display)] text-lg">
                    Admin Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmailValue(e.target.value)}
                      className="rounded-xl"
                      data-ocid="admin.settings.email_input"
                    />
                  </div>
                  <Button
                    onClick={handleSaveEmail}
                    disabled={setAdminEmail.isPending}
                    className="rounded-xl"
                    data-ocid="admin.settings.save_email_button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {setAdminEmail.isPending ? "Saving..." : "Save Email"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-soft border-border">
                <CardHeader>
                  <CardTitle className="font-[family-name:var(--font-display)] text-lg">
                    Razorpay Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {rzpSaveSuccess && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700 font-medium">
                        Settings saved successfully
                      </p>
                    </div>
                  )}
                  {rzpSaveError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive font-medium">
                        {rzpSaveError}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="rzp-key-id">Razorpay Key ID</Label>
                    <Input
                      id="rzp-key-id"
                      type="text"
                      placeholder="rzp_test_... or rzp_live_..."
                      value={rzpKeyId}
                      onChange={(e) => {
                        setRzpKeyId(e.target.value);
                        setRzpSaveSuccess(false);
                        setRzpSaveError(null);
                      }}
                      className="rounded-xl"
                      data-ocid="admin.settings.rzp_key_id_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      {savedKeyId
                        ? "A key is already saved. Enter a new one to replace it."
                        : "Enter your Razorpay Key ID from the Razorpay dashboard."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rzp-key-secret">Razorpay Key Secret</Label>
                    <Input
                      id="rzp-key-secret"
                      type="password"
                      placeholder="••••••••••••"
                      value={rzpKeySecret}
                      onChange={(e) => {
                        setRzpKeySecret(e.target.value);
                        setRzpSaveSuccess(false);
                        setRzpSaveError(null);
                      }}
                      className="rounded-xl"
                      data-ocid="admin.settings.rzp_key_secret_input"
                    />
                  </div>
                  <Button
                    onClick={handleSaveRazorpayKeys}
                    disabled={saveRazorpayKeys.isPending}
                    className="rounded-xl"
                    data-ocid="admin.settings.save_rzp_button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveRazorpayKeys.isPending
                      ? "Saving..."
                      : "Save Razorpay Keys"}
                  </Button>
                  <div className="bg-muted/50 rounded-xl p-3.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Get your keys from{" "}
                      <a
                        href="https://dashboard.razorpay.com/app/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent font-semibold hover:underline"
                      >
                        Razorpay Dashboard → API Keys
                      </a>
                      . Use test keys for testing, live keys for production.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="leads" className="mt-6">
            <LeadsPanel />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsAdminPanel
              reviewsData={reviewsData}
              reviewImageInputRef={reviewImageInputRef}
              reviewImageUploading={reviewImageUploading}
              uploadReviewImageFn={uploadReviewImageFn}
              setReviewImageUploading={setReviewImageUploading}
              setReviewForm={setReviewForm}
              setSelectedReview={setSelectedReview}
              setIsReviewDialogOpen={setIsReviewDialogOpen}
              setIsDeleteReviewDialogOpen={setIsDeleteReviewDialogOpen}
              addReviewMutation={addReviewMutation}
              updateReviewMutation={updateReviewMutation}
              deleteReviewMutation={deleteReviewMutation}
            />
          </TabsContent>
          <TabsContent value="communications">
            <CommunicationsPanel orders={orders} />
          </TabsContent>
          <TabsContent value="team" className="mt-6">
            <SalesRepAllowlistPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Add/Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update product details below."
                : "Fill in details for the new add-on product."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="prod-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prod-name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Crystal Glass Block"
                className="rounded-xl"
                data-ocid="admin.product_form.name_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={productForm.category}
                onValueChange={(v) =>
                  setProductForm((f) => ({ ...f, category: v }))
                }
              >
                <SelectTrigger
                  id="prod-category"
                  className="rounded-xl"
                  data-ocid="admin.product_form.category_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Merchandise">Merchandise</SelectItem>
                  <SelectItem value="Prints & Frames">
                    Prints &amp; Frames
                  </SelectItem>
                  <SelectItem value="LED & Glass">LED &amp; Glass</SelectItem>
                  <SelectItem value="3D Models">3D Models</SelectItem>
                  <SelectItem value={AVAILABLE_MODELS_CATEGORY}>
                    {AVAILABLE_MODELS_CATEGORY}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-price">
                Price in ₹ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prod-price"
                type="number"
                min="1"
                value={productForm.priceRupees}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, priceRupees: e.target.value }))
                }
                placeholder="e.g. 1299"
                className="rounded-xl"
                data-ocid="admin.product_form.price_input"
              />
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={productForm.codEnabled}
                  onChange={(e) =>
                    setProductForm((f) => ({
                      ...f,
                      codEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                  data-ocid="admin.product_form.cod_checkbox"
                />
                <span className="text-sm text-gray-700">COD Available</span>
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-description">Description</Label>
              <textarea
                id="prod-description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Enter product description..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-ocid="admin.product_form.description_textarea"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Product Image{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              {/* Hidden native file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Pick product image"
                data-ocid="admin.product_form.image_input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImagePickerLoading(true);
                  uploadProductImage.mutate(file, {
                    onSuccess: (url) => {
                      setProductForm((f) => ({ ...f, imageUrl: url }));
                      setImagePickerLoading(false);
                      if (editingProduct) {
                        updateProductImage.mutate({
                          id: editingProduct.id,
                          imageUrl: url,
                        });
                      }
                    },
                    onError: () => {
                      toast.error("Image upload failed. Please try again.");
                      setImagePickerLoading(false);
                    },
                  });
                  // reset so same file can be re-picked
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imagePickerLoading}
                  className="rounded-xl border-primary/40 text-primary hover:bg-primary/10 gap-2"
                  data-ocid="admin.product_form.upload_button"
                >
                  <Upload className="h-4 w-4" />
                  {imagePickerLoading ? "Uploading…" : "Upload Image"}
                </Button>
                {imagePickerLoading && (
                  <span className="text-muted-foreground text-sm animate-pulse">
                    Reading file…
                  </span>
                )}
                {productForm.imageUrl && !imagePickerLoading && (
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((f) => ({ ...f, imageUrl: "" }))
                    }
                    className="text-primary hover:text-destructive text-xs underline"
                    data-ocid="admin.product_form.image_remove"
                  >
                    Remove
                  </button>
                )}
              </div>
              {productForm.imageUrl && !imagePickerLoading && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-border bg-muted/30 w-24 h-24">
                  <div className="absolute inset-0 bg-red-100 animate-pulse" />
                  <img
                    src={productForm.imageUrl}
                    alt="preview"
                    decoding="async"
                    loading="lazy"
                    className="relative w-full h-full object-contain opacity-0 transition-opacity duration-200"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).classList.remove(
                        "opacity-0",
                      );
                      (e.target as HTMLImageElement).classList.add(
                        "opacity-100",
                      );
                      const skeleton = (e.target as HTMLImageElement)
                        .previousElementSibling as HTMLElement | null;
                      if (skeleton) skeleton.style.display = "none";
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const skeleton = (e.target as HTMLImageElement)
                        .previousElementSibling as HTMLElement | null;
                      if (skeleton) skeleton.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleProductSubmit}
                disabled={addProduct.isPending || updateProduct.isPending}
                className="flex-1 rounded-xl"
                data-ocid="admin.product_form.submit_button"
              >
                <Save className="h-4 w-4 mr-2" />
                {addProduct.isPending || updateProduct.isPending
                  ? "Saving..."
                  : editingProduct
                    ? "Save Changes"
                    : "Add Product"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
                className="rounded-xl border-primary text-primary hover:bg-primary/10"
                data-ocid="admin.product_form.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <span className="font-mono text-xs">
                  {selectedOrder.orderId}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">
                    {selectedOrder.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {selectedOrder.customerEmail}
                  </p>
                </div>
                {selectedOrder.customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Portrait Type</p>
                  <p className="font-medium text-foreground">
                    {portraitTypeLabel(selectedOrder.portraitType)}
                  </p>
                </div>
                {selectedOrder.portraitPrice > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Portrait Price
                    </p>
                    <p className="font-medium text-foreground">
                      ₹
                      {(
                        Number(selectedOrder.portraitPrice) / 100
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Art Style</p>
                  <p className="font-medium text-foreground">
                    {artStyleLabel(selectedOrder.artStyle)}
                  </p>
                </div>
                {selectedOrder.cartoonStyle && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cartoon Style
                    </p>
                    <p className="font-medium text-foreground">
                      {selectedOrder.cartoonStyle}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Customer Approved
                  </p>
                  <p
                    className={`font-medium ${selectedOrder.customerAcknowledged ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedOrder.customerAcknowledged ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Status
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge
                      variant={paymentBadgeVariant(selectedOrder.paymentStatus)}
                      className={paymentBadgeClass(selectedOrder.paymentStatus)}
                    >
                      {paymentStatusLabel(selectedOrder.paymentStatus)}
                    </Badge>
                    {(resolvePaymentStatus(selectedOrder.paymentStatus) ===
                      PaymentStatus.Pending ||
                      resolvePaymentStatus(selectedOrder.paymentStatus) ===
                        PaymentStatus.Failed) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          sendPaymentReminder.mutate(selectedOrder.orderId, {
                            onSuccess: (result) => {
                              if (result && "__kind__" in result) {
                                if (result.__kind__ === "ok") {
                                  toast.success(
                                    "Payment reminder sent successfully!",
                                  );
                                } else {
                                  toast.error(
                                    `Failed to send reminder: ${result.err}`,
                                  );
                                }
                              } else {
                                toast.success(
                                  "Payment reminder sent successfully!",
                                );
                              }
                            },
                            onError: (err: Error) => {
                              toast.error(
                                err.message ||
                                  "Failed to send payment reminder",
                              );
                            },
                          });
                        }}
                        disabled={sendPaymentReminder.isPending}
                        className="rounded-lg h-7 px-2.5 gap-1.5 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white text-xs"
                        data-ocid="admin.order.send_payment_reminder_button"
                      >
                        <Mail className="h-3 w-3" />
                        {sendPaymentReminder.isPending
                          ? "Sending..."
                          : "Send Reminder"}
                      </Button>
                    )}
                  </div>
                </div>
                {selectedOrder.razorpayPaymentId && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Razorpay Payment ID
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {selectedOrder.razorpayPaymentId}
                    </p>
                  </div>
                )}
                {selectedOrder.upiRef && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      UPI Reference
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {selectedOrder.upiRef}
                    </p>
                  </div>
                )}
                {selectedOrder.paymentRef && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Reference
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {selectedOrder.paymentRef}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge
                    variant={statusBadgeVariant(selectedOrder.orderStatus)}
                    className={statusBadgeClass(selectedOrder.orderStatus)}
                  >
                    {selectedOrder.orderStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Delivery
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedOrder.estimatedDeliveryText ||
                      formatDate(selectedOrder.estimatedDelivery)}
                  </p>
                </div>
              </div>

              {/* Referred By */}
              {selectedOrder.referredBy && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <span className="text-sm text-muted-foreground font-medium">
                    Referred by:
                  </span>
                  <span className="text-sm font-semibold text-red-700">
                    {selectedOrder.referredBy}
                  </span>
                </div>
              )}

              {/* Payment & Amount Details */}
              {Number(selectedOrder.amount) > 0 && (
                <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    💰 Payment Summary
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Portrait Base</span>
                    <span className="font-medium">
                      ₹
                      {(
                        (Number(selectedOrder.amount) -
                          Number(selectedOrder.addOnsAmount)) /
                        100
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {Number(selectedOrder.addOnsAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Add-Ons</span>
                      <span className="font-medium text-red-600">
                        ₹
                        {(
                          Number(selectedOrder.addOnsAmount) / 100
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-border pt-1 mt-1">
                    <span className="font-semibold">Grand Total</span>
                    <span className="font-bold text-foreground">
                      ₹
                      {(Number(selectedOrder.amount) / 100).toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes (actual customer notes only, no JSON) */}
              {selectedOrder.notes &&
                !selectedOrder.notes.includes("---ORDER_EXTRA---") &&
                selectedOrder.notes.trim() && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">
                      {selectedOrder.notes.trim()}
                    </p>
                  </div>
                )}

              {/* Special Instructions */}
              {selectedOrder.specialInstructions &&
                selectedOrder.specialInstructions.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Special Instructions
                    </p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">
                      {selectedOrder.specialInstructions[0]}
                    </p>
                  </div>
                )}

              {/* Selected Add-Ons */}
              {(() => {
                let addOns: Array<{
                  name: string;
                  priceRange: string;
                  category: string;
                }> = [];
                if (selectedOrder.selectedAddOns) {
                  try {
                    const parsed = JSON.parse(selectedOrder.selectedAddOns);
                    if (Array.isArray(parsed)) addOns = parsed;
                  } catch {
                    // malformed
                  }
                }
                if (!addOns.length && Number(selectedOrder.addOnsAmount) === 0)
                  return null;
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                      🎁 Selected Add-On Products
                    </p>
                    {addOns && addOns.length > 0 ? (
                      <div className="space-y-2">
                        {addOns.map(
                          (addon: {
                            name: string;
                            priceRange: string;
                            category: string;
                          }) => (
                            <div
                              key={addon.name + addon.priceRange}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-foreground font-medium">
                                {addon.name}
                              </span>
                              <span className="text-red-600 font-semibold">
                                {addon.priceRange}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add-ons selected (details not available)
                      </p>
                    )}
                    <div className="mt-3 pt-2 border-t border-red-200 flex justify-between text-sm">
                      <span className="font-semibold text-red-700">
                        Add-Ons Total
                      </span>
                      <span className="font-bold text-red-700">
                        ₹
                        {(
                          Number(selectedOrder.addOnsAmount) / 100
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Delivery Address */}
              {(() => {
                const addr = selectedOrder.deliveryAddress;
                if (!addr?.addressLine1) return null;
                return (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                      📦 Delivery Address
                    </p>
                    <div className="space-y-1 text-sm">
                      {addr.fullName && (
                        <p className="font-semibold text-foreground">
                          {addr.fullName}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {addr.addressLine1}
                      </p>
                      {addr.addressLine2 && (
                        <p className="text-muted-foreground">
                          {addr.addressLine2}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {[addr.city, addr.state, addr.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {addr.country && (
                        <p className="text-muted-foreground">{addr.country}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* Product Line Items */}
              {(() => {
                const items: OrderItem[] = Array.isArray(
                  selectedOrder.orderItems,
                )
                  ? selectedOrder.orderItems
                  : [];
                return (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-accent" />
                      Product Line Items
                    </p>
                    {items.length === 0 ? (
                      <p
                        className="text-sm text-muted-foreground"
                        data-ocid="admin.order.order_items.empty_state"
                      >
                        No products in this order
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((it, idx) => {
                          const qty = Number(it.quantity);
                          const unitPrice = Number(it.price);
                          const totalPrice = qty * unitPrice;
                          return (
                            <div
                              key={`${it.productId}-${idx}`}
                              className="flex items-center justify-between text-sm rounded-lg bg-muted/40 px-3 py-2"
                              data-ocid={`admin.order.order_items.item.${idx + 1}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-medium text-foreground truncate">
                                  {it.name}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Qty: {qty}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap"
                                >
                                  {it.flowType === "gift"
                                    ? "Gift"
                                    : it.flowType === "self"
                                      ? "Self"
                                      : it.flowType}
                                </Badge>
                              </div>
                              <div className="text-right whitespace-nowrap ml-2">
                                <span className="text-xs text-muted-foreground">
                                  ₹{(unitPrice / 100).toLocaleString("en-IN")}
                                  /unit
                                </span>
                                <span className="text-sm font-semibold text-foreground ml-2">
                                  ₹{(totalPrice / 100).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
                          <span className="font-semibold text-foreground">
                            Items Total
                          </span>
                          <span className="font-bold text-foreground">
                            ₹
                            {(
                              items.reduce(
                                (sum, it) =>
                                  sum + Number(it.quantity) * Number(it.price),
                                0,
                              ) / 100
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Customer Photos — always render from order.photoKeys */}
              {(() => {
                const urls: string[] = Array.isArray(selectedOrder.photoKeys)
                  ? selectedOrder.photoKeys
                      .map((k) => getPhotoUrl(k))
                      .filter((u): u is string => !!u)
                  : [];
                const count = urls.length;
                return (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Customer Photos{" "}
                      {count > 0 && (
                        <span className="text-red-600 font-semibold">
                          ({count})
                        </span>
                      )}
                    </p>
                    {count === 0 ? (
                      <div className="w-full h-32 flex items-center justify-center bg-muted text-muted-foreground text-sm rounded-xl border border-border">
                        No photos uploaded
                      </div>
                    ) : count === 1 ? (
                      <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 max-w-xs group">
                        <div className="absolute inset-0 bg-red-100 animate-pulse" />
                        <img
                          src={urls[0]}
                          alt="Reference"
                          decoding="async"
                          loading="lazy"
                          className="relative w-full h-auto object-cover opacity-0 transition-opacity duration-300"
                          onLoad={(e) => {
                            (e.target as HTMLImageElement).classList.remove(
                              "opacity-0",
                            );
                            (e.target as HTMLImageElement).classList.add(
                              "opacity-100",
                            );
                            const skeleton = (e.target as HTMLImageElement)
                              .previousElementSibling as HTMLElement | null;
                            if (skeleton) skeleton.style.display = "none";
                          }}
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.style.display = "none";
                            const skeleton =
                              t.previousElementSibling as HTMLElement | null;
                            if (skeleton) skeleton.style.display = "none";
                            const ph = t.parentNode?.querySelector(
                              ".photo-fallback",
                            ) as HTMLDivElement | null;
                            if (!ph) {
                              const d = document.createElement("div");
                              d.className =
                                "photo-fallback w-full h-32 flex items-center justify-center bg-muted text-muted-foreground text-sm";
                              d.textContent = "Photo not available";
                              t.parentNode?.appendChild(d);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(urls[0]);
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `customer-photo-${selectedOrder.orderId}-1.jpg`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (err) {
                              console.error("Download failed:", err);
                            }
                          }}
                          className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 shadow-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Download photo"
                          data-ocid="admin.order.photo.download_button.1"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {urls.map((url, i) => (
                          <div
                            key={url}
                            className="relative rounded-xl overflow-hidden border border-red-200 bg-muted/30 w-28 h-28 flex-shrink-0 group"
                            data-ocid={`admin.order.photo.${i + 1}`}
                          >
                            <div className="absolute inset-0 bg-red-100 animate-pulse" />
                            <img
                              src={url}
                              alt={`Customer portrait ${i + 1}`}
                              decoding="async"
                              loading="lazy"
                              className="relative w-full h-full object-contain opacity-0 transition-opacity duration-300"
                              onLoad={(e) => {
                                (e.target as HTMLImageElement).classList.remove(
                                  "opacity-0",
                                );
                                (e.target as HTMLImageElement).classList.add(
                                  "opacity-100",
                                );
                                const skeleton = (e.target as HTMLImageElement)
                                  .previousElementSibling as HTMLElement | null;
                                if (skeleton) skeleton.style.display = "none";
                              }}
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = "none";
                                const skeleton =
                                  t.previousElementSibling as HTMLElement | null;
                                if (skeleton) skeleton.style.display = "none";
                              }}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(url);
                                  const blob = await res.blob();
                                  const urlObj = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = urlObj;
                                  a.download = `customer-photo-${selectedOrder.orderId}-${i + 1}.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(urlObj);
                                } catch (err) {
                                  console.error("Download failed:", err);
                                }
                              }}
                              className="absolute bottom-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-md p-1 shadow-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Download photo ${i + 1}`}
                              data-ocid={`admin.order.photo.download_button.${i + 1}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {selectedOrder.finalArtworkKey &&
                getPhotoUrl(selectedOrder.finalArtworkKey) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Final Artwork
                    </p>
                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 max-w-xs group">
                      <div className="absolute inset-0 bg-red-100 animate-pulse" />
                      <img
                        src={getPhotoUrl(selectedOrder.finalArtworkKey)!}
                        alt="Final Artwork"
                        decoding="async"
                        loading="lazy"
                        className="relative w-full h-auto object-cover opacity-0 transition-opacity duration-300"
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).classList.remove(
                            "opacity-0",
                          );
                          (e.target as HTMLImageElement).classList.add(
                            "opacity-100",
                          );
                          const skeleton = (e.target as HTMLImageElement)
                            .previousElementSibling as HTMLElement | null;
                          if (skeleton) skeleton.style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = getPhotoUrl(
                              selectedOrder.finalArtworkKey,
                            )!;
                            const res = await fetch(url);
                            const blob = await res.blob();
                            const urlObj = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = urlObj;
                            a.download = `final-artwork-${selectedOrder.orderId}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(urlObj);
                          } catch (err) {
                            console.error("Download failed:", err);
                          }
                        }}
                        className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 shadow-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Download final artwork"
                        data-ocid="admin.order.artwork.download_button"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Delete Order</Label>
                  {deleteConfirming ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm text-destructive font-medium">
                        Are you sure? This cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteOrder}
                        disabled={deleteOrder.isPending}
                        className="rounded-xl"
                        data-ocid="admin.order.confirm_delete_button"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteOrder.isPending ? "Deleting..." : "Yes, Delete"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteConfirming(false)}
                        disabled={deleteOrder.isPending}
                        className="rounded-xl border-primary text-primary hover:bg-primary/10"
                        data-ocid="admin.order.cancel_delete_button"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleDeleteOrder}
                      className="rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      data-ocid="admin.order.delete_button"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Order
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-select">Update Status</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select
                      value={statusValue}
                      onValueChange={(v) => setStatusValue(v as OrderStatus)}
                    >
                      <SelectTrigger
                        id="status-select"
                        className="rounded-xl w-[200px]"
                        data-ocid="admin.order.status_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value={OrderStatus.Received}>
                          Received
                        </SelectItem>
                        <SelectItem value={OrderStatus.InProgress}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={OrderStatus.Shipped}>
                          Shipped
                        </SelectItem>
                        <SelectItem value={OrderStatus.OutForDelivery}>
                          Out for Delivery
                        </SelectItem>
                        <SelectItem value={OrderStatus.Completed}>
                          Completed
                        </SelectItem>
                        <SelectItem value={OrderStatus.Delivered}>
                          Delivered
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={updateStatus.isPending}
                      className="rounded-xl"
                      data-ocid="admin.order.update_status_button"
                    >
                      {updateStatus.isPending ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artwork-upload">Upload Final Artwork</Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      id="artwork-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setArtworkFile(e.target.files?.[0] || null)
                      }
                      className="rounded-xl w-auto flex-1 min-w-[200px]"
                      data-ocid="admin.order.artwork_input"
                    />
                    <Button
                      onClick={handleUploadArtwork}
                      disabled={!artworkFile || uploadArtwork.isPending}
                      className="rounded-xl"
                      data-ocid="admin.order.upload_artwork_button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadArtwork.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Add/Edit Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl border border-red-100">
          <DialogHeader>
            <DialogTitle className="text-red-800 font-bold text-xl">
              {selectedReview ? "Edit Review" : "Add Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="review-customer-name"
                className="block text-sm font-semibold text-red-700 mb-1"
              >
                Customer Name
              </label>
              <input
                id="review-customer-name"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="e.g. Priya Sharma"
                value={reviewForm.name}
                onChange={(e) =>
                  setReviewForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="review-rating"
                className="block text-sm font-semibold text-red-700 mb-1"
              >
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl transition-colors ${star <= reviewForm.rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
                    onClick={() =>
                      setReviewForm((f) => ({ ...f, rating: star }))
                    }
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                htmlFor="review-text"
                className="block text-sm font-semibold text-red-700 mb-1"
              >
                Review Text
              </label>
              <textarea
                id="review-text"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                rows={4}
                placeholder="Write the customer's review..."
                value={reviewForm.text}
                onChange={(e) =>
                  setReviewForm((f) => ({ ...f, text: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="review-photo"
                className="block text-sm font-semibold text-red-700 mb-1"
              >
                Photo (Optional)
              </label>
              {reviewForm.imageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={reviewForm.imageUrl}
                    alt="preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-200"
                  />
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700"
                    onClick={() =>
                      setReviewForm((f) => ({ ...f, imageUrl: "" }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  disabled={reviewImageUploading}
                  onClick={() => reviewImageInputRef.current?.click()}
                >
                  {reviewImageUploading ? "Uploading..." : "Upload Photo"}
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50 transition-colors"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg text-sm shadow transition-colors disabled:opacity-50"
              disabled={
                !reviewForm.name.trim() ||
                !reviewForm.text.trim() ||
                addReviewMutation.isPending ||
                updateReviewMutation.isPending
              }
              onClick={async () => {
                const imgUrl = reviewForm.imageUrl || null;
                if (selectedReview) {
                  await updateReviewMutation.mutateAsync({
                    id: selectedReview[0],
                    name: reviewForm.name,
                    text: reviewForm.text,
                    rating: BigInt(reviewForm.rating),
                    imageUrl: imgUrl,
                    status: reviewForm.status as ReviewStatus,
                  });
                } else {
                  await addReviewMutation.mutateAsync({
                    name: reviewForm.name,
                    text: reviewForm.text,
                    rating: BigInt(reviewForm.rating),
                    imageUrl: imgUrl,
                  });
                }
                setIsReviewDialogOpen(false);
              }}
            >
              {addReviewMutation.isPending || updateReviewMutation.isPending
                ? "Saving..."
                : "Save Review"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Delete Dialog */}
      <Dialog
        open={isDeleteReviewDialogOpen}
        onOpenChange={setIsDeleteReviewDialogOpen}
      >
        <DialogContent className="max-w-sm bg-white rounded-2xl border border-red-100">
          <DialogHeader>
            <DialogTitle className="text-red-700 font-bold text-lg">
              Delete Review?
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm py-2">
            Are you sure you want to delete this review? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setIsDeleteReviewDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow transition-colors disabled:opacity-50"
              disabled={deleteReviewMutation.isPending}
              onClick={async () => {
                if (selectedReview) {
                  await deleteReviewMutation.mutateAsync(selectedReview[0]);
                  setIsDeleteReviewDialogOpen(false);
                }
              }}
            >
              {deleteReviewMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
