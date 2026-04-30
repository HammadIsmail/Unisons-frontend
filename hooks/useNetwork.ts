"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingRequests, respondToConnectionRequest, sendConnectionRequest, getSentRequests, cancelSentRequest, removeConnection } from "@/lib/api/connections.api";
import { getBatchMates, getMyNetwork as getAlumniNetwork, searchAlumni } from "@/lib/api/alumni.api";
import { getMyMentors, getMyNetwork as getStudentNetwork } from "@/lib/api/student.api";
import { getSkillTrends } from "@/lib/api/network.api";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";

export function useNetwork() {
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const isAlumni = role === "alumni";
  const isStudent = role === "student";

  // 1. Pending Invitations (Incoming) - Alumni only
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ["network-invitations"],
    queryFn: getPendingRequests,
    enabled: isAlumni, // Students do not get incoming requests
  });

  // 3. Sent Requests (Both roles)
  const { data: sentRequests, isLoading: sentRequestsLoading } = useQuery({
    queryKey: ["network-sent-requests"],
    queryFn: getSentRequests,
  });

  // 4. My Connections (Both roles)
  const { data: myConnections, isLoading: myConnectionsLoading } = useQuery({
    queryKey: [isAlumni ? "alumni" : "student", "network"],
    queryFn: isAlumni ? getAlumniNetwork : getStudentNetwork,
  });

  // 5. Remove Connection
  const { mutate: removeOldConnection, isPending: isRemoving } = useMutation({
    mutationFn: removeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [isAlumni ? "alumni" : "student", "network"] });
      queryClient.invalidateQueries({ queryKey: ["network-suggestions"] });
    },
  });

  // 2. Suggestions (Discover All Alumni)
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["network-suggestions"],
    queryFn: () => searchAlumni(),
    select: (data: any[]) => {
      // Normalize data for the UI
      return data.map((item) => ({
        id: item.id || item.alumni_id || item.user_id,
        username: item.username,
        name: item.display_name,
        headline:
          item.bio ||
          `${item.role || ""}${item.current_company || item.company ? ` • ${item.current_company || item.company}` : ""}` ||
          "No description available",
        image: item.profile_picture,
        backDropImage: item.backDropImage,
      }));
    }
  });

  // 3. Skill Trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["network-trends"],
    queryFn: getSkillTrends,
  });

  // Mutations
  const respondMutation = useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: "accept" | "reject" }) =>
      respondToConnectionRequest(senderId, action),
    onSuccess: (_, { action }) => {
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
    trends,
    trendsLoading,
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
