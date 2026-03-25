"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBatchMates, connectWithAlumni } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import { useState } from "react";

export default function BatchMatesPage() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const { data: batchMates, isLoading } = useQuery({
    queryKey: ["alumni", "batch-mates"],
    queryFn: getBatchMates,
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => connectWithAlumni(id, "batchmate"),
    onSuccess: (_, id) => {
      setConnected((prev) => ({ ...prev, [id]: true }));
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Batch Mates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Alumni from your batch · {(profile as any)?.batch ?? ""}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3 items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-7 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : batchMates?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchMates.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm flex-shrink-0">
                  {b.display_name?.charAt(0) ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {b.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {b.role} · {b.company}
                  </p>
                </div>
              </div>

              {connected[b.id] ? (
                <span className="w-full text-center text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium">
                  ✓ Request Sent
                </span>
              ) : (
                <button
                  onClick={() => connectMutation.mutate(b.id)}
                  disabled={connectMutation.isPending}
                  className="w-full text-xs px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Connect as Batchmate
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">🎓</p>
          <p className="text-gray-400 text-sm">No batch mates found</p>
        </div>
      )}

    </div>
  );
}