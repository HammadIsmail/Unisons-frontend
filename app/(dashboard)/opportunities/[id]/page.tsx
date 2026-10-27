"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOpportunityById,
  deleteOpportunity,
  getOpportunityComments,
  addOpportunityComment,
  deleteOpportunityComment,
  replyOpportunityComment,
  deleteOpportunityReply,
} from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  Pencil,
  Share2,
  Sparkles,
  Trash2,
  Wifi,
  Bookmark,
  Zap,
  AlertTriangle,
  MessageSquare,
  Send,
  Maximize2,
  Loader2,
  Image as ImageIcon,
  CornerDownRight,
} from "lucide-react";

// ── Type helpers ──────────────────────────────────────────────────────────────

const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  job: { label: "Full-time", icon: <Briefcase className="h-3 w-3" /> },
  internship: { label: "Internship", icon: <GraduationCap className="h-3 w-3" /> },
  freelance: { label: "Freelance", icon: <Zap className="h-3 w-3" /> },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.job;
}

function formatDeadline(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return { formatted, expired: diffDays < 0, daysLeft: diffDays };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-hairline" />
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-10 space-y-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-16 w-3/4 rounded" />
            <Skeleton className="h-5 w-1/2 rounded" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, role } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_opportunities");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSaved(parsed.includes(id));
        }
      }
    } catch (e) {
      console.error("Failed to load saved state from localStorage:", e);
    }
  }, [id]);

  const toggleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      try {
        const stored = localStorage.getItem("saved_opportunities");
        let parsed: string[] = [];
        if (stored) {
          const parsedVal = JSON.parse(stored);
          if (Array.isArray(parsedVal)) {
            parsed = parsedVal;
          }
        }
        if (next) {
          if (!parsed.includes(id)) {
            parsed.push(id);
          }
        } else {
          parsed = parsed.filter((item) => item !== id);
        }
        localStorage.setItem("saved_opportunities", JSON.stringify(parsed));
      } catch (e) {
        console.error("Failed to save opportunity to localStorage:", e);
      }
      return next;
    });
  };



  const { data: opp, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => getOpportunityById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Opportunity deleted successfully");
      router.push("/opportunities");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete opportunity");
    },
  });

  const posterId = opp?.posted_by?.id || (opp?.posted_by as any)?._id || (opp?.posted_by as any)?.userId;
  const profileId = profile?.id || (profile as any)?._id || (profile as any)?.userId;
  const isOwner = isMounted && Boolean(posterId && profileId && String(posterId) === String(profileId));

  const isExpired = opp?.deadline ? new Date(opp.deadline) < new Date() : false;

  const [commentText, setCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["opportunity-comments", id],
    queryFn: () => getOpportunityComments(id),
    enabled: Boolean(id),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addOpportunityComment(id, content),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["opportunity-comments", id] });
      toast.success("Question / comment posted!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to post comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteOpportunityComment(id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-comments", id] });
      toast.success("Comment removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete comment");
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      replyOpportunityComment(id, commentId, content),
    onSuccess: () => {
      setReplyingToCommentId(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["opportunity-comments", id] });
      toast.success("Reply posted!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to post reply");
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentId, replyId }: { commentId: string; replyId: string }) =>
      deleteOpportunityReply(id, commentId, replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-comments", id] });
      toast.success("Reply removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete reply");
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  if (isLoading) return <DetailSkeleton />;

  if (!opp) {
    return (
      <div className="min-h-screen bg-background text-ink flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-surface border border-hairline flex items-center justify-center mx-auto">
            <Briefcase className="h-7 w-7 text-ink-soft" />
          </div>
          <h2
            className="text-2xl text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Opportunity not found
          </h2>
          <p className="text-ink-soft text-sm">
            This listing may have been removed or never existed.
          </p>
          <Button
            variant="outline"
            className="border-hairline bg-background text-ink hover:bg-secondary gap-1.5"
            asChild
          >
            <Link href="/opportunities">
              <ArrowLeft className="h-4 w-4" />
              Back to opportunities
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const meta = getTypeMeta(opp.type);
  const deadline = formatDeadline(opp.deadline);
  const companyName =
    typeof opp.company === "string" ? opp.company : opp.company?.name;
  const companyWebsite =
    typeof opp.company === "object" ? opp.company?.website : undefined;

  const mediaList: string[] = (() => {
    if (!opp?.media) return [];
    if (Array.isArray(opp.media)) {
      return opp.media.filter((m) => typeof m === "string" && m.trim().length > 0);
    }
    if (typeof opp.media === "string") {
      try {
        const parsed = JSON.parse(opp.media);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => typeof m === "string" && m.trim().length > 0);
        }
      } catch {}
      return [opp.media];
    }
    return [];
  })();

  const handleApply = () => {
    if (!opp?.apply_link) {
      toast.error("No application link provided for this listing.");
      return;
    }
    const raw = opp.apply_link.trim();
    const url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-ink">

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/opportunities"
            className="group inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            All opportunities
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-ink-soft hover:text-ink"
              onClick={toggleSave}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-ink text-ink" : ""}`} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-ink-soft hover:text-ink">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-10">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              {/* Badges */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-ink text-brand-foreground gap-1.5 px-3 py-1 text-xs font-medium tracking-wide uppercase">
                  {meta.icon}
                  {meta.label}
                </Badge>
                {opp.is_remote && (
                  <Badge
                    variant="outline"
                    className="border-hairline bg-surface text-ink gap-1.5 px-3 py-1 text-xs"
                  >
                    <Wifi className="h-3 w-3" />
                    Remote-friendly
                  </Badge>
                )}
                {isExpired && (
                  <Badge
                    variant="outline"
                    className="border-hairline bg-surface text-destructive gap-1.5 px-3 py-1 text-xs"
                  >
                    <CalendarClock className="h-3 w-3" />
                    Expired
                  </Badge>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1
                  className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl md:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {opp.title}
                </h1>
                {companyName && (
                  <p className="text-base font-semibold text-brand sm:text-lg">
                    at {companyName}
                  </p>
                )}
              </div>

              {/* Meta row */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
                {opp.location && opp.location.toLowerCase() !== "none" && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand" />
                    {opp.location}
                  </span>
                )}
                {opp.posted_at && (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand" />
                    {opp.posted_at}
                  </span>
                )}
              </div>
            </div>

            {/* Hero image */}
            {mediaList.length > 0 && (
              <div className="relative">
                <div 
                  onClick={() => window.open(mediaList[0], "_blank", "noopener,noreferrer")}
                  className="overflow-hidden rounded-3xl border border-hairline shadow-[var(--shadow-lift)] bg-surface cursor-pointer group"
                >
                  <img
                    src={mediaList[0]}
                    alt={`${opp.title} poster`}
                    className="h-64 w-full object-contain md:h-80 group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="p-2 text-center bg-surface/90 border-t border-hairline text-xs font-medium text-ink-soft flex items-center justify-center gap-1.5 group-hover:text-brand transition-colors">
                    <Maximize2 className="h-3 w-3" />
                    Click to view full poster
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA bar */}
          <div className="mt-12 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-[var(--shadow-soft)] md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <CalendarClock className={`h-5 w-5 ${isExpired ? "text-destructive" : "text-brand"}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-soft">
                  {isExpired ? "Deadline passed" : "Apply before"}
                </p>
                <p className="text-base font-medium text-ink">
                  {deadline.formatted}
                  {!deadline.expired && (
                    <span className="text-brand">
                      {" "}· {deadline.daysLeft} days left
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!isExpired && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleApply}
                  className="gap-1.5 bg-white !text-blue-600 border cursor-pointer !border-blue-600 hover:scale-102 shadow-md transition-all"
                >
                  Apply now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr]">

          {/* Main */}
          <article className="space-y-14">

            {/* About */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">
                01 — Overview
              </p>
              <h2
                className="mb-5 text-3xl text-ink md:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                About this role
              </h2>
              <p className="text-lg leading-relaxed text-ink-soft whitespace-pre-wrap">
                {opp.description}
              </p>
            </div>

            <Separator className="bg-hairline" />

            {/* Requirements */}
            {opp.requirements && (
              <>
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">
                    02 — Requirements
                  </p>
                  <h2
                    className="mb-5 text-3xl text-ink md:text-4xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    What we're looking for
                  </h2>
                  <p className="text-lg leading-relaxed text-ink-soft whitespace-pre-wrap">
                    {opp.requirements}
                  </p>
                </div>
                <Separator className="bg-hairline" />
              </>
            )}

            {/* Skills */}
            {opp.required_skills?.length > 0 && (
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">
                  {opp.requirements ? "03" : "02"} — Toolkit
                </p>
                <h2
                  className="mb-6 text-3xl text-ink md:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Skills we're hoping for
                </h2>
                <div className="flex flex-wrap gap-2">
                  {opp.required_skills.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full cursor-pointer border border-hairline bg-surface px-4 py-2 text-sm text-ink transition-all hover:scale-106 hover:text-blue-600 hover:border-blue-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Poster section in main body */}
            {mediaList.length > 0 && (
              <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ink">Official Opportunity Poster</h3>
                      <p className="text-xs text-ink-soft">Uploaded job flyer & advertisement document</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(mediaList[0], "_blank", "noopener,noreferrer")}
                    className="gap-1.5 text-xs border-hairline hover:bg-secondary cursor-pointer"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    View Full Size
                  </Button>
                </div>
                <div 
                  onClick={() => window.open(mediaList[0], "_blank", "noopener,noreferrer")}
                  className="overflow-hidden rounded-2xl border border-hairline bg-black/[0.02] flex items-center justify-center cursor-pointer group p-2"
                >
                  <img
                    src={mediaList[0]}
                    alt={`${opp.title} poster`}
                    className="max-h-[520px] w-full object-contain rounded-xl group-hover:scale-[1.01] transition-transform duration-200"
                  />
                </div>
              </div>
            )}

            {/* Questions & Comments Section */}
            <Separator className="bg-hairline" />

            <div>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-brand">
                    Discussion
                  </p>
                  <h2
                    className="text-3xl text-ink md:text-4xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Questions & Comments
                  </h2>
                  <p className="text-sm text-ink-soft mt-1">
                    Have questions about this role? Ask the hiring poster or connect with other applicants.
                  </p>
                </div>
                <Badge variant="outline" className="border-hairline gap-1.5 px-3 py-1 text-xs w-fit">
                  <MessageSquare className="h-3.5 w-3.5 text-brand" />
                  {comments?.length ?? 0} {comments?.length === 1 ? "Question" : "Questions"}
                </Badge>
              </div>

              {/* Comment input form */}
              <form onSubmit={handlePostComment} className="mb-8 space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={profile?.profile_picture} alt={profile?.display_name || "User"} />
                    <AvatarFallback>{profile?.display_name ? getInitials(profile.display_name) : "ME"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ask a question about requirements, team, salary, interview process..."
                      className="min-h-[90px] rounded-2xl border-hairline bg-surface text-ink resize-none focus-visible:ring-brand"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4 cursor-pointer"
                      >
                        {addCommentMutation.isPending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Post Question
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-hairline bg-surface p-4 transition-all hover:border-hairline/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.profile_picture} alt={comment.display_name} />
                            <AvatarFallback className="text-[10px]">
                              {comment.display_name ? getInitials(comment.display_name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-ink">{comment.display_name}</span>
                              {comment.role && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 border border-blue-200">
                                  {comment.role}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-soft">
                              @{comment.username} · {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>

                        {(profileId && (String(profileId) === String(comment.userId) || isOwner)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="h-8 w-8 p-0 text-ink-soft hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap pl-11">
                        {comment.content}
                      </p>

                      {/* Reply button action */}
                      <div className="pl-11 flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (replyingToCommentId === comment.id) {
                              setReplyingToCommentId(null);
                              setReplyText("");
                            } else {
                              setReplyingToCommentId(comment.id);
                              setReplyText("");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline cursor-pointer"
                        >
                          <CornerDownRight className="h-3.5 w-3.5" />
                          {replyingToCommentId === comment.id ? "Cancel reply" : "Reply"}
                        </button>
                      </div>

                      {/* Inline Reply Form */}
                      {replyingToCommentId === comment.id && (
                        <div className="pl-11 pt-2">
                          <div className="flex gap-2.5 items-start">
                            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                              <AvatarImage src={profile?.profile_picture} alt={profile?.display_name || "User"} />
                              <AvatarFallback className="text-[10px]">{profile?.display_name ? getInitials(profile.display_name) : "ME"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to @${comment.username}...`}
                                className="min-h-[70px] rounded-xl border-hairline bg-background text-ink text-xs resize-none focus-visible:ring-brand"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingToCommentId(null);
                                    setReplyText("");
                                  }}
                                  className="h-7 px-3 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!replyText.trim() || replyMutation.isPending}
                                  onClick={() => replyMutation.mutate({ commentId: comment.id, content: replyText.trim() })}
                                  className="h-7 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                >
                                  {replyMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Replying...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3" />
                                      Send Reply
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-11 pt-3 space-y-2.5 border-t border-hairline/60 mt-2">
                          {comment.replies.map((reply: any) => {
                            const isReplyAuthorPoster = Boolean(posterId && reply.userId && String(posterId) === String(reply.userId));
                            const canDeleteReply = Boolean(profileId && (String(profileId) === String(reply.userId) || String(profileId) === String(comment.userId) || isOwner));

                            return (
                              <div key={reply.id} className="rounded-xl border border-hairline/70 bg-background/50 p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={reply.profile_picture} alt={reply.display_name} />
                                      <AvatarFallback className="text-[9px]">
                                        {reply.display_name ? getInitials(reply.display_name) : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-ink">{reply.display_name}</span>
                                      {isReplyAuthorPoster && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                                          Author
                                        </span>
                                      )}
                                      {reply.role && !isReplyAuthorPoster && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 border border-blue-200">
                                          {reply.role}
                                        </span>
                                      )}
                                      <span className="text-[11px] text-ink-soft">
                                        @{reply.username} · {new Date(reply.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  </div>
                                  {canDeleteReply && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteReplyMutation.mutate({ commentId: comment.id, replyId: reply.id })}
                                      disabled={deleteReplyMutation.isPending}
                                      className="h-6 w-6 p-0 text-ink-soft hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap pl-8">
                                  {reply.content}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-hairline p-8 text-center bg-surface/50">
                    <MessageSquare className="h-8 w-8 text-ink-soft mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-ink">No questions asked yet</p>
                    <p className="text-xs text-ink-soft mt-1">
                      Have questions about requirements or the application? Be the first to ask!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6 md:sticky md:top-24 md:self-start">

            {/* Company card */}
            <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent">
                  <Building2 className="h-6 w-6 text-ink-soft" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-ink-soft">Company</p>
                  <h3
                    className="mt-1 text-xl text-ink"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {companyName}
                  </h3>
                  {companyWebsite && (
                    <a
                      href={`https://${companyWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-brand hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {companyWebsite}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Posted by */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-wider text-ink-soft">Posted by</p>
              <Link
                href={`/profile/${opp.posted_by?.id}`}
                className="mt-4 flex items-center gap-4 group w-fit"
              >
                <Avatar className="h-14 w-14 ring-2 ring-accent group-hover:ring-brand/40 transition-all">
                  <AvatarImage
                    src={opp.posted_by?.profile_picture}
                    alt={opp.posted_by?.display_name}
                  />
                  <AvatarFallback>
                    {opp.posted_by?.display_name
                      ? getInitials(opp.posted_by.display_name)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p
                    className="text-lg text-ink group-hover:text-brand transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {opp.posted_by?.display_name}
                  </p>
                  <p className="text-sm text-ink-soft">
                    @{opp.posted_by?.username}
                    {opp.posted_by?.role && (
                      <span className="ml-1 capitalize">· {opp.posted_by.role}</span>
                    )}
                  </p>
                </div>
              </Link>
              <Button
                variant="outline"
                className="mt-5 w-full border-hairline bg-background text-ink hover:bg-secondary"
                asChild
              >
                <Link href={`/profile/${opp.posted_by?.id}`}>View profile</Link>
              </Button>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="rounded-3xl border border-dashed border-hairline bg-surface-elev p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-ink-soft" />
                  <p className="text-xs uppercase tracking-wider text-ink-soft">
                    Manage listing
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-hairline bg-background gap-1.5 text-ink hover:bg-secondary"
                    asChild
                  >
                    <Link href={`/opportunities/${id}/edit`}>
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
                    Delete
                  </Button>
                </div>

                {confirm && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-destructive">
                          Delete this opportunity?
                        </p>
                        <p className="text-xs text-destructive/80 mt-0.5">
                          This will permanently remove the listing.
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
                        {deleteMutation.isPending ? (
                          "Deleting…"
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            Confirm delete
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirm(false)}
                        className="h-8 text-destructive hover:bg-destructive/10"
                      >
                        Cancel
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
