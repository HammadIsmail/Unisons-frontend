import api from "@/lib/api";
import {
  AdminStats,
  PendingAccount,
  PaginatedAdminAlumni,
  PaginatedAdminStudents,
} from "@/types/api.types";

export const getDashboardStats = async (): Promise<AdminStats> => {
  const { data } = await api.get("/api/admin/dashboard-stats");
  return data;
};

export const getPendingAccounts = async (): Promise<PendingAccount[]> => {
  const { data } = await api.get("/api/admin/pending-accounts");
  return data;
};

export const approveAccount = async (
  id: string,
  role: string
): Promise<{ message: string }> => {
  const { data } = await api.patch(`/api/admin/approve-account/${id}`, { role });
  return data;
};

export const rejectAccount = async (
  id: string,
  role: string,
  rejection_reason: string
): Promise<{ message: string }> => {
  const { data } = await api.patch(`/api/admin/reject-account/${id}`, {
    role,
    rejection_reason,
  });
  return data;
};

export const getAllAlumni = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedAdminAlumni> => {
  const { data } = await api.get("/api/admin/all-alumni", { params });
  return data;
};

export const getAllStudents = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedAdminStudents> => {
  const { data } = await api.get("/api/admin/all-students", { params });
  return data;
};

export const removeAccount = async (
  id: string,
  role: string
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/admin/remove-account/${id}`, {
    data: { role },
  });
  return data;
};