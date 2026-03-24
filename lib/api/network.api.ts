import api from "@/lib/api";
import {
  CentralityScore,
  ShortestPath,
  TopCompany,
  SkillTrends,
  BatchAnalysis,
} from "@/types/api.types";

export const getCentrality = async (): Promise<CentralityScore[]> => {
  const { data } = await api.get("/api/network/centrality");
  return data;
};

export const getShortestPath = async (
  fromId: string,
  toId: string
): Promise<ShortestPath> => {
  const { data } = await api.get("/api/network/shortest-path", {
    params: { from: fromId, to: toId },
  });
  return data;
};

export const getTopCompanies = async (): Promise<TopCompany[]> => {
  const { data } = await api.get("/api/network/top-companies");
  return data;
};

export const getSkillTrends = async (): Promise<SkillTrends> => {
  const { data } = await api.get("/api/network/skill-trends");
  return data;
};

export const getBatchAnalysis = async (): Promise<BatchAnalysis[]> => {
  const { data } = await api.get("/api/network/batch-analysis");
  return data;
};