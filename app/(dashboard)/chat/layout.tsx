"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations } from "@/lib/api/chat.api";
import { getMyNetwork } from "@/lib/api/connections.api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { MessageSquare, Search, Users, X } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { io, Socket } from "socket.io-client";
import { createContext, useContext } from "react";

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

export function getChatSocket(): Socket | null {
  return _socket;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type OnlineStatusMap = Record<string, { isOnline: boolean; lastSeen: string | null }>;

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
  if (diff < dayMs && date.getDate() === now.getDate())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < dayMs * 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export { formatLastSeen };

// ─── Sidebar (extracted OUTSIDE layout so its identity is stable) ─────────────
// Defining a component inside another component's render function gives it a new
// type identity on every render — React unmounts + remounts it, which resets
// focus after every keystroke. Moving it outside fixes the search input bug.
interface SidebarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onClose: () => void;
  isLoading: boolean;
  filteredItems: any[];
  mergedItems: any[];
  onlineStatus: OnlineStatusMap;
  profileId: string | undefined;
  pathname: string;
}

function Sidebar({
  search,
  onSearchChange,
  onClose,
  isLoading,
  filteredItems,
  mergedItems,
  onlineStatus,
  profileId,
  pathname,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white dark:text-slate-900" />
            </div>
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              Messages
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="w-full bg-muted/40 border border-border/60 rounded-lg pl-9 pr-8 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-slate-400/60 focus:border-slate-400/60 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-border/50 mx-3 flex-shrink-0" />

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
        {isLoading && !mergedItems.length ? (
          <div className="space-y-1 px-1 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-muted/60 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted/60 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-muted/40 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              {search ? (
                <Search className="w-5 h-5 text-muted-foreground/40" />
              ) : (
                <Users className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-[13px] font-medium text-foreground/60 mb-1">
              {search ? "No results" : "No conversations"}
            </p>
            <p className="text-[12px] text-muted-foreground/50 mb-4">
              {search
                ? `Nothing matched "${search}"`
                : "Connect with people to start messaging"}
            </p>
            {!search && (
              <Link
                href="/network"
                className="text-[12px] font-medium text-slate-700 dark:text-slate-300 underline underline-offset-2"
              >
                Browse network
              </Link>
            )}
          </div>
        ) : (
          filteredItems.map((conv) => {
            const isActive = pathname === `/chat/${conv.participantProfile.id}`;
            const participantId = conv.participantProfile.id;
            const liveStatus = onlineStatus[participantId];
            const isOnline =
              liveStatus?.isOnline ?? (conv.participantProfile as any).is_online ?? false;
            const hasUnread =
              conv.lastMessage &&
              !conv.lastMessage.isRead &&
              conv.lastMessage.senderId &&
              conv.lastMessage.senderId !== profileId;
            const initials = getInitials(conv.participantProfile.display_name);
            const hasMessage = !!conv.lastMessage?.content;

            return (
              <Link
                key={conv._id}
                href={`/chat/${conv.participantProfile.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-100 relative ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800/80"
                    : "hover:bg-muted/50 dark:hover:bg-muted/20"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage
                      src={conv.participantProfile.profile_picture || undefined}
                      alt={conv.participantProfile.display_name}
                    />
                    <AvatarFallback
                      className={`text-[12px] font-semibold ${
                        isActive
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p
                      className={`text-[13px] truncate ${
                        hasUnread
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      }`}
                    >
                      {conv.participantProfile.display_name}
                    </p>
                    {hasMessage && (
                      <span
                        className={`text-[10px] flex-shrink-0 tabular-nums ${
                          hasUnread
                            ? "text-foreground/70 font-medium"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {formatTime(conv.updatedAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[12px] truncate mt-0.5 ${
                      hasUnread
                        ? "text-foreground/70 font-medium"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {conv.lastMessage?.content || (
                      <span className="italic text-muted-foreground/40">
                        Start a conversation
                      </span>
                    )}
                  </p>
                </div>

                {/* Unread dot */}
                {hasUnread && (
                  <span className="flex-shrink-0 w-2 h-2 bg-slate-800 dark:bg-slate-100 rounded-full" />
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, role, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusMap>({});
  const socketRef = useRef<Socket | null>(null);

  const isRootPage = pathname === "/chat";
  const isInChat = pathname.startsWith("/chat/");

  // ── WebSocket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    const handleOnline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) =>
      setOnlineStatus((prev) => ({ ...prev, [userId]: { isOnline: true, lastSeen } }));
    const handleOffline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) =>
      setOnlineStatus((prev) => ({ ...prev, [userId]: { isOnline: false, lastSeen } }));
    const handleNewMessage = () =>
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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

  useEffect(() => {
    if (!conversations) return;
    const updates: OnlineStatusMap = {};
    conversations.forEach((c) => {
      const p = c.participantProfile as any;
      if (p?.id && typeof p.is_online !== "undefined")
        updates[p.id] = { isOnline: p.is_online, lastSeen: p.last_seen ?? null };
    });
    if (Object.keys(updates).length)
      setOnlineStatus((prev) => ({ ...prev, ...updates }));
  }, [conversations]);

  const isLoading = convLoading || connLoading;

  const mergedItems = useMemo(() => {
    if (!myConnections) return conversations || [];
    const convMap = new Map();
    conversations?.forEach((c) => convMap.set(c.participantProfile.id, c));
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
          lastMessage: { content: "", createdAt: new Date(0).toISOString(), isRead: true },
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

  // Close sidebar when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const sidebarProps: SidebarProps = {
    search,
    onSearchChange: setSearch,
    onClose: () => setSidebarOpen(false),
    isLoading,
    filteredItems,
    mergedItems,
    onlineStatus,
    profileId: profile?.id,
    pathname,
  };

  return (
    <ChatSocketContext.Provider value={{ socket: socketRef.current, onlineStatus }}>
      <div className="flex h-[calc(100vh-56px)] bg-background overflow-hidden">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex w-72 lg:w-[300px] flex-col flex-shrink-0 border-r border-border/50 bg-background">
          <Sidebar {...sidebarProps} />
        </aside>

        {/* ── Mobile root: show sidebar list inline ── */}
        {isRootPage && (
          <div className="flex flex-col flex-1 md:hidden">
            <Sidebar {...sidebarProps} />
          </div>
        )}

        {/* ── Mobile drawer — visible when inside a chat ── */}
        {isInChat && (
          <>
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
              </div>
            )}
            <aside
              className={`fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col bg-background shadow-xl border-r border-border/50 transform transition-transform duration-250 ease-in-out md:hidden ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="pt-14 h-full">
                <Sidebar {...sidebarProps} />
              </div>
            </aside>
          </>
        )}

        {/* ── Main chat area ── */}
        <main
          className={`flex-col min-w-0 overflow-hidden flex-1 ${
            isRootPage ? "hidden md:flex" : "flex"
          }`}
        >
          {children}
        </main>
      </div>
    </ChatSocketContext.Provider>
  );
}
