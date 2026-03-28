"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

import {
  LayoutDashboard,
  Briefcase,
  Globe,
  Search,
  Network,
  Users,
  FileText,
  GraduationCap,
  Bell,
  ShieldCheck,
  Clock,
  UserCog,
  BookOpen,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",        icon: <LayoutDashboard className="h-4 w-4" />, roles: ["alumni", "student"] },
  { label: "Opportunities", href: "/opportunities",    icon: <Briefcase className="h-4 w-4" />,       roles: ["alumni", "student"] },
  { label: "Network",       href: "/network",          icon: <Globe className="h-4 w-4" />,           roles: ["alumni", "student"] },
  { label: "Search",        href: "/search",           icon: <Search className="h-4 w-4" />,          roles: ["alumni", "student"] },
  { label: "My Network",    href: "/my-network",       icon: <Network className="h-4 w-4" />,         roles: ["alumni"] },
  { label: "Batch Mates",   href: "/batch-mates",      icon: <Users className="h-4 w-4" />,           roles: ["alumni"] },
  { label: "My Posts",      href: "/my-opportunities", icon: <FileText className="h-4 w-4" />,        roles: ["alumni"] },
  { label: "Mentors",       href: "/mentors",          icon: <GraduationCap className="h-4 w-4" />,   roles: ["student"] },
  { label: "Notifications", href: "/notifications",    icon: <Bell className="h-4 w-4" />,            roles: ["alumni", "student"] },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview",      href: "/admin",                 icon: <LayoutDashboard className="h-4 w-4" />, roles: ["admin"] },
  { label: "Pending",       href: "/admin/pending",         icon: <Clock className="h-4 w-4" />,           roles: ["admin"] },
  { label: "Alumni",        href: "/admin/alumni",          icon: <UserCog className="h-4 w-4" />,         roles: ["admin"] },
  { label: "Students",      href: "/admin/students",        icon: <BookOpen className="h-4 w-4" />,        roles: ["admin"] },
  { label: "Opportunities", href: "/admin/opportunities",   icon: <Briefcase className="h-4 w-4" />,       roles: ["admin"] },
];

const ROLE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  alumni:  { label: "Alumni",   color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-950/50",   dot: "bg-blue-500" },
  student: { label: "Student",  color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/50", dot: "bg-violet-500" },
  admin:   { label: "Admin",    color: "text-rose-700 dark:text-rose-300",   bg: "bg-rose-50 dark:bg-rose-950/50",   dot: "bg-rose-500" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuthStore();

  const items = role === "admin" ? ADMIN_NAV : NAV_ITEMS;
  const filteredItems = items.filter((item) => item.roles.includes(role ?? ""));
  const meta = ROLE_META[role ?? "student"] ?? ROLE_META.student;

  // Group nav items with a separator before Notifications
  const mainItems = filteredItems.filter((i) => i.href !== "/notifications");
  const bottomItems = filteredItems.filter((i) => i.href === "/notifications");

  return (
    <aside className="w-[220px] flex-shrink-0 bg-background border-r border-border/70 flex flex-col h-full">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-5 border-b border-border/70 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Wordmark accent block */}
          <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
          <span className="text-[17px] font-bold tracking-tight text-foreground">
            UNI<span className="text-blue-600">SON</span>
          </span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2.5 flex flex-col gap-0.5 overflow-y-auto">

        {/* Section label */}
        {role === "admin" && (
          <div className="flex items-center gap-2 px-2.5 mb-1 mt-1">
            <ShieldCheck className="h-3 w-3 text-rose-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Admin Panel
            </span>
          </div>
        )}

        {mainItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }
              `}
            >
              {/* Active indicator glow */}
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md -z-10 pointer-events-none" />
              )}

              <span className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>

              {/* Active dot on right */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />
              )}
            </Link>
          );
        })}

        {/* Separator before Notifications */}
        {bottomItems.length > 0 && (
          <>
            <div className="my-1.5 mx-2 border-t border-border/50" />
            {bottomItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group
                    ${isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md -z-10 pointer-events-none" />
                  )}
                  <span className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── Role badge ───────────────────────────────────────────────── */}
      <div className="p-3 border-t border-border/60 flex-shrink-0">
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${meta.bg}`}>
          <span className={`h-2 w-2 rounded-full ${meta.dot} flex-shrink-0`} />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-0.5">
              Signed in as
            </p>
            <p className={`text-sm font-semibold ${meta.color} leading-none`}>
              {meta.label}
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
}
