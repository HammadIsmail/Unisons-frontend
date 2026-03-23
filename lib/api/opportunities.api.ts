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
}): Promise<{ message: string; opportunity_id: string }> => {
  const { data } = await api.post("/api/opportunities", payload);
  return data;
};

export const updateOpportunity = async (
  id: string,
  payload: {
    title?: string;
    description?: string;
    apply_link?: string;
    deadline?: string;
    status?: string;
  }
): Promise<{ message: string }> => {
  const { data } = await api.put(`/api/opportunities/${id}`, payload);
  return data;
};

export const deleteOpportunity = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/opportunities/${id}`);
  return data;
};