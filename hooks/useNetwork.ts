"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingRequests,
  respondToConnectionRequest,
  sendConnectionRequest,
  getSentRequests,
  cancelSentRequest,
  removeConnection,
  getMyNetwork,
} from "@/lib/api/connections.api";
import { searchAlumni } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import { useCallback } from "react";

export function useNetwork() {
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const isAlumni = role === "alumni";
  const isStudent = role === "student";

  // 1. Pending Invitations (Incoming) - All roles can receive requests
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ["network-invitations"],
    queryFn: getPendingRequests,
    enabled: !!role,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // 2. Sent Requests (Both roles)
  const { data: sentRequests, isLoading: sentRequestsLoading } = useQuery({
    queryKey: ["network-sent-requests"],
    queryFn: getSentRequests,
    enabled: !!role,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // 3. My Connections (Both roles)
  const { data: myConnections, isLoading: myConnectionsLoading } = useQuery({
    queryKey: ["network-connections"],
    queryFn: () => getMyNetwork(role || undefined),
    enabled: !!role,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // 4. Remove Connection
  const { mutate: removeOldConnection, isPending: isRemoving } = useMutation({
    mutationFn: removeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      queryClient.invalidateQueries({ queryKey: [role, "network"] });
      queryClient.invalidateQueries({ queryKey: ["network-suggestions"] });
    },
  });

  // 5. Suggestions (Discover Alumni & Students)
  const selectSuggestions = useCallback((data: any[]) => {
    return (data || []).map((item) => ({
      id: item.id || item.alumni_id || item.user_id,
      username: item.username,
      name: item.display_name,
      headline:
        item.bio ||
        (item.company || item.current_company
          ? `${item.job_role || item.role || "Member"} at ${item.company || item.current_company}`
          : item.role
          ? `${item.role.charAt(0).toUpperCase() + item.role.slice(1)}${item.batch_year ? ` • Batch ${item.batch_year}` : ""}`
          : "UNISON Member"),
      image: item.profile_picture,
      backDropImage: item.backDropImage,
      role: item.role,
      batch_year: item.batch_year,
    }));
  }, []);

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["network-suggestions"],
    queryFn: () => searchAlumni(),
    enabled: !!role,
    select: selectSuggestions,
    refetchOnMount: "always",
  });

  // Mutations
  const respondMutation = useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: "accept" | "reject" }) =>
      respondToConnectionRequest(senderId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      queryClient.invalidateQueries({ queryKey: [role, "network"] });
      queryClient.invalidateQueries({ queryKey: ["network-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["network-suggestions"] });
      toast.success(action === "accept" ? "Connection accepted" : "Invitation ignored");
    },
    onError: () => toast.error("Failed to respond to invitation"),
  });

  const connectMutation = useMutation({
    mutationFn: ({ targetId }: { targetId: string }) =>
      sendConnectionRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["network-sent-requests"] });
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      toast.success("Connection request sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (targetId: string) => cancelSentRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-sent-requests"] });
      queryClient.invalidateQueries({ queryKey: ["network-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      toast.success("Connection request cancelled");
    },
    onError: () => toast.error("Failed to cancel connection request"),
  });

  return {
    invitations,
    invitationsLoading,
    sentRequests,
    sentRequestsLoading,
    myConnections,
    myConnectionsLoading,
    suggestions,
    suggestionsLoading,
    respondInvitation: respondMutation.mutate,
    isResponding: respondMutation.isPending,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    cancelRequest: cancelRequestMutation.mutate,
    isCancelling: cancelRequestMutation.isPending,
    removeOldConnection,
    isRemoving,
  };
}
