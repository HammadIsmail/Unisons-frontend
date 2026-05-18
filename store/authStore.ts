import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
  },
};

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      account_status: null,
      profile: null,
      isAuthenticated: false,

      setAuth: (token, role, account_status, profile) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("unison_token", token);
        }
        set({ token, role, account_status, profile, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("unison_token");
        }
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
      storage: createJSONStorage(() => safeStorage),
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

export { useAuthStore };
export default useAuthStore;