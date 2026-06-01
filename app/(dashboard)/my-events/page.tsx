"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyEvents } from "@/lib/api/events.api";
import { EventListItem } from "@/types/api.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import {
  CalendarDays, CalendarCheck, MapPin, Wifi,
  Users, Plus, Clock, Video, Network,
  GraduationCap, Handshake, Globe,
} from "lucide-react";
import { EventType } from "@/types/api.types";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<EventType, string> = {
  reunion: "bg-violet-100 text-violet-700 border-violet-200",
  webinar: "bg-blue-100 text-blue-700 border-blue-200",
  workshop: "bg-amber-100 text-amber-700 border-amber-200",
  networking: "bg-emerald-100 text-emerald-700 border-emerald-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    year: d.getFullYear(),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    isPast: d < new Date(),
  };
}

function useClientInfiniteScroll<T>(items: T[] | undefined, limit = 8) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(limit);
  }, [items, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items && visibleCount < items.length) {
          setVisibleCount((c) => c + limit);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [items, visibleCount, limit]);

  return {
    visibleItems: items?.slice(0, visibleCount) ?? [],
    observerTarget,
    hasMore: items ? visibleCount < items.length : false,
  };
}

// ── Event Card ─────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: EventListItem }) {
  const d = formatEventDate(event.date);
  const typeColor = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="h-10 w-10 text-slate-300" />
          </div>
        )}
        {/* Date chip */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm rounded-xl px-2 py-1.5 text-center shadow-sm min-w-[48px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">{d.month}</p>
          <p className="text-base font-bold text-slate-900 leading-none">{d.date}</p>
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
        {d.isPast && (
          <div className="absolute inset-0 bg-black/35 flex items-end justify-start p-2.5">
            <span className="text-white text-[10px] font-semibold bg-black/50 px-2 py-0.5 rounded-full">Past</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {event.title}
        </h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>{d.day}, {d.date} {d.month} · {d.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {event.is_online
              ? <><Wifi className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" /><span className="text-emerald-600 font-medium">Online</span></>
              : <><MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /><span className="truncate">{event.location || "TBD"}</span></>
            }
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span>{event.attendee_count} attending{event.max_attendees && <span className="text-slate-400"> / {event.max_attendees}</span>}</span>
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
          <Avatar className="h-6 w-6">
            <AvatarImage src={event.host?.profile_picture ?? ""} />
            <AvatarFallback className="text-[10px]">{event.host?.name ? getInitials(event.host.name) : "?"}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-500 truncate">
            by <span className="font-medium text-slate-700">{event.host?.name}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyEventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["my-events"],
    queryFn: getMyEvents,
  });

  const upcoming = useMemo(() => events?.filter((e) => new Date(e.date) >= new Date()) ?? [], [events]);
  const past = useMemo(() => events?.filter((e) => new Date(e.date) < new Date()) ?? [], [events]);

  const { visibleItems: visibleUpcoming, observerTarget: upcomingObserver, hasMore: upcomingHasMore } = useClientInfiniteScroll(upcoming);
  const { visibleItems: visiblePast, observerTarget: pastObserver, hasMore: pastHasMore } = useClientInfiniteScroll(past);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-blue-100 mb-4">
                <CalendarCheck className="h-3 w-3" />
                My Activity
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">My Events</h1>
              <p className="text-slate-500 mt-2 text-[15px]">
                Events you're hosting or have RSVP'd to.
              </p>
            </div>
            <Link href="/events/create">
              <Button className="gap-2 bg-white border !border-blue-600 hover:scale-103 cursor-pointer !text-blue-600 shadow-md font-normal shrink-0">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          {!isLoading && events && (
            <div className="flex gap-6 mt-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-2xl font-bold text-slate-900">{events.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total events</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Upcoming</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-400">{past.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Past</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events && events.length > 0 ? (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Upcoming</h2>
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{upcoming.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {visibleUpcoming.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
                <div ref={upcomingObserver} className="h-10 flex items-center justify-center mt-4">
                  {upcomingHasMore && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Past Events</h2>
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">{past.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 opacity-75">
                  {visiblePast.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
                <div ref={pastObserver} className="h-10 flex items-center justify-center mt-4">
                  {pastHasMore && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
              <CalendarCheck className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No events yet</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-5">
              Create an event or RSVP to upcoming events to see them here.
            </p>
            <div className="flex gap-3">
              <Link href="/events/create">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" />Create Event
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="gap-2 border-slate-200">
                  Browse Events
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
