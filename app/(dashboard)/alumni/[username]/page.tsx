"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlumniByUsername, connectWithAlumni } from "@/lib/api/alumni.api";
import useAuthStore from "@/store/authStore";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { studentConnectWithAlumni } from "@/lib/api/student.api";
import Link from "next/link";

const CONNECTION_TYPES_ALUMNI = ["batchmate", "colleague", "mentor"] as const;
const CONNECTION_TYPES_STUDENT = ["mentor"] as const;

export default function AlumniProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile, role } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>(
    role === "student" ? "mentor" : "batchmate"
  );
  const [connected, setConnected] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: alumni, isLoading } = useQuery({
    queryKey: ["alumni", "username", username],
    queryFn: () => getAlumniByUsername(username),
    enabled: !!username,
  });

  const connectMutation = useMutation({
    mutationFn: () => {
      if (!alumni?.id) throw new Error("Alumni ID not found");
      if (role === "student") {
        return studentConnectWithAlumni(alumni.id);
      }
      return connectWithAlumni(alumni.id, selectedType);
    },
    onSuccess: () => {
      setConnected(true);
      setSuccessMsg("Connection request sent successfully.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "network"] });
    },
    onError: (error: any) => {
      setErrorMsg(
        error.response?.data?.message || "Failed to connect. Try again."
      );
    },
  });

  const isOwnProfile = (profile as any)?.username === username;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex gap-4 items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!alumni) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-gray-400">Alumni profile not found.</p>
        <Link href="/search" className="text-green-700 text-sm mt-2 block">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Back */}
      <Link
        href="/search"
        className="text-sm text-gray-400 hover:text-gray-600 block"
      >
        ← Back to search
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {alumni.profile_picture ? (
              <img
                src={alumni.profile_picture}
                alt={alumni.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xl">
                {alumni.display_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {alumni.display_name}
              </h1>
              <p className="text-sm text-gray-400">@{alumni.username}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {alumni.job_role ?? "Job role not specified"} · {alumni.company ?? "Company not specified"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {alumni.degree} · Class of {alumni.graduation_year}
              </p>
            </div>
          </div>

          {/* Connect — alumni and students can connect with alumni, not own profile */}
          {(role === "alumni" || role === "student") && !isOwnProfile && alumni.role === "alumni" && (
            <div className="flex flex-col gap-2">
              {!connected ? (
                <>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-600 bg-white"
                  >
                    {(role === "alumni" ? CONNECTION_TYPES_ALUMNI : CONNECTION_TYPES_STUDENT).map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="bg-green-800 hover:bg-green-900 text-xs"
                    size="sm"
                  >
                    {connectMutation.isPending ? "Connecting..." : "Connect"}
                  </Button>
                </>
              ) : (
                <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium">
                  ✓ Request Sent
                </span>
              )}
            </div>
          )}

          {isOwnProfile && (
            <Link
              href="/profile/me"
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}
        {errorMsg && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* LinkedIn */}
        {alumni.linkedin_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">

            <a href={alumni.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              LinkedIn ↗
            </a>
          </div>
        )}
      </div>

      {/* Skills */}
      {alumni.skills?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {alumni.skills.map((skill: string) => (
              <span
                key={skill}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}