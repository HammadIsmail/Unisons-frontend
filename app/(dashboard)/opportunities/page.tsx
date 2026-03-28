"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/api/opportunities.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Briefcase,
  GraduationCap,
  Zap,
  Wifi,
  MapPin,
  Building2,
  CalendarClock,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  SearchX,
  Filter,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPES = ["all", "job", "internship", "freelance"] as const;

const TYPE_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  badge: string;
  cardAccent: string;
  iconBg: string;
}> = {
  job: {
    label: "Job",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    cardAccent: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    cardAccent: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-3.5 w-3.5" />,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    cardAccent: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.job;
}

function formatDeadline(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });

  if (diffDays < 0) return { label: "Expired", urgent: true };
  if (diffDays <= 3) return { label: `${formatted} · ${diffDays}d left`, urgent: true };
  return { label: formatted, urgent: false };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OppCardSkeleton() {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-4/5 rounded mb-2" />
        <Skeleton className="h-4 w-3/5 rounded mb-1" />
        <Skeleton className="h-4 w-2/5 rounded mb-4" />
        <div className="border-t border-border/50 pt-3 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const { role } = useAuthStore();
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [skill, setSkill] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", { page, type, skill, is_remote: isRemote }],
    queryFn: () =>
      getOpportunities({
        page,
        limit: 10,
        type: type || undefined,
        skill: skill || undefined,
        is_remote: isRemote,
      }),
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const totalPages = data ? Math.ceil(data.total / 10) : 0;
  const hasActiveFilters = !!(type || skill || isRemote);

  const clearFilters = () => {
    setType("");
    setSkill("");
    setIsRemote(undefined);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Opportunities
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading…"
              : data?.total
                ? `${data.total} opportunit${data.total === 1 ? "y" : "ies"} available`
                : "No opportunities found"}
          </p>
        </div>
        {role === "alumni" && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 h-9 px-4 gap-1.5 self-start sm:self-auto"
            asChild
          >
            <Link href="/post-opportunity">
              <Plus className="h-4 w-4" />
              Post Opportunity
            </Link>
          </Button>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 delay-75">

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5" />
            Type
          </span>
          {TYPES.map((t) => {
            const active = t === "all" ? !type : type === t;
            return (
              <button
                key={t}
                onClick={() => { setType(t === "all" ? "" : t); setPage(1); }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150
                  ${active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                  }
                `}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block w-px h-5 bg-border/60" />

        {/* Skill select */}
        <Select
          value={skill || "all"}
          onValueChange={(v) => { setSkill(v === "all" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs border-border/60 bg-background">
            <SelectValue placeholder="All Skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {skills?.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Remote toggle */}
        <button
          onClick={() => { setIsRemote(isRemote === true ? undefined : true); setPage(1); }}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
            ${isRemote
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/25"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
            }
          `}
        >
          <Wifi className="h-3.5 w-3.5" />
          Remote only
        </button>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <OppCardSkeleton key={i} />)}
        </div>
      ) : data?.data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
          {data.data.map((opp) => {
            const meta = getTypeMeta(opp.type);
            const deadline = formatDeadline(opp.deadline);
            const locationStr =
              !opp.location || opp.location.toLowerCase() === "none"
                ? null
                : opp.location;

            return (
              <Link key={opp.id} href={`/opportunities/${opp.id}`} className="group block">
                <Card className="h-full border-border/60 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-250 overflow-hidden relative">
                  {/* Top accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${meta.cardAccent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Top row: icon + badges */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
                        {meta.icon}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                        {opp.is_remote && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800">
                            <Wifi className="h-3 w-3" />
                            Remote
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-foreground text-[15px] leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {opp.title}
                    </h3>

                    {/* Company + Location */}
                    <div className="flex flex-col gap-1 mb-4">
                      {opp.company && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          {opp.company}
                        </span>
                      )}
                      {locationStr && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {locationStr}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                      {/* Posted by */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 flex-shrink-0 ring-1 ring-border/60">
                          <AvatarImage
                            src={opp.posted_by?.profile_picture ? opp.posted_by.profile_picture : undefined}
                            alt={opp.posted_by?.display_name}
                          />
                          <AvatarFallback className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            {opp.posted_by?.display_name?.charAt(0) ?? "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate leading-none">
                            {opp.posted_by?.display_name ?? "Unknown"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate leading-none mt-0.5">
                            @{opp.posted_by?.username ?? "unknown"}
                          </p>
                        </div>
                      </div>

                      {/* Deadline */}
                      <span className={`flex items-center gap-1 text-[11px] font-medium flex-shrink-0 ${deadline.urgent ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        {deadline.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <SearchX className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">No opportunities found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "No opportunities have been posted yet. Check back soon."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4 h-8 text-xs gap-1.5" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 gap-1.5 text-xs border-border/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Prev
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all duration-150 ${page === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-3 gap-1.5 text-xs border-border/60"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

    </div>
  );
}
