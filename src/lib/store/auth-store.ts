import { create } from "zustand";

export interface AuthStoreUser {
  username: string;
  tenantId: string | null;
  tenantCode: string | null;
  tenantName: string | null;
  branchId: string | null;
  branchName: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
}

interface AuthState {
  user: AuthStoreUser | null;
  setUser: (user: AuthStoreUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
