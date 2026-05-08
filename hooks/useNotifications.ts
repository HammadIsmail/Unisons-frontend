"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead } from "@/lib/api/notifications.api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { Notification } from "@/types/api.types";
import {
  clearAllNotifications,
  deleteNotification,
} from "@/lib/api/notifications.api";
import { toast } from "sonner";

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
  const { data: fetchedNotifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
  });

  // ── Sync fetched data into Zustand ──
  useEffect(() => {
    if (fetchedNotifications) {
      setNotifications(fetchedNotifications);
    }
  }, [fetchedNotifications]);

  // ── Socket connection ──
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const socket = connectSocket(token);

    socket.on("notification", (newNotification: Notification) => {
      prependNotification(newNotification);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.off("notification");
    };
  }, [token, isAuthenticated]);

  const flash = (msg: string) => {
    toast.success(msg, { action: { label: "OK", onClick: () => { } } });
  };

  // ── Mark as read ──
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id: string) => {
      markReadLocally(id);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      flash("All notifications cleared successfully");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      flash("Notification deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications,
    notificationCount,
    isLoading,
    markAsRead: markReadMutation.mutate,
    clearAllNotifications: clearAllMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isClearingAll: clearAllMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
}