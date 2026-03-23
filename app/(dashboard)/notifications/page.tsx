"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications.api";
import useUIStore from "@/store/uiStore";
import { useEffect } from "react";
import { timeAgo } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  account_approval:   "✅",
  new_opportunity:    "💼",
  connection_request: "🤝",
};

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
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-green-700 hover:text-green-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 animate-pulse flex gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications?.length ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition ${
                  !n.is_read ? "bg-green-50/40" : "hover:bg-gray-50"
                }`}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                  {TYPE_ICONS[n.type] ?? "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at)}
                  </p>
                </div>

                {/* Mark read */}
                {!n.is_read && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                    className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600 mt-1.5 hover:bg-green-800 transition"
                    title="Mark as read"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        )}
      </div>

    </div>
  );
}