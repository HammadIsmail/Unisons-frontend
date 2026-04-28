"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/api/opportunities.api";
import { getMyNetwork } from "@/lib/api/connections.api";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Opportunity } from "@/types/api.types";
import api from "@/lib/api";
import { Connection } from "@/types/api.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorSuggestion {
  alumni_id: string;
  username: string;
  display_name: string;
  profile_picture: string | null;
  domain: string;
  company: string;
  common_skills: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
  "full-time": {
    label: "Full-time",
    icon: <Briefcase className="h-2.5 w-2.5" />,
    pill: "bg-blue-100 text-blue-800",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-2.5 w-2.5" />,
    pill: "bg-emerald-100 text-emerald-800",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-2.5 w-2.5" />,
    pill: "bg-amber-100 text-amber-800",
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
  if (!dateStr) return "No Date";
  const ts = Date.parse(dateStr);
  if (isNaN(ts)) return "Invalid Date";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="border-b border-gray-100 py-4 space-y-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-100 rounded-full w-2/5" />
          <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-[85%]" />
        <div className="h-3 bg-gray-100 rounded-full w-[70%]" />
      </div>
      <div className="h-28 bg-gray-100 rounded-xl w-full" />
    </div>
  );
}

function ConnectionsSkeleton() {
  return (
    <div className="flex gap-4 px-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-[52px] h-[52px] rounded-full bg-gray-100" />
          <div className="h-2 bg-gray-100 rounded-full w-12" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-t border-gray-50 first:border-t-0 first:pt-0"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
          </div>
          <div className="h-7 bg-gray-100 rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Copy Link Button ─────────────────────────────────────────────────────────

function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}/opportunities/${id}`;
    navigator.clipboard.writeText(url).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [id]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all px-2.5 py-1.5 rounded-lg font-medium border border-transparent hover:border-blue-100"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}

// ─── Caption with Read More ───────────────────────────────────────────────────

function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 180;
  const isTruncated = text.length > MAX;
  const display = expanded || !isTruncated ? text : text.slice(0, MAX);

  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {display}
      {isTruncated && !expanded && (
        <>
          {"... "}
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            read more
          </button>
        </>
      )}
    </p>
  );
}

// ─── Opportunity Preview Card ─────────────────────────────────────────────────

function OpportunityPreview({ opp }: { opp: Opportunity }) {
  const meta = TYPE_META[opp.type] || TYPE_META["full-time"];
  const dl = formatDeadline(opp.deadline);

  return (
    <Link href={`/opportunities/${opp.id}`} className="block mx-4 mb-1">
      <div className="border-[1.5px] border-blue-100 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-3.5 transition-all duration-200 group/preview">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug font-serif">
              {opp.title}
            </h3>
            <p className="text-blue-600 font-semibold text-xs mt-0.5">{opp.company}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${meta.pill}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
          {opp.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 text-gray-400" />
              {opp.location}
            </div>
          )}

        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {opp.is_remote && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Wifi className="h-3 w-3" />
              Remote
            </span>
          )}
          {opp.required_skills?.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-gray-600 border border-gray-200"
            >
              {s}
            </span>
          ))}
          {opp.required_skills && opp.required_skills.length > 3 && (
            <span className="text-[11px] text-gray-400 px-1.5 py-0.5">
              +{opp.required_skills.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ opp, index }: { opp: Opportunity; index: number }) {
  const dl = formatDeadline(opp.deadline);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className="border-b border-gray-100 pb-5 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Link href={`/profile/${opp.posted_by.id}`} className="flex-shrink-0">
          <Avatar className="h-11 w-11 border-2 border-blue-100">
            <AvatarImage src={opp.posted_by.profile_picture ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
              {getInitials(opp.posted_by.display_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/profile/${opp.posted_by.id}`}>
            <p className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight">
              {opp.posted_by.display_name}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wide">
              {opp.posted_by.role}
            </span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">@{opp.posted_by.username}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">{timeAgo(opp.posted_at)}</span>
          </div>
        </div>

        <CopyLinkButton id={opp.id} />
      </div>

      {/* ── Caption ── */}
      <div className="px-4 pb-3">
        <Caption text={opp.description ?? ""} />
      </div>

      {/* ── Media ── */}
      {opp.media && opp.media.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden max-h-80 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={opp.media[0]}
            alt="Opportunity media"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* ── Opportunity Preview ── */}
      <OpportunityPreview opp={opp} />

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-3 mt-1 border-t border-gray-50">
        <Link
          href={`/opportunities/${opp.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-full border border-blue-200 hover:border-blue-600 transition-all duration-200 group/btn"
        >
          View & Apply
          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-400">
          <CalendarClock className="h-3.5 w-3.5" />
          <span className={dl.urgent ? "text-red-500 font-semibold" : ""}>
            {dl.urgent ? dl.label : `Due ${dl.label}`}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Connections Strip ────────────────────────────────────────────────────────

function ConnectionsStrip({ connections }: { connections: Connection[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  if (!connections.length) return null;

  return (
    <div className="border-b border-gray-100 pb-4 overflow-hidden">
      <div className="px-0 pt-2 pb-3 flex items-baseline justify-between">
        <h2 className="text-[25px] font-bold text-gray-700">Your Connections</h2>
        <Link
          href="/connections"
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          See all
        </Link>
      </div>

      <div className="relative justify-center flex items-center my-1 px-2 pb-4">
        <button
          onClick={() => scroll("left")}
          className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto px-6 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {connections.map((conn) => (
            <Link
              key={conn.id}
              href={`/profile/${conn.id}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <Avatar className="h-[52px] w-[52px] border-2 border-blue-100 group-hover:border-blue-400 transition-colors">
                <AvatarImage src={conn.profile_picture ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                  {getInitials(conn.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-gray-500 font-medium max-w-[56px] text-center leading-tight truncate">
                @{conn.username}
              </span>
            </Link>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Make More Connections Sidebar ────────────────────────────────────────────

function MakeMoreConnections({ suggestions }: { suggestions: MentorSuggestion[] }) {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setConnected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!suggestions.length) return null;

  return (
    <div className="p-5 pr-0">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[15px] font-bold text-gray-700">Make More Connections</h2>
        <Link
          href={"/explore/people"}
          className="text-xs text-blue-600 font-semibold hover:underline"
        >
          See More
        </Link>
      </div>

      <div className="divide-y divide-gray-50 mt-7">
        {suggestions.map((person) => {
          const isConnected = connected.has(person.alumni_id);
          return (
            <div
              key={person.alumni_id}
              className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
            >
              <Link href={`/profile/${person.alumni_id}`} className="flex-shrink-0">
                <Avatar className="h-9 w-9 border border-blue-100">
                  <AvatarImage src={person.profile_picture ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xs">
                    {getInitials(person.display_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/profile/${person.alumni_id}`}>
                  <p className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight truncate">
                    {person.display_name}
                  </p>
                </Link>
                <p className="text-[11px] text-gray-400 truncate">
                  {person.company || `@${person.username}`}
                </p>
              </div>

              <button
                onClick={() => toggle(person.alumni_id)}
                className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1 ${isConnected
                    ? "text-gray-400"
                    : "text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer"
                  }`}
              >
                {!isConnected && <UserPlus className="h-3 w-3" />}
                {isConnected ? "Following" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { profile, role } = useAuthStore();
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", { page }],
    queryFn: () => getOpportunities({ page, limit: 10 }),
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["my-connections", role],
    queryFn: () => getMyNetwork(role as "alumni" | "student"),
    enabled: !!role,
  });

  // Suggestions:
  //   • Students  → GET /api/student/mentors  (returns MentorSuggestion[])
  //   • Alumni    → GET /api/alumni/batch-mates (normalised to same shape)
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<MentorSuggestion[]>({
    queryKey: ["suggestions", role],
    queryFn: async () => {
      if (role === "student") {
        const { data } = await api.get("/api/student/mentors");
        return data as MentorSuggestion[];
      }
      // Alumni: use batch-mates as sidebar suggestions
      const { data } = await api.get("/api/alumni/batch-mates");
      return (data as any[]).map((bm) => ({
        alumni_id: bm.id,
        username: bm.username,
        display_name: bm.display_name,
        profile_picture: bm.profile_picture ?? null,
        domain: "",
        company: bm.company ?? "",
        common_skills: 0,
      }));
    },
    enabled: !!role,
  });

  return (
    <div className=" mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── LEFT: Main feed ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Create Post Box — alumni only */}
          {role === "alumni" && (
            <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-100">
              <Avatar className="h-10 w-10 border-2 border-blue-100 flex-shrink-0">
                <AvatarImage src={profile?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                  {profile?.display_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href="/post-opportunity"
                className="flex-1 bg-gray-100 hover:bg-blue-50 hover:border-blue-300 border border-transparent text-sm text-gray-400 hover:text-blue-500 font-medium px-4 py-2.5 rounded-full transition-all duration-200 block"
              >
                Share an opportunity or update…
              </Link>
            </div>
          )}

          {/* Connections Strip */}
          {connectionsLoading ? (
            <div className="border-b border-gray-100 pb-4 px-4 pt-2">
              <div className="h-4 bg-gray-100 rounded-full w-36 mb-4 animate-pulse" />
              <ConnectionsSkeleton />
            </div>
          ) : (
            <ConnectionsStrip connections={connections} />
          )}

          {/* Feed */}
          <div>
            <h2 className="text-[25px] font-bold text-gray-700 px-1 mb-3">Opportunities</h2>

            {isLoading ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : data?.data?.length ? (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {data.data.map((opp: Opportunity, i: number) => (
                    <PostCard key={opp.id} opp={opp} index={i} />
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center py-16 px-6 text-center border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Briefcase className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No opportunities yet</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-[240px]">
                  Be the first to share something with the community.
                </p>
                {role === "alumni" && (
                  <Link
                    href="/post-opportunity"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-full transition-colors"
                  >
                    Post Opportunity
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar — hidden on mobile ── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
          {suggestionsLoading ? (
            <div className="p-4">
              <div className="h-4 bg-gray-100 rounded-full w-44 mb-4 animate-pulse" />
              <SidebarSkeleton />
            </div>
          ) : (
            <MakeMoreConnections suggestions={suggestions} />
          )}
        </aside>

      </div>
    </div>

  );
}
