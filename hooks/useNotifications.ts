"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications.api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { Notification } from "@/types/api.types";

export function useNotifications() {
  const { token, isAuthenticated } = useAuthStore();
  const {
    setNotifications,
    prependNotification,
    markNotificationRead: markReadLocally,
    notifications,
    notificationCount,
  } = useUIStore();
  const queryClient = useQueryClient();

  // ── Fetch history on load ──
  const { isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    onSuccess: (data: Notification[]) => {
      setNotifications(data);
    },
  } as any);

  // ── Socket connection ──
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const socket = connectSocket(token);

    socket.on("notification", (newNotification: Notification) => {
      prependNotification(newNotification);
      // Invalidate so notifications page also updates
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.off("notification");
    };
  }, [token, isAuthenticated]);

  // ── Mark as read ──
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id: string) => {
      // Optimistic update
      markReadLocally(id);
    },
    onError: () => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications,
    notificationCount,
    isLoading,
    markAsRead: markReadMutation.mutate,
  };
}