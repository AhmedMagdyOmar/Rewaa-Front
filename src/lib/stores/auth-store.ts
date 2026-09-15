/**
 * Unified Zustand Auth Store
 *
 * Holds the currently authenticated user (provider or student).
 * Persisted to localStorage so the sidebar/navbar can display the user
 * name immediately on hard refresh without an extra network round-trip.
 *
 * Hydrated on:
 *   - Login  → authService.providerLogin / studentLogin
 *   - Logout → authService.providerLogout / studentLogout
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AuthRole = "provider" | "student";

export interface AuthUser {
  id: number | string;
  full_name: string;
  email: string;
  role: AuthRole;
  avatarUrl?: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser, role: AuthRole) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,

      setUser: (user, role) => set({ user: { ...user, role }, role, isAuthenticated: true }),

      clearUser: () => set({ user: null, role: null, isAuthenticated: false }),
    }),
    {
      name: "rewaa_auth_state",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage),
      ),
      // Only persist the user/role state, not actions
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
