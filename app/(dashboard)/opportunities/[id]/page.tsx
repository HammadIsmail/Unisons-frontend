"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunityById, deleteOpportunity } from "@/lib/api/opportunities.api";
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
  const authState = useAuthStore();
  const [profile, setProfile] = useState(authState.profile);
  const [role, setRole] = useState(authState.role);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Handle Next.js hydration for Zustand persist
  useEffect(() => {
    setProfile(authState.profile);
    setRole(authState.role);
  }, [authState.profile, authState.role]);

  const { data: opp, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => getOpportunityById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      router.push("/opportunities");
    },
  });

  const posterId = opp?.posted_by?.id || (opp?.posted_by as any)?._id;
  const isOwner = posterId && profile?.id && String(posterId) === String(profile?.id);

  const isExpired = opp?.deadline ? new Date(opp.deadline) < new Date() : false;

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
              onClick={() => setSaved((s) => !s)}
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
              <h1
                className="text-5xl leading-[1.05] tracking-tight text-ink md:text-7xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {opp.title}
                {companyName && (
                  <span className="block text-brand">at {companyName}.</span>
                )}
              </h1>

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
            {opp.media && opp.media.length > 0 && (
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-hairline shadow-[var(--shadow-lift)]">
                  <img
                    src={opp.media[0]}
                    alt={`${opp.title} media`}
                    className="h-64 w-full object-cover md:h-80"
                  />
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
                  variant="outline"
                  className="border-hairline bg-background text-ink hover:bg-secondary"
                >
                  Ask a question
                </Button>
                <Button className="gap-1.5 bg-white !text-blue-600 border cursor-pointer !border-blue-600 hover:scale-102 shadow-md transition-all">
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

            {/* Additional media */}
            {opp.media && opp.media.length > 1 && (
              <>
                <Separator className="bg-hairline" />
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand">
                    Gallery
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {opp.media.slice(1).map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <img
                          src={url}
                          alt={`Media ${i + 2}`}
                          className="w-full h-48 object-cover rounded-2xl border border-hairline group-hover:opacity-90 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
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
