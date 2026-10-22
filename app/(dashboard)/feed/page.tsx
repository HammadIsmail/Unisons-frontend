"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/api/feed.api";
import { getMyNetwork } from "@/lib/api/connections.api";
import { getProfileSuggestions, UserSuggestion } from "@/lib/api/profiles.api";
import { getSkillTrends } from "@/lib/api/network.api";
import useAuthStore from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  CalendarClock,
  Wifi,
  Copy,
  Check,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Zap,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Bell,
  Search,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  TrendingUp,
  Image as ImageIcon,
  Smile,
  Sparkles,
  Home,
  Users,
  Compass,
  Megaphone,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { FeedItem, Connection, SkillTrends } from "@/types/api.types";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; pillClass: string }> = {
  job: {
    label: "Job",
    icon: <Briefcase className="h-3 w-3" />,
    pillClass: "bg-primary/10 text-primary ring-1 ring-primary/20",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-3 w-3" />,
    pillClass: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-3 w-3" />,
    pillClass: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  },
};


function formatDeadline(iso: string) {
  const d = new Date(iso);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff < 0) return { label: "Expired", urgent: true };
  if (diff <= 3) return { label: diff === 0 ? "Today!" : `${diff}d left`, urgent: true };
  return { label, urgent: false };
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const ts = Date.parse(dateStr);
  if (isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft animate-pulse">
      <div className="p-5 space-y-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-full bg-secondary flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-secondary rounded-full w-2/5" />
            <div className="h-2.5 bg-secondary rounded-full w-3/5" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-secondary rounded-full w-full" />
          <div className="h-3 bg-secondary rounded-full w-[85%]" />
        </div>
        <div className="h-28 bg-secondary rounded-2xl w-full" />
      </div>
    </div>
  );
}

function ConnectionsSkeleton() {
  return (
    <div className="flex gap-4 py-1 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="h-14 w-14 rounded-full bg-secondary" />
          <div className="h-2 bg-secondary rounded-full w-12" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-secondary flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-secondary rounded-full w-3/4" />
            <div className="h-2 bg-secondary rounded-full w-1/2" />
          </div>
          <div className="h-7 bg-secondary rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Copy Link Button ──────────────────────────────────────────────────────────

function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/opportunities/${id}`).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [id]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

// ─── Caption with Read More ───────────────────────────────────────────────────

function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 180;
  const truncated = text.length > MAX;
  const display = expanded || !truncated ? text : text.slice(0, MAX);

  return (
    <p className="text-[12px] sm:text-sm leading-relaxed text-foreground/90">
      {display}
      {truncated && !expanded && (
        <>
          …{" "}
          <button onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">
            read more
          </button>
        </>
      )}
    </p>
  );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────

function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  let badgeLabel = "";
  let badgeIcon: React.ReactNode = <Briefcase className="h-3 w-3" />;
  let badgeClass = "bg-primary/10 text-primary ring-1 ring-primary/20";

  if (item.type === "announcement") {
    badgeLabel = "Announcement";
    badgeIcon = <Megaphone className="h-3 w-3" />;
    badgeClass = "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  } else if (item.type === "opportunity") {
    const meta = TYPE_META[item.opportunity_type] ?? TYPE_META["job"];
    badgeLabel = meta.label;
    badgeIcon = meta.icon;
    badgeClass = meta.pillClass;
  } else if (item.type === "event") {
    badgeLabel = item.event_type ? item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1) : "Event";
    badgeIcon = <CalendarDays className="h-3 w-3" />;
    badgeClass = "bg-purple-100 text-purple-700 ring-1 ring-purple-200";
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-shadow hover:shadow-elevated"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-3 sm:px-5 pt-4 sm:pt-5">
        <Link href={`/profile/${item.author.id}`} className="flex-shrink-0">
          <Avatar className="h-7 w-7 sm:h-9 sm:w-9 ring-2 ring-primary/10">
            <AvatarImage src={item.author.profile_picture ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-xs">
              {getInitials(item.author.display_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* middle section MUST be allowed to shrink properly */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={`/profile/${item.author.id}`} className="min-w-0">
              <h4 className="truncate text-[12px] sm:text-base font-semibold hover:text-primary transition-colors">
                {item.author.display_name}
              </h4>
            </Link>

            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
              · {timeAgo(item.created_at)}
            </span>
          </div>

          <p className="truncate text-[11px] sm:text-sm text-muted-foreground">
            {item.author.role}
          </p>
        </div>

        {/* badge */}
        <span
          className={`
            flex items-center gap-1 flex-shrink-0
            rounded-full
            px-2 py-0.5 sm:px-2.5 sm:py-1
            text-[9px] sm:text-[10px]
            font-semibold
            whitespace-nowrap
            ${badgeClass}
          `}
        >
          {badgeIcon}
          <span className="">{badgeLabel}</span>
        </span>
      </div>

      {/* Caption */}
      <div className="px-5 pt-3">
        <Caption text={item.type === "announcement" ? item.description : (item.title || "")} />
      </div>

      {/* Media */}
      {item.media_url && (
        <div className="mt-4 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.media_url}
            alt="Media"
            className="aspect-[16/9] w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Item preview card */}
      {item.type !== "announcement" && (
        <div className="mx-5 mt-4 rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/40 to-transparent p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm md:text-base font-semibold">{item.title}</h3>
              {item.type === "opportunity" && <p className="text-xs md:text-sm text-muted-foreground">{item.company_name}</p>}
              {item.type === "event" && <p className="text-xs md:text-sm text-muted-foreground">{item.location || "Online"}</p>}
            </div>
            <Link
              href={item.type === "opportunity" ? `/opportunities/${item.id}` : `/events/${item.id}`}
              className="group flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] md:px-4 md:py-2 md:text-xs text-blue-600 border border-blue-600 shadow-sm transition-transform hover:scale-105"
            >
              View
              <ArrowRight className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {item.type === "opportunity" && item.location && (
              <span className="flex items-center gap-1 text-xs md:text-sm">
                <MapPin className="h-3 w-3" />
                {item.location}
              </span>
            )}
            {item.type === "opportunity" && item.is_remote && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs md:text-sm">
                <Wifi className="h-3 w-3" />
                Remote
              </span>
            )}
            {item.type === "opportunity" && (
              <span className={`flex items-center gap-1 ${formatDeadline(item.deadline).urgent ? "text-amber-600 font-medium" : ""} text-xs md:text-sm`}>
                <CalendarClock className="h-3 w-3" />
                {formatDeadline(item.deadline).urgent ? formatDeadline(item.deadline).label : `Due ${formatDeadline(item.deadline).label}`}
              </span>
            )}

            {item.type === "event" && (
              <span className="flex items-center gap-1 text-xs md:text-sm">
                <CalendarDays className="h-3 w-3" />
                {new Date(item.event_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
              </span>
            )}
            {item.type === "event" && item.is_online && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs md:text-sm">
                <Wifi className="h-3 w-3" />
                Online
              </span>
            )}
            {item.type === "event" && !item.is_online && item.location && (
              <span className="flex items-center gap-1 text-xs md:text-sm">
                <MapPin className="h-3 w-3" />
                {item.location}
              </span>
            )}
            {item.type === "event" && (
              <span className="flex items-center gap-1 text-xs md:text-sm">
                <Users className="h-3 w-3" />
                {item.attendee_count} attending
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-end border-t border-border/60 px-3 py-2">
        <CopyLinkButton id={item.id} />
      </div>
    </motion.article>
  );
}

// ─── Composer ──────────────────────────────────────────────────────────────────

function Composer({ profilePicture, displayName }: { profilePicture?: string; displayName?: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={profilePicture} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <Link
          href="/post-opportunity"
          className="h-11 flex-1 rounded-full bg-secondary/60 px-5 text-left sm:text-sm text-[11px] text-muted-foreground transition-colors hover:bg-secondary flex items-center"
        >
          Share an opportunity or update…
        </Link>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex gap-1">
          {[
            { icon: Briefcase, label: "Opportunity", color: "text-primary", href: "/post-opportunity" },
            { icon: Smile, label: "Update", color: "text-amber-600", href: "/post-opportunity" },
          ].map((b) => (
            <Link
              key={b.label}
              href={b.href}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <b.icon className={`h-4 w-4 ${b.color}`} />
              <span className="hidden sm:inline">{b.label}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/post-opportunity"
          className="rounded-full bg-white px-4 py-1.5 text-xs text-blue-600 border border-blue-600 shadow-sm transition-transform hover:scale-105"
        >
          Post
        </Link>
      </div>
    </div>
  );
}

// ─── Connections Strip ────────────────────────────────────────────────────────

function ConnectionsStrip({ connections, isLoading }: { connections: Connection[]; isLoading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Your Network</h3>
          <p className="text-xs text-muted-foreground">Stay close with people you know</p>
        </div>
        <Link href="/network/my-connections" className="text-xs font-semibold text-primary hover:underline">
          See all
        </Link>
      </div>

      {isLoading ? (
        <ConnectionsSkeleton />
      ) : connections.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No connections yet. Start building your network!</p>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex flex-1 gap-4 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {connections.map((c) => (
              <Link
                key={c.id}
                href={`/profile/${c.id}`}
                className="group flex w-20 flex-shrink-0 flex-col items-center gap-2"
              >
                <div className="rounded-full bg-gradient-to-br from-primary/60 to-primary p-[2px] transition-transform group-hover:scale-105">
                  <div className="rounded-full border-2 border-card">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14">
                      <AvatarImage src={c.profile_picture ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                        {getInitials(c.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="line-clamp-1 text-[11px] font-medium text-foreground">
                  {c.display_name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Profile Card (left sidebar) ─────────────────────────────────────────────

function ProfileCard({ profile, role }: { profile: any; role?: string | null }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
      {profile?.backDropImage ? (
        <div
          className="h-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.backDropImage})` }}
        />
      ) : (
        <div className="h-20 bg-gradient-to-r from-primary/80 to-blue-500/60" />
      )}
      <div className="-mt-10 px-5 pb-5">
        <Avatar className="h-20 w-20 border-4 border-card shadow-soft">
          <AvatarImage src={profile?.profile_picture} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-xl">
            {getInitials(profile?.display_name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="mt-3 text-base font-semibold">{profile?.display_name ?? "Your Name"}</h3>
        <h3 className="text-sm text-gray-500 mb-3">@{profile?.username ?? "Your Username"}</h3>
        <p className="text-sm text-muted-foreground">{profile?.degree ?? ""} · {profile?.batch ?? ""}</p>

        <div className={`mt-4 grid ${role === "student" ? "grid-cols-1" : "grid-cols-2"} divide-x divide-border rounded-2xl bg-secondary/40 py-3 text-center`}>
          <div>
            <div className="text-sm font-semibold">{profile?.connections_count ?? "0"}</div>
            <div className="text-[11px] text-muted-foreground">Connections</div>
          </div>
          {role !== "student" && (
            <div>
              <div className="text-sm font-semibold">{profile?.posts_count ?? "0"}</div>
              <div className="text-[11px] text-muted-foreground">Posts</div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1">
          {[
            { icon: TrendingUp, label: "Profile insights", href: "/profile/me" },
            { icon: Users, label: "Connect with others", href: "/search" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Trending Card ────────────────────────────────────────────────────────────

function TrendingSkillsCard() {
  const { data: skills, isLoading } = useQuery<SkillTrends>({
    queryKey: ["skill-trends"],
    queryFn: async () => {
      const data = await getSkillTrends();
      return data as SkillTrends;
    },
  });

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold">Trending Skills</h3>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-secondary rounded w-3/4"></div>
          <div className="h-3 bg-secondary rounded w-1/2"></div>
        </div>
      ) : skills ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">In Demand</h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.most_required_in_opportunities?.slice(0, 5).map((s) => {
                const skillName = typeof s === "string" ? s : s.skill;
                return (
                  <span key={skillName} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                    {skillName}
                  </span>
                );
              })}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top among Alumni</h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.most_common_among_alumni?.slice(0, 5).map((s) => {
                const skillName = typeof s === "string" ? s : s.skill;
                return (
                  <span key={skillName} className="px-2 py-1 bg-secondary text-foreground text-[10px] font-medium rounded-full">
                    {skillName}
                  </span>
                );
              })}
            </div>
          </div>
          {skills.gap?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Skill Gap</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.gap.slice(0, 5).map((s) => {
                  const skillName = typeof s === "string" ? s : s.skill;
                  return (
                    <span key={skillName} className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full ring-1 ring-amber-200">
                      {skillName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No trends available.</p>
      )}
    </div>
  );
}

// ─── Suggestions Sidebar ──────────────────────────────────────────────────────

function MakeMoreConnections({
  suggestions,
  isLoading,
}: {
  suggestions: UserSuggestion[];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">People you may know</h3>
          <p className="text-xs text-muted-foreground">Based on your batch &amp; skills</p>
        </div>
        <Link href="/network" className="text-xs font-semibold text-primary hover:underline">
          See more
        </Link>
      </div>

      {isLoading ? (
        <SidebarSkeleton />
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No suggestions right now.</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((p) => {
            return (
              <li key={p.id} className="flex items-center gap-3">
                <Link href={`/profile/${p.id}`} className="flex-shrink-0">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={p.profile_picture ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm">
                      {getInitials(p.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${p.id}`}>
                    <p className="truncate text-sm font-semibold hover:text-primary transition-colors">
                      {p.display_name}
                    </p>
                  </Link>
                  <p className="truncate text-[11px] text-muted-foreground">{p.role}</p>
                  {p.mutual_connections != null && (
                    <p className="truncate text-[10px] text-muted-foreground/70">
                      {p.mutual_connections} mutual connections
                    </p>
                  )}
                </div>
                <Link
                  href={`/profile/${p.id}`}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:scale-104 text-[11px] text-blue-600 border border-blue-600 shadow-sm transition-all flex-shrink-0"
                >
                  <UserPlus className="h-3 w-3" />
                  Connect
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Feed filter tabs ─────────────────────────────────────────────────────────

const FILTER_TABS = ["All", "Announcements", "Opportunities", "Events"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const TAB_TYPE_MAP: Record<FilterTab, string | undefined> = {
  All: undefined,
  Announcements: "announcement",
  Opportunities: "opportunity",
  Events: "event",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { profile, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const typeFilter = TAB_TYPE_MAP[activeTab];
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed", { type: typeFilter }],
    queryFn: ({ pageParam = 1 }) => getFeed({ page: pageParam, limit: 10, type: typeFilter }),
    getNextPageParam: (lastPage) => {
      const limit = 10;
      const totalPages = Math.ceil(lastPage.total / limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

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

  const feedItems = data?.pages.flatMap((page) => page.data) || [];

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["my-connections", role],
    queryFn: () => getMyNetwork(role as "alumni" | "student"),
    enabled: !!role,
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<UserSuggestion[]>({
    queryKey: ["suggestions"],
    queryFn: getProfileSuggestions,
    enabled: !!role,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient gradient mesh */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, hsl(var(--primary)/0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 0%, hsl(217 91% 60%/0.10) 0%, transparent 60%)",
        }}
      />

      <main className="mx-auto px-1 py-2 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">

          {/* ── LEFT sidebar ── */}
          <aside className="hidden space-y-4 lg:block">
            <ProfileCard profile={profile} role={role} />
            <TrendingSkillsCard />
          </aside>

          {/* ── CENTER feed ── */}
          <section className="w-full min-w-0 space-y-5">
            {/* Composer — alumni only */}
            {role === "alumni" && (
              <Composer profilePicture={profile?.profile_picture} displayName={profile?.display_name} />
            )}

            {/* Connections strip */}
            <ConnectionsStrip connections={connections} isLoading={connectionsLoading} />

            {/* Filter + heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
              <h2 className="text-lg font-semibold tracking-tight">Discovery Feed</h2>
              <div className="flex gap-1 rounded-full border border-border bg-card p-1 overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTER_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${activeTab === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed */}
            {isLoading ? (
              <div className="space-y-5">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : feedItems.length > 0 ? (
              <div className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {feedItems.map((item: FeedItem, i: number) => (
                    <FeedCard key={item.id} item={item} index={i} />
                  ))}
                </AnimatePresence>
                {/* Intersection Observer Target */}
                <div ref={observerTarget} className="h-10 flex items-center justify-center text-muted-foreground text-sm">
                  {isFetchingNextPage ? (
                    <div className="flex gap-1 items-center">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  ) : hasNextPage ? null : (
                    "You've reached the end."
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 px-6 text-center rounded-3xl border border-border/60 bg-card shadow-soft">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Megaphone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-bold">No items found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                  There is no activity in this feed yet.
                </p>
                {role === "alumni" && (
                  <Link
                    href="/post-opportunity"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-foreground bg-primary hover:opacity-90 px-5 py-2.5 rounded-full transition-opacity"
                  >
                    Post Opportunity
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* ── RIGHT sidebar ── */}
          <aside className="hidden space-y-4 lg:block">
            <MakeMoreConnections suggestions={suggestions} isLoading={suggestionsLoading} />
          </aside>

        </div>
      </main>
    </div>
  );
}
