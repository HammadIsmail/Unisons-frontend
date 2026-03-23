import api from "@/lib/api";
import { AlumniSearchResult, OpportunitySearchResult } from "@/types/api.types";

export const searchAlumni = async (params: {
  name?: string;
  company?: string;
  skill?: string;
  batch_year?: string;
  degree?: string;
}): Promise<AlumniSearchResult[]> => {
  const { data } = await api.get("/api/search/alumni", { params });
  return data;
};

export const searchOpportunities = async (params: {
  title?: string;
  type?: string;
  skill?: string;
  location?: string;
  is_remote?: boolean;
}): Promise<OpportunitySearchResult[]> => {
  const { data } = await api.get("/api/search/opportunities", { params });
  return data;
};