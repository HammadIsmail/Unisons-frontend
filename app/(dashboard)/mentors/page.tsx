"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyMentors } from "@/lib/api/student.api";
import Link from "next/link";

export default function MentorsPage() {
  const { data: mentors, isLoading } = useQuery({
    queryKey: ["student", "mentors"],
    queryFn: getMyMentors,
  });

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Mentors</h1>
        <p className="text-sm text-gray-500 mt-1">
          Alumni who are guiding you in your career
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="flex gap-3 items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : mentors?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.alumni_id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 transition"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-lg flex-shrink-0">
                  {mentor.display_name?.charAt(0) ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {mentor.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {mentor.company}
                  </p>
                </div>
              </div>

              {/* Domain badge */}
              <div className="mb-4">
                <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                  {mentor.domain}
                </span>
              </div>

              {/* View profile link */}
              <Link
                href={`/alumni/${mentor.alumni_id}`}
                className="block w-full text-center text-xs px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition font-medium"
              >
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-gray-900 font-medium mb-1">No mentors yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Connect with alumni who can guide your career journey
          </p>
          <Link
            href="/search"
            className="text-xs text-green-700 hover:text-green-800 font-medium"
          >
            Find alumni to connect with →
          </Link>
        </div>
      )}

    </div>
  );
}