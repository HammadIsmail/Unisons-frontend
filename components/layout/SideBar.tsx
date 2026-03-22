"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",        icon: "⊞", roles: ["alumni", "student"] },
  { label: "Opportunities", href: "/opportunities",    icon: "💼", roles: ["alumni", "student"] },
  { label: "Network",       href: "/network",          icon: "◎", roles: ["alumni", "student"] },
  { label: "Search",        href: "/search",           icon: "⌕", roles: ["alumni", "student"] },
  { label: "My Network",    href: "/my-network",       icon: "⇌", roles: ["alumni"] },
  { label: "Batch Mates",   href: "/batch-mates",      icon: "⊕", roles: ["alumni"] },
  { label: "My Posts",      href: "/my-opportunities", icon: "✦", roles: ["alumni"] },
  { label: "Mentors",       href: "/mentors",          icon: "★", roles: ["student"] },
  { label: "Notifications", href: "/notifications",    icon: "◈", roles: ["alumni", "student"] },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview",      href: "/admin",                  icon: "⊞", roles: ["admin"] },
  { label: "Pending",       href: "/admin/pending",          icon: "⏳", roles: ["admin"] },
  { label: "Alumni",        href: "/admin/alumni",           icon: "◎", roles: ["admin"] },
  { label: "Students",      href: "/admin/students",         icon: "⊕", roles: ["admin"] },
  { label: "Opportunities", href: "/admin/opportunities",    icon: "💼", roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuthStore();

  const items = role === "admin" ? ADMIN_NAV : NAV_ITEMS;
  const filteredItems = items.filter((item) =>
    item.roles.includes(role ?? "")
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">

      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold text-green-800 tracking-tight">
          UNISON
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-green-50 text-green-800 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Role badge */}
      <div className="p-4 border-t border-gray-100">
        <div className="px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-medium text-gray-700 capitalize">{role}</p>
        </div>
      </div>

    </aside>
  );
}