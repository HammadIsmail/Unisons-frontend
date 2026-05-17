"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAlumni } from "@/lib/api/search.api";
import { getAllSkills } from "@/lib/api/skill.api";
import { useDebounce } from "@/hooks/useDebounce";
import { useNetwork } from "@/hooks/useNetwork";
import useAuthStore from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";
import {
  Search,
  MapPin,
  Building2,
  GraduationCap,
  Sparkles,
  X,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Briefcase,
  Wifi,
  ChevronRight,
  AtSign,
  SearchX,
  Filter,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "none" | "pending" | "connected";

type PendingAction =
  | { type: "cancel"; targetId: string; targetName: string }
  | { type: "disconnect"; targetId: string; targetName: string }
  | null;

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const isDanger = confirmVariant === "danger";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center mb-4",
            isDanger ? "bg-red-50" : "bg-amber-50"
          )}
        >
          <AlertTriangle
            className={cn("w-5 h-5", isDanger ? "text-red-500" : "text-amber-500")}
          />
        </div>
        <h2 className="text-[15px] font-semibold text-foreground leading-snug">
          {title}
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium border border-border/60 text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors",
              isDanger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter Pill (matches React design) ───────────────────────────────────────

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const active = !!value;
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(o => 
    typeof o === 'string' && o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setSearch("");
      }}
    >
      <DropdownMenuTrigger
        className={`h-9 flex !text-blue-600 items-center w-auto gap-1.5 rounded-full border px-3.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring border-blue-600`}
      >
        <span className={active ? "text-muted-foreground" : ""}>{label}</span>
        {active && <span className="font-semibold max-w-[100px] truncate">{value}</span>}
        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <div className="p-2 sticky top-0 bg-popover z-10">
          <Input
            id={`search-${label.toLowerCase()}`}
            name={`search-${label.toLowerCase()}`}
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8 text-xs"
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value || "_all"}
          onValueChange={(v) => onChange(v === "_all" ? "" : v)}
        >
          <DropdownMenuRadioItem value="_all">Any {label.toLowerCase()}</DropdownMenuRadioItem>
          {filteredOptions.map((o) => (
            <DropdownMenuRadioItem key={o} value={o}>
              {o}
            </DropdownMenuRadioItem>
          ))}
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No results found
            </div>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-1/2" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ── Alumni Card ───────────────────────────────────────────────────────────────

function AlumniCard({
  alumnus: a,
  status,
  onConnect,
  onRequestCancelConfirm,
  onRequestDisconnectConfirm,
  isLoading,
}: {
  alumnus: any;
  status: Status;
  onConnect: () => void;
  onRequestCancelConfirm: () => void;
  onRequestDisconnectConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 transition hover:border-border hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${a.id}`}>
          <Avatar className="h-12 w-12 ring-2 ring-background group-hover:scale-105 transition-transform">
            <AvatarImage src={a.profile_picture} alt={a.display_name} />
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {getInitials(a.display_name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${a.id}`}>
            <h3 className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
              {a.display_name}
            </h3>
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{a.username}
          </p>
        </div>
      </div>
      
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {a.company && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {a.company}
          </span>
        )}
        {a.batch_year && (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium dark:bg-blue-900/40 dark:text-blue-300">
            <GraduationCap className="h-3 w-3" />
            Batch of {a.batch_year}
          </span>
        )}
      </div>

      {a.bio ? (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground/90">
          {a.bio}
        </p>
      ) : (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground/90">
          No bio available
        </p>
      )}

      {a.skills?.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {a.skills.slice(0, 3).map((s: string) => (
            <Badge
              key={s}
              variant="secondary"
              className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted"
            >
              {s}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-4 line-clamp-2 text-xs text-muted-foreground/90">
          No skills available
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          {a.role.toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Message"
            asChild
          >
            <Link href={`/chat/${a.id}`}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>

          {status === "connected" ? (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 rounded-full px-3 text-xs border border-border/60 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={onRequestDisconnectConfirm}
              disabled={isLoading}
            >
              <Check className="h-3.5 w-3.5" /> Connected
            </Button>
          ) : status === "pending" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-full px-3 text-xs border border-border/60 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={onRequestCancelConfirm}
              disabled={isLoading}
            >
              <Clock className="h-3.5 w-3.5" /> Pending
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-xs !bg-white !text-blue-600 border !border-blue-600 hover:scale-102 cursor-pointer active:scale-[0.98] transition-all"
              onClick={onConnect}
              disabled={isLoading}
            >
              <UserPlus className="h-3.5 w-3.5" /> Connect
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        No matches yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try a broader search, or clear your filters to see everyone in the
        network.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-5 rounded-full"
        onClick={onReset}
      >
        Reset filters
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { role } = useAuthStore();
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

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleConfirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "cancel") cancelRequest(pendingAction.targetId);
    else if (pendingAction.type === "disconnect") removeOldConnection(pendingAction.targetId);
    setPendingAction(null);
  };

  const handleDialogCancel = () => setPendingAction(null);

  const handleConnect = (id: string) => connect({ targetId: id });

  const getStatus = (personId: string): Status => {
    if (
      myConnections?.some(
        (c: any) =>
          c.id === personId ||
          c.alumni_id === personId ||
          c.user_id === personId
      )
    )
      return "connected";
    if (sentRequests?.some((r: any) => r.target_id === personId))
      return "pending";
    return "none";
  };

  // Alumni filters
  const [company, setCompany] = useState("");
  const [skill, setSkill] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [degree, setDegree] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const usernameQuery = query.startsWith("@") ? query.slice(1) : "";
  const isAtMode = query.startsWith("@");

  const { data: suggestions } = useQuery({
    queryKey: ["search", "suggestions", usernameQuery],
    queryFn: () => searchAlumni({ display_name: usernameQuery }),
    enabled: isAtMode && usernameQuery.length > 0,
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const { data: alumniResults, isLoading: alumniLoading } = useQuery({
    queryKey: [
      "search",
      "alumni",
      { debouncedQuery, company, skill, batchYear, degree },
    ],
    queryFn: () =>
      searchAlumni({
        display_name: debouncedQuery || undefined,
        company: company || undefined,
        skill: skill || undefined,
        batch_year: batchYear || undefined,
        degree: degree || undefined,
      }),
  });

  const isLoading = alumniLoading;

  const skillOptions = skills ?? [];

  const hasAlumniFilters = !!(company || skill || batchYear || degree || query);

  const resetAll = () => {
    setQuery("");
    setCompany("");
    setSkill("");
    setBatchYear("");
    setDegree("");
  };

  const resultCount = alumniResults?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Alumni Network
          </Link>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Find your people.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Search users by name, company, skills, or batch — and
            start a conversation.
          </p>

          {/* Search Bar */}
          <div className="mt-8 group relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition" />
            <div className="relative flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                {isAtMode ? (
                  <AtSign className="h-5 w-5 text-primary" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={`Try "Stripe", "@username", or "Product Designer"…`}
                className="h-11 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-0"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Username Suggestions Dropdown */}
            {isAtMode &&
              showSuggestions &&
              suggestions &&
              suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border shadow-xl rounded-xl z-50 overflow-hidden">
                  {suggestions.slice(0, 5).map((s: any) => (
                    <button
                      key={s.id}
                      onMouseDown={() => router.push(`/profile/${s.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.profile_picture} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {getInitials(s.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {s.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{s.username}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterPill
              label="Company"
              value={company}
              onChange={setCompany}
              options={
                alumniResults
                  ? (Array.from(
                      new Set(
                        alumniResults
                          .map((a: any) => a.company)
                          .filter(Boolean)
                      )
                    ).sort() as string[])
                  : []
              }
            />
            <FilterPill
              label="Skill"
              value={skill}
              onChange={setSkill}
              options={skillOptions}
            />
            <FilterPill
              label="Batch"
              value={batchYear}
              onChange={setBatchYear}
              options={
                alumniResults
                  ? (Array.from(
                      new Set(
                        alumniResults
                          .map((a: any) => a.batch_year)
                          .filter(Boolean)
                      )
                    ).sort() as string[])
                  : []
              }
            />
            <FilterPill
              label="Degree"
              value={degree}
              onChange={setDegree}
              options={
                alumniResults
                  ? (Array.from(
                      new Set(
                        alumniResults
                          .map((a: any) => a.degree)
                          .filter(Boolean)
                      )
                    ).sort() as string[])
                  : []
              }
            />
            {hasAlumniFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3.5 w-3.5" /> Clear all
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!isLoading && (
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sorted by relevance
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : alumniResults?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alumniResults.map((a: any) => {
              const status = getStatus(a.id);
              return (
                <AlumniCard
                  key={a.id}
                  alumnus={a}
                  status={status}
                  onConnect={() => handleConnect(a.id)}
                  onRequestCancelConfirm={() =>
                    setPendingAction({
                      type: "cancel",
                      targetId: a.id,
                      targetName: a.display_name,
                    })
                  }
                  onRequestDisconnectConfirm={() =>
                    setPendingAction({
                      type: "disconnect",
                      targetId: a.id,
                      targetName: a.display_name,
                    })
                  }
                  isLoading={isConnecting || isCancelling || isRemoving}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState onReset={resetAll} />
        )}
      </main>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "disconnect"
            ? `Disconnect from ${pendingAction.targetName}?`
            : `Cancel request to ${pendingAction?.targetName}?`
        }
        description={
          pendingAction?.type === "disconnect"
            ? `You will be removed from ${pendingAction.targetName}'s connections. You can always reconnect later.`
            : `Your pending connection request to ${pendingAction?.targetName} will be withdrawn.`
        }
        confirmLabel={
          pendingAction?.type === "disconnect" ? "Disconnect" : "Cancel Request"
        }
        confirmVariant={pendingAction?.type === "disconnect" ? "danger" : "warning"}
        onConfirm={handleConfirm}
        onCancel={handleDialogCancel}
      />
    </div>
  );
}
