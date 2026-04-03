"use client";


import NetworkSection from "@/components/network/NetworkSection";
import NetworkInvitationCard from "@/components/network/NetworkInvitationCard";
import NetworkSuggestionCard from "@/components/network/NetworkSuggestionCard";
import SentRequestCard from "@/components/network/SentRequestCard";
import { useNetwork } from "@/hooks/useNetwork";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Info, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useMemo } from "react";

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

  const [connectionFilter, setConnectionFilter] = useState<"all" | "batchmate" | "colleague" | "mentor">("all");

  const filteredConnections = useMemo(() => {
    if (!myConnections) return [];
    if (connectionFilter === "all") return myConnections;
    return myConnections.filter((c: any) => c.connection_type === connectionFilter);
  }, [myConnections, connectionFilter]);

  const handleConnect = (id: string, type: "batchmate" | "colleague" | "mentor") => {
    connect({ targetId: id, type });
  };

  const getStatus = (personId: string) => {
    if (myConnections?.some((c: any) => c.id === personId || c.alumni_id === personId || c.user_id === personId)) {
      return "connected";
    }
    if (sentRequests?.some((r: any) => r.target_id === personId)) {
      return "pending";
    }
    return "none";
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="mb-6 w-full max-w-2xl h-auto p-1 bg-white border shadow-sm flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="connections" className="flex-1 py-2.5 px-4 font-semibold text-sm whitespace-nowrap">My Connections</TabsTrigger>
          
          {role === "alumni" && (
            <TabsTrigger value="invitations" className="flex-1 py-2.5 px-4 font-semibold text-sm whitespace-nowrap">
              Invitations
              {invitations && invitations.length > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{invitations.length}</span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="sent" className="flex-1 py-2.5 px-4 font-semibold text-sm whitespace-nowrap">
            Sent Requests
            {sentRequests && sentRequests.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">{sentRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex-1 py-2.5 px-4 font-semibold text-sm whitespace-nowrap">Discover</TabsTrigger>
        </TabsList>

        {/* Tab Content: Active Connections Section (Both Roles) */}
        <TabsContent value="connections" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection title={role === "alumni" ? "My Connections" : "My Mentors"}>
            
            {/* Filter Sub-tabs for Alumni */}
            {role === "alumni" && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-1.5 mr-2 text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Filter:</span>
                </div>
                {[
                  { id: "all", label: "All" },
                  { id: "batchmate", label: "Batchmates" },
                  { id: "colleague", label: "Colleagues" },
                  { id: "mentor", label: "Mentors" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setConnectionFilter(f.id as any)}
                    className={`h-8 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      connectionFilter === f.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-white border border-border/60 text-muted-foreground hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myConnectionsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-border/40">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : filteredConnections && filteredConnections.length > 0 ? (
                filteredConnections.map((conn: any) => (
                  <div key={conn.id} className="flex items-center gap-3 p-4 bg-white rounded-[12px] shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                    <img 
                      src={conn.profile_picture || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      alt={conn.display_name} 
                      className="h-14 w-14 rounded-full object-cover border border-border/60"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-[15px] truncate">{conn.display_name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{conn.role || conn.company || (role === "alumni" ? "Alumni" : "Student")}</p>
                      <p className="inline-block mt-1.5 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">{conn.connection_type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center text-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground">No connections yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                    Build your network by discovering people from your batch or suggesting connections.
                  </p>
                </div>
              )}
            </div>
          </NetworkSection>
        </TabsContent>

        {/* Tab Content: Invitations Section (Alumni Only) */}
        {role === "alumni" && (
          <TabsContent value="invitations" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <NetworkSection title="Invitations">
              <div className="flex flex-col gap-3">
                {invitationsLoading ? (
                  [1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-border/40">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
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
                          ? invite.connection_type.charAt(0).toUpperCase() + invite.connection_type.slice(1) + " Request"
                          : "Connection Request"
                      }
                      senderImage={invite.sender_profile_picture}
                      onAccept={() => respondInvitation({ senderId: invite.sender_id, action: "accept" })}
                      onIgnore={() => respondInvitation({ senderId: invite.sender_id, action: "reject" })}
                      isLoading={isResponding}
                    />
                  ))
                ) : (
                  <div className="py-16 flex flex-col items-center text-center border bg-white border-dashed rounded-lg">
                    <p className="text-sm font-semibold text-foreground">No pending invitations</p>
                    <p className="text-xs text-muted-foreground mt-1">You are all caught up.</p>
                  </div>
                )}
              </div>
            </NetworkSection>
          </TabsContent>
        )}

        {/* Tab Content: Sent Requests Section (Both) */}
        <TabsContent value="sent" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection title="Pending Requests Sent">
            <div className="flex flex-col gap-3">
              {sentRequestsLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-border/40">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-32 rounded-full" />
                  </div>
                ))
              ) : sentRequests && sentRequests.length > 0 ? (
                sentRequests.map((request: any) => (
                  <SentRequestCard
                    key={request.target_id}
                    targetName={request.target_display_name}
                    targetHeadline={
                      request.connection_type
                        ? request.connection_type.charAt(0).toUpperCase() + request.connection_type.slice(1) + " Request"
                        : "Connection Request"
                    }
                    targetImage={request.target_profile_picture}
                    onCancel={() => cancelRequest(request.target_id)}
                    isLoading={isCancelling}
                  />
                ))
              ) : (
                <div className="py-16 flex flex-col items-center text-center border bg-white border-dashed rounded-lg">
                  <p className="text-sm font-semibold text-foreground">No pending requests sent</p>
                  <p className="text-xs text-muted-foreground mt-1">When you connect with others, your pending requests will appear here.</p>
                </div>
              )}
            </div>
          </NetworkSection>
        </TabsContent>

        {/* Tab Content: Discovery Section */}
        <TabsContent value="discover" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NetworkSection 
            title="Discover Alumni"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestionsLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-[12px] shadow-sm overflow-hidden h-[260px] flex flex-col border border-border/40">
                    <Skeleton className="h-16 w-full" />
                    <div className="flex flex-col items-center -mt-9 px-4 pb-4 flex-1">
                      <Skeleton className="h-20 w-20 rounded-full border-4 border-white" />
                      <Skeleton className="h-4 w-3/4 mt-4" />
                      <Skeleton className="h-3 w-1/2 mt-2" />
                      <Skeleton className="h-8 w-full mt-auto rounded-full" />
                    </div>
                  </div>
                ))
              ) : suggestions && suggestions.length > 0 ? (
                suggestions.map((person) => (
                  <NetworkSuggestionCard
                    key={person.id}
                    userId={person.id}
                    username={person.username}
                    name={person.name}
                    headline={person.headline}
                    image={person.image}
                    connectionStatus={getStatus(person.id)}
                    onConnect={(type) => handleConnect(person.id, type)}
                    onCancel={() => cancelRequest(person.id)}
                    onRemove={() => removeOldConnection(person.id)}
                    isLoading={isConnecting || isCancelling || isRemoving}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center text-center bg-white border border-dashed rounded-lg">
                  <div className="bg-blue-50 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 text-[#0a66c2]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground">No suggestions yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
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
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground w-full">Loading network...</div>}>
      <NetworkPageContent />
    </Suspense>
  );
}
