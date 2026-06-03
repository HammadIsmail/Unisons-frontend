"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEventById,
  getEventAttendees,
  deleteEvent,
  rsvpToEvent,
  cancelRsvp,
} from "@/lib/api/events.api";
import useAuthStore from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { RSVPStatus, EventType } from "@/types/api.types";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Wifi,
  Users,
  Pencil,
  Trash2,
  AlertTriangle,
  Video,
  Network,
  GraduationCap,
  Handshake,
  Globe,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  HelpCircle,
  Share2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  reunion: {
    label: "Reunion",
    icon: <Users className="h-3.5 w-3.5" />,
    color: "bg-white text-blue-600 border-blue-600",
  },
  webinar: {
    label: "Webinar",
    icon: <Video className="h-3.5 w-3.5" />,
    color: "bg-white text-blue-600 border-blue-600",
  },
  workshop: {
    label: "Workshop",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    color: "bg-white text-blue-600 border-blue-600",
  },
  networking: {
    label: "Networking",
    icon: <Network className="h-3.5 w-3.5" />,
    color: "bg-white text-blue-600 border-blue-600",
  },
  other: {
    label: "Other",
    icon: <Handshake className="h-3.5 w-3.5" />,
    color: "bg-white text-blue-600 border-blue-600",
  },
};
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const isPast = d < new Date();
  return {
    full: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    isPast,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border/70" />
      <Skeleton className="w-full h-64 rounded-none" />
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-32 w-full mt-6" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuthStore();
  const [profile, setProfile] = useState(authState.profile);
  const [role, setRole] = useState(authState.role);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    setProfile(authState.profile);
    setRole(authState.role);
  }, [authState.profile, authState.role]);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id),
  });

  const { data: attendees } = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: () => getEventAttendees(id),
    enabled: !!event,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push("/events");
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: RSVPStatus) => rsvpToEvent(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: () => cancelRsvp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
    },
  });

  if (isLoading) return <DetailSkeleton />;

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-surface border border-hairline flex items-center justify-center mx-auto">
            <CalendarDays className="h-7 w-7 text-ink-soft" />
          </div>
          <h2 className="text-2xl text-ink font-semibold">Event not found</h2>
          <p className="text-ink-soft text-sm">This event may have been cancelled or never existed.</p>
          <Button variant="outline" asChild className="gap-1.5">
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const typeMeta = TYPE_META[event.type] ?? TYPE_META.other;
  const dateInfo = formatDate(event.date);
  const isOwner = event.host?.id && profile?.id && String(event.host.id) === String(profile.id);
  const canRsvp = (role === "alumni" || role === "admin" || role === "partner") && !isOwner;
  const myRsvp = event.my_rsvp_status;

  return (
    <div className="min-h-screen bg-background text-ink">

      {/* Banner */}
      {event.banner_url && (
        <div className="w-full h-64 md:h-80 overflow-hidden relative">
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Hero */}
      <section className={`border-b border-hairline ${!event.banner_url ? "pt-14" : ""}`}>
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${typeMeta.color}`}>
              {typeMeta.icon}
              {typeMeta.label}
            </span>
            {event.is_online && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <Wifi className="h-3.5 w-3.5" />
                Online
              </span>
            )}
            {dateInfo.isPast && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold">
                Past Event
              </span>
            )}
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" />
              {dateInfo.full}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              {dateInfo.time}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              {event.attendee_count} attending
              {event.max_attendees && <span className="text-ink-soft/60">/ {event.max_attendees} max</span>}
            </span>
          </div>

          {/* RSVP bar */}
          {canRsvp && !dateInfo.isPast && (
            <div className="mt-8 flex items-center flex-wrap gap-3">
              {myRsvp && myRsvp !== "none" ? (
                <>
                  <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border bg-blue-100 text-blue-700 border-blue-200`}>
                    <CheckCircle2 className="h-4 w-4" />
                    {myRsvp === "attending" ? "You're attending" : "Maybe attending"}
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => cancelRsvpMutation.mutate()}
                    disabled={cancelRsvpMutation.isPending}
                  >
                    {cancelRsvpMutation.isPending ? "Cancelling…" : "Cancel RSVP"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="gap-2 bg-white !text-blue-600 !border !border-blue-600 hover:scale-103"
                    onClick={() => rsvpMutation.mutate("attending")}
                    disabled={rsvpMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {rsvpMutation.isPending ? "Saving…" : "I'm in!"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => rsvpMutation.mutate("maybe")}
                    disabled={rsvpMutation.isPending}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Maybe
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr]">

          {/* Main content */}
          <article className="space-y-12">
            {/* Description */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">About</p>
              <h2
                className="mb-5 text-3xl text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                About this event
              </h2>
              {/* Server-sanitized HTML from description field */}
              <div
                className="prose prose-slate max-w-none text-ink-soft leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>

            {/* Meeting link */}
            {event.is_online && event.meeting_link && !dateInfo.isPast && (
              <>
                <Separator className="bg-hairline" />
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">Join</p>
                  <h2
                    className="mb-4 text-2xl text-ink"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Meeting Link
                  </h2>
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Join Online Session
                  </a>
                </div>
              </>
            )}

            {/* Attendees preview */}
            {attendees && attendees.length > 0 && (
              <>
                <Separator className="bg-hairline" />
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">Attendees</p>
                  <h2
                    className="mb-5 text-2xl text-ink"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Who's coming
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {attendees.slice(0, 12).map((a) => (
                      <Link
                        key={a.id}
                        href={`/profile/${a.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-hairline bg-surface hover:border-blue-200 hover:bg-blue-50/40 transition-colors group"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={a.profile_picture ?? ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(a.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-ink group-hover:text-blue-700 transition-colors leading-tight">
                            {a.display_name}
                          </p>
                          <p className="text-[10px] text-ink-soft capitalize">{a.role}</p>
                        </div>
                      </Link>
                    ))}
                    {attendees.length > 12 && (
                      <div className="flex items-center px-3 py-2 rounded-xl border border-dashed border-hairline text-xs text-ink-soft">
                        +{attendees.length - 12} more
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-5 md:sticky md:top-24 md:self-start">
            {/* Host card */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-wider text-ink-soft mb-4">Hosted by</p>
              <Link
                href={`/profile/${event.host?.id}`}
                className="flex items-center gap-3 group w-fit"
              >
                <Avatar className="h-12 w-12 ring-2 ring-accent group-hover:ring-brand/40 transition-all">
                  <AvatarImage src={event.host?.profile_picture ?? ""} />
                  <AvatarFallback>
                    {event.host?.name ? getInitials(event.host.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p
                    className="text-base text-ink group-hover:text-brand transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {event.host?.name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    @{event.host?.username}
                    {event.host?.role && (
                      <span className="ml-1 capitalize">· {event.host.role}</span>
                    )}
                  </p>
                </div>
              </Link>
              <Button variant="outline" className="mt-4 w-full border-hairline bg-background text-ink hover:bg-secondary" asChild>
                <Link href={`/profile/${event.host?.id}`}>View profile</Link>
              </Button>
            </div>

            {/* Event details card */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-[var(--shadow-soft)] space-y-4">
              <p className="text-xs uppercase tracking-wider text-ink-soft">Event Details</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CalendarDays className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft">Date & Time</p>
                    <p className="text-sm font-medium text-ink">{dateInfo.full}</p>
                    <p className="text-xs text-ink-soft">{dateInfo.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    {event.is_online
                      ? <Wifi className="h-4 w-4 text-brand" />
                      : <MapPin className="h-4 w-4 text-brand" />
                    }
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft">{event.is_online ? "Format" : "Location"}</p>
                    <p className="text-sm font-medium text-ink">
                      {event.is_online ? "Online" : (event.location || "Location TBD")}
                    </p>
                    {event.is_online && event.location && (
                      <p className="text-xs text-ink-soft">{event.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft">Attendance</p>
                    <p className="text-sm font-medium text-ink">
                      {event.attendee_count} attending
                    </p>
                    {event.max_attendees && (
                      <p className="text-xs text-ink-soft">{event.max_attendees} capacity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="rounded-3xl border border-dashed border-hairline bg-surface-elev p-6">
                <div className="mb-4 flex items-center gap-2">
                  <p className="text-xs uppercase tracking-wider text-ink-soft">Manage Event</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-hairline bg-background gap-1.5 text-ink hover:bg-secondary"
                    asChild
                  >
                    <Link href={`/events/${id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm((c) => !c)}
                    className="border-destructive/30 bg-background gap-1.5 text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>

                {confirm && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-destructive">Cancel this event?</p>
                        <p className="text-xs text-destructive/80 mt-0.5">
                          All RSVPs will be lost. This cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 !bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90 gap-1.5"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Cancelling…" : (
                          <><Trash2 className="h-3.5 w-3.5" /> Confirm</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirm(false)}
                        className="h-8 text-destructive hover:bg-destructive/10"
                      >
                        Keep event
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-ink-soft">
          <p>© UNISON - Where graduates stay connected, grow together, and give back</p>
        </div>
      </footer>
    </div>
  );
}
