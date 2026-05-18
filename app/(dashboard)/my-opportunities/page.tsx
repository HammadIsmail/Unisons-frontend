"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOpportunities, deleteOpportunity } from "@/lib/api/opportunities.api";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  Eye,
  Users,
  Pencil,
  Trash2,
  Plus,
  Search,
  GraduationCap,
  Building2,
  Calendar,
  Loader2,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "open" | "closed";

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusStyles: Record<Status, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  closed: "bg-slate-200 text-slate-500 border-slate-300",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OppSkeleton() {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/5 rounded" />
              <Skeleton className="h-4 w-2/5 rounded" />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${accent ? "text-blue-600" : "text-slate-900"}`}>
              {value}
            </p>
          </div>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              accent ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────────

function Meta({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card className="border-dashed border-slate-300 bg-white shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Briefcase className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">No opportunities found</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Try adjusting your filters or search, or post a new opportunity for students.
        </p>
        <Button
          variant="outline"
          className="mt-5 border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={onClear}
        >
          Clear filters
        </Button>
      </CardContent>
    </Card>
  );
}

// ── NoPostsState ──────────────────────────────────────────────────────────────

function NoPostsState() {
  return (
    <Card className="border-dashed border-slate-300 bg-white shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-[15px] font-semibold text-slate-900 mb-1">No opportunities posted yet</p>
        <p className="text-sm text-slate-500 mb-5 max-w-xs">
          Share jobs, internships, or freelance opportunities with the alumni network.
        </p>
        <Button
          className="h-9 gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          asChild
        >
          <Link href="/post-opportunity">
            <Plus className="h-4 w-4" />
            Post your first opportunity
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── OpportunityCard ───────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  onDelete,
  onEdit,
}: {
  opp: any;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const isExpired = opp.deadline ? new Date(opp.deadline) < new Date() : false;

  return (
    <Card className="border-slate-200 shadow-none transition-colors hover:border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {opp.title}
                </Link>
                <Badge
                  variant="outline"
                  className={`capitalize ${statusStyles[opp.status as Status] ?? statusStyles.closed}`}
                >
                  {opp.status}
                </Badge>
                {isExpired && (
                  <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">
                    Expired
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {opp.company && (
                  <>
                    {opp.company} ·{" "}
                  </>
                )}
                <span className="text-slate-500 capitalize">{opp.type}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              onClick={onEdit}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {opp.description && (
          <p className="text-sm text-slate-600">{opp.description}</p>
        )}

        {opp.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {opp.tags.map((t: string) => (
              <span
                key={t}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          {opp.location && <Meta icon={MapPin}>{opp.location}</Meta>}
          <Meta icon={Calendar}>
            <span className={isExpired ? "text-rose-600 font-medium" : ""}>
              Deadline {formatDate(opp.deadline)}
            </span>
          </Meta>
          {typeof opp.applicants === "number" && (
            <Meta icon={Users}>
              <span className="font-medium text-slate-700">{opp.applicants}</span> applicants
            </Meta>
          )}
          {typeof opp.views === "number" && (
            <Meta icon={Eye}>
              <span className="font-medium text-slate-700">{opp.views}</span> views
            </Meta>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── DeleteConfirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  opp,
  onCancel,
  onConfirm,
  isPending,
}: {
  opp: any;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700">Delete this opportunity?</p>
              <p className="text-xs text-rose-600/80 mt-0.5">
                "{opp.title}" will be permanently removed. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs gap-1.5"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" /> Yes, delete
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-100"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyOpportunitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "open" | "closed">("all");

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["my-opportunities"],
    queryFn: getMyOpportunities,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      setDeleteId(null);
      toast.success("Opportunity deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const filtered = opportunities.filter((o: any) => {
    const matchesTab = tab === "all" ? true : o.status === tab;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.title?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q) ||
      o.tags?.some((t: string) => t.toLowerCase().includes(q));
    return matchesTab && matchesQuery;
  });

  const counts = {
    all: opportunities.length,
    open: opportunities.filter((o: any) => o.status === "open").length,
    closed: opportunities.filter((o: any) => o.status === "closed").length,
    expired: opportunities.filter((o: any) => o.deadline ? new Date(o.deadline) < new Date() : false).length,
  };

  return (
    <div className="min-h-screen">

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Posted by you</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              My Opportunities
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Manage the opportunities you've shared with students. Edit details, track applicants,
              or close listings that are no longer accepting candidates.
            </p>
          </div>
          <Button
            className="bg-white hover:scale-103 hover:!bg-white border !border-blue-600 !text-blue-600 shadow-md"
            asChild
          >
            <Link href="/post-opportunity">
              <Plus className="mr-2 h-4 w-4" />
              New opportunity
            </Link>
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total posts" value={counts.all} icon={Briefcase} />
            <StatCard label="Active" value={counts.open} icon={Calendar} accent />
            <StatCard label="Expired" value={counts.expired} icon={AlertTriangle} />
            <StatCard label="Closed" value={counts.closed} icon={X} />
          </div>
        )}

        {/* Filters */}
        {!isLoading && opportunities.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  All <span className="ml-1.5 text-xs opacity-70">{counts.all}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="open"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Active <span className="ml-1.5 text-xs opacity-70">{counts.open}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Closed <span className="ml-1.5 text-xs opacity-70">{counts.closed}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value={tab} />
            </Tabs>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, company, tag…"
                className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <OppSkeleton key={i} />)
          ) : opportunities.length === 0 ? (
            <NoPostsState />
          ) : filtered.length === 0 ? (
            <EmptyState
              onClear={() => {
                setQuery("");
                setTab("all");
              }}
            />
          ) : (
            filtered.map((opp: any) => {
              if (deleteId === opp.id) {
                return (
                  <DeleteConfirm
                    key={opp.id}
                    opp={opp}
                    onCancel={() => setDeleteId(null)}
                    onConfirm={() => deleteMutation.mutate(opp.id)}
                    isPending={deleteMutation.isPending}
                  />
                );
              }

              return (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  onEdit={() => router.push(`/opportunities/${opp.id}/edit`)}
                  onDelete={() => setDeleteId(opp.id)}
                />
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
