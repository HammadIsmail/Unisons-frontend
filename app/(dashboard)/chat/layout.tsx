"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations } from "@/lib/api/chat.api";
import { getMyNetwork } from "@/lib/api/connections.api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { MessageSquare, Search, Users, X, Menu } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { io, Socket } from "socket.io-client";

// ─── Socket singleton ─────────────────────────────────────────────────────────
let _socket: Socket | null = null;

function getSocket(token: string): Socket {
  if (!_socket || !_socket.connected) {
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return _socket;
}

// Expose socket globally so child pages can reuse it without prop drilling
export function getChatSocket(): Socket | null {
  return _socket;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type OnlineStatusMap = Record<string, { isOnline: boolean; lastSeen: string | null }>;

// Context so child pages can emit typing / read events without recreating socket
import { createContext, useContext } from "react";

interface ChatSocketCtx {
  socket: Socket | null;
  onlineStatus: OnlineStatusMap;
}
export const ChatSocketContext = createContext<ChatSocketCtx>({ socket: null, onlineStatus: {} });
export const useChatSocket = () => useContext(ChatSocketContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;

  if (diff < dayMs && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < dayMs * 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export { formatLastSeen };

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, role, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});
  const socketRef = useRef<Socket | null>(null);

  // ── WebSocket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const handleOnline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: { isOnline: true, lastSeen } }));
    };

    const handleOffline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: { isOnline: false, lastSeen } }));
    };

    // Invalidate conversations when a new message arrives so unread badges refresh
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    // Update read status on sent messages when receiver reads them
    const handleMessagesRead = ({ participantId }: { participantId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);
    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [token, queryClient]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { data: myConnections, isLoading: connLoading } = useQuery({
    queryKey: ["network", role],
    queryFn: () => getMyNetwork(role as "alumni" | "student"),
    enabled: !!role,
  });

  // Seed online status from conversation data (is_online / last_seen fields)
  useEffect(() => {
    if (!conversations) return;
    const updates: OnlineStatusMap = {};
    conversations.forEach((c) => {
      const p = c.participantProfile as any;
      if (p?.id && typeof p.is_online !== "undefined") {
        updates[p.id] = { isOnline: p.is_online, lastSeen: p.last_seen ?? null };
      }
    });
    if (Object.keys(updates).length) {
      setOnlineStatus((prev) => ({ ...prev, ...updates }));
    }
  }, [conversations]);

  const isLoading = convLoading || connLoading;

  const mergedItems = useMemo(() => {
    if (!myConnections) return conversations || [];

    const convMap = new Map();
    conversations?.forEach((c) => {
      convMap.set(c.participantProfile.id, c);
    });

    const result = [...(conversations || [])];

    myConnections.forEach((conn: any) => {
      const connId = conn.id || conn.alumni_id || conn.user_id;
      if (!convMap.has(connId)) {
        result.push({
          _id: `virtual-${connId}`,
          participants: [profile?.id || "", connId],
          participantProfile: {
            id: connId,
            display_name: conn.display_name,
            username: conn.username || "",
            profile_picture: conn.profile_picture || null,
            is_online: conn.is_online,
            last_seen: conn.last_seen,
          },
          lastMessage: {
            content: "",
            createdAt: new Date(0).toISOString(),
            isRead: true,
          },
          updatedAt: new Date(0).toISOString(),
        });
      }
    });

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [conversations, myConnections, profile?.id]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return mergedItems;
    const q = search.toLowerCase();
    return mergedItems.filter(
      (c) =>
        c.participantProfile.display_name.toLowerCase().includes(q) ||
        c.participantProfile.username.toLowerCase().includes(q)
    );
  }, [mergedItems, search]);

  const isRootPage = pathname === "/chat";

  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">Messages</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-muted/50 dark:bg-muted/30 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-border/40 mx-4 flex-shrink-0" />

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {isLoading && !mergedItems.length ? (
          <div className="space-y-2 px-2 pt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-muted/70 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/70 rounded-md animate-pulse w-3/4" />
                  <div className="h-3 bg-muted/50 rounded-md animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              {search ? (
                <Search className="w-6 h-6 text-muted-foreground/40" />
              ) : (
                <Users className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground/70 mb-1">
              {search ? "No results found" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {search ? `No matches for "${search}"` : "Connect with people to start chatting"}
            </p>
            {!search && (
              <Link
                href="/network"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 px-4 py-2 rounded-lg transition-colors"
              >
                Find connections →
              </Link>
            )}
          </div>
        ) : (
          filteredItems.map((conv) => {
            const isActive = pathname === `/chat/${conv.participantProfile.id}`;
            const participantId = conv.participantProfile.id;
            const liveStatus = onlineStatus[participantId];
            const isOnline = liveStatus?.isOnline ?? (conv.participantProfile as any).is_online ?? false;

            const hasUnread =
              conv.lastMessage &&
              !conv.lastMessage.isRead &&
              conv.lastMessage.senderId &&
              conv.lastMessage.senderId !== profile?.id;
            const initials = getInitials(conv.participantProfile.display_name);
            const hasMessage = !!conv.lastMessage?.content;

            return (
              <Link
                key={conv._id}
                href={`/chat/${conv.participantProfile.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 relative group ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/30 shadow-sm"
                    : "hover:bg-muted/50 dark:hover:bg-muted/20"
                }`}
              >
                {/* Avatar with live online indicator */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
                    <AvatarImage
                      src={conv.participantProfile.profile_picture || undefined}
                      alt={conv.participantProfile.display_name}
                    />
                    <AvatarFallback
                      className={`text-[13px] font-semibold ${
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                          : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Live online dot — only shown when online */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <p
                      className={`text-[13.5px] truncate ${
                        hasUnread
                          ? "font-bold text-foreground"
                          : "font-semibold text-foreground/90"
                      }`}
                    >
                      {conv.participantProfile.display_name}
                    </p>
                    {hasMessage && (
                      <span
                        className={`text-[10.5px] flex-shrink-0 tabular-nums ${
                          hasUnread
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {formatTime(conv.updatedAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[12.5px] truncate leading-snug ${
                      hasUnread
                        ? "text-foreground/80 font-medium"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {conv.lastMessage?.content || (
                      <span className="italic text-muted-foreground/50">Start a conversation</span>
                    )}
                  </p>
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-500/40" />
                )}
              </Link>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <ChatSocketContext.Provider value={{ socket: socketRef.current, onlineStatus }}>
      <div className="flex h-[calc(100vh-56px)] bg-background overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex w-80 lg:w-[340px] flex-col flex-shrink-0 border-r border-border/50 bg-background/95 backdrop-blur-sm">
          <SidebarContent />
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        )}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-[300px] flex flex-col bg-background shadow-2xl border-r border-border/50 transform transition-transform duration-300 ease-in-out md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="pt-14">
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main Area ── */}
        <main
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
            isRootPage ? "hidden md:flex" : "flex"
          }`}
        >
          {!isRootPage && (
            <div className="md:hidden absolute top-[56px] left-3 z-30">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-background/95 backdrop-blur border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </ChatSocketContext.Provider>
  );
}
