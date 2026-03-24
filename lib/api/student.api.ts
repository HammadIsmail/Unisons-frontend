import api from "@/lib/api";
import { StudentProfile, Mentor } from "@/types/api.types";

export const getMyStudentProfile = async (): Promise<StudentProfile> => {
  const { data } = await api.get("/api/student/me");
  return data;
};

export const updateStudentProfile = async (
  payload: FormData
): Promise<{ message: string }> => {
  const { data } = await api.put("/api/student/me", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getMyMentors = async (): Promise<Mentor[]> => {
  const { data } = await api.get("/api/student/mentors");
  return data;
};

export const addStudentSkill = async (payload: {
  skill_name: string;
  category: string;
  proficiency_level: string;
}): Promise<{ message: string }> => {
  const { data } = await api.post("/api/student/skills", payload);
  return data;
};