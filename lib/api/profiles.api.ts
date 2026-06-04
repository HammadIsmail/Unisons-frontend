import api from "@/lib/api";
import { AlumniProfile, StudentProfile } from "@/types/api.types";

export type PublicProfile = Omit<AlumniProfile, "role"> &
  Omit<StudentProfile, "role"> & {
    role: "alumni" | "student" | "partner";
    connection_status: "pending" | "connected" | "blocked" | "none";
    is_connection_sender: boolean;
    opportunities_posted: any[];
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
