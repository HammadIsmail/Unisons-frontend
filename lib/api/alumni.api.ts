import api from "@/lib/api";
import {
  AlumniProfile,
  Connection,
  BatchMate,
} from "@/types/api.types";
import { UserByUsername } from "@/types/api.types";

export const getMyAlumniProfile = async (): Promise<AlumniProfile> => {
  const { data } = await api.get("/api/alumni/me");
  return data;
};

export const updateAlumniProfile = async (
  payload: FormData
): Promise<{ message: string }> => {
  const { data } = await api.put("/api/alumni/me", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getMyNetwork = async (): Promise<Connection[]> => {
  const { data } = await api.get("/api/alumni/network");
  return data;
};

export const connectWithAlumni = async (
  targetId: string,
  connectionType: string
): Promise<{ message: string }> => {
  const { data } = await api.post(`/api/alumni/connect/${targetId}`, {
    connection_type: connectionType,
  });
  return data;
};

export const getPendingRequests = async (): Promise<{
  profile_picture: string | Blob | undefined;
  display_name: string | undefined;
  sender_id: string;
  sender_display_name: string;
  connection_type: string;
  requested_at: string;
}[]> => {
  const { data } = await api.get("/api/alumni/connections/requests");
  return data;
};

export const respondToRequest = async (
  senderId: string,
  action: "accept" | "reject"
): Promise<{ message: string }> => {
  const { data } = await api.patch(
    `/api/alumni/connections/requests/${senderId}/respond`,
    { action }
  );
  return data;
};

export const getBatchMates = async (): Promise<BatchMate[]> => {
  const { data } = await api.get("/api/alumni/batch-mates");
  return data;
};

export const addWorkExperience = async (payload: {
  company_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  employment_type: string;
}): Promise<{ message: string }> => {
  const { data } = await api.post("/api/alumni/work-experience", payload);
  return data;
};

export const updateWorkExperience = async (
  id: string,
  payload: {
    role?: string;
    end_date?: string;
    is_current?: boolean;
  }
): Promise<{ message: string }> => {
  const { data } = await api.put(`/api/alumni/work-experience/${id}`, payload);
  return data;
};

export const deleteWorkExperience = async (
  id: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/alumni/work-experience/${id}`);
  return data;
};

export const addSkill = async (payload: {
  skill_name: string;
  category: string;
  proficiency_level: string;
  years_experience?: number;
}): Promise<{ message: string }> => {
  const { data } = await api.post("/api/alumni/skills", payload);
  return data;
};

export const deleteSkill = async (
  skillId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/alumni/skills/${skillId}`);
  return data;
};

export const getAllSkills = async (): Promise<string[]> => {
  const { data } = await api.get("/api/skills/all");
  return data;
};

export const getAlumniByUsername = async (
  username: string
): Promise<UserByUsername> => {
  const { data } = await api.get(`/api/search/user/${username}`);
  return data;
};