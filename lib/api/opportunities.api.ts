import api from "@/lib/api";
import {
  PaginatedOpportunities,
  OpportunityDetail,
  MyOpportunity,
} from "@/types/api.types";

export const getOpportunities = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  skill?: string;
  is_remote?: boolean;
}): Promise<PaginatedOpportunities> => {
  const { data } = await api.get("/api/opportunities", { params });
  return data;
};

export const getOpportunityById = async (id: string): Promise<OpportunityDetail> => {
  const { data } = await api.get(`/api/opportunities/${id}`);
  return data;
};

export const getMyOpportunities = async (): Promise<MyOpportunity[]> => {
  const { data } = await api.get("/api/opportunities/my-posts");
  return data;
};

export const postOpportunity = async (payload: {
  title: string;
  type: string;
  description: string;
  requirements: string;
  location: string;
  is_remote: boolean;
  deadline: string;
  company_name: string;
  apply_link: string;
  required_skills: string[];
  media?: File[];
}): Promise<{ message: string; opportunity_id: string }> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("type", payload.type);
  formData.append("description", payload.description);
  formData.append("requirements", payload.requirements);
  formData.append("location", payload.location);
  formData.append("is_remote", String(payload.is_remote));
  formData.append("deadline", payload.deadline);
  formData.append("company_name", payload.company_name);
  formData.append("apply_link", payload.apply_link);
  payload.required_skills.forEach((skill) => {
    formData.append("required_skills", skill);
  });
  if (payload.media) {
    payload.media.forEach((file) => {
      formData.append("media", file);
    });
  }
  const { data } = await api.post("/api/opportunities", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateOpportunity = async (
  id: string,
  payload: {
    title?: string;
    type?: string;
    description?: string;
    requirements?: string;
    location?: string;
    is_remote?: boolean;
    deadline?: string;
    company_name?: string;
    apply_link?: string;
    status?: string;
    required_skills?: string[];
    media?: (File | string)[];
    existing_media?: string[];
  }
): Promise<{ message: string }> => {
  const formData = new FormData();
  if (payload.title) formData.append("title", payload.title);
  if (payload.type) formData.append("type", payload.type);
  if (payload.description) formData.append("description", payload.description);
  if (payload.requirements) formData.append("requirements", payload.requirements);
  if (payload.location) formData.append("location", payload.location);
  if (payload.is_remote !== undefined) formData.append("is_remote", String(payload.is_remote));
  if (payload.deadline) formData.append("deadline", payload.deadline);
  if (payload.company_name) formData.append("company_name", payload.company_name);
  if (payload.apply_link) formData.append("apply_link", payload.apply_link);
  if (payload.status) formData.append("status", payload.status);

  if (payload.required_skills) {
    payload.required_skills.forEach((skill) => {
      formData.append("required_skills", skill);
    });
  }

  if (payload.media) {
    payload.media.forEach((item) => {
      formData.append("media", item);
    });
  }

  if (payload.existing_media) {
    payload.existing_media.forEach((url) => {
      formData.append("media", url);
    });
  }

  const { data } = await api.put(`/api/opportunities/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteOpportunity = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/opportunities/${id}`);
  return data;
};