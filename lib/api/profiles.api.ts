import api from "@/lib/api";
import { AlumniProfile, StudentProfile } from "@/types/api.types";

export interface PublicProfile extends AlumniProfile, StudentProfile {
  connection_status: "pending" | "connected" | "none";
  is_connection_sender: boolean;
  opportunities_posted: any[];
}

export const getUserPublicProfile = async (
  id: string
): Promise<PublicProfile> => {
  const { data } = await api.get(`/api/profiles/user/${id}`);
  return data;
};
