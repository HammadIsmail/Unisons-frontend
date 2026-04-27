"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/api/opportunities.api";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Opportunity } from "@/types/api.types";

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 animate-pulse">
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

// ─── Copy Link Button ─────────────────────────────────────────────────────────

function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}/opportunities/${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [id]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all px-2.5 py-1.5 rounded-lg font-medium"
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
      <div className="border-[1.5px] border-blue-100 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-3.5 transition-all duration-200 group/preview">
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
          <div className={`flex items-center gap-1 text-xs font-semibold ${dl.urgent ? "text-red-500" : "text-gray-500"}`}>
            <CalendarClock className="h-3 w-3" />
            {dl.label}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {opp.is_remote && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" />
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
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
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
          <div className="flex items-center gap-1.5 mt-0.5">
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
            {dl.urgent ? `${dl.label}` : `Due ${dl.label}`}
          </span>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { profile, role } = useAuthStore();
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", { page }],
    queryFn: () => getOpportunities({ page, limit: 10 }),
  });

  return (
    <div className="max-w-[600px] mx-auto px-3 py-4 space-y-4">
      {/* ── Create Post Box (alumni only) ── */}
      {role === "alumni" && (
        <div className="bg-white rounded-2xl shadow-sm p-3.5 flex items-center gap-3">
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

      {/* ── Feed ── */}
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
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Briefcase className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No opportunities yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-[240px]">
            Be the first to share something with the community.
          </p>
          <Link
            href="/post-opportunity"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-full transition-colors"
          >
            Post Opportunity
          </Link>
        </div>
      )}
    </div>
  );
}
