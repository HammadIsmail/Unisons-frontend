"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAlumni, searchOpportunities } from "@/lib/api/search.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

import {
  Search,
  Users,
  Briefcase,
  GraduationCap,
  Zap,
  Wifi,
  MapPin,
  Building2,
  ArrowRight,
  X,
  SlidersHorizontal,
  UserSearch,
  SearchX,
  AtSign,
  ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "alumni" | "opportunities";

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  job: {
    label: "Job",
    icon: <Briefcase className="h-3 w-3" />,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-3 w-3" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-3 w-3" />,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.job;
}

// ── Filter Field ──────────────────────────────────────────────────────────────

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-8 px-3 text-xs bg-background border border-border/60 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder:text-muted-foreground/50 text-foreground"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select value={value || "_all"} onValueChange={(v) => onChange(v === "_all" ? "" : v)}>
        <SelectTrigger className="h-8 text-xs border-border/60 bg-background">
          <SelectValue placeholder={placeholder ?? "Any"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">{placeholder ?? "Any"}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function AlumniSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 rounded mb-1.5" />
            <Skeleton className="h-3 w-20 rounded mb-1" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OppSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-3/5 rounded mb-2" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("alumni");
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Alumni filters
  const [company, setCompany] = useState("");
  const [skill, setSkill] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [degree, setDegree] = useState("");

  // Opportunity filters
  const [oppType, setOppType] = useState("");
  const [oppLocation, setOppLocation] = useState("");
  const [oppSkill, setOppSkill] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);

  const debouncedQuery = useDebounce(query, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const usernameQuery = query.startsWith("@") ? query.slice(1) : "";

  const { data: suggestions } = useQuery({
    queryKey: ["search", "suggestions", usernameQuery],
    queryFn: () => searchAlumni({ display_name: usernameQuery }),
    enabled: query.startsWith("@") && usernameQuery.length > 0 && tab === "alumni",
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const { data: alumniResults, isLoading: alumniLoading } = useQuery({
    queryKey: ["search", "alumni", { debouncedQuery, company, skill, batchYear, degree }],
    queryFn: () =>
      searchAlumni({
        display_name: debouncedQuery || undefined,
        company: company || undefined,
        skill: skill || undefined,
        batch_year: batchYear || undefined,
        degree: degree || undefined,
      }),
    enabled: tab === "alumni",
  });

  const { data: oppResults, isLoading: oppLoading } = useQuery({
    queryKey: ["search", "opportunities", { debouncedQuery, oppType, oppSkill, oppLocation, isRemote }],
    queryFn: () =>
      searchOpportunities({
        title: debouncedQuery || undefined,
        type: oppType || undefined,
        skill: oppSkill || undefined,
        location: oppLocation || undefined,
        is_remote: isRemote,
      }),
    enabled: tab === "opportunities",
  });

  const isLoading = tab === "alumni" ? alumniLoading : oppLoading;

  const isAtMode = query.startsWith("@") && tab === "alumni";
  const hasAlumniFilters = !!(company || skill || batchYear || degree);
  const hasOppFilters = !!(oppType || oppSkill || oppLocation || isRemote);
  const hasFilters = hasAlumniFilters || hasOppFilters;

  const skillOptions = skills?.map((s) => ({ value: s, label: s })) ?? [];

  const clearAll = () => {
    setQuery("");
    setCompany(""); setSkill(""); setBatchYear(""); setDegree("");
    setOppType(""); setOppSkill(""); setOppLocation(""); setIsRemote(undefined);
  };

  const resultCount =
    tab === "alumni" ? (alumniResults?.length ?? 0) : (oppResults?.length ?? 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find alumni or opportunities across the network
        </p>
      </div>

      {/* ── Search bar + tabs ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit border border-border/50">
          {(["alumni", "opportunities"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setQuery(""); }}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize
                ${tab === t
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {t === "alumni"
                ? <Users className="h-3.5 w-3.5" />
                : <Briefcase className="h-3.5 w-3.5" />
              }
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isAtMode
                ? <AtSign className="h-4 w-4 text-blue-500" />
                : <Search className="h-4 w-4 text-muted-foreground/60" />
              }
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isAtMode) {
                  const username = query.slice(1).trim();
                  if (username) { router.push(`/alumni/${username}`); setShowSuggestions(false); }
                }
                if (e.key === "Escape") setShowSuggestions(false);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={
                tab === "alumni"
                  ? "Search by name, or @username for exact lookup…"
                  : "Search by job title, company…"
              }
              className={`
                w-full pl-10 pr-10 py-2.5 h-10 text-sm rounded-xl border transition-all duration-150
                bg-background text-foreground placeholder:text-muted-foreground/50
                outline-none
                ${isAtMode
                  ? "border-blue-500 ring-2 ring-blue-500/15"
                  : "border-border/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                }
              `}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Username suggestion dropdown */}
            {isAtMode && showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border/70 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={() => { router.push(`/alumni/${s.username}`); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={s.profile_picture} />
                      <AvatarFallback className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {s.display_name?.charAt(0) ?? "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{s.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">
                    Press <kbd className="px-1 py-0.5 text-[10px] bg-background border border-border/60 rounded font-mono">Enter</kbd> to go directly to @{query.slice(1)}'s profile
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Go to profile CTA */}
          {isAtMode && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 gap-1.5 text-sm flex-shrink-0 shadow-sm shadow-blue-600/20"
              onClick={() => {
                const username = query.slice(1).trim();
                if (username) router.push(`/alumni/${username}`);
              }}
            >
              Go to profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* @username hint */}
        {isAtMode && (
          <p className="text-xs text-muted-foreground pl-1 flex items-center gap-1">
            <AtSign className="h-3 w-3 text-blue-500" />
            Press Enter or click "Go to profile" to view @{query.slice(1)}'s profile
          </p>
        )}
      </div>

      {/* ── Body: filters + results ──────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── Filters sidebar ───────────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <SlidersHorizontal className="h-3 w-3" />
              Filters
            </div>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          <Separator className="opacity-50" />

          {tab === "alumni" ? (
            <div className="space-y-3">
              <FilterInput label="Company" value={company} onChange={setCompany} placeholder="e.g. Netsol" />
              <FilterSelect
                label="Skill"
                value={skill}
                onChange={setSkill}
                options={skillOptions}
                placeholder="Any skill"
              />
              <FilterInput label="Batch Year" value={batchYear} onChange={setBatchYear} placeholder="e.g. 2020" />
              <FilterInput label="Degree" value={degree} onChange={setDegree} placeholder="e.g. BSCS" />
            </div>
          ) : (
            <div className="space-y-3">
              <FilterSelect
                label="Type"
                value={oppType}
                onChange={setOppType}
                options={[
                  { value: "job", label: "Job" },
                  { value: "internship", label: "Internship" },
                  { value: "freelance", label: "Freelance" },
                ]}
                placeholder="Any type"
              />
              <FilterSelect
                label="Skill"
                value={oppSkill}
                onChange={setOppSkill}
                options={skillOptions}
                placeholder="Any skill"
              />
              <FilterInput label="Location" value={oppLocation} onChange={setOppLocation} placeholder="e.g. Lahore" />
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Remote
                </label>
                <button
                  onClick={() => setIsRemote(isRemote === true ? undefined : true)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150
                    ${isRemote
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-background text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                    }
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5" />
                    Remote only
                  </span>
                  {isRemote && <X className="h-3 w-3 opacity-70" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-2">

          {/* Result count header */}
          {!isLoading && (
            <div className="flex items-center justify-between mb-1 px-0.5">
              <p className="text-xs text-muted-foreground">
                {resultCount > 0
                  ? `${resultCount} result${resultCount !== 1 ? "s" : ""} found`
                  : ""}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) =>
                tab === "alumni"
                  ? <AlumniSkeleton key={i} />
                  : <OppSkeleton key={i} />
              )}
            </div>
          ) : tab === "alumni" ? (
            alumniResults?.length ? (
              <div className="space-y-2">
                {alumniResults.map((a) => (
                  <Link key={a.id} href={`/alumni/${a.username}`} className="block group">
                    <Card className="border-border/60 hover:border-blue-500/40 hover:shadow-sm hover:shadow-blue-500/5 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/60 group-hover:ring-blue-500/30 transition-all">
                            <AvatarImage src={a.profile_picture} />
                            <AvatarFallback className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-xs font-bold">
                              {a.display_name ? getInitials(a.display_name) : "U"}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {a.display_name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              @{a.username}
                              {a.current_company && (
                                <>
                                  <span className="mx-1.5 text-muted-foreground/30">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {a.current_company}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>

                          {/* Skills + arrow */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden sm:flex gap-1.5 flex-wrap justify-end max-w-[160px]">
                              {a.skills?.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 font-medium"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UserSearch className="h-6 w-6 text-muted-foreground/40" />}
                title="No alumni found"
                description="Try adjusting your search or filters."
              />
            )
          ) : (
            oppResults?.length ? (
              <div className="space-y-2">
                {oppResults.map((o) => {
                  const meta = getTypeMeta(o.type);
                  return (
                    <Link key={o.id} href={`/opportunities/${o.id}`} className="block group">
                      <Card className="border-border/60 hover:border-blue-500/40 hover:shadow-sm hover:shadow-blue-500/5 transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.badge}`}>
                              {meta.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {o.title}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                {o.company && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {typeof o.company === "string" ? o.company : o.company}
                                  </span>
                                )}
                                {o.location && o.location.toLowerCase() !== "none" && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {o.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Badge + arrow */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                                {meta.icon}
                                {meta.label}
                              </span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<SearchX className="h-6 w-6 text-muted-foreground/40" />}
                title="No opportunities found"
                description="Try a different title or adjust your filters."
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{description}</p>
      </CardContent>
    </Card>
  );
}
