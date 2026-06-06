import api from "@/lib/api";
import { StudentProfile } from "@/types/api.types";

export const getMyStudentProfile = async (): Promise<StudentProfile> => {
  const { data } = await api.get("/api/student/me");
  return data;
};


// NOTE: Profile updates are unified. Use updateUserProfile from profiles.api.ts → PUT /api/profile/me
// getMyMentors removed — GET /api/student/mentors does not exist in the API.

export const getMyNetwork = async (): Promise<any[]> => {
  const { data } = await api.get("/api/student/connections");
  return data;
};

export const addStudentSkill = async (payload: {
  skill_name: string;
  category: string;
  proficiency_level: string;
}): Promise<{ message: string }> => {
  const { data } = await api.post("/api/profile/skills", payload);
  return data;
};

export const deleteStudentSkill = async (
  skillId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/profile/skills/${skillId}`);
  return data;
};

export const requestProfileUpgrade = async (payload: {
  graduation_year: number;
}): Promise<{ message: string }> => {
  const { data } = await api.post("/api/student/upgrade-request", payload);
  return data;
};
