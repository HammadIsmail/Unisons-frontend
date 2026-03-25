"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyNetwork, getPendingRequests, respondToRequest } from "@/lib/api/alumni.api";
import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Tab = "connections" | "requests";
type ConnectionFilter = "all" | "batchmate" | "colleague" | "mentor";

export default function MyNetworkPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("connections");
  const [filter, setFilter] = useState<ConnectionFilter>("all");
  const [actionMsg, setActionMsg] = useState("");

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["alumni", "network"],
    queryFn: getMyNetwork,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["alumni", "connection-requests"],
    queryFn: getPendingRequests,
  });

  const respondMutation = useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: "approve" | "reject" }) =>
      respondToRequest(senderId, action),
    onSuccess: (_, vars) => {
      setActionMsg(
        vars.action === "approve"
          ? "Connection accepted."
          : "Connection declined."
      );
      queryClient.invalidateQueries({ queryKey: ["alumni", "connection-requests"] });
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
  });

  const filteredConnections =
    filter === "all"
      ? connections
      : connections?.filter((c) => c.connection_type === filter);

  const pendingCount = requests?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Network</h1>
        <p className="text-sm text-gray-500 mt-1">
          {connections?.length ?? "—"} connections
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setTab("connections")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "connections"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Connections
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
            tab === "requests"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Requests
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {actionMsg && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {actionMsg}
          </AlertDescription>
        </Alert>
      )}

      {/* Connections Tab */}
      {tab === "connections" && (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "batchmate", "colleague", "mentor"] as ConnectionFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filter === f
                    ? "bg-green-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {connectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConnections?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnections.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm flex-shrink-0">
                      {c.display_name?.charAt(0) ?? "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.role} · {c.company}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    c.connection_type === "batchmate"
                      ? "bg-blue-50 text-blue-700"
                      : c.connection_type === "mentor"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.connection_type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-3xl mb-3">🤝</p>
              <p className="text-gray-400 text-sm">
                {filter === "all"
                  ? "No connections yet. Start connecting with alumni."
                  : `No ${filter} connections yet.`}
              </p>
              <Link
                href="/search"
                className="mt-3 text-xs text-green-700 hover:text-green-800 font-medium block"
              >
                Find alumni to connect →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : requests?.length ? (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.sender_id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm flex-shrink-0">
                      {r.sender_display_name?.charAt(0) ?? "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.sender_display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Wants to connect as{" "}
                        <span className="font-medium capitalize">
                          {r.connection_type}
                        </span>{" "}
                        · {new Date(r.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respondMutation.mutate({
                          senderId: r.sender_id,
                          action: "approve",
                        })
                      }
                      disabled={respondMutation.isPending}
                      className="px-3 py-1.5 bg-green-800 hover:bg-green-900 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        respondMutation.mutate({
                          senderId: r.sender_id,
                          action: "reject",
                        })
                      }
                      disabled={respondMutation.isPending}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">No pending connection requests</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}