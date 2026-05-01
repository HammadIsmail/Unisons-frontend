"use client";

import NetworkSection from "@/components/network/NetworkSection";
import NetworkInvitationCard from "@/components/network/NetworkInvitationCard";
import SentRequestCard from "@/components/network/SentRequestCard";
import { useNetwork } from "@/hooks/useNetwork";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  Send,
  Compass,
  Link2,
  Sparkles,
  Clock,
  MailOpen,
  AlertTriangle,
  X,
} from "lucide-react";
import useAuthStore from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";


// ─── Confirm Dialog ───────────────────────────────────────────────────────────
type PendingAction =
  | { type: "cancel"; targetId: string; targetName: string }
  | { type: "disconnect"; targetId: string; targetName: string }
  | null;

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
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const isDanger = confirmVariant === "danger";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center mb-4",
            isDanger ? "bg-red-50" : "bg-amber-50"
          )}
        >
          <AlertTriangle
            className={cn("w-5 h-5", isDanger ? "text-red-500" : "text-amber-500")}
          />
        </div>
        <h2 className="text-[15px] font-semibold text-foreground leading-snug">
          {title}
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
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

// ─── Suggestion Card ─────────────────────────────────────────────────────────
interface SuggestionCardProps {
  person: {
    id: string;
    name: string;
    username?: string;
    headline?: string;
    image?: string;
    backDropImage?: string;
  };
  index: number;
  status: "none" | "pending" | "connected";
  onConnect: () => void;
  onCancel: () => void;
  onRemove: () => void;
  isLoading: boolean;
  onRequestCancelConfirm: () => void;
  onRequestDisconnectConfirm: () => void;
}

function SuggestionCard({
  person,
  index,
  status,
  onConnect,
  onCancel,
  onRemove,
  isLoading,
  onRequestCancelConfirm,
  onRequestDisconnectConfirm,
}: SuggestionCardProps) {
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white w-full sm:w-[220px] border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:border-blue-200 hover:shadow-lg transition-all duration-200">
      {/* Backdrop */}
      <div
        className={cn(
          "h-20 flex-shrink-0 relative",
          person.backDropImage ? "bg-cover bg-center" : "bg-gradient-to-br from-slate-100 to-slate-200"
        )}
        style={
          person.backDropImage
            ? { backgroundImage: `url(${person.backDropImage})` }
            : undefined
        }
      >
        {/* Avatar */}
        <Link
          href={`/profile/${person.id}`}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[64px] h-[64px] rounded-full border-[3px] border-white bg-muted overflow-hidden flex items-center justify-center text-base font-semibold text-muted-foreground shadow-sm hover:ring-2 hover:ring-blue-400/40 transition-all"
        >
          {person.image ? (
            <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </div>

      {/* Body */}
      <div className="pt-10 pb-4 px-4 flex flex-col items-center flex-1 gap-1">
        <Link
          href={`/profile/${person.id}`}
          className="text-[14px] font-semibold text-foreground text-center leading-tight hover:text-blue-600 transition-colors line-clamp-1"
        >
          {person.name}
        </Link>

        {person.username && (
          <span className="text-[11px] text-muted-foreground/70 text-center">
            @{person.username}
          </span>
        )}

        {person.headline && (
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed line-clamp-2 mt-0.5">
            {person.headline}
          </p>
        )}

        {/* Action button */}
        <div className="w-full mt-auto pt-3">
          {status === "connected" ? (
            <button
              onClick={onRequestDisconnectConfirm}
              disabled={isLoading}
              className="w-full py-1.5 rounded-lg text-[12px] font-medium border border-border/60 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              Connected
            </button>
          ) : status === "pending" ? (
            <button
              onClick={onRequestCancelConfirm}
              disabled={isLoading}
              className="w-full py-1.5 rounded-lg text-[12px] font-medium border border-border/60 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              Pending…
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isLoading}
              className="w-full py-1.5 rounded-lg text-[12px] font-semibold bg-white border border-blue-400 text-blue-600 hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton for suggestion card ────────────────────────────────────────────
function SuggestionCardSkeleton() {
  return (
    <div className="bg-white w-full sm:w-[220px] border border-border/40 rounded-2xl overflow-hidden flex flex-col">
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="pt-10 pb-4 px-4 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-full mt-0.5" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-8 w-full rounded-lg mt-3" />
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function NetworkStatsBar({
  connectionsCount,
  pendingCount,
  invitationsCount,
}: {
  connectionsCount: number;
  pendingCount: number;
  invitationsCount: number;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-white border border-border/40 rounded-2xl w-fit">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <p className="text-[18px] font-bold text-foreground leading-none">{connectionsCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Connections</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border/50" />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <p className="text-[18px] font-bold text-foreground leading-none">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Pending</p>
        </div>
      </div>

      {invitationsCount > 0 && (
        <>
          <div className="w-px h-8 bg-border/50" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <MailOpen className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-[18px] font-bold text-foreground leading-none">{invitationsCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Invites</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────
function NetworkPageContent() {
  const { role } = useAuthStore();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "discover";

  const {
    invitations,
    invitationsLoading,
    sentRequests,
    sentRequestsLoading,
    myConnections,
    myConnectionsLoading,
    suggestions,
    suggestionsLoading,
    respondInvitation,
    isResponding,
    connect,
    isConnecting,
    cancelRequest,
    isCancelling,
    removeOldConnection,
    isRemoving,
  } = useNetwork();

  const handleConnect = (id: string) => connect({ targetId: id });

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleConfirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "cancel") cancelRequest(pendingAction.targetId);
    else if (pendingAction.type === "disconnect") removeOldConnection(pendingAction.targetId);
    setPendingAction(null);
  };

  const handleDialogCancel = () => setPendingAction(null);

  const getStatus = (personId: string): "connected" | "pending" | "none" => {
    if (
      myConnections?.some(
        (c: any) =>
          c.id === personId || c.alumni_id === personId || c.user_id === personId
      )
    )
      return "connected";
    if (sentRequests?.some((r: any) => r.target_id === personId)) return "pending";
    return "none";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Network</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Grow your professional circle and stay connected with alumni.
          </p>
        </div>

        {/* Stats bar */}
        {!myConnectionsLoading && !sentRequestsLoading && (
          <NetworkStatsBar
            connectionsCount={myConnections?.length ?? 0}
            pendingCount={sentRequests?.length ?? 0}
            invitationsCount={invitations?.length ?? 0}
          />
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        {/* ── Tab Navigation — pill buttons, left-aligned ── */}
        <TabsList className="mb-8 p-0 bg-transparent border-none shadow-none flex flex-wrap gap-2 ">
          <TabsTrigger
            value="connections"
            className={cn(
              "group h-auto py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all duration-150",
              "bg-white border-border/50 text-muted-foreground shadow-sm",
              "hover:border-blue-600 hover:text-blue-600 hover:shadow-none hover:scale-102",
              "data-[state=active]:bg-white data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 group-data-[state=active]:text-blue-600 transition-colors">
                <Users className="w-3.5 h-3.5" />
                <span>My Connections</span>
              </span>

              {myConnections && myConnections.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold 
                                bg-gray-100 text-muted-foreground
                                group-hover:bg-blue-100 group-hover:text-blue-600
                                group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600"
                >
                  {myConnections.length}
                </span>
              )}
            </span>
          </TabsTrigger>

          {role === "alumni" && (
            <TabsTrigger
              value="invitations"
              className={cn(
                "group h-auto py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all duration-150",
                "bg-white border-border/50 text-muted-foreground shadow-sm",
                "hover:border-blue-600 hover:text-blue-600 hover:shadow-none hover:scale-[1.02]",
                "data-[state=active]:bg-white data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
              )}
            >
              <span className="flex items-center gap-2">

                {/* icon + label block (same pattern as Connections) */}
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 group-data-[state=active]:text-blue-600 transition-colors">
                  <MailOpen className="w-3.5 h-3.5" />
                  <span>Invitations</span>
                </span>

                {/* badge */}
                {invitations && invitations.length > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold
        bg-gray-100 text-muted-foreground
        group-hover:bg-blue-100 group-hover:text-blue-600
        group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600"
                  >
                    {invitations.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
          )}

          <TabsTrigger
            value="sent"
            className={cn(
              "group h-auto py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all duration-150",
              "bg-white border-border/50 text-muted-foreground shadow-sm",
              "hover:border-blue-600 hover:text-blue-600 hover:shadow-none hover:scale-[1.02]",
              "data-[state=active]:bg-white data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            )}
          >
            <span className="flex items-center gap-2">

              {/* icon + label block */}
              <span className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 group-data-[state=active]:text-blue-600 transition-colors">
                <Send className="w-3.5 h-3.5" />
                <span>Sent</span>
              </span>

              {/* badge */}
              {sentRequests && sentRequests.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold
        bg-gray-100 text-muted-foreground
        group-hover:bg-blue-100 group-hover:text-blue-600
        group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600"
                >
                  {sentRequests.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="discover"
            className={cn(
              "group h-auto py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all duration-150",
              "bg-white border-border/50 text-muted-foreground shadow-sm",
              "hover:border-blue-600 hover:text-blue-600 hover:shadow-none hover:scale-[1.02]",
              "data-[state=active]:bg-white data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
            )}
          >
            <span className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 group-data-[state=active]:text-blue-600 transition-colors">
              <Compass className="w-3.5 h-3.5" />
              <span>Discover</span>
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── My Connections ── */}
        <TabsContent value="connections" className="m-0 focus-visible:outline-none focus-visible:ring-0 pt-8">
          <div className="mb-4 sm:pt-10">
            <h2 className="text-2xl font-bold text-foreground">My connections</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              People you're connected with
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {myConnectionsLoading ? (
              [1, 2, 3, 4, 5].map((i) => <SuggestionCardSkeleton key={i} />)
            ) : myConnections && myConnections.length > 0 ? (
              myConnections.map((conn: any, index: number) => (
                <SuggestionCard
                  key={conn.id}
                  person={{
                    id: conn.id,
                    name: conn.display_name,
                    username: conn.username,
                    headline: conn.bio || conn.role || conn.company || (role === "alumni" ? "Alumni" : "Student"),
                    image: conn.profile_picture,
                    backDropImage: conn.backDropImage,
                  }}
                  index={index}
                  status="connected"
                  onConnect={() => { }}
                  onCancel={() => { }}
                  onRemove={() => removeOldConnection(conn.id)}
                  isLoading={isRemoving}
                  onRequestCancelConfirm={() => { }}
                  onRequestDisconnectConfirm={() =>
                    setPendingAction({ type: "disconnect", targetId: conn.id, targetName: conn.display_name })
                  }
                />
              ))
            ) : (
              <div className="w-full py-16 flex flex-col items-center text-center border border-dashed border-border/60 rounded-2xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">No connections yet</h3>
                <p className="text-[13px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                  Build your network by discovering people from your batch.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Invitations (Alumni only) ── */}
        {role === "alumni" && (
          <TabsContent value="invitations" className="m-0 focus-visible:outline-none focus-visible:ring-0 pt-8">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-foreground">Invitations</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                People who want to connect with you
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-2xl">
              {invitationsLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/40">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : invitations && invitations.length > 0 ? (
                invitations.map((invite: any) => (
                  <NetworkInvitationCard
                    key={invite.sender_id}
                    senderName={invite.sender_display_name}
                    senderHeadline={
                      invite.connection_type
                        ? invite.connection_type.charAt(0).toUpperCase() +
                        invite.connection_type.slice(1) +
                        " Request"
                        : "Connection Request"
                    }
                    senderImage={invite.sender_profile_picture}
                    onAccept={() => respondInvitation({ senderId: invite.sender_id, action: "accept" })}
                    onIgnore={() => respondInvitation({ senderId: invite.sender_id, action: "reject" })}
                    isLoading={isResponding}
                  />
                ))
              ) : (
                <div className="py-16 flex flex-col items-center text-center border border-dashed border-border/60 rounded-2xl bg-white/50">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                    <MailOpen className="h-5 w-5 text-rose-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-foreground">No pending invitations</p>
                  <p className="text-[12px] text-muted-foreground mt-1">You're all caught up.</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ── Sent Requests ── */}
        <TabsContent value="sent" className="m-0 focus-visible:outline-none focus-visible:ring-0 pt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Pending requests sent</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Awaiting response from these people
            </p>
          </div>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))] max-w-4xl">
            {sentRequestsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/40">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
                </div>
              ))
            ) : sentRequests && sentRequests.length > 0 ? (
              sentRequests.map((request: any) => (
                <SentRequestCard
                  key={request.target_id}
                  targetId={request.target_id}
                  targetName={request.target_display_name}
                  targetHeadline={
                    request.connection_type
                      ? request.connection_type.charAt(0).toUpperCase() +
                      request.connection_type.slice(1) +
                      " Request"
                      : "Connection Request"
                  }
                  targetImage={request.target_profile_picture}
                  onCancel={() =>
                    setPendingAction({
                      type: "cancel",
                      targetId: request.target_id,
                      targetName: request.target_display_name,
                    })
                  }
                  isLoading={isCancelling}
                />
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center text-center border border-dashed border-border/60 rounded-2xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                  <Send className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-[14px] font-semibold text-foreground">No pending requests sent</p>
                <p className="text-[12px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                  When you connect with others, your pending requests will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Discover ── */}
        <TabsContent value="discover" className="m-0 focus-visible:outline-none focus-visible:ring-0 pt-8">
          {/* Discover header with tip banner */}
          <div className="mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
              <div>
                <h2 className="text-2xl font-bold text-foreground ">Discover alumni</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  People you might know from your batch and beyond
                </p>
              </div>
            </div>

            {/* Tip banner */}
            {suggestions && suggestions.length > 0 && (
              <div className="mt-3 flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl w-full sm:w-fit">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <p className="text-[12px] text-blue-700">
                  <span className="font-semibold">{suggestions.length} people</span> suggested based on your batch and interests
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {suggestionsLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <SuggestionCardSkeleton key={i} />)
            ) : suggestions && suggestions.length > 0 ? (
              suggestions.map((person: any, index: number) => (
                <SuggestionCard
                  key={person.id}
                  person={{
                    id: person.id,
                    name: person.name,
                    username: person.username,
                    headline: person.headline,
                    image: person.image,
                    backDropImage: person.backDropImage,
                  }}
                  index={index}
                  status={getStatus(person.id)}
                  onConnect={() => handleConnect(person.id)}
                  onCancel={() => cancelRequest(person.id)}
                  onRemove={() => removeOldConnection(person.id)}
                  isLoading={isConnecting || isCancelling || isRemoving}
                  onRequestCancelConfirm={() =>
                    setPendingAction({ type: "cancel", targetId: person.id, targetName: person.name })
                  }
                  onRequestDisconnectConfirm={() =>
                    setPendingAction({ type: "disconnect", targetId: person.id, targetName: person.name })
                  }
                />
              ))
            ) : (
              <div className="w-full py-16 flex flex-col items-center text-center border border-dashed border-border/60 rounded-2xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <Compass className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">No suggestions yet</h3>
                <p className="text-[13px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                  We'll show you people you might know as you expand your network.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "disconnect"
            ? `Disconnect from ${pendingAction.targetName}?`
            : `Cancel request to ${pendingAction?.targetName}?`
        }
        description={
          pendingAction?.type === "disconnect"
            ? `You will be removed from ${pendingAction.targetName}'s connections. You can always reconnect later.`
            : `Your pending connection request to ${pendingAction?.targetName} will be withdrawn.`
        }
        confirmLabel={
          pendingAction?.type === "disconnect" ? "Disconnect" : "Cancel Request"
        }
        confirmVariant={pendingAction?.type === "disconnect" ? "danger" : "warning"}
        onConfirm={handleConfirm}
        onCancel={handleDialogCancel}
      />
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground w-full">
          Loading network...
        </div>
      }
    >
      <NetworkPageContent />
    </Suspense>
  );
}
