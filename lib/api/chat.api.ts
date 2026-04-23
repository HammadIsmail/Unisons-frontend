import api from "@/lib/api";
import { Conversation, Message } from "@/types/api.types";

export const getConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get<Conversation[]>("/api/chat/conversations");
  return data;
};

export const getMessages = async (participantId: string): Promise<Message[]> => {
  const { data } = await api.get<Message[]>(`/api/chat/conversations/${participantId}/messages`);
  return data;
};

export const sendMessage = async (params: {
  receiverId: string;
  content: string
}): Promise<Message> => {
  // Sanitize payload to only allowed fields (Strict DTO compliance)
  const payload = {
    receiverId: params.receiverId,
    content: params.content.trim()
  };
  const { data } = await api.post<Message>("/api/chat/messages", payload);
  return data;
};

export const markMessageRead = async (messageId: string): Promise<{ success: boolean }> => {
  // Guard: Never call API for temporary frontend IDs
  if (!messageId || messageId.startsWith("temp-")) {
    return { success: false };
  }

  const { data } = await api.patch<{ success: boolean }>(`/api/chat/messages/${messageId}/read`);
  return data;
};
