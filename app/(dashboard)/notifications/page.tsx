"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  XCircle,
  Briefcase,
  Users,
  PartyPopper,
  ShieldCheck,
  Info,
  ArrowUpRight,
  MessageSquare,
  Filter,
  Clock,
} from "lucide-react";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  label: string;
  pill: string;
}> = {
  account_approved: {
    icon: <ShieldCheck className="h-4 w-4" />,
    gradient: "from-emerald-500 to-teal-600",
    label: "Account",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  },
  account_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    gradient: "from-rose-500 to-pink-600",
    label: "Account",
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
  },
  new_opportunity: {
    icon: <Briefcase className="h-4 w-4" />,
    gradient: "from-blue-500 to-indigo-600",
    label: "Opportunity",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  },
  connection_request: {
    icon: <Users className="h-4 w-4" />,
    gradient: "from-violet-500 to-purple-600",
    label: "Network",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
  },
  connection_accepted: {
    icon: <PartyPopper className="h-4 w-4" />,
    gradient: "from-amber-500 to-orange-600",
    label: "Network",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
  new_message: {
    icon: <MessageSquare className="h-4 w-4" />,
    gradient: "from-sky-500 to-blue-600",
    label: "Message",
    pill: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
  },
};

const FILTERS = ["All", "Unread", "Messages", "Network", "Opportunity", "Account"];

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Info className="h-4 w-4" />,
    gradient: "from-slate-400 to-slate-600",
    label: "Info",
    pill: "bg-muted text-muted-foreground ring-border/60",
  };
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function useClientInfiniteScroll<T>(items: T[] | undefined, limit = 15) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(limit);
  }, [items, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items && visibleCount < items.length) {
          setVisibleCount((c) => c + limit);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [items, visibleCount, limit]);

  return {
    visibleItems: items?.slice(0, visibleCount) ?? [],
    observerTarget,
    hasMore: items ? visibleCount < items.length : false,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex gap-4 p-5">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-12 w-0.5 rounded-full" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-8 w-28 rounded-lg mt-1" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");

  const [swipedNotification, setSwipedNotification] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;

    if (diff > 40) {
      setSwipedNotification(id);
      touchStartX.current = null;
    } else if (diff < -40) {
      if (swipedNotification === id) {
        setSwipedNotification(null);
      }
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteNotification(id, {
      onSettled: () => {
        setDeletingId(null);
      },
    });
    setSwipedNotification(null);
  };

  const {
    notifications,
    isLoading,
    markAsRead,
    notificationCount,
    clearAllNotifications,
    isClearingAll,
    deleteNotification,
    isDeletingNotification,
  } = useNotifications();

  const handleClick = (id: string, referenceLink?: string | null, isRead?: boolean) => {
    if (!isRead) markAsRead(id);
    if (referenceLink) router.push(referenceLink);
  };

  const markAllRead = () => {
    notifications.filter((n) => !n.is_read).forEach((n) => markAsRead(n.id));
  };

  const filtered = useMemo(() => {
    return notifications?.filter((n) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Unread") return !n.is_read;
      const cfg = getTypeConfig(n.type);
      return cfg.label === activeFilter;
    }) ?? [];
  }, [notifications, activeFilter]);

  const todayCount = notifications?.filter((n) => {
    const d = new Date(n.created_at);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length ?? 0;

  const { visibleItems: visibleFiltered, observerTarget, hasMore } = useClientInfiniteScroll(filtered);

  return (
    <div className="min-h-screen bg-background w-full" onClick={() => setSwipedNotification(null)}>

      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-white border-1 border-blue-600 flex items-center justify-center shadow-sm">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm ring-2 ring-background">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-none">Notifications</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                  {notificationCount > 0 ? `${notificationCount} unread` : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {notificationCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
              {notifications?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllNotifications()}
                  disabled={isClearingAll}
                  className="h-8 gap-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  {isClearingAll
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Clear all</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            {
              label: "Total",
              value: notifications?.length ?? 0,
              color: "text-foreground",
              sub: "notifications",
            },
            {
              label: "Unread",
              value: notificationCount,
              color: "text-black dark:text-blue-400",
              sub: "pending",
            },
            {
              label: "Today",
              value: todayCount,
              color: "text-black dark:text-emerald-400",
              sub: "received",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl sm:rounded-2xl border border-border/60 bg-card px-2 py-3 sm:px-4 sm:py-4 text-center space-y-0.5 hover:border-border transition-colors"
            >
              <p className={`text-xl sm:text-3xl font-bold tabular-nums leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filter pills ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          <Filter className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`
                flex-shrink-0 px-3.5 py-1.5 cursor-pointer rounded-full mt-1 text-[11px] font-medium transition-all duration-150 border
                ${activeFilter === f
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]"
                  : "border border-blue-600 text-blue-600 hover:scale-103"
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <div className="mx-auto px-4 sm:px-6 pb-6">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4].map((i) => <NotificationSkeleton key={i} />)}
          </div>
        ) : filtered.length ? (
          <div className="relative space-y-4">

            {visibleFiltered.map((n, idx) => {
              const config = getTypeConfig(n.type);
              const isLast = idx === filtered.length - 1;

              return (
                <div
                  key={n.id}
                  onTouchStart={(e) => handleTouchStart(e, n.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (swipedNotification && swipedNotification !== n.id) {
                      setSwipedNotification(null);
                    }
                  }}
                  onTouchMove={(e) => handleTouchMove(e, n.id)}
                  onTouchEnd={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  className={`
    group relative overflow-hidden flex gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl
    border transition-all duration-300

    ${swipedNotification && swipedNotification !== n.id
                      ? "blur-[1px] scale-[0.98] opacity-60"
                      : ""
                    }

    ${swipedNotification === n.id
                      ? "bg-red-50/50 border-red-200 dark:bg-red-950/10 dark:border-red-900/50"
                      : !n.is_read
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                        : "bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10"
                    }
  `}
                >
                  {/* Timeline node */}
                  <div className="flex-shrink-0 z-10 relative">
                    {n.sender_profile_picture || n.sender_display_name ? (
                      <div className="relative">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-background shadow-sm">
                          <AvatarImage
                            src={n.sender_profile_picture ?? ""}
                            alt={n.sender_display_name ?? ""}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                            {getInitials(n.sender_display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center ring-2 ring-background shadow-sm text-white`}
                        >
                          <span className="scale-50 sm:scale-75">{config.icon}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-sm ring-2 ring-background`}
                      >
                        <span className="scale-75 sm:scale-100">{config.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-col items-start gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ring-1 ${config.pill}`}
                      >
                        {config.label}
                      </span>
                      {n.sender_username && (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          @{n.sender_username}
                        </span>
                      )}
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50 ml-auto">
                        <Clock className="h-3 w-3" />
                        {timeAgo(n.created_at)}
                      </span>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Message */}
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${!n.is_read
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                        }`}
                    >
                      {n.message}
                    </p>

                    {/* Action row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {n.reference_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          name="view-details"
                          onClick={() => handleClick(n.id, n.reference_link, n.is_read)}
                          className="h-6.5 sm:h-7 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] border-border/60 px-2.5 sm:px-3 rounded-lg"
                        >
                          View details
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      )}
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(n.id)}
                          className="h-6.5 sm:h-7 gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-muted-foreground px-1.5 sm:px-2 rounded-lg"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delete Button (Unified for Desktop and Mobile) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    disabled={deletingId === n.id}
                    className={`
                      flex
                      absolute top-0 right-0 h-full w-[5%] min-w-[52px]
                      transition-transform duration-300 ease-out
                      bg-red-600 hover:bg-rose-700
                      items-center justify-center
                      rounded-tr-xl sm:rounded-tr-2xl rounded-br-xl sm:rounded-br-2xl
                      z-10
                      ${swipedNotification === n.id ? "translate-x-0" : "translate-x-full md:group-hover:translate-x-0"}
                    `}
                  >
                    {deletingId === n.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              );
            })}
            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-2">
              {hasMore && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            </div>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm ring-2 ring-background">
                <CheckCheck className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <p className="text-base font-semibold text-foreground">
              {activeFilter !== "All"
                ? `No ${activeFilter.toLowerCase()} notifications`
                : "You're all caught up!"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
              {activeFilter !== "All"
                ? "Try a different filter to see more notifications."
                : "New notifications will appear here as they arrive."}
            </p>
            {activeFilter !== "All" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5 text-xs rounded-lg"
                onClick={() => setActiveFilter("All")}
              >
                Show all notifications
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Footer count ─────────────────────────────────────────────── */}
      {!isLoading && notifications?.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground/40 pb-2">
          Showing {filtered.length} of {notifications.length} notification
          {notifications.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}