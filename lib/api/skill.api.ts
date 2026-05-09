import api from "@/lib/api";

export const deleteSkill = async (
  skillId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/skills/${skillId}`);
  return data;
};

export const getAllSkills = async (): Promise<string[]> => {
  const { data } = await api.get("/api/skills/all");
  return data;
};
