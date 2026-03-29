"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyMentors } from "@/lib/api/student.api";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  GraduationCap,
  Building2,
  ArrowRight,
  Search,
  Layers,
  ChevronRight,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "A";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// Domain color map — cycles through a palette for variety
const DOMAIN_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
];

function getDomainColor(index: number) {
  return DOMAIN_COLORS[index % DOMAIN_COLORS.length];
}

// Avatar accent colors
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MentorCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MentorsPage() {
  const { data: mentors, isLoading } = useQuery({
    queryKey: ["student", "mentors"],
    queryFn: getMyMentors,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Mentors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading…"
              : mentors?.length
              ? `${mentors.length} mentor${mentors.length !== 1 ? "s" : ""} guiding your career`
              : "Alumni who are guiding your career journey"}
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
            Find mentors
          </Link>
        </Button>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <MentorCardSkeleton key={i} />)}
        </div>
      ) : mentors?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor, idx) => (
            <Card
              key={mentor.alumni_id}
              className="border-border/60 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-250 group overflow-hidden relative"
            >
              {/* Hover accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="p-5 flex flex-col h-full">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className={`h-12 w-12 flex-shrink-0 ring-2 ring-background shadow-sm`}>
                    <AvatarImage src={mentor.profile_picture} alt={mentor.display_name} />
                    <AvatarFallback className={`${getAvatarColor(idx)} text-white font-bold text-base`}>
                      {getInitials(mentor.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {mentor.display_name}
                    </p>
                    <p className="text-xs text-gray-500 text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      @{mentor.username}
                    </p>
                    {mentor.company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        {mentor.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Domain badge */}
                {mentor.domain && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getDomainColor(idx)}`}>
                      <Layers className="h-3 w-3" />
                      {mentor.domain}
                    </span>
                  </div>
                )}

                {/* View profile CTA */}
                <div className="mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 border-border/60 group-hover:border-blue-500/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    asChild
                  >
                    <Link href={`/alumni/${mentor.username}`}>
                      View Profile
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty state */
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">No mentors yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              Connect with alumni in your field to get guidance on your career journey.
            </p>
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20" asChild>
              <Link href="/search">
                <Search className="h-3.5 w-3.5" />
                Find alumni to connect with
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
