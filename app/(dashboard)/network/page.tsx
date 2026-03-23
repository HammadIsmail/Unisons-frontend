"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCentrality,
  getTopCompanies,
  getSkillTrends,
  getBatchAnalysis,
  getShortestPath,
} from "@/lib/api/network.api";
import { searchAlumni } from "@/lib/api/search.api";

export default function NetworkPage() {
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [pathTriggered, setPathTriggered] = useState(false);

  const { data: centrality, isLoading: centralityLoading } = useQuery({
    queryKey: ["network", "centrality"],
    queryFn: getCentrality,
  });

  const { data: topCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: ["network", "top-companies"],
    queryFn: getTopCompanies,
  });

  const { data: skillTrends } = useQuery({
    queryKey: ["network", "skill-trends"],
    queryFn: getSkillTrends,
  });

  const { data: batchAnalysis } = useQuery({
    queryKey: ["network", "batch-analysis"],
    queryFn: getBatchAnalysis,
  });

  const { data: path, isLoading: pathLoading } = useQuery({
    queryKey: ["network", "path", fromId, toId],
    queryFn: () => getShortestPath(fromId, toId),
    enabled: pathTriggered && !!fromId && !!toId,
  });

  const maxCount = topCompanies?.[0]?.alumni_count ?? 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Network Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Graph-powered insights across the UNISON alumni network
        </p>
      </div>

      {/* Top Row: Centrality + Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Centrality Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Most Connected Alumni
          </h2>
          {centralityLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-4 bg-gray-100 rounded" />
                  <div className="flex-1 h-4 bg-gray-100 rounded" />
                  <div className="w-12 h-4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : centrality?.length ? (
            <div className="space-y-2">
              {centrality.map((a, i) => (
                <div key={a.alumni_id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${
                    i === 0 ? "text-amber-500" :
                    i === 1 ? "text-gray-400" :
                    i === 2 ? "text-amber-700" : "text-gray-300"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {a.connections} connections
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                      {a.centrality_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          )}
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Companies</h2>
          {companiesLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : topCompanies?.length ? (
            <div className="space-y-3">
              {topCompanies.map((c) => (
                <div key={c.company}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">
                      {c.company}
                    </span>
                    <span className="text-xs text-gray-400">
                      {c.alumni_count} alumni
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-green-700 h-1.5 rounded-full transition-all"
                      style={{ width: `${(c.alumni_count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          )}
        </div>

      </div>

      {/* Skill Trends */}
      {skillTrends && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Skill Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                In-Demand
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillTrends.most_required_in_opportunities.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Common Among Alumni
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillTrends.most_common_among_alumni.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Skill Gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillTrends.gap.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Analysis */}
      {batchAnalysis?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Batch Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wide pb-2">Batch</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wide pb-2">Alumni</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wide pb-2">Top Companies</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wide pb-2">Top Roles</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wide pb-2">Avg Connections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batchAnalysis.map((b) => (
                  <tr key={b.batch}>
                    <td className="py-3 font-medium text-gray-900">{b.batch}</td>
                    <td className="py-3 text-gray-600">{b.total_alumni}</td>
                    <td className="py-3 text-gray-600 text-xs">
                      {b.top_companies.slice(0, 2).join(", ")}
                    </td>
                    <td className="py-3 text-gray-600 text-xs">
                      {b.top_roles.slice(0, 2).join(", ")}
                    </td>
                    <td className="py-3 text-gray-600">{b.avg_connections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Shortest Path Finder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">
          Connection Path Finder
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Find the shortest path between two alumni in the network
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">From (Alumni ID)</label>
            <input
              type="text"
              value={fromId}
              onChange={(e) => { setFromId(e.target.value); setPathTriggered(false); }}
              placeholder="Enter alumni ID"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To (Alumni ID)</label>
            <input
              type="text"
              value={toId}
              onChange={(e) => { setToId(e.target.value); setPathTriggered(false); }}
              placeholder="Enter alumni ID"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600"
            />
          </div>
        </div>

        <button
          onClick={() => setPathTriggered(true)}
          disabled={!fromId || !toId || pathLoading}
          className="px-4 py-2 bg-green-800 hover:bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition"
        >
          {pathLoading ? "Finding path..." : "Find path"}
        </button>

        {/* Path Result */}
        {path && pathTriggered && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700 font-semibold mb-3">
              {path.hops} hop{path.hops !== 1 ? "s" : ""} between them
            </p>
            <div className="flex items-center flex-wrap gap-2">
              {path.path.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-green-200">
                    {name}
                  </span>
                  {i < path.path.length - 1 && (
                    <span className="text-green-400 text-sm">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pathTriggered && !pathLoading && !path && (
          <p className="mt-3 text-sm text-gray-400">
            No path found between these alumni.
          </p>
        )}
      </div>

    </div>
  );
}