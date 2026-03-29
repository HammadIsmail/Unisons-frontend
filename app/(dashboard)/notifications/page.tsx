"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications.api";
import useUIStore from "@/store/uiStore";
import { useEffect } from "react";
import { timeAgo } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  Bell,
  CheckCircle2,
  Briefcase,
  Users,
  CheckCheck,
  Inbox,
  Info,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

// ── Notification icon map ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}> = {
  account_approval: {
    icon: <ShieldCheck className="h-4 w-4" />,
    iconBg: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  new_opportunity: {
    icon: <Briefcase className="h-4 w-4" />,
    iconBg: "bg-blue-500/10 ring-1 ring-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  connection_request: {
    icon: <Users className="h-4 w-4" />,
    iconBg: "bg-violet-500/10 ring-1 ring-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Info className="h-4 w-4" />,
    iconBg: "bg-muted ring-1 ring-border/60",
    iconColor: "text-muted-foreground",
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setNotificationCount } = useUIStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = async () => {
    const unread = notifications?.filter((n) => !n.is_read) ?? [];
    await Promise.all(unread.map((n) => markReadMutation.mutateAsync(n.id)));
  };

  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n) => !n.is_read).length;
      setNotificationCount(unread);
    }
  }, [notifications, setNotificationCount]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={markReadMutation.isPending}
            className="h-8 gap-1.5 text-xs border-border/60 flex-shrink-0"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* ── List card ───────────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4].map((i) => <NotificationSkeleton key={i} />)}
          </div>
        ) : notifications?.length ? (
          <div className="divide-y divide-border/50">
            {notifications.map((n, idx) => {
              const config = getTypeConfig(n.type);
              return (
                <div
                  key={n.id}
                  className={`
                    flex items-start gap-3 px-5 py-4 transition-colors duration-150
                    ${!n.is_read
                      ? "bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50/60 dark:hover:bg-blue-950/20"
                      : "hover:bg-muted/40"
                    }
                  `}
                >
                  {/* Icon */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.iconBg} ${config.iconColor}`}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot / mark read */}
                  {!n.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                      title="Mark as read"
                      className="flex-shrink-0 flex items-center justify-center mt-1.5 group"
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications yet. We'll let you know when something happens.</p>
          </CardContent>
        )}
      </Card>

    </div>
  );
}
