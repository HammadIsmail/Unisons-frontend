import api from "@/lib/api";
import { AlumniProfile, StudentProfile } from "@/types/api.types";

export type PublicProfile = Omit<AlumniProfile, "role"> &
  Omit<StudentProfile, "role"> & {
    role: "alumni" | "student";
    connection_status: "pending" | "connected" | "none";
    is_connection_sender: boolean;
    opportunities_posted: any[];
  };

export const getUserPublicProfile = async (
  id: string
): Promise<PublicProfile> => {
  const { data } = await api.get(`/api/profiles/user/${id}`);
  return data;
};
