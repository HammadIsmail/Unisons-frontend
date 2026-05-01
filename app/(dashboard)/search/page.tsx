"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAlumni, searchOpportunities } from "@/lib/api/search.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import { useDebounce } from "@/hooks/useDebounce";
import { useNetwork } from "@/hooks/useNetwork";
import useAuthStore from "@/store/authStore";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
  SearchX,
  AtSign,
  ChevronRight,
  Clock,
  UserPlus,
  ExternalLink,
  Filter,
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

// ── Filter Components ─────────────────────────────────────────────────────────

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 min-w-[120px]">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 px-3 text-xs bg-background border border-border/60 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder:text-muted-foreground/50 text-foreground"
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
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 min-w-[120px]">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <Select value={value || "_all"} onValueChange={(v) => onChange(v === "_all" ? "" : v)}>
        <SelectTrigger className="h-9 text-xs border-border/60 bg-background rounded-xl">
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ResultSkeleton({ type }: { type: Tab }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
            {type === "alumni" && <Skeleton className="h-3 w-1/2 rounded" />}
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { role } = useAuthStore();
  const [tab, setTab] = useState<Tab>("alumni");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const {
    myConnections,
    sentRequests,
    connect,
    isConnecting,
    cancelRequest,
    isCancelling,
    removeOldConnection,
    isRemoving,
  } = useNetwork();

  const getStatus = (personId: string) => {
    if (myConnections?.some((c: any) => c.id === personId || c.alumni_id === personId || c.user_id === personId)) {
      return "connected";
    }
    if (sentRequests?.some((r: any) => r.target_id === personId)) {
      return "pending";
    }
    return "none";
  };

  const handleConnect = (id: string, type: "batchmate" | "colleague" | "mentor") => {
    connect({ targetId: id });
  };

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
  const hasFilters = tab === "alumni" ? hasAlumniFilters : hasOppFilters;

  const skillOptions = skills?.map((s) => ({ value: s, label: s })) ?? [];

  const clearAll = () => {
    setQuery("");
    setCompany(""); setSkill(""); setBatchYear(""); setDegree("");
    setOppType(""); setOppSkill(""); setOppLocation(""); setIsRemote(undefined);
  };

  const resultCount = tab === "alumni" ? (alumniResults?.length ?? 0) : (oppResults?.length ?? 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground">Find alumni or opportunities across the network</p>
      </div>

      {/* ── Search Bar & Tab Selection ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex p-1 bg-muted/60 border border-border/50 rounded-xl h-10 w-fit">
            {(["alumni", "opportunities"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setQuery(""); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === t ? "bg-background text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "alumni" ? <Users className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                {t}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              {isAtMode ? <AtSign className="h-4 w-4 text-blue-500" /> : <Search className="h-4 w-4 text-muted-foreground/50" />}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              placeholder={tab === "alumni" ? "Search by name, or @username..." : "Search by job title, company..."}
              className={`w-full h-10 pl-10 pr-10 text-sm rounded-xl border bg-background transition-all outline-none ${
                isAtMode ? "border-blue-500 ring-2 ring-blue-500/10" : "border-border/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              }`}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Username Suggestions */}
            {isAtMode && showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border shadow-xl rounded-xl z-50 overflow-hidden">
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={() => router.push(`/alumni/${s.username}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={s.profile_picture} />
                      <AvatarFallback className="bg-blue-600/10 text-blue-600 text-[10px] font-bold">{getInitials(s.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{s.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 py-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg text-[10px] uppercase font-bold tracking-widest text-muted-foreground border border-border/40">
            <Filter className="h-3 w-3" />
            Filters
          </div>

          {tab === "alumni" ? (
            <>
              <FilterInput value={company} onChange={setCompany} placeholder="Company" />
              <FilterSelect value={skill} onChange={setSkill} options={skillOptions} placeholder="Skill" />
              <FilterInput value={batchYear} onChange={setBatchYear} placeholder="Batch" />
              <FilterInput value={degree} onChange={setDegree} placeholder="Degree" />
            </>
          ) : (
            <>
              <FilterSelect
                value={oppType}
                onChange={setOppType}
                options={[
                  { value: "job", label: "Job" },
                  { value: "internship", label: "Internship" },
                  { value: "freelance", label: "Freelance" },
                ]}
                placeholder="Job Type"
              />
              <FilterSelect value={oppSkill} onChange={setOppSkill} options={skillOptions} placeholder="Skill" />
              <FilterInput value={oppLocation} onChange={setOppLocation} placeholder="Location" />
              <button
                onClick={() => setIsRemote(isRemote === true ? undefined : true)}
                className={`h-9 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                  isRemote ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-background text-muted-foreground border-border/60 hover:border-border"
                }`}
              >
                <Wifi className="h-3.5 w-3.5" />
                Remote Only
              </button>
            </>
          )}

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl gap-2">
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* ── Results Section ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        {!isLoading && resultCount > 0 && (
          <p className="text-xs font-medium text-muted-foreground pl-1">{resultCount} results matching your search</p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            [1, 2, 3, 4].map(i => <ResultSkeleton key={i} type={tab} />)
          ) : tab === "alumni" ? (
            alumniResults?.length ? (
              alumniResults.map(a => {
                const status = getStatus(a.id);
                const isPending = status === "pending";
                const isConnected = status === "connected";

                return (
                  <Card key={a.id} className="border-border/60 hover:border-blue-500/40 hover:shadow-sm transition-all duration-200 group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link href={`/alumni/${a.username}`}>
                        <Avatar className="h-12 w-12 border border-border/40 group-hover:scale-105 transition-transform">
                          <AvatarImage src={a.profile_picture} />
                          <AvatarFallback className="bg-blue-600/10 text-blue-600 font-bold text-sm">{getInitials(a.display_name)}</AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/alumni/${a.username}`} className="font-bold text-foreground hover:text-blue-600 transition-colors inline-block">{a.display_name}</Link>
                        <p className="text-xs text-muted-foreground truncate">
                          @{a.username} 
                          {a.current_company && <span className="opacity-50 mx-2">|</span>}
                          {a.current_company && <span className="inline-flex items-center gap-1 font-medium"><Building2 className="h-3 w-3" /> {a.current_company}</span>}
                        </p>
                        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                          {a.skills?.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40 font-medium whitespace-nowrap">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status !== "none" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant={isPending ? "secondary" : "ghost"} size="sm" className="h-8 rounded-full px-4 text-xs font-bold transition-all">
                                {isPending ? <><Clock className="h-3.5 w-3.5 mr-1.5" /> Pending</> : "Connected"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>{isPending ? "Cancel Request" : "Remove Connection"}</DialogTitle>
                                <DialogDescription>
                                  Confirm if you want to {isPending ? "cancel your request to" : "remove"} <span className="font-semibold text-foreground">{a.display_name}</span>.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                                <DialogClose asChild><Button variant="outline" size="sm">Back</Button></DialogClose>
                                <DialogClose asChild>
                                  <Button variant="destructive" size="sm" onClick={() => isPending ? cancelRequest(a.id) : removeOldConnection(a.id)} disabled={isCancelling || isRemoving}>
                                    Confirm
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : role === "student" ? (
                          <Button variant="outline" size="sm" className="h-8 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-4 text-xs font-bold" onClick={() => handleConnect(a.id, "mentor")} disabled={isConnecting}>
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Connect
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-4 text-xs font-bold" disabled={isConnecting}>
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Connect
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuItem onClick={() => handleConnect(a.id, "batchmate")} className="text-xs font-medium cursor-pointer">Connect as Batchmate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConnect(a.id, "colleague")} className="text-xs font-medium cursor-pointer">Connect as Colleague</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Link href={`/alumni/${a.username}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/30 hover:text-foreground transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EmptySearch icon={<SearchX className="h-8 w-8 text-muted-foreground/30" />} title="No alumni found" description="Adjust your filters or try a broader search." />
            )
          ) : (
            oppResults?.length ? (
              oppResults.map(o => {
                const meta = getTypeMeta(o.type);
                return (
                  <Card key={o.id} className="border-border/60 hover:border-blue-500/40 hover:shadow-sm transition-all duration-200 group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link href={`/opportunities/${o.id}`}>
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105 ${meta.badge}`}>
                          {meta.icon}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/opportunities/${o.id}`} className="font-bold text-foreground hover:text-blue-600 transition-colors truncate block">{o.title}</Link>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
                          {o.company && <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Building2 className="h-3 w-3 opacity-70" /> {o.company}</span>}
                          {o.location && o.location.toLowerCase() !== "none" && <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><MapPin className="h-3 w-3 opacity-70" /> {o.location}</span>}
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold h-5 px-2 bg-muted/40">{meta.label}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs px-5 shadow-lg shadow-blue-600/5 group/btn"
                          asChild
                        >
                          <Link href={`/opportunities/${o.id}`}>
                            Details <ChevronRight className="ml-1 h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EmptySearch icon={<SearchX className="h-8 w-8 text-muted-foreground/30" />} title="No opportunities found" description="Try a different job title or broader location." />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EmptySearch({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="py-20 flex flex-col items-center text-center bg-muted/20 border-2 border-dashed border-border/40 rounded-3xl">
      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">{icon}</div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-[280px] leading-relaxed">{description}</p>
    </div>
  );
}
