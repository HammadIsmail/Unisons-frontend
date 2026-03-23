import api from "@/lib/api";
import { StudentProfile, Mentor } from "@/types/api.types";

export const getStudentProfile = async (id: string): Promise<StudentProfile> => {
  const { data } = await api.get(`/api/student/profile/${id}`);
  return data;
};

export const updateStudentProfile = async (
  id: string,
  payload: FormData
): Promise<{ message: string }> => {
  const { data } = await api.put(`/api/student/profile/${id}`, payload, {
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