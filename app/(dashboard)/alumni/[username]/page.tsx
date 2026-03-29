"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlumniByUsername, connectWithAlumni } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentConnectWithAlumni } from "@/lib/api/student.api";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  GraduationCap,
  Tag,
  Linkedin,
  UserPlus,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  UserSearch,
  ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

const CONNECTION_TYPES_ALUMNI = ["batchmate", "colleague", "mentor"] as const;
const CONNECTION_TYPES_STUDENT = ["mentor"] as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <Skeleton className="h-4 w-28 rounded" />
      <Card className="border-border/60 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600/20 to-violet-600/10" />
        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <Skeleton className="h-20 w-20 rounded-full ring-4 ring-background" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-40 rounded mb-2" />
          <Skeleton className="h-4 w-24 rounded mb-3" />
          <Skeleton className="h-4 w-56 rounded mb-1" />
          <Skeleton className="h-4 w-44 rounded" />
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
          </div>
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

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>(
    role === "student" ? "mentor" : "batchmate"
  );
  const [connected, setConnected] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: alumni, isLoading } = useQuery({
    queryKey: ["alumni", "username", username],
    queryFn: () => getAlumniByUsername(username),
    enabled: !!username,
  });

  const connectMutation = useMutation({
    mutationFn: () => {
      if (!alumni?.id) throw new Error("Alumni ID not found");
      if (role === "student") return studentConnectWithAlumni(alumni.id);
      return connectWithAlumni(alumni.id, selectedType);
    },
    onSuccess: () => {
      setConnected(true);
      setSuccessMsg("Connection request sent successfully.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || "Failed to connect. Try again.");
    },
  });

  const isOwnProfile = (profile as any)?.username === username;
  const canConnect =
    (role === "alumni" || role === "student") &&
    !isOwnProfile &&
    alumni?.role === "alumni";

  const connectionTypes =
    role === "alumni" ? CONNECTION_TYPES_ALUMNI : CONNECTION_TYPES_STUDENT;

  if (isLoading) return <ProfileSkeleton />;

  if (!alumni) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <UserSearch className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Profile not found</p>
            <p className="text-sm text-muted-foreground mb-4">
              This alumni profile doesn't exist or may have been removed.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
              <Link href="/search">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to search
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to search
      </Link>

      {/* ── Profile hero card ────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden bg-gradient-to-b from-blue-400/20 via-transparent to-transparent">
        <CardContent className="px-6 pb-6 pt-12">
          {/* Avatar row */}
          <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
            <Avatar className="h-20 w-20 ring-4 ring-blue-100 shadow-md flex-shrink-0">
              <AvatarImage src={alumni.profile_picture} alt={alumni.display_name} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                {alumni.display_name ? getInitials(alumni.display_name) : "A"}
              </AvatarFallback>
            </Avatar>
            {/* Action area */}
            <div className="flex flex-col gap-2 pb-1 flex-shrink-0">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border/60" asChild>
                  <Link href="/profile/me">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </Link>
                </Button>
              ) : canConnect ? (
                connected ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Request Sent
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {connectionTypes.length > 1 && (
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-8 w-[120px] text-xs border-border/60 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {connectionTypes.map((t) => (
                            <SelectItem key={t} value={t} className="capitalize text-xs">
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                      className="h-8 gap-1.5 cursor-pointer text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {connectMutation.isPending ? "Connecting…" : "Connect"}
                    </Button>
                  </div>
                )
              ) : null}
            </div>
          </div>

          {/* Name + handle */}
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {alumni.display_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">@{alumni.username}</p>

          <p className="text-md mt-4">{alumni.bio}</p>

          {/* Role + company */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(alumni.job_role || alumni.company) && (
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {[alumni.job_role, alumni.company].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>

          {/* Degree */}
          {(alumni.degree || alumni.graduation_year) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {[alumni.degree, alumni.graduation_year ? `Class of ${alumni.graduation_year}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}

          {/* Alerts */}
          {successMsg && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{errorMsg}</p>
            </div>
          )}

          {/* LinkedIn */}
          {alumni.linkedin_url && (
            <>
              <Separator className="my-4 opacity-60" />
              <a
                href={alumni.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn Profile
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Skills ──────────────────────────────────────────────────────── */}
      {alumni.skills?.length > 0 && (
        <Section icon={<Tag className="h-3.5 w-3.5" />} title="Skills">
          <div className="flex flex-wrap gap-2">
            {alumni.skills.map((skill: string) => (
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

    </div>
  );
}
