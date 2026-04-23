"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/api/chat.api";
import { getMyNetwork } from "@/lib/api/connections.api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { MessageSquare, Search } from "lucide-react";
import useAuthStore from "@/store/authStore";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, role } = useAuthStore();
  const isAlumni = role === "alumni";

  // 1. Fetch active conversations
  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  // 2. Fetch all connections (batchmates, colleagues, mentors)
  const { data: myConnections, isLoading: connLoading } = useQuery({
    queryKey: ["network", role],
    queryFn: () => getMyNetwork(role as "alumni" | "student"),
    enabled: !!role,
  });

  const isLoading = convLoading || connLoading;

  // 3. Merge connections and conversations
  // We want to show EVERY connection. If a connection doesn't have an active conversation,
  // we'll create a "virtual" conversation object for it.
  const mergedItems = useMemo(() => {
    if (!myConnections) return conversations || [];

    const convMap = new Map();
    conversations?.forEach((c) => {
      convMap.set(c.participantProfile.id, c);
    });

    const result = [...(conversations || [])];

    myConnections.forEach((conn: any) => {
      // Normalize connection ID (some API fields might vary)
      const connId = conn.id || conn.alumni_id || conn.user_id;
      if (!convMap.has(connId)) {
        // Add a virtual conversation for this connection
        result.push({
          _id: `virtual-${connId}`,
          participants: [profile?.id || "", connId],
          participantProfile: {
            id: connId,
            display_name: conn.display_name,
            username: conn.username || "",
            profile_picture: conn.profile_picture || null,
          },
          lastMessage: {
            content: "",
            createdAt: new Date(0).toISOString(),
            isRead: true,
          },
          updatedAt: new Date(0).toISOString(), // Sort at the bottom
        });
      }
    });

    // Sort by updatedAt descending
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations, myConnections]);

  const isRootPage = pathname === "/chat";

  return (
    <div className="flex h-[calc(100vh-56px)] bg-background">
      {/* Sidebar: Message Inbox */}
      <div 
        className={`w-full md:w-80 lg:w-96 border-r border-border/60 flex-shrink-0 flex flex-col ${
          !isRootPage ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-border/60">
          <h2 className="text-lg font-semibold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-muted/60 border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {isLoading && !mergedItems.length ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mergedItems.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No connections found.</p>
              <Link href="/network" className="text-xs text-blue-600 hover:underline mt-2 block">
                Find people to connect with
              </Link>
            </div>
          ) : (
            mergedItems.map((conv) => {
              const isActive = pathname === `/chat/${conv.participantProfile.id}`;
              const initials = getInitials(conv.participantProfile.display_name);

              return (
                <Link
                  key={conv._id}
                  href={`/chat/${conv.participantProfile.id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors duration-150 relative ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-muted/60"
                  }`}
                >
                  <Avatar className="h-11 w-11 flex-shrink-0 border border-border/50">
                    <AvatarImage src={conv.participantProfile.profile_picture || undefined} alt={conv.participantProfile.display_name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-semibold text-sm text-foreground truncate pr-2">
                        {conv.participantProfile.display_name}
                      </p>
                      {conv.lastMessage?.content && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[13px] truncate ${
                      conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId && conv.lastMessage.senderId !== profile?.id ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}>
                      {conv.lastMessage?.content || "Start a conversation"}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.senderId && conv.lastMessage.senderId !== profile?.id && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
        isRootPage ? "hidden md:flex" : "flex"
      }`}>
        {children}
      </div>
    </div>
  );
}
