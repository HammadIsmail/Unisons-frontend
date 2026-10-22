import { create } from "zustand";
import { UserRole, OTPType } from "@/types/auth.types";
import { PublicTenant } from "@/types/api.types";

interface RegistrationState {
  step: 1 | 2 | 3;
  email: string;
  verifiedToken: string;
  otpType: OTPType;
  role: UserRole | null;
  tenant_id: string;
  selectedTenant: PublicTenant | null;

  setStep: (step: 1 | 2 | 3) => void;
  setEmail: (email: string) => void;
  setVerifiedToken: (token: string) => void;
  setOtpType: (type: OTPType) => void;
  setRole: (role: UserRole) => void;
  setTenant: (tenant: PublicTenant) => void;
  setTenantId: (tenant_id: string) => void;
  reset: () => void;
}

const useRegistrationStore = create<RegistrationState>()((set) => ({
  step: 1,
  email: "",
  verifiedToken: "",
  otpType: "email_verification",
  role: null,
  tenant_id: "",
  selectedTenant: null,

  setStep: (step) => set({ step }),
  setEmail: (email) => set({ email }),
  setVerifiedToken: (verifiedToken) => set({ verifiedToken }),
  setOtpType: (otpType) => set({ otpType }),
  setRole: (role) => set({ role }),
  setTenant: (tenant) => set({ tenant_id: tenant.id, selectedTenant: tenant }),
  setTenantId: (tenant_id) => set({ tenant_id }),
  reset: () =>
    set({
      step: 1,
      email: "",
      verifiedToken: "",
      otpType: "email_verification",
      role: null,
      tenant_id: "",
      selectedTenant: null,
    }),
}));

export default useRegistrationStore;