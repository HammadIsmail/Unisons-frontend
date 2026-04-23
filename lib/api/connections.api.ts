import api from "@/lib/api";
import { ConnectionRequest } from "@/types/api.types";

export interface SentConnectionRequest {
  target_id: string;
  target_display_name: string;
  target_username: string;
  target_profile_picture: string | null;
  connection_type: "batchmate" | "colleague" | "mentor";
  requested_at: string;
}

export interface ConnectionStatus {
  status: "pending" | "connected" | "none";
  is_sender: boolean;
}

export const sendConnectionRequest = async (
  targetId: string,
  connectionType: "batchmate" | "colleague" | "mentor"
): Promise<{ message: string }> => {
  const { data } = await api.post(`/api/connections/request/${targetId}`, {
    connection_type: connectionType,
  });
  return data;
};

export const getPendingRequests = async (): Promise<ConnectionRequest[]> => {
  const { data } = await api.get("/api/connections/requests");
  return data;
};

export const getSentRequests = async (): Promise<SentConnectionRequest[]> => {
  const { data } = await api.get("/api/connections/requests/sent");
  return data;
};

export const respondToConnectionRequest = async (
  senderId: string,
  action: "accept" | "reject"
): Promise<{ message: string }> => {
  const { data } = await api.patch(`/api/connections/requests/${senderId}/respond`, {
    action,
  });
  return data;
};

export const getConnectionStatus = async (
  targetId: string
): Promise<ConnectionStatus> => {
  const { data } = await api.get(`/api/connections/status/${targetId}`);
  return data;
};

export const removeConnection = async (
  targetId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/connections/${targetId}`);
  return data;
};

export const cancelSentRequest = async (
  targetId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/connections/request/${targetId}`);
  return data;
};

export const getMyNetwork = async (role: "alumni" | "student"): Promise<any[]> => {
  const endpoint = role === "alumni" ? "/api/alumni/connections" : "/api/student/connections";
  const { data } = await api.get(endpoint);
  return data;
};
