import api from "@/lib/api";

export const getMyPartnerProfile = async () => {
  const { data } = await api.get("/api/partner/me");
  return data;
};

// NOTE: Profile updates are unified. Use updateUserProfile from profiles.api.ts → PUT /api/profile/me

export const getPartnerConnections = async () => {
  const { data } = await api.get("/api/partner/connections");
  return data;
};
