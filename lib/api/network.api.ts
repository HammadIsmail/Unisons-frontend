import api from "@/lib/api";
import { SkillTrends } from "@/types/api.types";

export const getSkillTrends = async (): Promise<SkillTrends> => {
  const { data } = await api.get("/api/network/skill-trends");
  return data as SkillTrends;
};
