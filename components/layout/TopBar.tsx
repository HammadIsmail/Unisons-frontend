"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default function TopBar() {
  const router = useRouter();
  const { profile, role, clearAuth } = useAuthStore();
  const { notificationCount } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">

      {/* Left: Page title placeholder */}
      <div className="text-sm font-medium text-gray-500">
        UNISON Alumni Network
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <Link href="/notifications" className="relative">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition">
            <span className="text-lg">🔔</span>
          </div>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.profile_picture} />
              <AvatarFallback className="bg-green-100 text-green-800 text-xs font-semibold">
                {profile?.name ? getInitials(profile.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {profile?.name ?? "User"}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{role}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                <Link
                  href="/profile/me"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}