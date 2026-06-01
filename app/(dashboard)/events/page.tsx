"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/api/events.api";
import { EventListItem, EventType } from "@/types/api.types";
import useAuthStore from "@/store/authStore";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import {
  CalendarDays,
  MapPin,
  Wifi,
  Users,
  Plus,
  Video,
  Network,
  Handshake,
  GraduationCap,
  Globe,
  Clock,
  Filter, // <-- Added Filter icon import just in case you want to use it
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All Types", icon: <Globe className="h-3.5 w-3.5" /> },
  { value: "reunion", label: "Reunion", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "webinar", label: "Webinar", icon: <Video className="h-3.5 w-3.5" /> },
  { value: "workshop", label: "Workshop", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: "networking", label: "Networking", icon: <Network className="h-3.5 w-3.5" /> },
  { value: "other", label: "Other", icon: <Handshake className="h-3.5 w-3.5" /> },
];

const TYPE_COLORS: Record<EventType, string> = {
  reunion:    "bg-violet-100 text-violet-700 border-violet-200",
  webinar:    "bg-blue-100 text-blue-700 border-blue-200",
  workshop:   "bg-amber-100 text-amber-700 border-amber-200",
  networking: "bg-emerald-100 text-emerald-700 border-emerald-200",
  other:      "bg-slate-100 text-slate-700 border-slate-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    year: d.getFullYear(),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: EventListItem }) {
  const d = formatEventDate(event.date);
  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;
  const isPast = new Date(event.date) < new Date();

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {/* Date chip */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow-sm min-w-[52px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">{d.month}</p>
          <p className="text-lg font-bold text-slate-900 leading-none">{d.date}</p>
        </div>
{/* Ribbon — clean small version */}
<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
  <span
    className="
      absolute
      top-[10px]
      right-[-28px]
      w-[110px]
      py-1.5
      text-center
      text-[10px]
      font-bold
      uppercase
      tracking-wider
      text-white
      bg-blue-600
      rotate-45
      shadow-md
    "
  >
    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
  </span>
</div>
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">Past Event</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>{d.day}, {d.date} {d.month} {d.year} · {d.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {event.is_online ? (
              <>
                <Wifi className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Online</span>
                {event.location && <span>· {event.location}</span>}
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{event.location || "Location TBD"}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>
              {event.attendee_count} attending
              {event.max_attendees && (
                <span className="text-slate-400"> / {event.max_attendees} max</span>
              )}
            </span>
          </div>
        </div>

        {/* Host */}
        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
          <Avatar className="h-6 w-6">
            <AvatarImage src={event.host?.profile_picture ?? ""} />
            <AvatarFallback className="text-[10px]">
              {event.host?.name ? getInitials(event.host.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-500 truncate">
            Hosted by <span className="font-medium text-slate-700">{event.host?.name}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const authState = useAuthStore();
  const [role, setRole] = useState(authState.role);
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [isOnlineFilter, setIsOnlineFilter] = useState<boolean | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    setRole(authState.role);
  }, [authState.role]);

  const params = {
    ...(selectedType !== "all" && { type: selectedType }),
    ...(isOnlineFilter !== undefined && { is_online: isOnlineFilter }),
    status: statusFilter,
  };

  const LIMIT = 20;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["events", params],
    queryFn: ({ pageParam = 0 }) => getEvents({ ...params, limit: LIMIT, offset: pageParam * LIMIT }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === LIMIT ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const events = data?.pages.flatMap((page) => page) || [];

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const canCreate = role === "alumni" || role === "admin" || role === "partner";

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-blue-100 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Alumni Network
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Events</h1>
              <p className="text-slate-500 mt-2 text-[15px] max-w-lg">
                Discover reunions, webinars, workshops, and networking events hosted by the alumni community.
              </p>
            </div>
            {canCreate && (
              <Link href="/events/create">
                <Button className="gap-2 bg-white !text-blue-600 border !border-blue-600 hover:scale-103 shadow-blue-600/25 shadow-sm cursor-pointer shrink-0">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between">
          
          {/* ── UPDATED: Slider Type Filters ── */}
          <div 
            className="flex items-center gap-2 overflow-x-auto p-2 pb-1 flex-1 min-w-0 pr-4 [&::-webkit-scrollbar]:hidden" 
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`
                  inline-flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 cursor-pointer rounded-full text-[11px] font-medium transition-all duration-150 border
                  ${selectedType === t.value
                    ? "bg-white !text-blue-600 border !border-blue-600 shadow-sm scale-[1.02]"
                    : "border-slate-200 text-slate-600 hover:border-blue-600 hover:!text-blue-600 hover:scale-[1.03]"
                  }
                `}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Right-side toggles */}
          <div className="flex flex-row items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
            {/* Online/Offline */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white text-xs font-medium shrink-0">
              {(
                [
                  { label: "All", value: undefined },
                  { label: "Online", value: true },
                  { label: "In-person", value: false },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setIsOnlineFilter(opt.value)}
                  className={`px-3 py-2 transition-colors ${
                    isOnlineFilter === opt.value
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Upcoming / Past */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white text-xs font-medium shrink-0">
              {(["upcoming", "past"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 capitalize transition-colors ${
                    statusFilter === s
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
               {events.map((event) => (
                  <EventCard key={event.id} event={event} />
               ))}
            </div>
            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10 mt-8 flex items-center justify-center text-slate-500 text-sm">
              {isFetchingNextPage ? (
                <div className="flex gap-1 items-center">
                  <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
              ) : hasNextPage ? null : (
                "You've reached the end."
              )}
            </div>
          </>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
            <p className="text-slate-500">No events found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}