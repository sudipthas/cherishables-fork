import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useIsCallerFounder,
  useIsCallerSalesRep,
  useListSalesReps,
  useTeamListCartLeads,
  useTeamListOrders,
  useTeamListProducts,
  useTeamUpdateCartLeadStatus,
} from "@/hooks/useAdmin";
import type { CartLead, SalesRep } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  CheckCircle2,
  Copy,
  Lock,
  Package,
  Phone,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TEAM_LEAD_STATUS_OPTIONS = [
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

function formatPrice(price: bigint): string {
  return `₹${(Number(price) / 100).toLocaleString("en-IN")}`;
}

function handleCopyProductLink(productId: string) {
  const url = `${window.location.origin}/product/${productId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Product link copied to clipboard!"))
    .catch(() => toast.error("Failed to copy link"));
}

function handleCopyTrackingLink(orderId: string) {
  const url = `${window.location.origin}/order-status/${orderId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Tracking link copied to clipboard!"))
    .catch(() => toast.error("Failed to copy link"));
}

function TeamLeadStatusSelect({ lead }: { lead: CartLead }) {
  const updateStatus = useTeamUpdateCartLeadStatus();
  const currentStatus = lead.status ?? "New";

  function handleChange(newStatus: string) {
    updateStatus.mutate(
      { id: lead.id, status: newStatus },
      {
        onSuccess: () => toast.success(`Lead status updated to ${newStatus}`),
        onError: (err) =>
          toast.error(
            `Update failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
      },
    );
  }

  const isOldStatus = !TEAM_LEAD_STATUS_OPTIONS.some(
    (opt) => opt.value === currentStatus,
  );

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={updateStatus.isPending}
    >
      <SelectTrigger
        className="h-8 w-[170px] text-xs"
        data-ocid="team.lead.status_select"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {isOldStatus && (
          <SelectItem value={currentStatus} disabled>
            {currentStatus}
          </SelectItem>
        )}
        {TEAM_LEAD_STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProductsTab() {
  const { data: products = [], isLoading } = useTeamListProducts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          Products
        </h3>
        <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="team.products.empty_state"
        >
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No products available</p>
          <p className="text-sm mt-1">
            Products will appear here once they are added by the admin.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Price</TableHead>
                <TableHead className="text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-muted-foreground">COD</TableHead>
                <TableHead className="text-muted-foreground w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, i) => (
                <TableRow
                  key={product.id}
                  className="transition-smooth hover:bg-muted/50"
                  data-ocid={`team.products.item.${i + 1}`}
                >
                  <TableCell className="font-medium text-foreground">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPrice(BigInt(product.price))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        product.codEnabled
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {product.codEnabled ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      aria-label="Copy product link"
                      onClick={() => handleCopyProductLink(product.id)}
                      className="p-1.5 rounded-lg text-accent hover:text-primary hover:bg-accent/10 transition-colors"
                      data-ocid={`team.products.copy_link_button.${i + 1}`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
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

function LeadsTab() {
  const { data: leads = [], isLoading } = useTeamListCartLeads();
  const { data: reps = [] } = useListSalesReps();

  const repByPrincipal = new Map<string, SalesRep>();
  for (const rep of reps) {
    repByPrincipal.set(rep.principal, rep);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Leads
        </h3>
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
          data-ocid="team.leads.empty_state"
        >
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No leads yet</p>
          <p className="text-sm mt-1">
            Leads will appear here when visitors interact with your store.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Product</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">
                  Interest
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Recipient
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Assigned Rep
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, i) => {
                const assignedRep = lead.assignedRep
                  ? repByPrincipal.get(lead.assignedRep)
                  : undefined;
                const repName = assignedRep?.name?.trim() || "Unassigned";
                const repPhone = assignedRep?.phone?.trim();
                const showCallButton = !!repPhone;

                return (
                  <TableRow
                    key={String(lead.id)}
                    className="transition-smooth hover:bg-muted/50"
                    data-ocid={`team.leads.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.productName || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${leadTypeBadgeClass(lead.leadType ?? "CartAbandon")}`}
                        data-ocid={`team.leads.type_badge.${i + 1}`}
                      >
                        {leadTypeLabel(lead.leadType ?? "CartAbandon")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.productInterest?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.recipient?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {assignedRep ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                            aria-hidden="true"
                          />
                          {repName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          {repName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TeamLeadStatusSelect lead={lead} />
                    </TableCell>
                    <TableCell>
                      {showCallButton ? (
                        <a
                          href={`tel:${repPhone}`}
                          aria-label={`Call assigned rep ${repName} at ${repPhone}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 px-2.5 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-smooth"
                          data-ocid={`team.leads.call_button.${i + 1}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">
                          —
                        </span>
                      )}
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

function OrdersTab() {
  const { data: orders = [], isLoading } = useTeamListOrders();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          Orders
        </h3>
        <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="team.orders.empty_state"
        >
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">
            Orders will appear here once customers start placing them.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Order ID
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Payment</TableHead>
                <TableHead className="text-muted-foreground">
                  Created Date
                </TableHead>
                <TableHead className="text-muted-foreground w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, i) => (
                <TableRow
                  key={order.orderId}
                  className="transition-smooth hover:bg-muted/50"
                  data-ocid={`team.orders.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs text-foreground">
                    {order.orderId}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {order.customerName || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.customerPhone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.orderStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      aria-label="Copy tracking link"
                      onClick={() => handleCopyTrackingLink(order.orderId)}
                      className="p-1.5 rounded-lg text-accent hover:text-primary hover:bg-accent/10 transition-colors"
                      data-ocid={`team.orders.copy_tracking_button.${i + 1}`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
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

export default function TeamPortalPage() {
  const [activeTab, setActiveTab] = useState("products");
  const { actor } = useActor(createActor);
  const { login, loginStatus } = useInternetIdentity();
  const { data: isSalesRep, isLoading: salesRepLoading } =
    useIsCallerSalesRep();
  const { data: isFounder, isLoading: founderLoading } = useIsCallerFounder();

  const isAuthenticated = !!actor;
  const accessLoading = salesRepLoading || founderLoading;
  const hasAccess = !!isSalesRep || !!isFounder;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-soft border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              Team Portal Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Please authenticate with Internet Identity to access the Team
              Portal.
            </p>
            <Button
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="team.login_button"
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

  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p>Checking team access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-soft border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You do not have access to the Team Portal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-semibold text-foreground">
            Cherishables
          </h1>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="font-mono text-xs bg-accent/10 text-accent border-accent/30"
            >
              Team Portal
            </Badge>
            {isFounder && (
              <Badge
                variant="outline"
                className="font-mono text-xs bg-primary/10 text-primary border-primary/30"
              >
                Founder
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-accent" />
            Team Portal
          </h2>
          <p className="text-muted-foreground mt-1">
            View products, manage lead statuses, and track orders.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="mb-6 bg-card border border-border rounded-xl p-1">
            <TabsTrigger
              value="products"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="team.products_tab"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="team.leads_tab"
            >
              Leads
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              data-ocid="team.orders_tab"
            >
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="leads" className="mt-6">
            <LeadsTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
