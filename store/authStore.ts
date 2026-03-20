import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole, AccountStatus } from "@/types/auth.types";
import { UserProfile } from "@/types/api.types";

interface AuthState {
    token: string | null;
    role: UserRole | null;
    account_status: AccountStatus | null;
    profile: UserProfile | null;
    isAuthenticated: boolean;

    setAuth: (
        token: string,
        role: UserRole,
        account_status: AccountStatus,
        profile: UserProfile
    ) => void;
    clearAuth: () => void;
    updateProfile: (profile: UserProfile) => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            role: null,
            account_status: null,
            profile: null,
            isAuthenticated: false,

            setAuth: (token, role, account_status, profile) => {
                localStorage.setItem("unison_token", token);
                set({ token, role, account_status, profile, isAuthenticated: true });
            },

            clearAuth: () => {
                localStorage.removeItem("unison_token");
                set({
                    token: null,
                    role: null,
                    account_status: null,
                    profile: null,
                    isAuthenticated: false,
                });
            },

            updateProfile: (profile) => set({ profile }),
        }),
        {
            name: "unison_auth",
            partialize: (state) => ({
                token: state.token,
                role: state.role,
                account_status: state.account_status,
                profile: state.profile,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;