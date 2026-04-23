"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatSocket } from "@/hooks/useChatSocket";
import useUIStore from "@/store/uiStore";

import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

// ── Page title map ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/opportunities":    "Opportunities",
  "/network":          "Network",
  "/search":           "Search",
  "/my-network":       "My Network",
  "/batch-mates":      "Batch Mates",
  "/my-opportunities": "My Posts",
  "/mentors":          "Mentors",
  "/notifications":    "Notifications",
  "/profile/me":       "My Profile",
  "/settings":         "Settings",
  "/admin":            "Admin Overview",
  "/admin/pending":    "Pending Approvals",
  "/admin/alumni":     "Alumni",
  "/admin/students":   "Students",
  "/admin/opportunities": "Manage Opportunities",
};

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, role, clearAuth } = useAuthStore();
  const { notificationCount } = useNotifications();
  const { unreadChatCount } = useUIStore();
  
  // Call the hook to initialize socket listener globally
  useChatSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const pageTitle =
    PAGE_TITLES[pathname] ??
    pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ??
    "UNISON";

  const initials = profile?.display_name ? getInitials(profile.display_name) : "U";

  return (
    <header className="h-14 border-b border-border/70 bg-background/95 backdrop-blur-sm flex items-center justify-between px-5 flex-shrink-0 sticky top-0 z-30">

      {/* ── Left: Page title ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-foreground capitalize tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: Actions ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        <Link
          href="/notifications"
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* Message square */}
        <Link
          href="/chat"
          className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150"
          aria-label="Messages"
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
              {unreadChatCount > 9 ? "9+" : unreadChatCount}
            </span>
          )}
        </Link>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl hover:bg-muted/70 transition-all duration-150 group"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Avatar className="w-7 h-7 ring-1 ring-border/60">
              <AvatarImage src={profile?.profile_picture} alt={profile?.display_name} />
              <AvatarFallback className="bg-blue-600 text-white text-[11px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-medium text-foreground leading-none">
                {profile?.display_name ?? "User"}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize mt-0.5 leading-none">
                {role}
              </p>
            </div>
            <ChevronDown
              className={`hidden md:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 bg-popover border border-border/70 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">

              {/* User info header */}
              <div className="px-4 py-2.5 mb-1">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {profile?.display_name ?? "User"}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                  {role} account
                </p>
              </div>

              <Separator className="my-1 opacity-60" />

              {/* Menu items */}
              <div className="px-1.5 py-1 space-y-0.5">
                <Link
                  href="/profile/me"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-foreground rounded-xl hover:bg-muted/70 transition-colors duration-100"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-foreground rounded-xl hover:bg-muted/70 transition-colors duration-100"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Settings
                </Link>
              </div>

              <Separator className="my-1 opacity-60" />

              <div className="px-1.5 pb-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

    </header>
  );
}
