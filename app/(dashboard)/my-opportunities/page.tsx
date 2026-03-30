"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOpportunities, deleteOpportunity, updateOpportunity } from "@/lib/api/opportunities.api";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Building2,
  Briefcase,
  GraduationCap,
  Zap,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { badge: string; icon: React.ReactNode }> = {
  job: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: <Briefcase className="h-3 w-3" />,
  },
  internship: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: <GraduationCap className="h-3 w-3" />,
  },
  freelance: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: <Zap className="h-3 w-3" />,
  },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.job;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OppSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/5 rounded" />
            <Skeleton className="h-4 w-2/5 rounded" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MyOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState<"open" | "closed">("open");

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["my-opportunities"],
    queryFn: getMyOpportunities,
  });

  const flash = (msg: string) => {
    toast.success(msg, {
      action: {
        label: "OK",
        onClick: () => {},
      },
    })
  };

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      setDeleteId(null);
      flash("Opportunity deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateOpportunity(id, payload),
    onSuccess: () => {
      setEditId(null);
      flash("Opportunity updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const openEdit = (opp: any) => {
    setEditId(opp.id);
    setEditDeadline(opp.deadline?.split("T")[0] ?? "");
    setEditStatus(opp.status);
    setDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {opportunities?.length
              ? `${opportunities.length} posting${opportunities.length !== 1 ? "s" : ""}`
              : "Manage your posted opportunities"}
          </p>
        </div>
        <Button
          className="h-9 gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 flex-shrink-0"
          asChild
        >
          <Link href="/post-opportunity">
            <Plus className="h-4 w-4" />
            Post New
          </Link>
        </Button>
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <OppSkeleton key={i} />)}
        </div>
      ) : opportunities?.length ? (
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const meta = getTypeMeta(opp.type);
            const isEditing = editId === opp.id;
            const isDeleting = deleteId === opp.id;
            const isExpired = opp.deadline ? new Date(opp.deadline) < new Date() : false;

            return (
              <Card
                key={opp.id}
                className={`border-border/60 transition-all duration-200 ${isEditing ? "border-blue-500/40 shadow-md shadow-blue-500/5" : ""}`}
              >
                <CardContent className="p-5">
                  {isEditing ? (
                    /* ── Edit form ── */
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{opp.title}</p>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Deadline
                          </Label>
                          <Input
                            type="date"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="h-9 text-sm border-border/60"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                          </Label>
                          <Select value={editStatus} onValueChange={(v) => setEditStatus(v as "open" | "closed")}>
                            <SelectTrigger className="h-9 text-sm border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                          onClick={() => updateMutation.mutate({ id: opp.id, payload: { deadline: editDeadline, status: editStatus } })}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                            : "Save changes"
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-border/60"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal view ── */
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                              {meta.icon}
                              {opp.type}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              opp.status === "open"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-muted text-muted-foreground border-border/60"
                            }`}>
                              {opp.status}
                            </span>
                            {isExpired && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                                Expired
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="text-[15px] font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                          >
                            {opp.title}
                          </Link>

                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {opp.company && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {opp.company}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className={`h-3 w-3 ${isExpired ? "text-rose-500" : ""}`} />
                              <span className={isExpired ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                                Deadline {formatDate(opp.deadline)}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 border-border/60"
                            onClick={() => openEdit(opp)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => { setDeleteId(opp.id); setEditId(null); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Delete confirm */}
                      {isDeleting && (
                        <div className="mt-2 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-start gap-2.5 mb-3">
                            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Delete this opportunity?</p>
                              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">This action cannot be undone.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => deleteMutation.mutate(opp.id)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending
                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
                                : <><Trash2 className="h-3.5 w-3.5" /> Yes, delete</>
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                              onClick={() => setDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">No opportunities posted yet</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Share jobs, internships, or freelance opportunities with the alumni network.
            </p>
            <Button
              className="h-9 gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
              asChild
            >
              <Link href="/post-opportunity">
                <Plus className="h-4 w-4" />
                Post your first opportunity
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
