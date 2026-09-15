/**
 * Unified auth hook entry point.
 *
 * Re-exports role-aware TanStack Query hooks from `use-auth-queries`
 * and the Zustand auth store. Import from here throughout the app.
 *
 */

// Role-aware hooks backed by auth-service.ts → Laravel Sanctum
export {
  useProviderLogin,
  useProviderLogout,
  useProviderProfile,
  useStudentLogin,
  useStudentLogout,
  useStudentProfile,
} from "./use-auth-queries";

export { useAuthStore } from "@/lib/stores/auth-store";
