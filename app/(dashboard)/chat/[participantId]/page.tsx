"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, markMessageRead, getConversations } from "@/lib/api/chat.api";
import useAuthStore from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Send } from "lucide-react";
import { Message } from "@/types/api.types";

export default function ChatRoomPage() {
  const params = useParams();
  const participantId = params.participantId as string;
  const router = useRouter();
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState("");

  // 1. Participant Details from conversations list
  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const conversation = conversations?.find(c => c.participantProfile.id === participantId);
  const participant = conversation?.participantProfile;

  // 2. Fetch Messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", participantId],
    queryFn: () => getMessages(participantId),
    enabled: !!participantId,
  });

  // Scroll to bottom when messages load or change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!messages || !profile || !participantId) return;

    // Find messages that are not from me and are unread, and have a valid ID
    const unreadMsgs = messages.filter(
      (msg) => !msg.isRead && msg.senderId !== profile.id && !msg._id.startsWith("temp-")
    );

    if (unreadMsgs.length === 0) return;

    // Process them
    Promise.allSettled(unreadMsgs.map((msg) => markMessageRead(msg._id)))
      .then((results) => {
        const anySuccess = results.some((r) => r.status === "fulfilled");
        if (anySuccess) {
          // Just one invalidation for the whole batch
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
        }
      })
      .catch(console.error);
  }, [messages, profile?.id, queryClient, participantId]);

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage({ receiverId: participantId, content: text }),
    onMutate: async (text: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["messages", participantId] });
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", participantId]);

      const myId = profile?.id || (profile as any)?.uuid || (profile as any)?._id || "me";
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        conversationId: conversation?._id || "",
        senderId: myId,
        content: text,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previousMessages) {
        queryClient.setQueryData(["messages", participantId], [...previousMessages, optimisticMessage]);
      } else {
        queryClient.setQueryData(["messages", participantId], [optimisticMessage]);
      }

      setContent(""); // Clear input

      // Also update conversation preview
      await queryClient.cancelQueries({ queryKey: ["conversations"] });
      const previousConversations = queryClient.getQueryData<any[]>(["conversations"]);
      if (previousConversations) {
        queryClient.setQueryData(["conversations"], previousConversations.map(c =>
          c.participantProfile.id === participantId
            ? { ...c, lastMessage: optimisticMessage, updatedAt: optimisticMessage.createdAt }
            : c
        ));
      }

      return { previousMessages, previousConversations };
    },
    onError: (err, newMsg, context) => {
      // Revert if error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", participantId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(["conversations"], context.previousConversations);
      }
    },
    onSettled: () => {
      // Always refetch to ensure correctness
      queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    const textToSend = content.trim();
    sendMutation.mutate(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-16 border-b border-border/60 flex items-center px-4 flex-shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden mr-3 p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {participant ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={participant.profile_picture || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                {getInitials(participant.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground leading-none">{participant.display_name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">@{participant.username}</p>
            </div>
          </div>
        ) : (
          <div className="h-9 w-40 bg-muted/60 rounded-lg animate-pulse" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
        {isLoading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>No messages yet. Send a message to start!</p>
          </div>
        ) : (
          messages?.map((msg, index) => {
            const myId = String(profile?.id || (profile as any)?.uuid || (profile as any)?._id || "").trim();
            const myUsername = String(profile?.username || "").trim();
            const senderId = String(msg.senderId || "").trim();
            console.log("isMe Check:", {
              myId,
              myUsername,
              senderId,
              isMe: (myId && senderId === myId) || (myUsername && senderId === myUsername)
            });
            const isMe = (myId && senderId === myId) || (myUsername && senderId === myUsername);
            const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                {!isMe && (
                  <div className="w-8 shrink-0 mr-2 flex flex-col justify-end pb-1">
                    {showAvatar && participant && (
                      <Avatar className="h-7 w-7 border border-border/50 shadow-sm">
                        <AvatarImage src={participant.profile_picture || undefined} />
                        <AvatarFallback className="text-[9px] bg-muted">{getInitials(participant.display_name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe
                  ? "bg-blue-600 text-white rounded-br-none shadow-sm shadow-blue-500/10"
                  : "bg-muted dark:bg-muted/70 text-foreground rounded-bl-none shadow-sm"
                  }`}>
                  <div className="text-[14.5px] whitespace-pre-wrap break-words">{msg.content}</div>
                  <div className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-200" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-background border-t border-border/60 flex-shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-muted/40 p-2 rounded-2xl border border-border/50 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full max-h-32 min-h-[44px] bg-transparent resize-none py-2.5 pl-3 pr-2 text-sm text-foreground focus:outline-none scrollbar-hide"
            rows={1}
            disabled={sendMutation.isPending}
          />
          <button
            type="submit"
            disabled={!content.trim() || sendMutation.isPending}
            className="h-10 w-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors mb-0.5"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
