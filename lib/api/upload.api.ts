import api from "@/lib/api";

export const uploadImage = async (
  file: File
): Promise<{
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/api/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};