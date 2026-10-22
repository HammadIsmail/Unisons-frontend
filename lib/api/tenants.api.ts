import api from "@/lib/api";
import { PublicTenant } from "@/types/api.types";

/**
 * Public endpoint to fetch all active universities for registration / picker
 */
export const getPublicTenants = async (): Promise<PublicTenant[]> => {
  const { data } = await api.get<PublicTenant[]>("/api/tenants");
  return data;
};
