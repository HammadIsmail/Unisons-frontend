import api from "@/lib/api";

export const deleteSkill = async (
  skillId: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/skills/${skillId}`);
  return data;
};
