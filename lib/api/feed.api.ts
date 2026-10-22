import api from "@/lib/api";
import { PaginatedFeed } from "@/types/api.types";

export const getFeed = async (params: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<PaginatedFeed> => {
  const { data } = await api.get("/api/feed", { params });
  return data;
};
