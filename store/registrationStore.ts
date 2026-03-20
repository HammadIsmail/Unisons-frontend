import { create } from "zustand";
import { UserRole, OTPType } from "@/types/auth.types";

interface RegistrationState {
    step: 1 | 2 | 3;
    email: string;
    verifiedToken: string;
    otpType: OTPType;
    role: UserRole | null;

    setStep: (step: 1 | 2 | 3) => void;
    setEmail: (email: string) => void;
    setVerifiedToken: (token: string) => void;
    setOtpType: (type: OTPType) => void;
    setRole: (role: UserRole) => void;
    reset: () => void;
}

const useRegistrationStore = create<RegistrationState>()((set) => ({
    step: 1,
    email: "",
    verifiedToken: "",
    otpType: "email_verification",
    role: null,

    setStep: (step) => set({ step }),
    setEmail: (email) => set({ email }),
    setVerifiedToken: (verifiedToken) => set({ verifiedToken }),
    setOtpType: (otpType) => set({ otpType }),
    setRole: (role) => set({ role }),
    reset: () =>
        set({
            step: 1,
            email: "",
            verifiedToken: "",
            otpType: "email_verification",
            role: null,
        }),
}));

export default useRegistrationStore;