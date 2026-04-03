"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunityById, deleteOpportunity } from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Zap,
  Wifi,
  MapPin,
  Building2,
  CalendarClock,
  Globe,
  ExternalLink,
  FileText,
  CheckSquare,
  Tag,
  UserCircle2,
  Settings2,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// ── Type helpers ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  badge: string;
  accent: string;
  accentText: string;
}> = {
  job: {
    label: "Job",
    icon: <Briefcase className="h-4 w-4" />,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    accent: "from-blue-500 to-blue-600",
    accentText: "text-blue-600 dark:text-blue-400",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-4 w-4" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    accent: "from-emerald-500 to-teal-500",
    accentText: "text-emerald-600 dark:text-emerald-400",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-4 w-4" />,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    accent: "from-amber-500 to-orange-500",
    accentText: "text-amber-600 dark:text-amber-400",
  },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.job;
}

function formatDeadline(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("en-PK", {
    year: "numeric", month: "long", day: "numeric",
  });
  return { formatted, expired: diffDays < 0, daysLeft: diffDays };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <Skeleton className="h-4 w-32 rounded" />
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-5 w-1/2 rounded" />
          <Skeleton className="h-px w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-4/6 rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <h2 className="font-semibold text-foreground text-[15px]">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, role } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const isOwner =
    role === "admin" ||
    (opp?.posted_by?.id && opp.posted_by.id === profile?.id);

  const isExpired = opp?.deadline ? new Date(opp.deadline) < new Date() : false;

  if (isLoading) return <DetailSkeleton />;

  if (!opp) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Opportunity not found</p>
            <p className="text-sm text-muted-foreground mb-4">
              This listing may have been removed or never existed.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
              <Link href="/opportunities">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to opportunities
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = getTypeMeta(opp.type);
  const deadline = formatDeadline(opp.deadline);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Back link */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to opportunities
      </Link>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        {/* Gradient accent top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${meta.accent}`} />

        <CardContent className="p-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
              {meta.icon}
              {meta.label}
            </span>
            {opp.is_remote && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800">
                <Wifi className="h-3 w-3" />
                Remote
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                <CalendarClock className="h-3 w-3" />
                Expired
              </span>
            )}
          </div>

          {/* Title + Apply row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                {opp.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap mt-2">
                {opp.company && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {typeof opp.company === "string" ? opp.company : opp.company?.name}
                  </span>
                )}
                {opp.location && opp.location.toLowerCase() !== "none" && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {opp.location}
                  </span>
                )}
              </div>
            </div>

         
          </div>

          {/* Media */}
          {opp.media && opp.media.length > 0 && (
            <div className="mt-5">
              <div className={`grid gap-3 ${opp.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {opp.media.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                    <img
                      src={url}
                      alt={`Media ${i + 1}`}
                      className="w-full h-48 object-cover rounded-xl border border-border/60 group-hover:opacity-90 transition"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Meta row */}
          <Separator className="my-4 opacity-60" />
          <div className="flex items-center gap-5 flex-wrap text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarClock className={`h-3.5 w-3.5 ${deadline.expired ? "text-rose-500" : "text-muted-foreground"}`} />
              <span className="text-muted-foreground">Deadline:</span>
              <span className={`font-medium ${deadline.expired ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                {deadline.formatted}
                {!deadline.expired && deadline.daysLeft <= 7 && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400 text-xs">
                    ({deadline.daysLeft}d left)
                  </span>
                )}
              </span>
            </span>
            {opp.company?.website && (
              <a
                href={`https://${opp.company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {opp.company.website}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <Section icon={<FileText className="h-3.5 w-3.5" />} title="About this role">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {opp.description}
        </p>
      </Section>

      {/* ── Requirements ───────────────────────────────────────────────── */}
      <Section icon={<CheckSquare className="h-3.5 w-3.5" />} title="Requirements">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {opp.requirements}
        </p>
      </Section>

      {/* ── Skills ─────────────────────────────────────────────────────── */}
      {opp.required_skills?.length > 0 && (
        <Section icon={<Tag className="h-3.5 w-3.5" />} title="Required Skills">
          <div className="flex flex-wrap gap-2">
            {opp.required_skills.map((skill: string) => (
              <span
                key={skill}
                className="text-xs px-3 py-1.5 rounded-full font-medium bg-muted text-foreground border border-border/60 hover:bg-muted/80 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Posted by ──────────────────────────────────────────────────── */}
      <Section icon={<UserCircle2 className="h-3.5 w-3.5" />} title="Posted by">
        <Link
          href={`/alumni/${opp.posted_by?.username}`}
          className="flex items-center gap-3.5 group w-fit"
        >
          <Avatar className="w-10 h-10 ring-2 ring-border/60 group-hover:ring-blue-500/40 transition-all">
            <AvatarImage src={opp.posted_by?.profile_picture} />
            <AvatarFallback className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-sm font-bold">
              {opp.posted_by?.display_name ? getInitials(opp.posted_by.display_name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {opp.posted_by?.display_name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              @{opp.posted_by?.username}
              {opp.posted_by?.role && (
                <span className="ml-2 capitalize">{opp.posted_by.role}</span>
              )}
            </p>
          </div>
        </Link>
      </Section>

      {/* ── Owner actions ──────────────────────────────────────────────── */}
      {isOwner && (
        <Section icon={<Settings2 className="h-3.5 w-3.5" />} title="Manage">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/60"
              asChild
            >
              <Link href="/my-opportunities">
                <Pencil className="h-3.5 w-3.5" />
                Edit in My Posts
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                    Delete this opportunity?
                  </p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    This action cannot be undone. The listing will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="h-8 text-xs gap-1.5"
                >
                  {deleteMutation.isPending ? (
                    <>Deleting…</>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Yes, delete
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-8 text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Section>
      )}

    </div>
  );
}
