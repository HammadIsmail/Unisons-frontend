"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "@/lib/socket";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { Message } from "@/types/api.types";
import { usePathname } from "next/navigation";
import { getConversations } from "@/lib/api/chat.api";
import { useRef } from "react";

export function useChatSocket() {
  const { profile, token, isAuthenticated } = useAuthStore();
  const { incrementUnreadChatCount, setUnreadChatCount } = useUIStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // 1. Initial fetch for unread count
  useEffect(() => {
    if (!isAuthenticated || !profile) return;

    getConversations().then((convs) => {
      const count = convs.filter(c => 
        c.lastMessage && 
        !c.lastMessage.isRead && 
        c.lastMessage.senderId !== profile.id
      ).length;
      setUnreadChatCount(count);
    }).catch(console.error);
  }, [isAuthenticated, profile, setUnreadChatCount]);

  // 2. Real-time updates
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const socket = connectSocket(token);

    const handleNewMessage = (newMessage: Message) => {
      console.log("Real-time message received:", newMessage);
      // Check if we are currently in this chat room (Case-insensitive)
      const currentPath = (pathnameRef.current || "").toLowerCase();
      const expectedPath = `/chat/${newMessage.senderId}`.toLowerCase();
      const isChatRoomActive = currentPath === expectedPath;
      
      console.log(`Matching: ${currentPath} === ${expectedPath} ? ${isChatRoomActive}`);

      if (isChatRoomActive) {
        // We are in the chat room, invalidate messages to fetch it
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } else {
        // We are NOT in the room, increment the unread badge
        incrementUnreadChatCount();
      }

      // Always invalidate the inbox to update lastMessage
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [token, isAuthenticated, queryClient, incrementUnreadChatCount]);
}
