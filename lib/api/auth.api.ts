import api from "@/lib/api";
import {
  OTPResponse,
  VerifyOTPResponse,
  RegisterResponse,
  LoginResponse,
  ResetPasswordResponse,
} from "@/types/api.types";
import { OTPType } from "@/types/auth.types";

export const sendOTP = async (email: string, type: OTPType): Promise<OTPResponse> => {
  const { data } = await api.post("/api/auth/send-otp", { email, type });
  return data;
};

export const verifyOTP = async (
  email: string,
  otp: string,
  type: OTPType
): Promise<VerifyOTPResponse> => {
  const { data } = await api.post("/api/auth/verify-otp", { email, otp, type });
  return data;
};

export const registerUser = async (payload: {
  verified_token: string;
  username: string;
  display_name: string;
  email: string;
  password: string;
  role: "alumni" | "student";
  roll_number: string;
  degree: string;
  graduation_year?: number;
  semester?: number;
  student_card: File;
}): Promise<RegisterResponse> => {
  const formData = new FormData();
  formData.append("verified_token", payload.verified_token);
  formData.append("username", payload.username);
  formData.append("display_name", payload.display_name);
  formData.append("email", payload.email);
  formData.append("password", payload.password);
  formData.append("role", payload.role);
  formData.append("roll_number", payload.roll_number);
  formData.append("degree", payload.degree);
  if (payload.graduation_year) {
    formData.append("graduation_year", String(payload.graduation_year));
  }
  if (payload.semester) {
    formData.append("semester", String(payload.semester));
  }
  formData.append("student_card", payload.student_card);

  const { data } = await api.post("/api/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
};

export const resetPassword = async (
  verified_token: string,
  new_password: string
): Promise<ResetPasswordResponse> => {
  const { data } = await api.post("/api/auth/reset-password", {
    verified_token,
    new_password,
  });
  return data;
};