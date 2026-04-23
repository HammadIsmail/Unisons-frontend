import { create } from "zustand";
import { Notification } from "@/types/api.types";

interface UIState {
  sidebarOpen: boolean;
  notificationCount: number;
  notifications: Notification[];

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setNotificationCount: (count: number) => void;
  decrementNotificationCount: () => void;
  setNotifications: (notifications: Notification[]) => void;
  prependNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;

  unreadChatCount: number;
  setUnreadChatCount: (count: number) => void;
  incrementUnreadChatCount: () => void;
  decrementUnreadChatCount: () => void;
}

const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  notificationCount: 0,
  notifications: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setNotificationCount: (count) => set({ notificationCount: count }),
  decrementNotificationCount: () =>
    set((state) => ({
      notificationCount: Math.max(0, state.notificationCount - 1),
    })),
  setNotifications: (notifications) =>
    set({
      notifications,
      notificationCount: notifications.filter((n) => !n.is_read).length,
    }),
  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      notificationCount: state.notificationCount + 1,
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      notificationCount: Math.max(0, state.notificationCount - 1),
    })),

  unreadChatCount: 0,
  setUnreadChatCount: (count) => set({ unreadChatCount: count }),
  incrementUnreadChatCount: () =>
    set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  decrementUnreadChatCount: () =>
    set((state) => ({
      unreadChatCount: Math.max(0, state.unreadChatCount - 1),
    })),
}));

export default useUIStore;