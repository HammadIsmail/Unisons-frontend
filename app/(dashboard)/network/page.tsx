"use client";

import NetworkSection from "@/components/network/NetworkSection";
import NetworkInvitationCard from "@/components/network/NetworkInvitationCard";
import SentRequestCard from "@/components/network/SentRequestCard";
import { useNetwork } from "@/hooks/useNetwork";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";


// ─── Suggestion Card (matches wireframe layout) ─────────────────────────────
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
}

function SuggestionCard({
  person,
  index,
  status,
  onConnect,
  onCancel,
  onRemove,
  isLoading,
}: SuggestionCardProps) {
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:border-border/80 hover:shadow-md transition-all duration-200">
      {/* Backdrop */}
      <div
        className={cn(
          "h-24 flex-shrink-0 relative",
          person.backDropImage ? "bg-cover bg-center" : "bg-slate-200"
        )}
        style={person.backDropImage ? { backgroundImage: `url(${person.backDropImage})` } : undefined}
      >
        {/* Avatar — straddling the backdrop / body divider */}
        <Link href={`/profile/${person.username || person.id}`} className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full border-[3px] border-white bg-muted overflow-hidden flex items-center justify-center text-lg font-semibold text-muted-foreground shadow-sm hover:ring-2 hover:ring-blue-400/30 transition-all">
          {person.image ? (
            <img
              src={person.image}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </Link>
      </div>

      {/* Body */}
      <div className="pt-12 pb-5 px-5 flex flex-col items-center flex-1 gap-1.5">
        {/* Name */}
        <Link
          href={`/profile/${person.username || person.id}`}
          className="text-[15px] font-semibold text-foreground text-center leading-tight hover:text-blue-600 transition-colors line-clamp-1"
        >
          {person.name}
        </Link>

        {/* Username */}
        {person.username && (
          <span className="text-[12px] text-muted-foreground text-center">
            @{person.username}
          </span>
        )}

        {/* Bio / headline */}
        {person.headline && (
          <p className="text-[12px] text-muted-foreground text-center leading-relaxed line-clamp-2 mt-1">
            {person.headline}
          </p>
        )}

        {/* Action button */}
        <div className="w-full mt-auto pt-4">
          {status === "connected" ? (
            <button
              onClick={onRemove}
              disabled={isLoading}
              className="w-full py-2 rounded-lg text-[13px] font-medium border border-border/60 text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              Connected
            </button>
          ) : status === "pending" ? (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-full py-2 rounded-lg text-[13px] font-medium border border-border/60 text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              Pending
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isLoading}
              className="w-full py-2 rounded-lg text-[13px] font-semibold bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton for suggestion card ──────────────────────────────────────────
function SuggestionCardSkeleton() {
  return (
    <div className="bg-white border border-border/40 rounded-2xl overflow-hidden flex flex-col">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="pt-12 pb-5 px-5 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-full mt-1" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-9 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}

// ─── Main Page Content ──────────────────────────────────────────────────────
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

  const getStatus = (personId: string): "connected" | "pending" | "none" => {
    if (
      myConnections?.some(
        (c: any) =>
          c.id === personId ||
          c.alumni_id === personId ||
          c.user_id === personId
      )
    )
      return "connected";
    if (sentRequests?.some((r: any) => r.target_id === personId))
      return "pending";
    return "none";
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        {/* ── Tab Navigation ── */}
        <TabsList className="mb-6 w-full max-w-2xl h-auto p-1 bg-white border border-border/50 shadow-sm flex overflow-x-auto no-scrollbar rounded-xl gap-0.5">
          <TabsTrigger
            value="connections"
            className="flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            My connections
          </TabsTrigger>

          {role === "alumni" && (
            <TabsTrigger
              value="invitations"
              className="flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Invitations
              {invitations && invitations.length > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {invitations.length}
                </span>
              )}
            </TabsTrigger>
          )}

          <TabsTrigger
            value="sent"
            className="flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Sent
            {sentRequests && sentRequests.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {sentRequests.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="discover"
            className="flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        {/* ── My Connections ── */}
        <TabsContent value="connections" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection title="My connections">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  />
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center text-center bg-white border border-dashed border-border/60 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">No connections yet</h3>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                    Build your network by discovering people from your batch.
                  </p>
                </div>
              )}
            </div>
          </NetworkSection>
        </TabsContent>

        {/* ── Invitations (Alumni only) ── */}
        {role === "alumni" && (
          <TabsContent value="invitations" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <NetworkSection title="Invitations">
              <div className="flex flex-col gap-3">
                {invitationsLoading ? (
                  [1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/40"
                    >
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
                      onAccept={() =>
                        respondInvitation({ senderId: invite.sender_id, action: "accept" })
                      }
                      onIgnore={() =>
                        respondInvitation({ senderId: invite.sender_id, action: "reject" })
                      }
                      isLoading={isResponding}
                    />
                  ))
                ) : (
                  <div className="py-16 flex flex-col items-center text-center bg-white border border-dashed border-border/60 rounded-2xl">
                    <p className="text-[14px] font-semibold text-foreground">No pending invitations</p>
                    <p className="text-[12px] text-muted-foreground mt-1">You are all caught up.</p>
                  </div>
                )}
              </div>
            </NetworkSection>
          </TabsContent>
        )}

        {/* ── Sent Requests ── */}
        <TabsContent value="sent" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection title="Pending requests sent">
            <div className="flex flex-col gap-3">
              {sentRequestsLoading ? (
                [1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/40"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))
              ) : sentRequests && sentRequests.length > 0 ? (
                sentRequests.map((request: any) => (
                  <SentRequestCard
                    key={request.target_id}
                    targetName={request.target_display_name}
                    targetHeadline={
                      request.connection_type
                        ? request.connection_type.charAt(0).toUpperCase() +
                        request.connection_type.slice(1) +
                        " Request"
                        : "Connection Request"
                    }
                    targetImage={request.target_profile_picture}
                    onCancel={() => cancelRequest(request.target_id)}
                    isLoading={isCancelling}
                  />
                ))
              ) : (
                <div className="py-16 flex flex-col items-center text-center bg-white border border-dashed border-border/60 rounded-2xl">
                  <p className="text-[14px] font-semibold text-foreground">No pending requests sent</p>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                    When you connect with others, your pending requests will appear here.
                  </p>
                </div>
              )}
            </div>
          </NetworkSection>
        </TabsContent>

        {/* ── Discover ── */}
        <TabsContent value="discover" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection title="Discover alumni">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  />
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center text-center bg-white border border-dashed border-border/60 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">No suggestions yet</h3>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                    We'll show you people you might know as you expand your network.
                  </p>
                </div>
              )}
            </div>
          </NetworkSection>
        </TabsContent>
      </Tabs>
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
