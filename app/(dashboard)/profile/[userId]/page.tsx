"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserPublicProfile } from "@/lib/api/profiles.api";
import {
  sendConnectionRequest, removeConnection, getConnectionStatus, cancelSentRequest,
  followUser, unfollowUser, blockUser, unblockUser, getFollowers, getFollowing
} from "@/lib/api/connections.api";
import useAuthStore from "@/store/authStore";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Folder from "@/components/Folder";
import {
  GraduationCap, Building2, CalendarDays, Linkedin, Phone, Briefcase,
  MessageCircle, UserPlus, UserCheck, UserX, Clock, ArrowLeft, Activity,
  ChevronRight, ExternalLink, Tag, Mail, MapPin, AlertTriangle, X,
  MoreHorizontal, ShieldAlert, Users, UserMinus, ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingAction =
  | { type: "cancel"; targetId: string; targetName: string }
  | { type: "disconnect"; targetId: string; targetName: string }
  | { type: "block"; targetId: string; targetName: string }
  | { type: "unblock"; targetId: string; targetName: string }
  | null;

type ProficiencyLevel = "beginner" | "intermediate" | "expert";

interface StatBox {
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open, title, description, confirmLabel,
  confirmVariant = "danger", onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const isDanger = confirmVariant === "danger";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center mb-4", isDanger ? "bg-red-50" : "bg-amber-50")}>
          <AlertTriangle className={cn("h-5 w-5", isDanger ? "text-red-500" : "text-amber-500")} />
        </div>
        <h2 className="text-[15px] font-semibold text-foreground leading-snug">{title}</h2>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium border border-border/60 text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors",
              isDanger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "U";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── FollowButton ─────────────────────────────────────────────────────────────

function FollowButton({ targetId, isFollowingInitially }: { targetId: string; isFollowingInitially?: boolean }) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(isFollowingInitially ?? false);

  const followMut = useMutation({
    mutationFn: () => followUser(targetId),
    onSuccess: () => {
      setIsFollowing(true);
      toast.success("Followed user");
      queryClient.invalidateQueries({ queryKey: ["public-profile", targetId] });
    },
  });

  const unfollowMut = useMutation({
    mutationFn: () => unfollowUser(targetId),
    onSuccess: () => {
      setIsFollowing(false);
      toast.success("Unfollowed user");
      queryClient.invalidateQueries({ queryKey: ["public-profile", targetId] });
    },
  });

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollowMut.mutate()}
        disabled={unfollowMut.isPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-border/60 font-medium hover:bg-muted text-muted-foreground transition-colors"
      >
        {unfollowMut.isPending ? "..." : "Unfollow"}
      </button>
    );
  }
  return (
    <button
      onClick={() => followMut.mutate()}
      disabled={followMut.isPending}
      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
    >
      {followMut.isPending ? "..." : "Follow"}
    </button>
  );
}

// ─── FollowsDialog ────────────────────────────────────────────────────────────

function FollowsDialog({
  open, onOpenChange, userId, type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}) {
  const { data, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: () => type === "followers" ? getFollowers(userId) : getFollowing(userId),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <h2 className="font-semibold text-foreground capitalize">{type}</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : data?.length ? (
            <div className="space-y-4">
              {data.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <Link href={`/profile/${user.id}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground leading-tight">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </Link>
                  <FollowButton targetId={user.id} isFollowingInitially={user.is_following} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No {type} found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PublicProfileSkeleton ────────────────────────────────────────────────────

function PublicProfileSkeleton() {
  return (
    <div className="w-full mx-auto animate-pulse">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="bg-background px-6 pb-6 border-b border-border/60">
        <div className="hidden sm:grid grid-cols-3 items-center pt-14 pb-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-20 rounded" />)}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-6 px-0 mt-1">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-20 rounded" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 px-4 sm:px-6 py-5">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── ProfileStatsFolder ───────────────────────────────────────────────────────

function ProfileStatsFolder({ stats, small = false }: { stats: StatBox[]; small?: boolean }) {
  const items = stats.map((stat, i) => (
    <div key={i} className="flex flex-col items-center justify-center w-full h-full">
      {stat.onClick ? (
        <button
          onClick={(e) => { e.stopPropagation(); stat.onClick!(); }}
          className="flex flex-col items-center leading-tight hover:opacity-70 transition-opacity"
        >
          <span className="font-extrabold leading-none" style={{ color: stat.color, fontSize: small ? "12px" : "14px" }}>
            {stat.value}
          </span>
          <span className="text-[7px] text-gray-500 font-semibold mt-0.5 tracking-wide uppercase">{stat.label}</span>
        </button>
      ) : (
        <div className="flex flex-col items-center leading-tight">
          <span className="font-extrabold leading-none" style={{ color: stat.color, fontSize: small ? "12px" : "14px" }}>
            {stat.value}
          </span>
          <span className="text-[7px] text-gray-500 font-semibold mt-0.5 tracking-wide uppercase">{stat.label}</span>
        </div>
      )}
    </div>
  ));

  return (
    <div className="flex flex-col items-center">
      <Folder size={0.7} color="#2563EB" items={items} />
      <span className={`font-normal text-foreground mt-1.5 ${small ? "text-[10px]" : "text-xs"}`}>View Stats</span>
    </div>
  );
}

// ─── ProfileActions ───────────────────────────────────────────────────────────
// Single component used across all three breakpoints (desktop / tablet / mobile).
// The `size` prop switches between "sm" (mobile) and "md" (tablet+desktop).

interface ProfileActionsProps {
  userId: string;
  status: string | undefined;
  p: any;
  isAlumni: boolean;
  isConnected: boolean;
  size?: "sm" | "md";
  connectionButton: React.ReactNode;
  followMut: any;
  unfollowMut: any;
  setPendingAction: (a: PendingAction) => void;
}

function ProfileActions({
  userId, status, p, isAlumni, isConnected,
  size = "md", connectionButton, followMut, unfollowMut, setPendingAction,
}: ProfileActionsProps) {
  const px = size === "sm" ? "px-3" : "px-4";
  const h = "h-9";
  const textSize = "text-sm";

  return (
    <div className={cn(
      "flex items-center gap-2 flex-wrap",
      size === "sm" ? "w-full justify-center" : "justify-end"
    )}>
      {/* LinkedIn */}
      {isAlumni && p?.linkedin_url && (
        <a
          href={p.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            `${h} w-9 rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800`,
            "flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0"
          )}
        >
          <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </a>
      )}

      {/* Message (only when connected) */}
      {isConnected && (
        <Link
          href={`/chat/${userId}`}
          className={cn(
            `${h} ${px} flex items-center gap-1.5 ${textSize} font-semibold rounded-xl`,
            size === "sm"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "border border-blue-600 bg-white text-blue-600 hover:scale-102",
            "transition-all flex-shrink-0"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Link>
      )}

      {/* Follow / Unfollow */}
      {p?.is_following ? (
        <button
          id="unfollow_btn"
          onClick={() => unfollowMut.mutate()}
          disabled={unfollowMut.isPending}
          className={cn(
            `${h} ${px} flex items-center gap-1.5 ${textSize} font-semibold rounded-xl`,
            "border border-border/60 text-muted-foreground hover:bg-muted transition-all cursor-pointer flex-shrink-0"
          )}
        >
          <UserMinus className="h-4 w-4" />
          {unfollowMut.isPending ? (size === "sm" ? "..." : "Unfollowing...") : "Unfollow"}
        </button>
      ) : (
        <button
          onClick={() => followMut.mutate()}
          id="follow_btn"
          disabled={followMut.isPending}
          className={cn(
            `${h} ${px} flex items-center gap-1.5 ${textSize} font-semibold rounded-xl`,
            "bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer flex-shrink-0"
          )}
        >
          <UserPlus className="h-4 w-4" />
          {followMut.isPending ? (size === "sm" ? "..." : "Following...") : "Follow"}
        </button>
      )}

      {/* Connect / Pending / Connected button */}
      {connectionButton}

      {/* More (Block / Unblock) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            `${h} w-9 flex items-center justify-center rounded-xl`,
            "border border-border/60 text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          )}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {status === "blocked" ? (
            <DropdownMenuItem
              className="text-amber-600 focus:text-amber-600 cursor-pointer flex items-center gap-2"
              onClick={() => setPendingAction({ type: "unblock", targetId: userId, targetName: p?.display_name })}
            >
              <ShieldCheck className="h-4 w-4" />
              Unblock User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
              onClick={() => setPendingAction({ type: "block", targetId: userId, targetName: p?.display_name })}
            >
              <ShieldAlert className="h-4 w-4" />
              Block User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Proficiency Colors ───────────────────────────────────────────────────────

const PROFICIENCY_COLORS: Record<ProficiencyLevel, string> = {
  expert: "bg-blue-600 text-white",
  intermediate: "bg-blue-100 text-blue-700 border border-blue-300",
  beginner: "bg-gray-100 text-gray-600 border border-gray-300",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { profile: myProfile } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => getUserPublicProfile(userId),
    enabled: !!userId && myProfile?.id !== userId,
    retry: 1,
  });

  const { data: connStatus, isLoading: connLoading } = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: () => getConnectionStatus(userId),
    enabled: !!userId && myProfile?.id !== userId,
    retry: 1,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const connectMutation = useMutation({
    mutationFn: () => sendConnectionRequest(userId),
    onSuccess: () => {
      toast.success("Connection request sent!");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to send request"),
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

  const cancelMutation = useMutation({
    mutationFn: () => cancelSentRequest(userId),
    onSuccess: () => {
      toast.success("Request cancelled.");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: () => toast.error("Failed to cancel request"),
  });

  const followMut = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: () => {
      toast.success("Followed user!");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
    },
    onError: () => toast.error("Failed to follow user"),
  });

  const unfollowMut = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: () => {
      toast.success("Unfollowed user");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
    },
    onError: () => toast.error("Failed to unfollow user"),
  });

  const blockMut = useMutation({
    mutationFn: () => blockUser(userId),
    onSuccess: () => {
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: () => toast.error("Failed to block user"),
  });

  const unblockMut = useMutation({
    mutationFn: () => unblockUser(userId),
    onSuccess: () => {
      toast.success("User unblocked");
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: () => toast.error("Failed to unblock user"),
  });

  // ── Local State ────────────────────────────────────────────────────────────

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [followsDialogOpen, setFollowsDialogOpen] = useState(false);
  const [followsDialogType, setFollowsDialogType] = useState<"followers" | "following">("followers");

  // ── Guards ─────────────────────────────────────────────────────────────────

  const isMe = myProfile?.id && userId === myProfile.id;
  if (isMe) { router.replace("/profile/me"); return null; }

  const isLoading = profileLoading || (connLoading && !profile);
  if (isLoading) return <PublicProfileSkeleton />;

  if (error || !profile) {
    const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Unknown error";
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 items-center justify-center mb-5">
            <UserX className="h-7 w-7 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Profile not found</h2>
          <p className="text-sm text-muted-foreground mb-4">This user may not exist or their profile is unavailable.</p>
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl mb-6 font-mono break-all">{errMsg}</p>
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived Values ─────────────────────────────────────────────────────────

  const status = connStatus?.status ?? profile.connection_status;
  const isConnected = status === "connected";
  const isPending = status === "pending";
  const isAlumni = profile.role === "alumni" || profile.role === "partner";
  const isPartner = profile.role === "partner";
  const p = profile as any;

  // ── Confirm Handler ────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "cancel") cancelMutation.mutate();
    else if (pendingAction.type === "disconnect") removeMutation.mutate();
    else if (pendingAction.type === "block") blockMut.mutate();
    else if (pendingAction.type === "unblock") unblockMut.mutate();
    setPendingAction(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const openFollowsDialog = (type: "followers" | "following") => {
    setFollowsDialogType(type);
    setFollowsDialogOpen(true);
  };

  const alumniStatBoxes: StatBox[] = [
    { label: "Followers",    value: p?.followers_count ?? 0,                                        color: "#3b82f6", onClick: () => openFollowsDialog("followers") },
    { label: "Following",    value: p?.following_count ?? 0,                                        color: "#8b5cf6", onClick: () => openFollowsDialog("following") },
    { label: "Connections",  value: p?.connections_count ?? 0,                                      color: "#10b981" },
    { label: "Opportunities", value: p?.opportunities_posted?.length ?? 0,                         color: "#f59e0b" },
    { label: "Skills",       value: p?.detailed_skills?.length ?? p?.skills?.length ?? 0,          color: "#ec4899" },
  ];

  const studentStatBoxes: StatBox[] = [
    { label: "Followers",  value: p?.followers_count ?? 0,                                         color: "#3b82f6", onClick: () => openFollowsDialog("followers") },
    { label: "Following",  value: p?.following_count ?? 0,                                         color: "#8b5cf6", onClick: () => openFollowsDialog("following") },
    { label: "Semester",   value: `Sem ${p?.semester ?? "—"}`,                                     color: "#f59e0b" },
    { label: "Skills",     value: p?.detailed_skills?.length ?? p?.skills?.length ?? 0,            color: "#ec4899" },
  ];

  const activeStats = isAlumni ? alumniStatBoxes : studentStatBoxes;

  // ── Name Block ─────────────────────────────────────────────────────────────

  const nameBlock = (mobile = false) => (
    <div className="flex flex-col items-center mt-4 text-center">
      <h1 className={`font-bold text-foreground tracking-tight ${mobile ? "text-xl" : "text-2xl"}`}>
        {p?.display_name}
      </h1>
      <p className="text-sm text-gray-400 mt-0.5">@{p?.username}</p>
      {isAlumni && !isPartner && (p?.current_role || p?.current_company) && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {[p.current_role, p.current_company].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-0.5">
        {isPartner
          ? [p?.job_title, p?.affiliation].filter(Boolean).join(" · ")
          : [profile?.degree, profile?.batch, isAlumni ? `Class of ${p?.graduation_year}` : `Semester ${p?.semester}`].filter(Boolean).join(" · ")}
      </p>
    </div>
  );

  // ── Connection Button ──────────────────────────────────────────────────────

  const connectionButton = isConnected ? (
    <button
      onClick={() => setPendingAction({ type: "disconnect", targetId: userId, targetName: p?.display_name })}
      disabled={removeMutation.isPending}
      className="h-9 px-4 flex items-center gap-1.5 text-sm font-semibold rounded-xl border border-border/60 text-muted-foreground hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
    >
      <UserCheck className="h-4 w-4" />
      {removeMutation.isPending ? "Removing…" : "Connected"}
    </button>
  ) : isPending ? (
    <button
      onClick={() => setPendingAction({ type: "cancel", targetId: userId, targetName: p?.display_name })}
      disabled={cancelMutation.isPending}
      className="h-9 px-4 flex items-center gap-1.5 text-sm font-semibold rounded-xl border border-border/60 text-muted-foreground hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
    >
      <Clock className="h-4 w-4" />
      {cancelMutation.isPending ? "Cancelling…" : "Pending"}
    </button>
  ) : (
    <button
      onClick={() => connectMutation.mutate()}
      disabled={connectMutation.isPending}
      className="h-9 px-4 flex items-center gap-1.5 text-sm font-semibold rounded-lg border border-blue-600 bg-white text-blue-600 hover:scale-102 transition-all cursor-pointer"
    >
      <UserPlus className="h-4 w-4" />
      {connectMutation.isPending ? "Sending…" : "Connect"}
    </button>
  );

  // ── Shared actions props ───────────────────────────────────────────────────

  const actionsProps = {
    userId, status, p, isAlumni, isConnected,
    connectionButton, followMut, unfollowMut, setPendingAction,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500">

      {/* ── COVER ─────────────────────────────────────────────────────────── */}
      <div className="relative h-52 sm:h-64 overflow-visible bg-gradient-to-br from-indigo-500/30 via-violet-400/20 to-purple-300/10">
        <div className="absolute inset-0 overflow-hidden">
          {p?.backDropImage && (
            <img src={p.backDropImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
            <AvatarImage src={p?.profile_picture} alt={p?.display_name} />
            <AvatarFallback className="bg-indigo-600 text-white text-3xl font-bold">
              {getInitials(p?.display_name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* ── PROFILE BAR ───────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border/60">

        {/* DESKTOP — lg and above: 3-col grid */}
        <div className="hidden lg:grid grid-cols-3 items-start px-6 pt-14 pb-3">
          <div className="flex items-center justify-start">
            <ProfileStatsFolder stats={activeStats} />
          </div>
          {nameBlock()}
          <ProfileActions {...actionsProps} size="md" />
        </div>

        {/* TABLET — sm to lg */}
        <div className="hidden sm:flex lg:hidden flex-col items-center px-6 pt-14 pb-3 gap-3">
          {nameBlock()}
          <div className="flex items-center justify-center">
            <ProfileStatsFolder stats={activeStats} />
          </div>
          <ProfileActions {...actionsProps} size="md" />
        </div>

        {/* MOBILE — below sm */}
        <div className="sm:hidden flex flex-col items-center px-4 pt-14 pb-3 gap-3">
          {nameBlock(true)}
          <div className="flex items-center justify-center">
            <ProfileStatsFolder stats={activeStats} small />
          </div>
          <ProfileActions {...actionsProps} size="sm" />
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-6 px-4 sm:px-6 mt-1">
          <button className="py-3 text-md text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400">
            Profile
          </button>
          <Link
            href="/network"
            className="py-3 text-md font-md text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
          >
            Network
          </Link>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 px-4 sm:px-6 py-5">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40">
              <h2 className="font-bold text-foreground text-sm tracking-tight">About</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {profile?.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio yet.</p>
              )}
              <div className="pt-1 space-y-2.5">
                {isAlumni && !isPartner && p?.current_company && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span>{p.current_company}</span>
                  </div>
                )}
                {isPartner && p?.affiliation && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span>{p.affiliation}</span>
                  </div>
                )}
                {isPartner && p?.job_title && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                    <span>{p.job_title}</span>
                  </div>
                )}
                {p?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {isAlumni && p?.linkedin_url && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Linkedin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate inline-flex items-center gap-1">
                      LinkedIn Profile <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
                {!isPartner && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 flex-shrink-0" />
                    <span>{[profile?.degree, profile?.batch].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {!isAlumni && p?.semester && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 flex-shrink-0" />
                    <span>Semester {p.semester}</span>
                  </div>
                )}
                {isAlumni && !isPartner && p?.graduation_year && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 flex-shrink-0" />
                    <span>Class of {p.graduation_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN CONTENT ────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* Skills */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
                  <span className="text-muted-foreground"><Tag className="h-4 w-4" /></span>
                  Skills
                </h2>
                {p?.detailed_skills?.length > 0 && (
                  <span className="text-xs text-muted-foreground font-medium">{p.detailed_skills.length} listed</span>
                )}
              </div>
              <div className="p-5">
                {p?.detailed_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {p.detailed_skills.map((s: { id: string; skill_name?: string; name?: string; skill?: string; proficiency_level: ProficiencyLevel }) => (
                      <div
                        key={s.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 pl-3 pr-3 py-1.5 rounded-t-full rounded-tr-full rounded-br-full rounded-bl-none border text-xs font-semibold transition-all",
                          PROFICIENCY_COLORS[s.proficiency_level] ?? PROFICIENCY_COLORS.beginner
                        )}
                      >
                        <span>{s.skill_name || s.name || s.skill}</span>
                      </div>
                    ))}
                  </div>
                ) : profile?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills?.map((s: any) => (
                      <span key={s.id} className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border/60">
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-3 text-center">
                    <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No skills added yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">This user hasn't listed any skills.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Experience */}
          {isAlumni && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
                  <span className="text-muted-foreground"><Briefcase className="h-4 w-4" /></span>
                  Work Experience
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  {p.work_experience.length} {p.work_experience.length === 1 ? "role" : "roles"}
                </span>
              </div>
              <div className="p-3">
                {p?.work_experience?.length > 0 ? (
                  <div className="space-y-4">
                    {p.work_experience.map((w: any, idx: number) => (
                      <div key={w.id}>
                        {idx > 0 && <Separator className="opacity-40 mb-4" />}
                        <div className="flex gap-3 items-start">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900">
                            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-foreground">{w.role}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60 capitalize">
                                {w.employment_type}
                              </span>
                              {w.is_current && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{w.company_name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No work experience added</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">This alumni hasn't added any experience yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opportunities Posted */}
          {isAlumni && p?.opportunities_posted?.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
                  <span className="text-muted-foreground"><Activity className="h-4 w-4" /></span>
                  Opportunities Posted
                </h2>
                <span className="text-xs text-muted-foreground font-medium">{p.opportunities_posted.length} total</span>
              </div>
              <div className="p-5 space-y-3">
                {p.opportunities_posted.map((opp: any) => (
                  <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                    <div className="flex items-start justify-between p-3 rounded-xl border border-border/40 hover:border-blue-600 dark:hover:border-indigo-800 hover:bg-blue-50/30 dark:hover:bg-indigo-950/20 transition-all group">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">{opp.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.company}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                            opp.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-muted text-muted-foreground border-border/40"
                          )}>
                            {opp.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-2.5 w-2.5" />
                            {opp.posted_at
                              ? new Date(opp.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors ml-2 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!p?.detailed_skills?.length &&
            !profile?.skills?.length &&
            !(isAlumni && p?.work_experience?.length) &&
            !(isAlumni && p?.opportunities_posted?.length) && (
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-12 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mb-4">
                  <UserX className="h-6 w-6 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Nothing to show yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">This user hasn't added any details yet.</p>
              </div>
            )}
        </div>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "disconnect" ? `Disconnect from ${pendingAction.targetName}?`
            : pendingAction?.type === "cancel" ? `Cancel request to ${pendingAction?.targetName}?`
            : pendingAction?.type === "block" ? `Block ${pendingAction?.targetName}?`
            : `Unblock ${pendingAction?.targetName}?`
        }
        description={
          pendingAction?.type === "disconnect"
            ? `You will be removed from ${pendingAction.targetName}'s connections. You can always reconnect later.`
            : pendingAction?.type === "cancel"
            ? `Your pending connection request to ${pendingAction?.targetName} will be withdrawn.`
            : pendingAction?.type === "block"
            ? `You will no longer be connected with ${pendingAction?.targetName} and they won't be able to contact you.`
            : `You will unblock ${pendingAction?.targetName}. Note: this does not restore your previous connection status.`
        }
        confirmLabel={
          pendingAction?.type === "disconnect" ? "Disconnect"
            : pendingAction?.type === "cancel" ? "Cancel Request"
            : pendingAction?.type === "block" ? "Block"
            : "Unblock"
        }
        confirmVariant={
          (pendingAction?.type === "disconnect" || pendingAction?.type === "block") ? "danger" : "warning"
        }
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      <FollowsDialog
        open={followsDialogOpen}
        onOpenChange={setFollowsDialogOpen}
        userId={userId}
        type={followsDialogType}
      />
    </div>
  );
}
