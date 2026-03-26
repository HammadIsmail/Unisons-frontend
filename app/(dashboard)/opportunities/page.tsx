"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/api/opportunities.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import Link from "next/link";

const TYPES = ["all", "job", "internship", "freelance"];

export default function OpportunitiesPage() {
  const { role } = useAuthStore();
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [skill, setSkill] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", { page, type, skill, is_remote: isRemote }],
    queryFn: () =>
      getOpportunities({
        page,
        limit: 10,
        type: type || undefined,
        skill: skill || undefined,
        is_remote: isRemote,
      }),
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const totalPages = data ? Math.ceil(data.total / 10) : 0;

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ?? "—"} opportunities available
          </p>
        </div>
        {role === "alumni" && (
          <Link
            href="/post-opportunity"
            className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-medium rounded-lg transition"
          >
            + Post Opportunity
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">

        {/* Type filter */}
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setType(t === "all" ? "" : t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                (t === "all" && !type) || type === t
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Skill filter */}
        <select
          value={skill}
          onChange={(e) => { setSkill(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-600 text-gray-600 bg-white"
        >
          <option value="">All Skills</option>
          {skills?.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Remote toggle */}
        <button
          onClick={() => {
            setIsRemote(isRemote === true ? undefined : true);
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            isRemote === true
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Remote only
        </button>

        {/* Clear filters */}
        {(type || skill || isRemote) && (
          <button
            onClick={() => { setType(""); setSkill(""); setIsRemote(undefined); setPage(1); }}
            className="text-xs text-red-500 hover:text-red-700 ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Opportunities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : data?.data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.data.map((opp) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition block"
            >
              {/* Type badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  opp.type === "job"
                    ? "bg-blue-50 text-blue-700"
                    : opp.type === "internship"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {opp.type}
                </span>
                {opp.is_remote && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                    Remote
                  </span>
                )}
              </div>

              {/* Title & Company */}
              <h3 className="font-semibold text-gray-900 mb-1">{opp.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {opp.company.name} · {opp.location}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                <span>Posted by {opp.posted_by.display_name}</span>
                <span>
                  Deadline:{" "}
                  {new Date(opp.deadline).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No opportunities match your filters</p>
          <button
            onClick={() => { setType(""); setSkill(""); setIsRemote(undefined); }}
            className="mt-3 text-xs text-green-700 hover:text-green-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}