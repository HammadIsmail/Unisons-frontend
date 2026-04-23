"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import useUiStore from "@/store/uiStore";
import { MessageSquare, Search, Home, Users, Briefcase, Bell, User, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "Home", href: "/feed", icon: Home },
  { label: "My Network", href: "/network", icon: Users },
  { label: "Messaging", href: "/chat", icon: MessageSquare },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, clearAuth } = useAuthStore();
  const { notificationCount } = useNotifications();
  const { unreadChatCount } = useUiStore();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-4 flex-1">
          <Link href="/feed" className="flex items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0a66c2] text-white font-bold text-xl">
              U
            </div>
            <span className="hidden text-xl font-bold text-[#0a66c2] sm:inline-block">
              UNISON
            </span>
          </Link>
          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="h-9 w-full bg-[#eef3f8] pl-10 border-none focus-visible:ring-1 focus-visible:ring-[#0a66c2] cursor-pointer"
              onFocus={() => router.push("/search")}
              readOnly
            />
          </div>
          {/* Mobile Search Icon */}
          <Link href="/search" className="md:hidden flex items-center justify-center p-2 text-muted-foreground hover:bg-muted/50 rounded-full transition-colors">
            <Search className="h-6 w-6" />
          </Link>
        </div>

        {/* Right: Nav Links & Profile */}
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex items-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center px-3 py-1 transition-colors hover:text-foreground md:min-w-[80px] ${
                    isActive ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.label === "Notifications" && notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white leading-none">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                    {item.label === "Messaging" && unreadChatCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0a66c2] px-1 text-[10px] font-bold text-white leading-none">
                        {unreadChatCount > 9 ? "9+" : unreadChatCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden text-[11px] font-medium lg:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center px-3 py-1 text-muted-foreground hover:text-foreground transition-colors md:min-w-[80px]">
                <Avatar className="h-6 w-6 border border-border">
                  <AvatarImage src={profile?.profile_picture} />
                  <AvatarFallback className="bg-[#0a66c2] text-white text-[10px]">
                    {profile?.display_name?.slice(0, 2).toUpperCase() || "UN"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-[11px] font-medium lg:block">Me</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuLabel className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={profile?.profile_picture} />
                  <AvatarFallback>{profile?.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold leading-none">{profile?.display_name}</span>
                  <span className="text-xs text-muted-foreground mt-1 capitalize">{profile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile/me" className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
