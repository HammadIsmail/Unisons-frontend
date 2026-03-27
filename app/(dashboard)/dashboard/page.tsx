"use client";

import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/authStore";
import useUIStore from "@/store/uiStore";
import { getOpportunities } from "@/lib/api/opportunities.api";
import { getSkillTrends } from "@/lib/api/network.api";
import { getNotifications } from "@/lib/api/notifications.api";
import { getMyNetwork } from "@/lib/api/alumni.api";
import { getMyMentors } from "@/lib/api/student.api";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const { profile, role } = useAuthStore();
  const { setNotificationCount } = useUIStore();

  const { data: opportunities, isLoading: oppsLoading } = useQuery({
    queryKey: ["opportunities", { limit: 5 }],
    queryFn: () => getOpportunities({ limit: 5 }),
  });

  const { data: skillTrends } = useQuery({
    queryKey: ["network", "skill-trends"],
    queryFn: getSkillTrends,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const { data: network } = useQuery({
    queryKey: ["alumni", "network"],
    queryFn: getMyNetwork,
    enabled: role === "alumni",
  });

  const { data: mentors } = useQuery({
    queryKey: ["student", "mentors"],
    queryFn: getMyMentors,
    enabled: role === "student",
  });

  // Update notification badge count
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n) => !n.is_read).length;
      setNotificationCount(unread);
    }
  }, [notifications, setNotificationCount]);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {profile?.display_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {role} · {profile?.degree} · {profile?.batch}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">
            {role === "alumni" ? "Connections" : "Mentors"}
          </p>
          <p className="text-3xl font-semibold text-green-800 mt-1">
            {role === "alumni"
              ? (network?.length ?? "—")
              : (mentors?.length ?? "—")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Open Opportunities</p>
          <p className="text-3xl font-semibold text-blue-700 mt-1">
            {oppsLoading ? "—" : (opportunities?.total ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Unread Notifications</p>
          <p className="text-3xl font-semibold text-amber-600 mt-1">
            {unreadCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Opportunities</h2>
            <Link
              href="/opportunities"
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              View all →
            </Link>
          </div>

          {oppsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : opportunities?.data?.length ? (
            <div className="space-y-3">
              {opportunities.data.slice(0, 5).map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {opp.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {opp.company?.name} · {opp.location}
                        {opp.is_remote && " · Remote"}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      opp.type === "job"
                        ? "bg-blue-50 text-blue-700"
                        : opp.type === "internship"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {opp.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No opportunities yet
            </p>
          )}
        </div>

        {/* Skill Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Skill Trends</h2>
            <Link
              href="/network"
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Full analytics →
            </Link>
          </div>

          {skillTrends ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  In-Demand Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillTrends.most_required_in_opportunities.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Skill Gaps
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skillTrends.gap.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-100 rounded w-full" />
              ))}
            </div>
          )}
        </div>

        {/* Notifications Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Recent Notifications
            </h2>
            <Link
              href="/notifications"
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              View all →
            </Link>
          </div>

          {notifications?.length ? (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className={`py-3 flex items-start gap-3 ${
                    !n.is_read ? "opacity-100" : "opacity-60"
                  }`}
                >
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                  )}
                  {n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No notifications yet
            </p>
          )}
        </div>

      </div>
    </div>
  );
}