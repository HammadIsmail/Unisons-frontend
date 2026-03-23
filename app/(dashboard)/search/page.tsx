"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAlumni, searchOpportunities } from "@/lib/api/search.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";

type Tab = "alumni" | "opportunities";

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("alumni");
  const [query, setQuery] = useState("");

  // Alumni filters
  const [company, setCompany] = useState("");
  const [skill, setSkill] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [degree, setDegree] = useState("");

  // Opportunity filters
  const [oppType, setOppType] = useState("");
  const [oppLocation, setOppLocation] = useState("");
  const [oppSkill, setOppSkill] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);

  const debouncedQuery = useDebounce(query, 300);

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const { data: alumniResults, isLoading: alumniLoading } = useQuery({
    queryKey: ["search", "alumni", { debouncedQuery, company, skill, batchYear, degree }],
    queryFn: () =>
      searchAlumni({
        name: debouncedQuery || undefined,
        company: company || undefined,
        skill: skill || undefined,
        batch_year: batchYear || undefined,
        degree: degree || undefined,
      }),
    enabled: tab === "alumni",
  });

  const { data: oppResults, isLoading: oppLoading } = useQuery({
    queryKey: ["search", "opportunities", { debouncedQuery, oppType, oppSkill, oppLocation, isRemote }],
    queryFn: () =>
      searchOpportunities({
        title: debouncedQuery || undefined,
        type: oppType || undefined,
        skill: oppSkill || undefined,
        location: oppLocation || undefined,
        is_remote: isRemote,
      }),
    enabled: tab === "opportunities",
  });

  const isLoading = tab === "alumni" ? alumniLoading : oppLoading;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Search</h1>
        <p className="text-sm text-gray-500 mt-1">
          Find alumni or opportunities across the network
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "alumni"
              ? "Search by name..."
              : "Search by title..."
          }
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-sm transition"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {(["alumni", "opportunities"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery(""); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-6">

        {/* Filters Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filters
          </p>

          {tab === "alumni" ? (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Netsol"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Skill</label>
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600 bg-white"
                >
                  <option value="">Any skill</option>
                  {skills?.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Batch Year</label>
                <input
                  type="text"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  placeholder="e.g. 2020"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Degree</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. BSCS"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600 bg-white"
                >
                  <option value="">Any type</option>
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Skill</label>
                <select
                  value={oppSkill}
                  onChange={(e) => setOppSkill(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600 bg-white"
                >
                  <option value="">Any skill</option>
                  {skills?.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Location</label>
                <input
                  type="text"
                  value={oppLocation}
                  onChange={(e) => setOppLocation(e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRemote === true}
                    onChange={(e) => setIsRemote(e.target.checked ? true : undefined)}
                    className="rounded"
                  />
                  Remote only
                </label>
              </div>
            </>
          )}

          {/* Clear */}
          <button
            onClick={() => {
              setQuery("");
              setCompany(""); setSkill(""); setBatchYear(""); setDegree("");
              setOppType(""); setOppSkill(""); setOppLocation(""); setIsRemote(undefined);
            }}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear all
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : tab === "alumni" ? (
            alumniResults?.length ? (
              <div className="space-y-3">
                {alumniResults.map((a) => (
                  <Link
                    key={a.id}
                    href={`/alumni/${a.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 hover:border-green-300 transition block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm flex-shrink-0">
                        {a.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">
                          {a.role} · {a.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {a.skills?.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-sm">No alumni found</p>
              </div>
            )
          ) : (
            oppResults?.length ? (
              <div className="space-y-3">
                {oppResults.map((o) => (
                  <Link
                    key={o.id}
                    href={`/opportunities/${o.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 transition block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {o.company} · {o.location}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        o.type === "job"
                          ? "bg-blue-50 text-blue-700"
                          : o.type === "internship"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {o.type}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-sm">No opportunities found</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}