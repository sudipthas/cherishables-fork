import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  uploadTeamMemberImage,
  useAddTeamMember,
  useDeleteTeamMember,
  useReorderTeamMembers,
  useTeamMembers,
  useUpdateTeamMember,
} from "@/hooks/useTeamMembers";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TeamMembersAdminPanel() {
  const { data: members = [], isLoading } = useTeamMembers();
  const addMutation = useAddTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();
  const reorderMutation = useReorderTeamMembers();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sortedMembers = [...members].sort(
    (a, b) => Number(a.displayOrder) - Number(b.displayOrder),
  );

  function resetForm() {
    setName("");
    setRole("");
    setImageUrl("");
    setFile(null);
    setUploadProgress(0);
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(member: (typeof sortedMembers)[number]) {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setImageUrl(member.imageUrl);
    setFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      toast.error("Name and role are required");
      return;
    }

    let finalImageUrl = imageUrl;
    if (file) {
      setUploading(true);
      setUploadProgress(10);
      try {
        finalImageUrl = await uploadTeamMemberImage(file);
        setUploadProgress(100);
      } catch (_err) {
        toast.error(
          `Image upload failed: ${_err instanceof Error ? _err.message : String(_err)}`,
        );
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (!finalImageUrl.trim()) {
      toast.error("Please upload a photo");
      return;
    }

    if (editingId) {
      const existing = sortedMembers.find((m) => m.id === editingId);
      updateMutation.mutate(
        {
          id: editingId,
          name: name.trim(),
          role: role.trim(),
          imageUrl: finalImageUrl,
          displayOrder: existing?.displayOrder ?? BigInt(sortedMembers.length),
          isActive: existing?.isActive ?? true,
        },
        {
          onSuccess: () => {
            toast.success("Team member updated");
            resetForm();
          },
          onError: (err: Error) => toast.error(err.message || "Update failed"),
        },
      );
    } else {
      addMutation.mutate(
        {
          name: name.trim(),
          role: role.trim(),
          imageUrl: finalImageUrl,
        },
        {
          onSuccess: () => {
            toast.success("Team member added");
            resetForm();
          },
          onError: (err: Error) => toast.error(err.message || "Add failed"),
        },
      );
    }
  }

  function handleDelete(id: string, nameLabel: string) {
    if (
      window.confirm(
        `Delete team member "${nameLabel}"? This cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Team member deleted"),
        onError: (err: Error) => toast.error(err.message || "Delete failed"),
      });
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...sortedMembers];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    const ids = newOrder.map((m) => m.id);
    try {
      await reorderMutation.mutateAsync(ids);
    } catch (_err) {
      toast.error("Reorder failed");
    }
  }

  async function handleMoveDown(index: number) {
    if (index === sortedMembers.length - 1) return;
    const newOrder = [...sortedMembers];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    const ids = newOrder.map((m) => m.id);
    try {
      await reorderMutation.mutateAsync(ids);
    } catch (_err) {
      toast.error("Reorder failed");
    }
  }

  return (
    <Card className="rounded-2xl shadow-soft border-border mt-6">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Founding Team Members
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Manage the team members displayed on the About Us page.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {sortedMembers.length} member{sortedMembers.length !== 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm((v) => !v);
            }}
            className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2"
            data-ocid="admin.team.add_button"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Add Member"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-muted/40 border border-border rounded-2xl p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tm-name">Name</Label>
                <Input
                  id="tm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="rounded-xl"
                  data-ocid="admin.team.name_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-role">Role</Label>
                <Input
                  id="tm-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Founder & Artist"
                  className="rounded-xl"
                  data-ocid="admin.team.role_input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tm-image">Photo</Label>
              <div className="flex flex-wrap gap-3 items-end">
                <Input
                  id="tm-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f) setImageUrl("");
                  }}
                  className="rounded-xl flex-1 min-w-[200px]"
                  data-ocid="admin.team.image_input"
                />
                {file && (
                  <span className="text-xs text-muted-foreground">
                    {file.name}
                  </span>
                )}
              </div>
              {imageUrl && !file && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-border bg-muted/30 w-20 h-20">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            {uploading && (
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
                disabled={
                  uploading || addMutation.isPending || updateMutation.isPending
                }
                className="rounded-xl bg-primary text-white hover:bg-primary/90"
                data-ocid="admin.team.submit_button"
              >
                <Save className="h-4 w-4 mr-2" />
                {uploading
                  ? "Uploading…"
                  : addMutation.isPending || updateMutation.isPending
                    ? "Saving…"
                    : editingId
                      ? "Save Changes"
                      : "Add Member"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="rounded-xl border-primary text-primary hover:bg-primary/10"
                data-ocid="admin.team.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Loading team members…
          </p>
        ) : sortedMembers.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin.team.empty_state"
          >
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No team members yet</p>
            <p className="text-sm mt-1">
              Add founding team members to display on the About Us page
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMembers.map((member, idx) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft"
                data-ocid={`admin.team.item.${idx + 1}`}
              >
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-16 h-16 object-cover rounded-full bg-muted flex-shrink-0 border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.role}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Order: {Number(member.displayOrder)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={member.isActive}
                    onCheckedChange={(v) =>
                      updateMutation.mutate({
                        id: member.id,
                        name: member.name,
                        role: member.role,
                        imageUrl: member.imageUrl,
                        displayOrder: member.displayOrder,
                        isActive: v,
                      })
                    }
                    data-ocid={`admin.team.active_switch.${idx + 1}`}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={idx === 0 || reorderMutation.isPending}
                    onClick={() => handleMoveUp(idx)}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                    data-ocid={`admin.team.up_button.${idx + 1}`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={
                      idx === sortedMembers.length - 1 ||
                      reorderMutation.isPending
                    }
                    onClick={() => handleMoveDown(idx)}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                    data-ocid={`admin.team.down_button.${idx + 1}`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Edit member"
                  onClick={() => openEdit(member)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  data-ocid={`admin.team.edit_button.${idx + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Edit member"
                  >
                    <title>Edit member</title>
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Delete member"
                  onClick={() => handleDelete(member.id, member.name)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  data-ocid={`admin.team.delete_button.${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
