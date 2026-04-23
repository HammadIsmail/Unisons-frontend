"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  Bell,
  CheckCheck,
  Inbox,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  PartyPopper,
  ShieldCheck,
  Info,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

// ── Type icon + color config ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}> = {
  account_approved: {
    icon: <ShieldCheck className="h-4 w-4" />,
    iconBg: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  account_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    iconBg: "bg-rose-500/10 ring-1 ring-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
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
  connection_accepted: {
    icon: <PartyPopper className="h-4 w-4" />,
    iconBg: "bg-amber-500/10 ring-1 ring-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  new_message: {
    icon: <MessageSquare className="h-4 w-4" />,
    iconBg: "bg-blue-500/10 ring-1 ring-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Info className="h-4 w-4" />,
    iconBg: "bg-muted ring-1 ring-border/60",
    iconColor: "text-muted-foreground",
  };
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, notificationCount } = useNotifications();

  const handleClick = (id: string, referenceLink?: string | null, isRead?: boolean) => {
    if (!isRead) markAsRead(id);
    if (referenceLink) router.push(referenceLink);
  };

  const markAllRead = () => {
    notifications.filter((n) => !n.is_read).forEach((n) => markAsRead(n.id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notificationCount > 0
              ? `${notificationCount} unread notification${notificationCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {notificationCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="h-8 gap-1.5 text-xs border-border/60 flex-shrink-0"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Notification list ────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4].map((i) => <NotificationSkeleton key={i} />)}
          </div>
        ) : notifications?.length ? (
          <div className="divide-y divide-border/50">
            {notifications.map((n) => {
              const config = getTypeConfig(n.type);
              const hasLink = !!n.reference_link;

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n.id, n.reference_link, n.is_read)}
                  className={`
                    flex items-start gap-3 px-5 py-4 transition-colors duration-150
                    ${hasLink ? "cursor-pointer" : "cursor-default"}
                    ${!n.is_read
                      ? "bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50/70 dark:hover:bg-blue-950/20"
                      : "hover:bg-muted/40"
                    }
                  `}
                >
                  {/* Avatar or type icon */}
                  {n.sender_profile_picture || n.sender_display_name ? (
                    <Avatar className={`h-9 w-9 flex-shrink-0 mt-0.5 ring-1 ${!n.is_read ? "ring-blue-500/20" : "ring-border/60"}`}>
                      <AvatarImage src={n.sender_profile_picture ?? ""} alt={n.sender_display_name ?? ""} />
                      <AvatarFallback className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-xs font-bold">
                        {getInitials(n.sender_display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.iconBg} ${config.iconColor}`}>
                      {config.icon}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {n.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {n.sender_username && (
                        <span className="text-[11px] text-muted-foreground/60">
                          @{n.sender_username}
                        </span>
                      )}
                      {n.sender_username && <span className="text-muted-foreground/30 text-[10px]">·</span>}
                      <span className="text-[11px] text-muted-foreground/60">
                        {timeAgo(n.created_at)}
                      </span>
                      {hasLink && (
                        <>
                          <span className="text-muted-foreground/30 text-[10px]">·</span>
                          <span className="text-[11px] text-blue-500 dark:text-blue-400 flex items-center gap-0.5">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
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
            <p className="text-sm text-muted-foreground">
              No notifications yet. We'll let you know when something happens.
            </p>
          </CardContent>
        )}
      </Card>

    </div>
  );
}
