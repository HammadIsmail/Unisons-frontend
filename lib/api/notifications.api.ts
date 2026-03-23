import api from "@/lib/api";
import { Notification } from "@/types/api.types";

export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get("/api/notifications");
  return data;
};

export const markNotificationRead = async (
  id: string
): Promise<{ message: string }> => {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return data;
};