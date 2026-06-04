"use client";

import Navbar from "./Navbar";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useQuery } from "@tanstack/react-query";
import { getMyAlumniProfile } from "@/lib/api/alumni.api";
import { getMyStudentProfile } from "@/lib/api/student.api";
import { getMyPartnerProfile } from "@/lib/api/partner.api";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize real-time chat socket listener
  useChatSocket();

  const { role, updateProfile } = useAuthStore();

  const { data: alumniProfile } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: getMyAlumniProfile,
    enabled: role === "alumni",
  });

  const { data: partnerProfile } = useQuery({
    queryKey: ["partner", "me"],
    queryFn: getMyPartnerProfile,
    enabled: role === "partner",
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["student", "me"],
    queryFn: getMyStudentProfile,
    enabled: role === "student",
  });

  const profile = role === "partner" ? partnerProfile : role === "alumni" ? alumniProfile : studentProfile;

  useEffect(() => {
    if (profile) {
      updateProfile(profile as any);
    }
  }, [profile, updateProfile]);
  return (
    <div className="min-h-screen bg-white has-bottom-nav">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <main className="w-full">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}