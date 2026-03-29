"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyNetwork, getPendingRequests, respondToRequest } from "@/lib/api/alumni.api";
import { useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Users,
  UserCheck,
  Building2,
  Network,
  CheckCircle2,
  XCircle,
  Search,
  Inbox,
  CalendarClock,
  ChevronRight,
  UserPlus,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "connections" | "requests";
type ConnectionFilter = "all" | "batchmate" | "colleague" | "mentor";

const CONNECTION_TYPE_META: Record<string, { badge: string }> = {
  batchmate: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  mentor: {
    badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  },
  colleague: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
};

function getConnectionBadge(type: string) {
  return CONNECTION_TYPE_META[type]?.badge ??
    "bg-muted text-muted-foreground border-border/60";
}

function getInitials(name?: string) {
  if (!name) return "A";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-violet-600", "bg-emerald-600",
  "bg-amber-600", "bg-rose-600", "bg-cyan-600",
];
function getAvatarColor(str: string) {
  const hash = str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ConnectionSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/5 rounded" />
          <Skeleton className="h-3 w-3/5 rounded" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
      </CardContent>
    </Card>
  );
}

function RequestSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MyNetworkPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("connections");
  const [filter, setFilter] = useState<ConnectionFilter>("all");
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "muted" } | null>(null);

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["alumni", "network"],
    queryFn: getMyNetwork,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["alumni", "connection-requests"],
    queryFn: getPendingRequests,
  });

  const respondMutation = useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: "accept" | "reject" }) =>
      respondToRequest(senderId, action),
    onSuccess: (_, vars) => {
      setActionMsg({
        text: vars.action === "accept" ? "Connection accepted." : "Connection declined.",
        type: vars.action === "accept" ? "success" : "muted",
      });
      setTimeout(() => setActionMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ["alumni", "connection-requests"] });
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
  });

  const filteredConnections =
    filter === "all" ? connections : connections?.filter((c) => c.connection_type === filter);

  const pendingCount = requests?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Network</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connections?.length
              ? `${connections.length} connection${connections.length !== 1 ? "s" : ""}`
              : "Manage your connections"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border/60 flex-shrink-0"
          asChild
        >
          <Link href="/search">
            <Search className="h-3.5 w-3.5" />
            Find alumni
          </Link>
        </Button>
      </div>

      {/* ── Action toast ─────────────────────────────────────────────────── */}
      {actionMsg && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all animate-in fade-in duration-300 ${
          actionMsg.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-muted border-border/60 text-muted-foreground"
        }`}>
          {actionMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <XCircle className="h-4 w-4 flex-shrink-0" />
          }
          {actionMsg.text}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit border border-border/50">
        {([
          { key: "connections" as Tab, label: "Connections", icon: <Network className="h-3.5 w-3.5" /> },
          { key: "requests" as Tab, label: "Requests", icon: <UserPlus className="h-3.5 w-3.5" /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`
              flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === key
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {icon}
            {label}
            {key === "requests" && pendingCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Connections tab ──────────────────────────────────────────────── */}
      {tab === "connections" && (
        <div className="space-y-4">
          {/* Type filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "batchmate", "colleague", "mentor"] as ConnectionFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150
                  ${filter === f
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                  }
                `}
              >
                {f}
              </button>
            ))}
          </div>

          {connectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <ConnectionSkeleton key={i} />)}
            </div>
          ) : filteredConnections?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredConnections.map((c) => (
                <Link key={c.id} href={`/alumni/${c.username}`} className="block group">
                  <Card className="border-border/60 hover:border-blue-500/40 hover:shadow-sm hover:shadow-blue-500/5 transition-all duration-200">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/60 group-hover:ring-blue-500/30 transition-all">
                        <AvatarImage src={c.profile_picture} alt={c.display_name} />
                        <AvatarFallback className={`${getAvatarColor(c.id ?? c.display_name ?? "")} text-white text-xs font-bold`}>
                          {getInitials(c.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {c.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          @{c.username}
                          {c.company && (
                            <>
                              <span className="mx-1 opacity-40">·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Building2 className="h-2.5 w-2.5" />
                                {c.company}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getConnectionBadge(c.connection_type)}`}>
                          {c.connection_type}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-border/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {filter === "all" ? "No connections yet" : `No ${filter} connections yet`}
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
                  {filter === "all"
                    ? "Start connecting with alumni in your network."
                    : `You haven't added any ${filter}s yet.`}
                </p>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border/60" asChild>
                  <Link href="/search">
                    <Search className="h-3.5 w-3.5" />
                    Find alumni
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Requests tab ─────────────────────────────────────────────────── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {requestsLoading ? (
            [1, 2, 3].map((i) => <RequestSkeleton key={i} />)
          ) : requests?.length ? (
            requests.map((r) => (
              <Card key={r.sender_id} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                  <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/60">
                    <AvatarImage src={r.profile_picture} alt={r.display_name} />
                    <AvatarFallback className={`${getAvatarColor(r.sender_id ?? "")} text-white text-xs font-bold`}>
                      {getInitials(r.display_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.sender_display_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Wants to connect as{" "}
                      <span className={`inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded-full border ${getConnectionBadge(r.connection_type)}`}>
                        {r.connection_type}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {new Date(r.requested_at).toLocaleDateString("en-PK", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => respondMutation.mutate({ senderId: r.sender_id, action: "accept" })}
                      disabled={respondMutation.isPending}
                      className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondMutation.mutate({ senderId: r.sender_id, action: "reject" })}
                      disabled={respondMutation.isPending}
                      className="h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground"
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Inbox className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No pending requests</p>
                <p className="text-xs text-muted-foreground">
                  You're all caught up. New requests will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
