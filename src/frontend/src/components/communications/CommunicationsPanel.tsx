import { EmailStatus, MessageDirection } from "@/backend";
import type { CommunicationLog, EmailTemplate, Order } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAddCustomerReply,
  useDeleteMessage,
  useGetAdminEmailConfig,
  useListCommunicationLogs,
  useListEmailTemplates,
  useSendTemplateEmail,
  useUpdateAdminEmailConfig,
} from "@/hooks/useAdmin";
import {
  Bot,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldAlert,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface CommunicationsPanelProps {
  orders: Order[];
}

const PREVIEW_VARIABLES: Record<string, string> = {
  customerName: "John Doe",
  orderId: "CC-12345",
  trackingId: "CC-12345",
  orderStatus: "Paid",
  amount: "₹1,299",
  productName: "Custom Caricature Portrait",
  estimatedDelivery: "2-3 business days",
  artistName: "Cherishables Team",
  supportEmail: "support@cherishables.in",
  previewLink: "https://cherishables.shop/preview/CC-12345",
  courierName: "Delhivery",
  trackingNumber: "TRK987654321",
  deliveryDate: "15 June 2026",
};

function formatDate(ts?: bigint): string {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function replaceVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function StatusBadge({ status }: { status: EmailStatus }) {
  if (status === EmailStatus.Sent) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Sent
      </Badge>
    );
  }
  if (status === EmailStatus.Pending) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
      <XCircle className="h-3 w-3 mr-1" />
      Failed
    </Badge>
  );
}

export default function CommunicationsPanel({
  orders,
}: CommunicationsPanelProps) {
  const { data: templates, isLoading: templatesLoading } =
    useListEmailTemplates();
  const {
    data: logs,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useListCommunicationLogs();
  const sendEmailMutation = useSendTemplateEmail();
  const { data: emailConfig } = useGetAdminEmailConfig();
  const updateConfigMutation = useUpdateAdminEmailConfig();

  const [activeTab, setActiveTab] = useState("send");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [customVars, setCustomVars] = useState<Record<string, string>>({});
  const [previewBody, setPreviewBody] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Reply form state
  const [replyOrderId, setReplyOrderId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const addReplyMutation = useAddCustomerReply();
  const deleteMessageMutation = useDeleteMessage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    logId: string;
    label: string;
  } | null>(null);

  // Config state
  const [configEmail, setConfigEmail] = useState("orders@cherishables.in");
  const [configFromName, setConfigFromName] = useState("Cherishables");
  const [configEnabled, setConfigEnabled] = useState(true);
  const [configReplyTo, setConfigReplyTo] = useState("orders@cherishables.in");

  useEffect(() => {
    if (emailConfig) {
      setConfigEmail(emailConfig.adminEmail);
      setConfigFromName(emailConfig.fromName);
      setConfigEnabled(emailConfig.isEnabled);
      setConfigReplyTo(emailConfig.replyTo);
    }
  }, [emailConfig]);

  // Build preview when template or order changes
  useEffect(() => {
    if (!selectedTemplate) {
      setPreviewSubject("");
      setPreviewBody("");
      return;
    }
    const order = orders.find((o) => o.orderId === selectedOrderId);
    const vars: Record<string, string> = { ...PREVIEW_VARIABLES };
    if (order) {
      vars.customerName = order.customerName;
      vars.orderId = order.orderId;
      vars.trackingId = order.orderId;
      vars.orderStatus = order.orderStatus;
      vars.amount = `₹${(Number(order.amount) / 100).toLocaleString("en-IN")}`;
      vars.productName = order.selectedAddOns || "Custom Portrait";
    }
    // Apply custom vars
    for (const [k, v] of Object.entries(customVars)) {
      if (v.trim()) vars[k] = v.trim();
    }
    setPreviewSubject(replaceVariables(selectedTemplate.subject, vars));
    setPreviewBody(replaceVariables(selectedTemplate.body, vars));
  }, [selectedTemplate, selectedOrderId, customVars, orders]);

  function handleSendEmail() {
    if (!selectedTemplate) {
      toast.error("Please select an email template");
      return;
    }
    if (!selectedOrderId) {
      toast.error("Please select an order");
      return;
    }
    const entries = Object.entries(customVars).filter(
      ([, v]) => v.trim() !== "",
    );
    sendEmailMutation.mutate(
      {
        templateId: selectedTemplate.id,
        orderId: selectedOrderId,
        customVariables: entries,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            toast.success("Email sent successfully!");
            setSelectedTemplate(null);
            setSelectedOrderId("");
            setCustomVars({});
          } else {
            toast.error(`Failed to send email: ${result.err}`);
          }
        },
        onError: (err) => {
          toast.error(
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      },
    );
  }

  function openDeleteDialog(logId: string, label: string) {
    setDeleteTarget({ logId, label });
    setDeleteDialogOpen(true);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteMessageMutation.mutate(deleteTarget.logId, {
      onSuccess: () => {
        toast.success("Message deleted successfully");
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      },
    });
  }

  function handleSaveConfig() {
    updateConfigMutation.mutate(
      {
        adminEmail: configEmail,
        fromName: configFromName,
        isEnabled: configEnabled,
        replyTo: configReplyTo,
      },
      {
        onSuccess: () => toast.success("Email configuration saved!"),
        onError: () => toast.error("Failed to save configuration"),
      },
    );
  }

  const activeTemplates = templates?.filter((t) => t.isActive) ?? [];

  // Group logs by orderId for threaded view
  const groupedLogs = React.useMemo(() => {
    if (!logs) return new Map<string, CommunicationLog[]>();
    const map = new Map<string, CommunicationLog[]>();
    for (const log of logs) {
      const list = map.get(log.orderId) ?? [];
      list.push(log);
      map.set(log.orderId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => Number(a.sentAt ?? 0n) - Number(b.sentAt ?? 0n));
    }
    return map;
  }, [logs]);

  const orderIdsWithLogs = React.useMemo(
    () => Array.from(groupedLogs.keys()).sort(),
    [groupedLogs],
  );

  function handleRecordReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyOrderId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }
    if (!replyBody.trim()) {
      toast.error("Please enter a reply body");
      return;
    }
    addReplyMutation.mutate(
      {
        orderId: replyOrderId.trim(),
        templateId: "customer-reply",
        body: replyBody.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Reply recorded successfully!");
          setReplyOrderId("");
          setReplyBody("");
          setReplyAuthor("");
        },
        onError: (err) => {
          toast.error(
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-card border border-border rounded-xl p-1">
          <TabsTrigger
            value="send"
            className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2"
            data-ocid="admin.communications.send_tab"
          >
            <Send className="h-4 w-4" />
            Send Email
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2"
            data-ocid="admin.communications.templates_tab"
          >
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2"
            data-ocid="admin.communications.history_tab"
          >
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2"
            data-ocid="admin.communications.settings_tab"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Send Email Tab */}
        <TabsContent value="send" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <Card className="rounded-2xl shadow-soft border-border">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-accent" />
                  Compose Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comm-template">Email Template</Label>
                  <Select
                    value={selectedTemplate?.id ?? ""}
                    onValueChange={(id) => {
                      const t = templates?.find((tm) => tm.id === id) ?? null;
                      setSelectedTemplate(t);
                      if (t) {
                        const vars: Record<string, string> = {};
                        for (const v of t.variables) {
                          vars[v] = "";
                        }
                        setCustomVars(vars);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="comm-template"
                      className="rounded-xl"
                      data-ocid="admin.communications.template_select"
                    >
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comm-order">Order</Label>
                  <Select
                    value={selectedOrderId}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger
                      id="comm-order"
                      className="rounded-xl"
                      data-ocid="admin.communications.order_select"
                    >
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.orderId} value={o.orderId}>
                          {o.orderId} — {o.customerName} ({o.customerEmail})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-sm font-semibold">
                      Custom Variables
                    </Label>
                    {selectedTemplate.variables.map((varName) => (
                      <div key={varName} className="space-y-1">
                        <Label
                          htmlFor={`var-${varName}`}
                          className="text-xs capitalize"
                        >
                          {varName.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <Input
                          id={`var-${varName}`}
                          value={customVars[varName] ?? ""}
                          onChange={(e) =>
                            setCustomVars((prev) => ({
                              ...prev,
                              [varName]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${varName}`}
                          className="rounded-xl"
                          data-ocid={`admin.communications.var_input.${varName}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl flex-1"
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={!selectedTemplate}
                    data-ocid="admin.communications.preview_button"
                  >
                    Preview
                  </Button>
                  <Button
                    className="rounded-xl flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSendEmail}
                    disabled={
                      sendEmailMutation.isPending ||
                      !selectedTemplate ||
                      !selectedOrderId
                    }
                    data-ocid="admin.communications.send_button"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Live Preview */}
            <Card className="rounded-2xl shadow-soft border-border">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-accent" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="bg-muted/40 rounded-xl p-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Subject
                      </span>
                      <p className="text-sm font-medium mt-1">
                        {previewSubject || "—"}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4 min-h-[200px]">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Body
                      </span>
                      <div className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                        {previewBody || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-3 w-3" />
                      Variables like {"{{customerName}}"} will be replaced with
                      actual order data.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Select a template and order to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-0">
          <Card className="rounded-2xl shadow-soft border-border">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <p className="text-muted-foreground">Loading templates...</p>
              ) : !templates || templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No templates found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((t, idx) => (
                    <div
                      key={t.id}
                      className="border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors"
                      data-ocid={`admin.communications.template.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground">
                              {t.name}
                            </h4>
                            <Badge
                              variant={t.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {t.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {t.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            Subject: {t.subject}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.variables.map((v) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent"
                              >
                                {"{{"}
                                {v}
                                {"}}"}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0 space-y-6">
          {/* Record Reply Form */}
          <Card className="rounded-2xl shadow-soft border-border">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                Record Customer Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordReply} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reply-order-id">Order ID</Label>
                    <Input
                      id="reply-order-id"
                      value={replyOrderId}
                      onChange={(e) => setReplyOrderId(e.target.value)}
                      placeholder="e.g. CC-12345"
                      className="rounded-xl"
                      data-ocid="admin.communications.reply.order_input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply-author">
                      From / Author (Optional)
                    </Label>
                    <Input
                      id="reply-author"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      placeholder="Customer name or email"
                      className="rounded-xl"
                      data-ocid="admin.communications.reply.author_input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-body">Reply Body</Label>
                  <Textarea
                    id="reply-body"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Paste the customer's reply here..."
                    rows={4}
                    className="rounded-xl"
                    data-ocid="admin.communications.reply.body_input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addReplyMutation.isPending}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  data-ocid="admin.communications.reply.submit_button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {addReplyMutation.isPending ? "Saving..." : "Record Reply"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Threaded Conversation View */}
          <Card className="rounded-2xl shadow-soft border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Communication History
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                className="rounded-xl gap-2 border-primary text-primary hover:bg-primary/10"
                data-ocid="admin.communications.history.refresh_button"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <p className="text-muted-foreground">Loading history...</p>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No emails sent yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {orderIdsWithLogs.map((orderId) => {
                    const orderLogs = groupedLogs.get(orderId) ?? [];
                    return (
                      <div
                        key={orderId}
                        className="border border-border rounded-2xl p-4 bg-card/50"
                        data-ocid={`admin.communications.history.thread.${orderId}`}
                      >
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {orderId}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {orderLogs.length} message
                            {orderLogs.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {orderLogs.map((log) => (
                            <div key={log.id} className="space-y-2">
                              {/* Log header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={log.status} />
                                  <span className="text-xs text-muted-foreground">
                                    {log.templateName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(log.sentAt)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      openDeleteDialog(
                                        log.id,
                                        `${log.templateName} — ${formatDate(log.sentAt)}`,
                                      )
                                    }
                                    disabled={deleteMessageMutation.isPending}
                                    aria-label="Delete message"
                                    data-ocid={`admin.communications.history.delete_button.${log.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {/* Messages thread */}
                              <div className="space-y-2 pl-2">
                                {log.messages.map((msg, mIdx) => {
                                  const isSent =
                                    msg.direction === MessageDirection.Sent;
                                  return (
                                    <div
                                      key={`${log.id}-msg-${mIdx}`}
                                      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                          isSent
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted text-foreground rounded-bl-md border border-border"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {isSent ? (
                                            <>
                                              <Bot className="h-3 w-3 opacity-70" />
                                              <span className="text-[10px] uppercase tracking-wide opacity-70">
                                                Admin
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <User className="h-3 w-3 opacity-70" />
                                              <span className="text-[10px] uppercase tracking-wide opacity-70">
                                                {msg.author || "Customer"}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                          {msg.body}
                                        </p>
                                        {log.errorMessage && (
                                          <p className="text-[10px] mt-1 opacity-70 italic">
                                            Error: {log.errorMessage}
                                          </p>
                                        )}
                                        <span
                                          className={`text-[10px] mt-1 block ${
                                            isSent
                                              ? "text-primary-foreground/60"
                                              : "text-muted-foreground"
                                          }`}
                                        >
                                          {formatDate(msg.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-0">
          <Card className="rounded-2xl shadow-soft border-border max-w-xl">
            <CardHeader>
              <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cfg-email">Admin Email Address</Label>
                <Input
                  id="cfg-email"
                  type="email"
                  value={configEmail}
                  onChange={(e) => setConfigEmail(e.target.value)}
                  placeholder="orders@cherishables.in"
                  className="rounded-xl"
                  data-ocid="admin.communications.settings.email_input"
                />
                <p className="text-xs text-muted-foreground">
                  This email will be used as the sender address for all customer
                  communications.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-from">From Name</Label>
                <Input
                  id="cfg-from"
                  value={configFromName}
                  onChange={(e) => setConfigFromName(e.target.value)}
                  placeholder="Cherishables"
                  className="rounded-xl"
                  data-ocid="admin.communications.settings.from_name_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-replyto">Reply-To Email</Label>
                <Input
                  id="cfg-replyto"
                  type="email"
                  value={configReplyTo}
                  onChange={(e) => setConfigReplyTo(e.target.value)}
                  placeholder="orders@cherishables.in"
                  className="rounded-xl"
                  data-ocid="admin.communications.settings.replyto_input"
                />
                <p className="text-xs text-muted-foreground">
                  Customer replies will be sent to this address.
                </p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="cfg-enabled" className="cursor-pointer">
                    Enable Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Turn off to pause all automated and manual emails.
                  </p>
                </div>
                <Switch
                  id="cfg-enabled"
                  checked={configEnabled}
                  onCheckedChange={setConfigEnabled}
                  data-ocid="admin.communications.settings.enabled_switch"
                />
              </div>
              <Button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="admin.communications.settings.save_button"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateConfigMutation.isPending
                  ? "Saving..."
                  : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-card rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-lg">
              Email Preview
            </DialogTitle>
            <DialogDescription>
              This is how the email will appear to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 rounded-xl p-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                To
              </span>
              <p className="text-sm mt-1">
                {orders.find((o) => o.orderId === selectedOrderId)
                  ?.customerEmail ?? "—"}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Subject
              </span>
              <p className="text-sm font-medium mt-1">{previewSubject}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 min-h-[200px]">
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {previewBody}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsPreviewOpen(false);
                handleSendEmail();
              }}
              disabled={
                sendEmailMutation.isPending ||
                !selectedTemplate ||
                !selectedOrderId
              }
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-card rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-lg">
              Delete Message
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="bg-muted/40 rounded-xl p-3 text-sm text-foreground">
              {deleteTarget.label}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
              className="rounded-xl"
              data-ocid="admin.communications.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMessageMutation.isPending}
              className="rounded-xl"
              data-ocid="admin.communications.delete.confirm_button"
            >
              {deleteMessageMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
