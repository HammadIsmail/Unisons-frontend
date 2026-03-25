"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOpportunities, deleteOpportunity, updateOpportunity } from "@/lib/api/opportunities.api";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState<"open" | "closed">("open");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["my-opportunities"],
    queryFn: getMyOpportunities,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      setDeleteId(null);
      setSuccessMsg("Opportunity deleted.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateOpportunity(id, payload),
    onSuccess: () => {
      setEditId(null);
      setSuccessMsg("Opportunity updated.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const openEdit = (opp: any) => {
    setEditId(opp.id);
    setEditDeadline(opp.deadline?.split("T")[0] ?? "");
    setEditStatus(opp.status);
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">
            {opportunities?.length ?? "—"} posted
          </p>
        </div>
        <Link
          href="/post-opportunity"
          className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-medium rounded-lg transition"
        >
          + Post New
        </Link>
      </div>

      {successMsg && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : opportunities?.length ? (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              {/* Edit form */}
              {editId === opp.id ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">{opp.title}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Deadline</Label>
                      <Input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as "open" | "closed")}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-600 bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-800 hover:bg-green-900"
                      onClick={() =>
                        updateMutation.mutate({
                          id: opp.id,
                          payload: { deadline: editDeadline, status: editStatus },
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          opp.status === "open"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {opp.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {opp.company} · Posted {new Date(opp.posted_at).toLocaleDateString()} ·
                        Deadline {new Date(opp.deadline).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(opp)}
                        className="text-xs px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(opp.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete confirm */}
                  {deleteId === opp.id && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 mb-2">
                        Delete this opportunity? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(opp.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-400 text-sm mb-3">
            You haven&apos;t posted any opportunities yet
          </p>
          <Link
            href="/post-opportunity"
            className="text-xs text-green-700 hover:text-green-800 font-medium"
          >
            Post your first opportunity →
          </Link>
        </div>
      )}

    </div>
  );
}