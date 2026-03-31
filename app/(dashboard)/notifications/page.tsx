"use client";

import { useMutation } from "@tanstack/react-query";
import { markNotificationRead } from "@/lib/api/notifications.api";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  account_approved:    "✅",
  account_rejected:    "❌",
  new_opportunity:     "💼",
  connection_request:  "🤝",
  connection_accepted: "🎉",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead, notificationCount } = useNotifications();

  const handleClick = (id: string, referenceLink?: string | null, isRead?: boolean) => {
    if (!isRead) markAsRead(id);
    if (referenceLink) router.push(referenceLink);
  };

  const markAllRead = () => {
    notifications
      .filter((n) => !n.is_read)
      .forEach((n) => markAsRead(n.id));
  };

  return (
    <div className="max-w-2xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {notificationCount > 0 ? `${notificationCount} unread` : "All caught up"}
          </p>
        </div>
        {notificationCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-green-700 hover:text-green-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

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
                onClick={() => handleClick(n.id, n.reference_link, n.is_read)}
                className={`p-4 flex items-start gap-3 transition cursor-pointer ${
                  !n.is_read ? "bg-green-50/40 hover:bg-green-50" : "hover:bg-gray-50"
                }`}
              >
                {/* Sender avatar or type icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {n.sender_profile_picture ? (
                    <img
                      src={n.sender_profile_picture}
                      alt={n.sender_display_name ?? ""}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-base">
                      {TYPE_ICONS[n.type] ?? "🔔"}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  {n.sender_display_name && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      @{n.sender_username}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
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