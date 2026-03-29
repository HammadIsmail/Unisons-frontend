"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBatchMates, connectWithAlumni } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import { useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Building2,
  GraduationCap,
  UserPlus,
  CheckCircle2,
  Search,
  Users,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BatchMateSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BatchMatesPage() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const { data: batchMates, isLoading } = useQuery({
    queryKey: ["alumni", "batch-mates"],
    queryFn: getBatchMates,
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => connectWithAlumni(id, "batchmate"),
    onSuccess: (_, id) => {
      setConnected((prev) => ({ ...prev, [id]: true }));
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
  });

  const batch = (profile as any)?.batch;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Batch Mates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Alumni from your batch
            {batch && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                <GraduationCap className="h-3 w-3" />
                {batch}
              </span>
            )}
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
            Find more
          </Link>
        </Button>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <BatchMateSkeleton key={i} />)}
        </div>
      ) : batchMates?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchMates.map((b) => (
            <Card
              key={b.id}
              className="border-border/60 hover:border-blue-500/40 hover:shadow-sm hover:shadow-blue-500/5 transition-all duration-200 group overflow-hidden relative"
            >
              {/* Hover accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="p-4 flex flex-col gap-3">
                {/* Avatar + info */}
                <Link href={`/alumni/${b.username}`} className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border/60 group-hover:ring-blue-500/30 transition-all">
                    <AvatarImage src={b.profile_picture} alt={b.display_name} />
                    <AvatarFallback className={`${getAvatarColor(b.id ?? b.display_name ?? "")} text-white text-xs font-bold`}>
                      {getInitials(b.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {b.display_name}
                    </p>
                    {(b.role || b.company) && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        {b.company && <Building2 className="h-3 w-3 flex-shrink-0" />}
                        {[b.role, b.company].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Connect button */}
                {connected[b.id] ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Request Sent
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => connectMutation.mutate(b.id)}
                    disabled={connectMutation.isPending}
                    className="w-full h-8 text-xs gap-1.5 border-border/60 group-hover:border-blue-500/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Connect as Batchmate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No batch mates found</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
              Looks like no other alumni from your batch have joined yet.
            </p>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border/60" asChild>
              <Link href="/search">
                <Search className="h-3.5 w-3.5" />
                Search all alumni
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
