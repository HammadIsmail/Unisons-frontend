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
  content: string;
  messageType?: "text" | "image";
  imageUrl?: string;
}): Promise<Message> => {
  // Sanitize payload to only allowed fields (Strict DTO compliance)
  const payload: Record<string, string> = {
    receiverId: params.receiverId,
    content: params.content.trim(),
    messageType: params.messageType ?? "text",
  };
  if (params.imageUrl) payload.imageUrl = params.imageUrl;
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

// ── Mark all messages in a conversation as read ────────────────────────────────
export const markConversationRead = async (participantId: string): Promise<{ success: boolean }> => {
  const { data } = await api.patch<{ success: boolean }>(`/api/chat/conversations/${participantId}/read`);
  return data;
};

// ── Upload an image to attach to a message (max 5 MB) ─────────────────────────
export const uploadChatImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string; publicId: string }>("/api/chat/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Edit a message (only within 3 minutes of sending) ─────────────────────────
export const editMessage = async (
  messageId: string,
  content: string
): Promise<{ _id: string; content: string; isEdited: boolean; createdAt: string }> => {
  const { data } = await api.patch(`/api/chat/messages/${messageId}`, { content });
  return data;
};

// ── Delete a message (only within 3 minutes of sending) ───────────────────────
export const deleteMessage = async (messageId: string): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/api/chat/messages/${messageId}`);
  return data;
};

// ── Clear chat history for the current user (other participant still sees it) ──
export const clearConversation = async (conversationId: string): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/api/chat/conversations/${conversationId}/clear`);
  return data;
};
