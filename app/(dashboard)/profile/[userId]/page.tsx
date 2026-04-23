"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserPublicProfile } from "@/lib/api/profiles.api";
import { sendConnectionRequest, removeConnection, getConnectionStatus } from "@/lib/api/connections.api";
import useAuthStore from "@/store/authStore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Building2,
  CalendarDays,
  Linkedin,
  Phone,
  Tag,
  Briefcase,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  ArrowLeft,
  Activity,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const PROFICIENCY_META: Record<string, { badge: string }> = {
  expert: {
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  intermediate: {
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  beginner: { badge: "bg-muted text-muted-foreground border-border/60" },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PublicProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <Card className="border-border/60 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-600/20 to-violet-600/10" />
        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5 flex-wrap gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-48 rounded mb-2" />
          <Skeleton className="h-4 w-28 rounded mb-3" />
          <Skeleton className="h-4 w-64 rounded" />
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-20 rounded" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <h2 className="font-semibold text-foreground text-[15px]">{title}</h2>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { profile: myProfile } = useAuthStore();
  const queryClient = useQueryClient();

  // ALL hooks must come before any conditional returns
  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getUserPublicProfile(userId),
    enabled: !!userId && myProfile?.id !== userId,
    retry: 1,
  });

  // Fetch connection status separately to ensure accuracy
  const {
    data: connStatus,
    isLoading: connLoading,
  } = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: () => getConnectionStatus(userId),
    enabled: !!userId && myProfile?.id !== userId,
    retry: 1,
  });

  const connectMutation = useMutation({
    mutationFn: (type: "batchmate" | "colleague" | "mentor") =>
      sendConnectionRequest(userId, type),
    onSuccess: () => {
      toast.success("Connection request sent!");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to send request"),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeConnection(userId),
    onSuccess: () => {
      toast.success("Connection removed.");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: () => toast.error("Failed to remove connection"),
  });

  // Redirect self to /profile/me
  const isMe = myProfile?.id && userId === myProfile.id;

  if (isMe) {
    router.replace("/profile/me");
    return null;
  }

  const isLoading = profileLoading || (connLoading && !profile);

  if (error || !profile) {
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Unknown error";
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <UserX className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Profile not found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-2">
          This user may not exist or their profile is unavailable.
        </p>
        <p className="text-xs text-rose-500 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg mb-6 font-mono">
          {errMsg}
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  // Prioritize connStatus API if available, fallback to profile result
  const status = connStatus?.status ?? profile.connection_status;
  const isConnected = status === "connected";
  const isPending = status === "pending";
  const isAlumni = profile.role === "alumni";
  const p = profile as any;

  // Determine default connection type based on roles
  const defaultConnectType: "mentor" | "colleague" =
    myProfile?.role === "student" ? "mentor" : "colleague";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-2"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* ── Profile Hero ─────────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-blue-600/25 via-violet-500/10 to-transparent" />

        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5 gap-3 flex-wrap">
            {/* Avatar */}
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-md flex-shrink-0">
              <AvatarImage src={p?.profile_picture} alt={p?.display_name} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                {getInitials(p?.display_name)}
              </AvatarFallback>
            </Avatar>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Message button — only for connected users */}
              {isConnected && (
                <Link
                  href={`/chat/${userId}`}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
              )}

              {/* Connection action */}
              {isConnected ? (
                <button
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-background text-sm font-semibold text-muted-foreground hover:border-rose-400 hover:text-rose-600 active:scale-95 transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  {removeMutation.isPending ? "Removing…" : "Connected"}
                </button>
              ) : isPending ? (
                <button
                  disabled
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border/60 bg-muted text-sm font-semibold text-muted-foreground cursor-not-allowed"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </button>
              ) : (
                <button
                  onClick={() => connectMutation.mutate(defaultConnectType)}
                  disabled={connectMutation.isPending}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-sm font-semibold hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  {connectMutation.isPending ? "Sending…" : "Connect"}
                </button>
              )}
            </div>
          </div>

          {/* Name + username */}
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {p?.display_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">@{p?.username}</p>

          {/* Role badge */}
          <span
            className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              isAlumni
                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {isAlumni ? "Alumni" : "Student"}
          </span>

          {/* Work info */}
          {isAlumni && (p?.role || p?.current_company) && (
            <p className="flex items-center gap-1.5 text-sm text-foreground mt-3">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {[p.role, p.current_company].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Degree + batch */}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {[
              p?.degree,
              p?.batch,
              isAlumni
                ? `Class of ${p?.graduation_year}`
                : p?.semester
                ? `Semester ${p?.semester}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Contact row */}
          <div className="mt-3 flex flex-wrap gap-4">
            {p?.phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {p.phone}
              </span>
            )}
            {isAlumni && p?.linkedin_url && (
              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Linkedin className="h-3 w-3" />
                LinkedIn
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Skills ───────────────────────────────────────────────────────── */}
      {(p?.detailed_skills?.length > 0 || profile?.skills?.length > 0) && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader icon={<Tag className="h-3.5 w-3.5" />} title="Skills" />

            {p?.detailed_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {p.detailed_skills.map((s: any) => {
                  const meta =
                    PROFICIENCY_META[s.proficiency_level] ??
                    PROFICIENCY_META.beginner;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/40"
                    >
                      <span className="text-xs font-medium text-foreground">
                        {s.skill_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${meta.badge}`}
                      >
                        {s.proficiency_level}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1.5 rounded-full font-medium bg-muted text-foreground border border-border/60"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Work Experience — alumni only ─────────────────────────────── */}
      {isAlumni && p?.work_experience?.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Briefcase className="h-3.5 w-3.5" />}
              title="Work Experience"
            />
            <div className="space-y-3">
              {p.work_experience.map((w: any, idx: number) => (
                <div key={w.id}>
                  {idx > 0 && <Separator className="opacity-50 mb-3" />}
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {w.role}
                        </p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60 capitalize">
                          {w.employment_type}
                        </span>
                        {w.is_current && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {w.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {w.start_date
                          ? new Date(w.start_date).toLocaleDateString()
                          : "—"}{" "}
                        —{" "}
                        {w.is_current
                          ? "Present"
                          : w.end_date
                          ? new Date(w.end_date).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Opportunities Posted — alumni only ────────────────────────── */}
      {isAlumni && p?.opportunities_posted?.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Activity className="h-3.5 w-3.5" />}
              title="Opportunities Posted"
            />
            <div className="space-y-4">
              {p.opportunities_posted.map((opp: any) => (
                <div key={opp.id} className="group">
                  <Link href={`/opportunities/${opp.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">
                          {opp.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opp.company}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              opp.status === "open"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-muted text-muted-foreground border-border/40"
                            }`}
                          >
                            {opp.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-2.5 w-2.5" />
                            Posted{" "}
                            {opp.posted_at
                              ? new Date(opp.posted_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-2 flex-shrink-0" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
