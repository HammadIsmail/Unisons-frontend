"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, getConversations, markConversationRead } from "@/lib/api/chat.api";
import useAuthStore from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video, CheckCheck } from "lucide-react";
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
  const da = new Date(a), db = new Date(b);
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
  const [isTyping, setIsTyping] = useState(false); // remote participant is typing

  // ── Socket from layout context ───────────────────────────────────────────
  const { socket, onlineStatus } = useChatSocket();
  const liveStatus = onlineStatus[participantId];

  // ── Participant details ──────────────────────────────────────────────────
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const conversation = conversations?.find((c) => c.participantProfile.id === participantId);
  const participant = conversation?.participantProfile as any;

  // Derive online status: prefer live socket data, fall back to profile field
  const isOnline = liveStatus?.isOnline ?? participant?.is_online ?? false;
  const lastSeen = liveStatus?.lastSeen ?? participant?.last_seen ?? null;

  // ── Fetch messages ───────────────────────────────────────────────────────
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", participantId],
    queryFn: () => getMessages(participantId),
    enabled: !!participantId,
  });

  // ── Bulk-mark conversation as read when chat is opened ───────────────────
  useEffect(() => {
    if (!participantId || !profile) return;
    // Call the bulk-read endpoint
    markConversationRead(participantId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      })
      .catch(() => {/* silently ignore */ });
  }, [participantId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket: typing_status + message_read / messages_read ────────────────
  useEffect(() => {
    if (!socket) return;

    const handleTypingStatus = ({ senderId, isTyping: typing }: { senderId: string; isTyping: boolean }) => {
      if (senderId === participantId) setIsTyping(typing);
    };

    // Single message read
    const handleMessageRead = ({ messageId, readAt }: { messageId: string; readAt: string }) => {
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev?.map((m) => (m._id === messageId ? { ...m, isRead: true, readAt } : m)) ?? prev
      );
    };

    // Bulk read (all messages in this conversation marked read)
    const handleMessagesRead = ({ participantId: pid }: { participantId: string }) => {
      if (pid !== participantId) return;
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev?.map((m) => ({ ...m, isRead: true })) ?? prev
      );
    };

    // New incoming message — append to cache then re-mark read
    const handleNewMessage = (msg: Message) => {
      if (String(msg.senderId) !== participantId) return;
      queryClient.setQueryData<Message[]>(["messages", participantId], (prev) =>
        prev ? [...prev, { ...msg, isRead: true }] : [msg]
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Mark new message read immediately
      markConversationRead(participantId).catch(() => { });
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
      // Stop typing when leaving the chat
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
      el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
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
  const myId = String(profile?.id || (profile as any)?.uuid || (profile as any)?._id || "").trim();
  const myUsername = String(profile?.username || "").trim();

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage({ receiverId: participantId, content: text }),
    onMutate: async (text: string) => {
      // Stop typing indicator
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
              ? { ...c, lastMessage: optimisticMessage, updatedAt: optimisticMessage.createdAt }
              : c
          )
        );
      }
      return { previousMessages, previousConversations };
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", participantId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(["conversations"], context.previousConversations);
      }
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
    ? `🚫 Unblock ${participant?.display_name?.split(" ")[0] ?? "this user"} to send messages`
    : `🔗 Connect with ${participant?.display_name?.split(" ")[0] ?? "this user"} first to send messages`;


  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* ── Chat Header ── */}
      <header className="h-[65px] border-b border-border/40 flex items-center px-4 flex-shrink-0 bg-background/98 backdrop-blur-md z-10 sticky top-0">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden mr-3 p-2 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {participant ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border/30">
                <AvatarImage src={participant.profile_picture || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-700 dark:text-blue-300 text-[13px] font-semibold">
                  {getInitials(participant.display_name)}
                </AvatarFallback>
              </Avatar>
              {/* Live online dot */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px] text-foreground leading-none truncate">
                {participant.display_name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {isTyping ? "Typing…" : "Online"}
                    </p>
                  </>
                ) : (
                  <p className="text-[11.5px] text-muted-foreground/60">
                    {formatLastSeen(lastSeen)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-muted/60 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted/60 rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-muted/40 rounded-md animate-pulse" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all hidden sm:flex items-center">
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all hidden sm:flex items-center">
            <Video className="w-4.5 h-4.5" />
          </button>
          <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto bg-muted/10 dark:bg-muted/5">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
          {isLoading ? (
            <div className="space-y-4 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} gap-2`}>
                  {i % 2 === 0 && (
                    <div className="w-8 h-8 rounded-full bg-muted/70 animate-pulse flex-shrink-0 self-end" />
                  )}
                  <div
                    className="h-10 rounded-2xl animate-pulse bg-muted/70"
                    style={{ width: `${[180, 240, 150, 210, 190][i]}px` }}
                  />
                </div>
              ))}
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-12">
              {participant && (
                <div className="mb-5">
                  <div className="relative inline-block">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-xl ring-2 ring-border/20">
                      <AvatarImage src={participant.profile_picture || undefined} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-700 dark:text-blue-300">
                        {getInitials(participant.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground mb-1">
                {participant
                  ? `Say hello to ${participant.display_name.split(" ")[0]}!`
                  : "Start a conversation"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {participant
                  ? `This is the beginning of your conversation with @${participant.username}.`
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

              // Read receipt: show blue ticks on last sent message only
              const isLastSentMsg =
                isMe &&
                isLastInGroup &&
                (!nextMsg || String(nextMsg.senderId).trim() !== myId);

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[11px] text-muted-foreground/70 font-medium px-3 py-1 bg-muted/30 rounded-full border border-border/30">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"
                      } ${isLastInGroup ? "mb-3" : "mb-0.5"}`}
                  >
                    {/* Received: Avatar space */}
                    {!isMe && (
                      <div className="w-8 flex-shrink-0 self-end mb-0.5">
                        {showAvatar && participant ? (
                          <Avatar className="h-8 w-8 border border-border/40 shadow-sm">
                            <AvatarImage src={participant.profile_picture || undefined} />
                            <AvatarFallback className="text-[9px] font-semibold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300">
                              {getInitials(participant.display_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[70%] sm:max-w-[60%] group ${isMe ? "items-end" : "items-start"
                        } flex flex-col`}
                    >
                      {!isMe && isFirstInGroup && participant && (
                        <span className="text-[11px] font-medium text-muted-foreground ml-1 mb-1">
                          {participant.display_name.split(" ")[0]}
                        </span>
                      )}

                      <div
                        className={`relative px-4 py-2.5 shadow-sm transition-all ${isMe
                          ? `bg-blue-600 text-white ${isFirstInGroup && isLastInGroup
                            ? "rounded-2xl"
                            : isFirstInGroup
                              ? "rounded-2xl rounded-br-md"
                              : isLastInGroup
                                ? "rounded-2xl rounded-tr-md"
                                : "rounded-lg rounded-r-md"
                          } shadow-blue-600/20`
                          : `bg-white dark:bg-muted/60 text-foreground border border-border/30 ${isFirstInGroup && isLastInGroup
                            ? "rounded-2xl"
                            : isFirstInGroup
                              ? "rounded-2xl rounded-bl-md"
                              : isLastInGroup
                                ? "rounded-2xl rounded-tl-md"
                                : "rounded-lg rounded-l-md"
                          }`
                          }`}
                      >
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>

                        {/* Timestamp + read receipt (only on last sent bubble in group) */}
                        <div
                          className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"
                            }`}
                        >
                          <span
                            className={`text-[10px] ${isMe ? "text-blue-200" : "text-muted-foreground/50"
                              }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <CheckCheck
                              className={`w-3 h-3 transition-colors duration-300 ${msg._id.startsWith("temp-")
                                ? "text-blue-300/40" // pending
                                : msg.isRead
                                  ? "text-blue-200"    // read — bright
                                  : "text-blue-300/60" // delivered, unread
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
            <div className="flex items-end gap-2.5 mb-3">
              <div className="w-8 flex-shrink-0 self-end">
                {participant && (
                  <Avatar className="h-8 w-8 border border-border/40 shadow-sm">
                    <AvatarImage src={participant.profile_picture || undefined} />
                    <AvatarFallback className="text-[9px] font-semibold bg-muted text-muted-foreground">
                      {getInitials(participant.display_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="bg-white dark:bg-muted/60 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* ── Message Input Bar ── */}
      <div className="flex-shrink-0 border-t border-border/40 bg-background/98 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {isBlocked ? (
            <div className="relative group">
              {/* Disabled overlay with tooltip */}
              <div className="flex items-end gap-2.5 bg-muted/20 dark:bg-muted/10 rounded-2xl border border-border/30 px-3 py-2.5 opacity-50 pointer-events-none select-none">
                <button type="button" className="p-1.5 text-muted-foreground/60 rounded-lg flex-shrink-0 self-end mb-0.5">
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <div className="flex-1 min-h-[36px] py-1.5" />
                <button type="button" className="p-1.5 text-muted-foreground/60 rounded-lg flex-shrink-0 self-end mb-0.5">
                  <Smile className="w-4.5 h-4.5" />
                </button>
                <div className="h-9 w-9 flex-shrink-0 self-end rounded-xl bg-muted/60" />
              </div>

              {/* Tooltip */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-popover text-popover-foreground text-[12.5px] font-medium px-3.5 py-2 rounded-xl shadow-lg border border-border/50 pointer-events-none whitespace-nowrap">
                  {disabledMessage}
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2.5 bg-muted/30 dark:bg-muted/20 rounded-2xl border border-border/50 px-3 py-2.5 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 shadow-sm"
            >
              <button
                type="button"
                className="p-1.5 text-muted-foreground/60 hover:text-muted-foreground rounded-lg hover:bg-muted/60 transition-all flex-shrink-0 self-end mb-0.5"
                tabIndex={-1}
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                disabled={sendMutation.isPending}
                className="flex-1 bg-transparent resize-none min-h-[36px] max-h-32 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none overflow-y-auto scrollbar-hide leading-relaxed disabled:opacity-70"
              />

              <button
                type="button"
                className="p-1.5 text-muted-foreground/60 hover:text-muted-foreground rounded-lg hover:bg-muted/60 transition-all flex-shrink-0 self-end mb-0.5"
                tabIndex={-1}
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              <button
                type="submit"
                disabled={!content.trim() || sendMutation.isPending}
                className={`h-9 w-9 flex-shrink-0 self-end rounded-xl flex items-center justify-center transition-all duration-200 ${content.trim() && !sendMutation.isPending
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 scale-100 hover:scale-105"
                  : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed"
                  }`}
              >
                {sendMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </form>
          )}

          {!isBlocked && (
            <p className="text-[10.5px] text-muted-foreground/40 text-center mt-2 select-none">
              Press <kbd className="font-mono">Enter</kbd> to send ·{" "}
              <kbd className="font-mono">Shift+Enter</kbd> for new line
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
