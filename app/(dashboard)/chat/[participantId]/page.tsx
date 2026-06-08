"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  getConversations,
  markConversationRead,
} from "@/lib/api/chat.api";
import useAuthStore from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import { Message } from "@/types/api.types";
import { useChatSocket, formatLastSeen } from "../layout";
import { getUserPublicProfile } from "@/lib/api/profiles.api";
import { getConnectionStatus } from "@/lib/api/connections.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;
  if (diff < dayMs && date.getDate() === now.getDate()) return "Today";
  if (diff < dayMs * 2) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatRoomPage() {
  const params = useParams();
  const participantId = params.participantId as string;
  const router = useRouter();
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { socket, onlineStatus } = useChatSocket();
  const liveStatus = onlineStatus[participantId];

  // ── Participant details ──────────────────────────────────────────────────
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const conversation = conversations?.find((c) => c.participantProfile.id === participantId);
  const participant = conversation?.participantProfile as any;

  const isOnline = liveStatus?.isOnline ?? participant?.is_online ?? false;
  const lastSeen = liveStatus?.lastSeen ?? participant?.last_seen ?? null;

  // ── Fetch messages ───────────────────────────────────────────────────────
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", participantId],
    queryFn: () => getMessages(participantId),
    enabled: !!participantId,
  });

  // ── Mark read on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (!participantId || !profile) return;
    markConversationRead(participantId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      })
      .catch(() => {});
  }, [participantId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleTypingStatus = ({
      senderId,
      isTyping: typing,
    }: {
      senderId: string;
      isTyping: boolean;
    }) => {
      if (senderId === participantId) setIsTyping(typing);
    };

    const handleMessageRead = ({ messageId, readAt }: { messageId: string; readAt: string }) => {
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev?.map((m) => (m._id === messageId ? { ...m, isRead: true, readAt } : m)) ?? prev
      );
    };

    const handleMessagesRead = ({ participantId: pid }: { participantId: string }) => {
      if (pid !== participantId) return;
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev?.map((m) => ({ ...m, isRead: true })) ?? prev
      );
    };

    const handleNewMessage = (msg: Message) => {
      if (String(msg.senderId) !== participantId) return;
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev ? [...prev, { ...msg, isRead: true }] : [msg]
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      markConversationRead(participantId).catch(() => {});
    };

    socket.on("typing_status", handleTypingStatus);
    socket.on("message_read", handleMessageRead);
    socket.on("messages_read", handleMessagesRead);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("typing_status", handleTypingStatus);
      socket.off("message_read", handleMessageRead);
      socket.off("messages_read", handleMessagesRead);
      socket.off("new_message", handleNewMessage);
      socket.emit("typing", { receiverId: participantId, isTyping: false });
    };
  }, [socket, participantId, queryClient]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [content]);

  // ── Typing emit ──────────────────────────────────────────────────────────
  const emitTyping = useCallback(
    (typing: boolean) => {
      if (!socket) return;
      socket.emit("typing", { receiverId: participantId, isTyping: typing });
    },
    [socket, participantId]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.trim()) {
      emitTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
    }
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const myId = String(
    profile?.id || (profile as any)?.uuid || (profile as any)?._id || ""
  ).trim();
  const myUsername = String(profile?.username || "").trim();

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage({ receiverId: participantId, content: text }),
    onMutate: async (text: string) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);

      await queryClient.cancelQueries({ queryKey: ["messages", participantId] });
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", participantId]);

      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        conversationId: conversation?._id || "",
        senderId: myId,
        content: text,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["messages", participantId],
        previousMessages ? [...previousMessages, optimisticMessage] : [optimisticMessage]
      );
      setContent("");

      await queryClient.cancelQueries({ queryKey: ["conversations"] });
      const previousConversations = queryClient.getQueryData<any[]>(["conversations"]);
      if (previousConversations) {
        queryClient.setQueryData(
          ["conversations"],
          previousConversations.map((c) =>
            c.participantProfile.id === participantId
              ? {
                  ...c,
                  lastMessage: optimisticMessage,
                  updatedAt: optimisticMessage.createdAt,
                }
              : c
          )
        );
      }
      return { previousMessages, previousConversations };
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages)
        queryClient.setQueryData(["messages", participantId], context.previousMessages);
      if (context?.previousConversations)
        queryClient.setQueryData(["conversations"], context.previousConversations);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const { data: publicProfile } = useQuery({
    queryKey: ["publicProfile", participantId],
    queryFn: () => getUserPublicProfile(participantId),
    enabled: !!participantId,
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["connectionStatus", participantId],
    queryFn: () => getConnectionStatus(participantId),
    enabled: !!participantId,
  });

  const isBlocked = publicProfile?.is_blocked ?? false;
  const isNotConnected = connectionStatus?.status !== "connected";
  const isInputDisabled = isBlocked || isNotConnected;

  const disabledMessage = isBlocked
    ? `Unblock ${participant?.display_name?.split(" ")[0] ?? "this user"} to send messages`
    : `Connect with ${participant?.display_name?.split(" ")[0] ?? "this user"} first to send messages`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header — sticky so it stays visible while scrolling messages ── */}
      <header className="sticky top-0 z-10 h-[57px] border-b border-border/50 flex items-center px-4 gap-3 flex-shrink-0 bg-background">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {participant ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarImage src={participant.profile_picture || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-[12px] font-semibold">
                  {getInitials(participant.display_name)}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-foreground leading-none truncate">
                {participant.display_name}
              </p>
              <p className="text-[11.5px] mt-0.5 leading-none">
                {isOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {isTyping ? "Typing…" : "Online"}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">{formatLastSeen(lastSeen)}</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-muted/60 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-muted/60 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
        )}
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-0.5">
          {isLoading ? (
            <div className="space-y-4 pt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} gap-2`}
                >
                  {i % 2 === 0 && (
                    <div className="w-7 h-7 rounded-full bg-muted/70 animate-pulse flex-shrink-0 self-end" />
                  )}
                  <div
                    className="h-9 rounded-2xl animate-pulse bg-muted/60"
                    style={{ width: `${[160, 220, 140, 200, 170][i]}px` }}
                  />
                </div>
              ))}
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-12">
              {participant && (
                <Avatar className="h-16 w-16 border-2 border-border/40 mb-4">
                  <AvatarImage src={participant.profile_picture || undefined} />
                  <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                    {getInitials(participant.display_name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-[15px] font-semibold text-foreground mb-1">
                {participant
                  ? `Start a conversation with ${participant.display_name.split(" ")[0]}`
                  : "Start a conversation"}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {participant
                  ? `@${participant.username}`
                  : "Send a message to kick things off."}
              </p>
            </div>
          ) : (
            messages?.map((msg, index) => {
              const senderId = String(msg.senderId || "").trim();
              const isMe =
                (myId && senderId === myId) || (myUsername && senderId === myUsername);
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
              const showDate = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
              const showAvatar = !isMe && isLastInGroup;

              return (
                <div key={msg._id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[11px] text-muted-foreground/60 font-medium px-2">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${
                      isLastInGroup ? "mb-2.5" : "mb-0.5"
                    }`}
                  >
                    {/* Avatar placeholder for received messages */}
                    {!isMe && (
                      <div className="w-7 flex-shrink-0 self-end mb-0.5">
                        {showAvatar && participant ? (
                          <Avatar className="h-7 w-7 border border-border/40">
                            <AvatarImage src={participant.profile_picture || undefined} />
                            <AvatarFallback className="text-[9px] font-semibold bg-muted text-muted-foreground">
                              {getInitials(participant.display_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] sm:max-w-[72%] md:max-w-[62%] flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`relative px-3.5 py-2.5 ${
                          isMe
                            ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ${
                                isFirstInGroup && isLastInGroup
                                  ? "rounded-2xl"
                                  : isFirstInGroup
                                  ? "rounded-2xl rounded-br-sm"
                                  : isLastInGroup
                                  ? "rounded-2xl rounded-tr-sm"
                                  : "rounded-lg rounded-r-sm"
                              }`
                            : `bg-muted/50 dark:bg-muted/40 text-foreground border border-border/40 ${
                                isFirstInGroup && isLastInGroup
                                  ? "rounded-2xl"
                                  : isFirstInGroup
                                  ? "rounded-2xl rounded-bl-sm"
                                  : isLastInGroup
                                  ? "rounded-2xl rounded-tl-sm"
                                  : "rounded-lg rounded-l-sm"
                              }`
                        }`}
                      >
                        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>

                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isMe
                                ? "text-white/50 dark:text-slate-900/40"
                                : "text-muted-foreground/40"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <CheckCheck
                              className={`w-3 h-3 transition-colors ${
                                msg._id.startsWith("temp-")
                                  ? "text-white/30 dark:text-slate-900/30"
                                  : msg.isRead
                                  ? "text-white/80 dark:text-slate-900/70"
                                  : "text-white/50 dark:text-slate-900/40"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 mb-3">
              <div className="w-7 flex-shrink-0 self-end">
                {participant && (
                  <Avatar className="h-7 w-7 border border-border/40">
                    <AvatarImage src={participant.profile_picture || undefined} />
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {getInitials(participant.display_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="bg-muted/50 border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background px-3 sm:px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {isInputDisabled ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border border-border/50 rounded-xl">
              <p className="text-[13px] text-muted-foreground/70 flex-1 text-center">
                {disabledMessage}
              </p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2.5 bg-muted/30 border border-border/50 rounded-xl px-3 py-2.5 focus-within:border-slate-400/70 focus-within:ring-1 focus-within:ring-slate-400/30 transition-all"
              >
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message…"
                  rows={1}
                  disabled={sendMutation.isPending}
                  className="flex-1 bg-transparent resize-none min-h-[34px] max-h-[120px] py-1 text-[13.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none overflow-y-auto scrollbar-hide leading-relaxed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!content.trim() || sendMutation.isPending}
                  className={`h-8 w-8 flex-shrink-0 self-end rounded-lg flex items-center justify-center transition-all duration-150 ${
                    content.trim() && !sendMutation.isPending
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90"
                      : "bg-muted/60 text-muted-foreground/30 cursor-not-allowed"
                  }`}
                >
                  {sendMutation.isPending ? (
                    <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
              </form>

              <p className="text-[10.5px] text-muted-foreground/35 text-center mt-1.5 select-none hidden sm:block">
                <kbd className="font-mono">Enter</kbd> to send ·{" "}
                <kbd className="font-mono">Shift+Enter</kbd> for new line
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
