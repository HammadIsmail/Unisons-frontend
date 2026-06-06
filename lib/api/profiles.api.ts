import api from "@/lib/api";
import { AlumniProfile, StudentProfile } from "@/types/api.types";

export type PublicProfile = Omit<AlumniProfile, "role"> &
  Omit<StudentProfile, "role"> & {
    role: "alumni" | "student" | "partner";
    connection_status: "pending" | "connected" | "blocked" | "none";
    is_connection_sender: boolean;
    opportunities_posted: any[];
    // Social counts
    followers_count: number;
    following_count: number;
    is_following: boolean;
    // Presence
    is_online: boolean;
    last_seen: string | null;
    // Education section
    education: {
      id: string;
      university: string;
      degree: string;
      field_of_study?: string;
      start_date: string;
      end_date?: string | null;
      is_current: boolean;
    }[];
  };

export const getUserPublicProfile = async (
  id: string
): Promise<PublicProfile> => {
  const { data } = await api.get(`/api/profiles/user/${id}`);
  return data;
};

export interface UserSuggestion {
  id: string;
  display_name: string;
  username: string;
  profile_picture: string | null;
  role: string;
  degree: string;
  batch: string;
  mutual_connections?: number;
}

export const getProfileSuggestions = async (): Promise<UserSuggestion[]> => {
  const { data } = await api.get("/api/profiles/suggestions");
  return data as UserSuggestion[];
};

export const updateUserProfile = async (
  payload: FormData
): Promise<{ message: string }> => {
  const { data } = await api.put("/api/profile/me", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
