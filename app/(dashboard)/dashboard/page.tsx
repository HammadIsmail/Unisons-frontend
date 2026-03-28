"use client";

import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { getOpportunities } from "@/lib/api/opportunities.api";
import { getNotifications } from "@/lib/api/notifications.api";
import { getMyNetwork } from "@/lib/api/alumni.api";
import { getMyMentors } from "@/lib/api/student.api";
import Link from "next/link";
import { useEffect } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Users,
  Briefcase,
  Bell,
  ArrowUpRight,
  MapPin,
  Building2,
  Wifi,
  Inbox,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getNotificationIcon(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("mentor") || lower.includes("connect"))
    return <Users className="h-3.5 w-3.5" />;
  if (lower.includes("opportunit") || lower.includes("job") || lower.includes("intern"))
    return <Briefcase className="h-3.5 w-3.5" />;
  if (lower.includes("alert") || lower.includes("warn"))
    return <AlertCircle className="h-3.5 w-3.5" />;
  if (lower.includes("success") || lower.includes("accept") || lower.includes("approv"))
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
}

const typeStyles: Record<string, { badge: string; dot: string }> = {
  job: {
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  internship: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  other: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
};

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="mt-4 h-8 w-20 rounded" />
        <Skeleton className="mt-1 h-3.5 w-28 rounded" />
      </CardContent>
    </Card>
  );
}

function OpportunityCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl">
      <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="mt-1.5 h-3 w-1/2 rounded" />
        <div className="mt-2 flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-7 w-7 rounded-full flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="mt-1 h-3 w-24 rounded" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, role } = useAuthStore();
  const { setNotificationCount } = useUIStore();

  const { data: opportunities, isLoading: oppsLoading } = useQuery({
    queryKey: ["opportunities", { limit: 5 }],
    queryFn: () => getOpportunities({ limit: 5 }),
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const { data: network } = useQuery({
    queryKey: ["alumni", "network"],
    queryFn: getMyNetwork,
    enabled: role === "alumni",
  });

  const { data: mentors } = useQuery({
    queryKey: ["student", "mentors"],
    queryFn: getMyMentors,
    enabled: role === "student",
  });

  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n) => !n.is_read).length;
      setNotificationCount(unread);
    }
  }, [notifications, setNotificationCount]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;
  const firstName = profile?.display_name?.split(" ")[0] ?? "there";
  const initials = getInitials(profile?.display_name);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const networkCount = role === "alumni" ? (network?.length ?? null) : (mentors?.length ?? null);
  const networkLoading = role === "alumni"
    ? network === undefined
    : mentors === undefined;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-border shadow-md">
                <AvatarImage src={profile?.profile_picture} alt={profile?.display_name} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back, {firstName} 👋
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-muted-foreground capitalize font-medium">
                  {role === "alumni" ? "Alumni" : "Student"}
                </span>
                {profile?.degree && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">•</span>
                    <span className="text-sm text-muted-foreground">{profile.degree}</span>
                  </>
                )}
                {profile?.batch && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">•</span>
                    <span className="text-sm text-muted-foreground">{profile.batch}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5 border border-border/60 self-start sm:self-auto">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{today}</span>
          </div>
        </div>

        {/* ── Metric Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">

          {/* Connections / Mentors */}
          <Card className="group border-border/60 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                  {role === "alumni"
                    ? <Users className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    : <GraduationCap className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  }
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  <span>Active</span>
                </div>
              </div>
              {networkLoading ? (
                <>
                  <Skeleton className="h-8 w-16 rounded mb-1" />
                  <Skeleton className="h-3 w-28 rounded" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {networkCount ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {role === "alumni" ? "Network connections" : "Assigned mentors"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Open Opportunities */}
          <Card className="group border-border/60 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                  <Briefcase className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <Link
                  href="/opportunities"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              {oppsLoading ? (
                <>
                  <Skeleton className="h-8 w-16 rounded mb-1" />
                  <Skeleton className="h-3 w-28 rounded" />
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {opportunities?.total ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">Open opportunities</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="group border-border/60 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 relative">
                  <Bell className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <Link
                  href="/notifications"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">{unreadCount}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount === 1 ? "Unread notification" : "Unread notifications"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">

          {/* Recent Opportunities — 3 cols */}
          <Card className="lg:col-span-3 border-border/60">
            <CardHeader className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="font-semibold text-foreground text-[15px]">Recent Opportunities</h2>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground px-2.5" asChild>
                  <Link href="/opportunities">
                    View all
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <Separator className="opacity-50" />

            <CardContent className="px-5 py-4">
              {oppsLoading ? (
                <div className="space-y-1">
                  {[1, 2, 3, 4].map((i) => (
                    <OpportunityCardSkeleton key={i} />
                  ))}
                </div>
              ) : opportunities?.data?.length ? (
                <div className="space-y-1 -mx-2">
                  {opportunities.data.slice(0, 5).map((opp) => {
                    const style = typeStyles[opp.type] ?? typeStyles.other;
                    const locationStr =
                      !opp.location || opp.location.toLowerCase() === "none"
                        ? null
                        : opp.location;

                    return (
                      <Link
                        key={opp.id}
                        href={`/opportunities/${opp.id}`}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group/item cursor-pointer"
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${style.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground leading-snug group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors line-clamp-1">
                              {opp.title}
                            </p>
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/item:text-muted-foreground/60 transition-all flex-shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {opp.company && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {opp.company}
                              </span>
                            )}
                            {locationStr && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {locationStr}
                              </span>
                            )}
                            {opp.is_remote && (
                              <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                                <Wifi className="h-3 w-3" />
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
                              {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No opportunities yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Check back later or explore all listings
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" asChild>
                    <Link href="/opportunities">Browse opportunities</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications — 2 cols */}
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center relative">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-foreground text-[15px]">Notifications</h2>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground px-2.5" asChild>
                  <Link href="/notifications">
                    All
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <Separator className="opacity-50" />

            <CardContent className="px-5 py-4">
              {notifications === undefined ? (
                <div className="space-y-0.5 divide-y divide-border/40">
                  {[1, 2, 3, 4].map((i) => <NotificationSkeleton key={i} />)}
                </div>
              ) : notifications.length ? (
                <div className="divide-y divide-border/40 -mx-1">
                  {notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 py-3 px-1 rounded-lg transition-colors hover:bg-muted/40 ${!n.is_read ? "" : "opacity-55"}`}
                    >
                      {/* Icon bubble */}
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/25"
                          : "bg-muted text-muted-foreground"
                        }`}>
                        {getNotificationIcon(n.message)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground leading-snug line-clamp-2">
                            {n.message}
                          </p>
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Inbox className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No new notifications right now.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions banner ─────────────────────────────────────────── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Card className="border-border/60 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 text-white overflow-hidden relative">
            {/* Decorative blob */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute right-16 bottom-0 h-20 w-20 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

            <CardContent className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-[15px]">
                    {role === "alumni"
                      ? "Ready to give back? Post an opportunity."
                      : "Looking for guidance? Find a mentor."}
                  </p>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {role === "alumni"
                      ? "Help students land their first role."
                      : "Connect with alumni in your field."}
                  </p>
                </div>
              </div>
              <Button
                className="bg-white !text-blue-700 hover:bg-blue-50 font-semibold text-sm h-9 px-5 flex-shrink-0 shadow-md"
                asChild
              >
                <Link href={role === "alumni" ? "/opportunities/create" : "/mentors"}>
                  {role === "alumni" ? "Post opportunity" : "Find mentors"}
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
