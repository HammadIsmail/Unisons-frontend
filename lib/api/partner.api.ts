import api from "@/lib/api";

export const getMyPartnerProfile = async () => {
  const { data } = await api.get("/api/partner/me");
  return data;
};

export const updatePartnerProfile = async (formData: FormData) => {
  const { data } = await api.put("/api/partner/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getPartnerConnections = async () => {
  const { data } = await api.get("/api/partner/connections");
  return data;
};
