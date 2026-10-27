import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserRole, AccountStatus } from "@/types/auth.types";
import { UserProfile, PublicTenant } from "@/types/api.types";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  account_status: AccountStatus | null;
  profile: UserProfile | null;
  tenant: PublicTenant | null;
  isAuthenticated: boolean;

  setAuth: (
    token: string,
    role: UserRole,
    account_status: AccountStatus,
    profile: UserProfile,
    tenant?: PublicTenant | null
  ) => void;
  setRole: (role: UserRole) => void;
  setTenant: (tenant: PublicTenant | null) => void;
  clearAuth: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

// Cookie storage for middleware access
const cookieStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      account_status: null,
      profile: null,
      tenant: null,
      isAuthenticated: false,

      setAuth: (token, role, account_status, profile, tenant = null) => {
        localStorage.setItem("unison_token", token);
        set({ token, role, account_status, profile, tenant, isAuthenticated: true });
      },

      setRole: (role) => set({ role }),

      setTenant: (tenant) => set({ tenant }),

      clearAuth: () => {
        localStorage.removeItem("unison_token");
        set({
          token: null,
          role: null,
          account_status: null,
          profile: null,
          tenant: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (profile) =>
        set((state) => {
          const newRole = ((profile as any)?.role as UserRole) || state.role;
          return {
            profile: state.profile ? ({ ...state.profile, ...profile } as UserProfile) : (profile as UserProfile),
            role: newRole,
          };
        }),
    }),
    {
      name: "unison_auth",
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        account_status: state.account_status,
        profile: state.profile,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
export default useAuthStore;