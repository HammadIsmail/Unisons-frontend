"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/authStore";
import Link from "next/link";

import { getOpportunities, getMyOpportunities } from "@/lib/api/opportunities.api";
import { searchOpportunities } from "@/lib/api/search.api";
import { getAllSkills } from "@/lib/api/skill.api";
import { Opportunity } from "@/types/api.types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  Search,
  Bookmark,
  TrendingUp,
  Sparkles,
  Clock,
  Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type OppType = "job" | "internship" | "freelance";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPES = ["all", "job", "internship", "freelance"] as const;

const TYPE_META: Record<
  OppType,
  {
    label: string;
    Icon: React.ElementType;
    chip: string;
    dot: string;
  }
> = {
  job: {
    label: "Full-time",
    Icon: Briefcase,
    chip: "bg-[oklch(0.95_0.04_240)] text-[oklch(0.4_0.18_255)] dark:bg-[oklch(0.3_0.08_255)] dark:text-[oklch(0.85_0.12_245)]",
    dot: "bg-[oklch(0.6_0.2_255)]",
  },
  internship: {
    label: "Internship",
    Icon: GraduationCap,
    chip: "bg-[oklch(0.95_0.05_160)] text-[oklch(0.45_0.15_160)] dark:bg-[oklch(0.3_0.08_160)] dark:text-[oklch(0.85_0.15_160)]",
    dot: "bg-[oklch(0.65_0.18_160)]",
  },
  freelance: {
    label: "Freelance",
    Icon: Zap,
    chip: "bg-[oklch(0.95_0.06_60)] text-[oklch(0.5_0.18_55)] dark:bg-[oklch(0.32_0.1_55)] dark:text-[oklch(0.85_0.15_70)]",
    dot: "bg-[oklch(0.7_0.18_60)]",
  },
};

function getTypeMeta(type: string) {
  return TYPE_META[type as OppType] ?? TYPE_META.job;
}

function formatDeadline(date: string) {
  const d = new Date(date);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Expired", urgent: true };
  if (diff === 0) return { label: "Today", urgent: true };
  if (diff <= 3) return { label: `${diff}d left`, urgent: true };
  if (diff <= 14) return { label: `${diff}d left`, urgent: false };
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgent: false,
  };
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function OppCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-4/5 rounded mb-1.5" />
      <Skeleton className="h-4 w-3/5 rounded mb-1" />
      <Skeleton className="h-4 w-2/5 rounded mb-4" />
      <div className="flex gap-1.5 mb-5">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <div className="mt-auto flex-1" />
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 rounded mb-2" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded mt-5" />
          <Skeleton className="h-4 w-4/5 rounded mt-2" />
          <div className="flex gap-2 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:justify-between">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const { role, profile } = useAuthStore();
  const [type, setType] = useState<"" | OppType>("");
  const [skill, setSkill] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [showMyOpportunities, setShowMyOpportunities] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_opportunities");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSaved(new Set(parsed));
        }
      }
    } catch (e) {
      console.error("Failed to load saved opportunities from localStorage:", e);
    }
  }, []);

  // Use search API when there's a query, else use list API
  const isSearching = !!query;

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["opportunities-search", { query, type, skill, isRemote }],
    queryFn: () =>
      searchOpportunities({
        title: query || undefined,
        type: type || undefined,
        skill: skill || undefined,
        is_remote: isRemote,
      }),
    enabled: isSearching && !showMyOpportunities,
  });

  const {
    data: listData,
    isLoading: listLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["opportunities-list", { type, skill, is_remote: isRemote }],
    queryFn: ({ pageParam = 1 }) =>
      getOpportunities({
        page: pageParam,
        limit: 9, // 1 featured + 8 in grid
        type: type || undefined,
        skill: skill || undefined,
        is_remote: isRemote,
      }),
    getNextPageParam: (lastPage) => {
      const limit = 9;
      const totalPages = Math.ceil(lastPage.total / limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !isSearching && !showMyOpportunities,
  });

  const { data: myOpportunitiesData, isLoading: myOpportunitiesLoading } = useQuery({
    queryKey: ["my-opportunities"],
    queryFn: getMyOpportunities,
    enabled: showMyOpportunities,
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const isLoading = showMyOpportunities 
    ? myOpportunitiesLoading 
    : isSearching 
      ? searchLoading 
      : listLoading;

  // Normalize data from either API
  const opportunities: Opportunity[] = showMyOpportunities
    ? (myOpportunitiesData?.map((myOpp) => ({
        ...myOpp,
        type: (myOpp.type as "job" | "internship" | "freelance") || "job",
        is_remote: false,
        location: "",
        apply_link: "",
        media: [],
        posted_by: {
          id: profile?.id || "",
          display_name: profile?.display_name || "",
          username: profile?.username || "",
          profile_picture: profile?.profile_picture || null,
          role: role || "",
        },
      })) as Opportunity[]) ?? []
    : isSearching
      ? searchData ?? []
      : listData?.pages.flatMap((page) => page.data) ?? [];

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isSearching && !showMyOpportunities) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isSearching, showMyOpportunities]);

  const totalCount = showMyOpportunities
    ? opportunities.length
    : isSearching
      ? opportunities.length
      : listData?.pages[0]?.total ?? 0;

  // When the "Saved" filter is active, restrict to bookmarked opportunities
  const visibleOpportunities = showSaved
    ? opportunities.filter((o) => saved.has(o.id))
    : opportunities;

  const featured = visibleOpportunities[0];
  const rest = visibleOpportunities.slice(1);
  const hasActiveFilters = !!(type || skill || isRemote || query || showSaved || showMyOpportunities);

  const stats = [
    { label: "Open roles", value: totalCount, Icon: Briefcase },
    {
      label: "Remote",
      value: opportunities.filter((o) => o.is_remote).length,
      Icon: Wifi,
    },
    { label: "This week", value: opportunities.length, Icon: TrendingUp },
    {
      label: "Hiring orgs",
      value: new Set(opportunities.map((o) => o.company)).size,
      Icon: Building2,
    },
  ];

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("saved_opportunities", JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save opportunities to localStorage:", e);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setType("");
    setSkill("");
    setIsRemote(undefined);
    setQuery("");
    setShowSaved(false);
    setShowMyOpportunities(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.7 0.18 255 / 0.25), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 20%, oklch(0.7 0.2 320 / 0.15), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 pb-5 pt-5">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[oklch(0.65_0.2_255)]" />
                Curated by your alumni network
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Find your next{" "}
<span
  className="bg-clip-text text-transparent"
  style={{
    backgroundImage:
      "linear-gradient(135deg, #2563eb, #60a5fa, #93c5fd)",
  }}
>
  opportunity
</span>
              </h1>
              <p className="mt-3 max-w-xl text-base text-muted-foreground">
                Roles posted by alumni and partners. Filter by type, skill, or
                remote-first to discover what fits.
              </p>
            </div>
            {(role === "alumni" || role === "partner") && (
              <Button
                variant="outline"
                size="lg"
                asChild
                className="
    self-start md:self-auto
    gap-2
    rounded-lg
    !border-blue-600
    !bg-white
    !text-blue-600
    shadow-sm
    transition-all duration-200
    hover:!bg-white
    hover:shadow-lg
    hover:scale-[1.02]
  "
              >
                <Link href="/post-opportunity">
                  <Plus className="h-4 w-4" />
                  Post opportunity
                </Link>
              </Button>
            )}
          </div>

          {/* Search + stats */}
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute z-10 left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                placeholder="Search by role, company, or keyword…"
                className="h-full rounded-4xl border-border bg-card/80 py-4 pl-12 pr-4 text-base shadow-sm backdrop-blur placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 backdrop-blur"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <s.Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-lg font-semibold text-foreground">
                      {isLoading ? (
                        <Skeleton className="h-5 w-8" />
                      ) : (
                        s.value
                      )}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1">
            {TYPES.map((t) => {
              const active = t === "all" ? !type : type === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setType(t === "all" ? "" : (t as OppType));
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all",
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <Select
            value={skill || "all"}
            onValueChange={(v) => {
              setSkill(v === "all" ? "" : v);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-full border-border bg-card text-xs">
              <SelectValue placeholder="All skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {skills?.map((s, i) => (
                <SelectItem index={i+1} key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => {
              setIsRemote(isRemote ? undefined : true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              isRemote
                ? "border-transparent bg-foreground text-background shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <Wifi className="h-3.5 w-3.5" />
            Remote only
          </button>

          <button
            onClick={() => {
              setShowSaved((p) => {
                if (!p) setShowMyOpportunities(false);
                return !p;
              });
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              showSaved
                ? "border-transparent bg-foreground text-background shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", showSaved && "fill-current")} />
            Saved
            {saved.size > 0 && (
              <span
                className={cn(
                  "ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                  showSaved
                    ? "bg-background text-foreground"
                    : "bg-foreground/10 text-foreground"
                )}
              >
                {saved.size}
              </span>
            )}
          </button>

          {(role === "alumni" || role === "partner") && (
            <button
              onClick={() => {
                setShowMyOpportunities((p) => {
                  if (!p) setShowSaved(false);
                  return !p;
                });
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                showMyOpportunities
                  ? "border-transparent bg-foreground text-background shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className={cn("h-3.5 w-3.5", showMyOpportunities && "text-background")} />
              My opportunities
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {isLoading ? (
          <>
            <FeaturedCardSkeleton />
            <div className="mt-12">
              <div className="mb-5">
                <Skeleton className="h-7 w-48 rounded mb-1" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <OppCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        ) : visibleOpportunities.length === 0 ? (
          <EmptyState
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            isSavedFilter={showSaved}
          />
        ) : (
          <>
            {featured && (
              <FeaturedCard
                opp={featured}
                saved={saved.has(featured.id)}
                onSave={() => toggleSave(featured.id)}
              />
            )}

            {rest.length > 0 && (
              <>
                <div className="mb-5 mt-12 flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      All opportunities
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {rest.length} role{rest.length === 1 ? "" : "s"} matching
                      your filters
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((opp) => (
                    <OppCard
                      key={opp.id}
                      opp={opp}
                      saved={saved.has(opp.id)}
                      onSave={() => toggleSave(opp.id)}
                    />
                  ))}
                </div>
                {/* Intersection Observer Target */}
                {!isSearching && !showMyOpportunities && (
                  <div ref={observerTarget} className="h-10 mt-8 flex items-center justify-center text-muted-foreground text-sm">
                    {isFetchingNextPage ? (
                      <div className="flex gap-1 items-center">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                      </div>
                    ) : hasNextPage ? null : (
                      "You've reached the end."
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({
  opp,
  saved,
  onSave,
}: {
  opp: Opportunity;
  saved: boolean;
  onSave: () => void;
}) {
  const meta = getTypeMeta(opp.type);
  const deadline = formatDeadline(opp.deadline);

  return (
    <Link href={`/opportunities/${opp.id}`} className="group block">
      <article className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-xl">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 90% 0%, oklch(0.7 0.2 255 / 0.18), transparent 60%)",
          }}
        />

        <div className="grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-6 lg:grid-cols-[1fr_auto] lg:p-10">
          {/* LEFT SIDE */}
          <div className="min-w-0">
            {/* badges */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-transparent bg-foreground/5 px-2.5 py-1 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  meta.chip
                )}
              >
                <meta.Icon className="h-3 w-3" />
                {meta.label}
              </span>

              {opp.is_remote && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Wifi className="h-3 w-3" />
                  Remote
                </span>
              )}
            </div>

            {/* header */}
            <div className="flex gap-3 sm:flex-row sm:items-start">
              <CompanyLogo opp={opp} size={52} />

              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl group-hover:text-[oklch(0.55_0.22_255)] transition-colors">
                  {opp.title}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {opp.company}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {opp.location}
                  </span>

                  {opp.salary && (
                    <span className="font-medium text-foreground">
                      {opp.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* description */}
            {opp.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {opp.description}
              </p>
            )}

            {/* skills */}
            {opp.required_skills?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {opp.required_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            {/* footer meta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <PostedBy opp={opp} />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Posted {timeAgo(opp.posted_at)}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE (ACTIONS) */}
          <div className="flex flex-col gap-3 lg:items-end lg:justify-between">
            {/* deadline */}
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                deadline.urgent
                  ? "bg-[oklch(0.95_0.05_25)] text-[oklch(0.5_0.2_25)] dark:bg-[oklch(0.3_0.1_25)] dark:text-[oklch(0.85_0.15_30)]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {deadline.label}
            </span>

            {/* buttons */}
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:flex-col lg:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(opp.apply_link, "_blank", "noopener,noreferrer");
                }}
                className="
                  w-full sm:w-auto lg:w-full
                  gap-2 rounded-lg
                  !border-blue-600 !bg-white !text-blue-600
                  shadow-sm transition-all duration-200
                  hover:!border-blue-700 hover:!text-blue-700
                  hover:shadow-lg hover:scale-[1.02]
                  active:scale-[0.98]
                "
              >
                Apply now
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSave();
                }}
                className="w-full sm:w-auto lg:w-full gap-2"
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Standard Card ─────────────────────────────────────────────────────────────

function OppCard({
  opp,
  saved,
  onSave,
}: {
  opp: Opportunity;
  saved: boolean;
  onSave: () => void;
}) {
  const meta = getTypeMeta(opp.type);
  const deadline = formatDeadline(opp.deadline);
  const locationStr =
    !opp.location || opp.location.toLowerCase() === "none"
      ? null
      : opp.location;

  return (
    <Link href={`/opportunities/${opp.id}`} className="group block">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 90% 0%, oklch(0.7 0.2 255 / 0.18), transparent 60%)",
          }}
        />
        {/* Save button — stop propagation so Link doesn't fire */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onSave();
          }}
          aria-label={saved ? "Unsave" : "Save"}
          className={cn(
            "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            saved && "bg-foreground text-background hover:bg-foreground"
          )}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>

        <div className="mb-4 pr-10">
          <CompanyLogo opp={opp} size={44} />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              meta.chip
            )}
          >
            <meta.Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
          {opp.is_remote && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Wifi className="h-2.5 w-2.5" />
              Remote
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:text-[oklch(0.55_0.22_255)] transition-colors">
          {opp.title}
        </h3>

        <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
          {opp.company && (
            <span className="font-medium text-foreground">{opp.company}</span>
          )}
          {locationStr && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationStr}
            </span>
          )}
        </div>

        {opp.salary && (
          <div className="mt-3 text-sm font-medium text-foreground">
            {opp.salary}
          </div>
        )}

        {opp.required_skills && opp.required_skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opp.required_skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
            {opp.required_skills.length > 3 && (
              <span className="rounded-md px-1 py-0.5 text-[11px] text-muted-foreground">
                +{opp.required_skills.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex-1" />

        <div className="flex items-center justify-between border-t border-border pt-4">
          <PostedBy opp={opp} compact />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              deadline.urgent
                ? "bg-[oklch(0.95_0.05_25)] text-[oklch(0.5_0.2_25)] dark:bg-[oklch(0.3_0.1_25)] dark:text-[oklch(0.85_0.15_30)]"
                : "text-muted-foreground"
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {deadline.label}
          </span>
        </div>
      </article>
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CompanyLogo({ opp, size }: { opp: Opportunity; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
      style={{ width: size, height: size }}
    >
      {opp.media && opp.media[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={opp.media[0]}
          alt={`${opp.company} logo`}
          className="h-full w-full object-contain p-1.5"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Building2 className="h-1/2 w-1/2 text-muted-foreground" />
      )}
    </div>
  );
}

function PostedBy({
  opp,
  compact,
}: {
  opp: Opportunity;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={compact ? "h-6 w-6" : "h-7 w-7"}>
        <AvatarImage
          src={
            opp.posted_by?.profile_picture
              ? opp.posted_by.profile_picture
              : undefined
          }
          alt={opp.posted_by?.display_name}
        />
        <AvatarFallback className="text-[10px]">
          {opp.posted_by?.display_name?.charAt(0) ?? "A"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-xs font-medium text-foreground">
          {opp.posted_by?.display_name ?? "Unknown"}
        </div>
        {!compact && (
          <div className="truncate text-[11px] text-muted-foreground">
            @{opp.posted_by?.username ?? "unknown"}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onClear,
  hasActiveFilters,
  isSavedFilter,
}: {
  onClear: () => void;
  hasActiveFilters: boolean;
  isSavedFilter?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        {isSavedFilter ? (
          <Bookmark className="h-6 w-6 text-muted-foreground" />
        ) : (
          <SearchX className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        {isSavedFilter ? "No saved opportunities" : "No opportunities found"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {isSavedFilter
          ? "Bookmark opportunities you\'re interested in and they\'ll appear here."
          : hasActiveFilters
          ? "Try adjusting your filters or search terms to see more results."
          : "No opportunities have been posted yet. Check back soon."}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClear} className="mt-6 gap-2">
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
