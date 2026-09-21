import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Derives the fine-grained provider role from the backend `user_type` stored
 * in the auth store at login time.
 *
 * Backend UserTypeEnum values that map to each role:
 *   - isAdmin    → "center" | "group"   (can manage teachers, assistants, grades, subjects)
 *   - isTeacher  → "teacher"            (read-only: grades, subjects)
 *   - isAssistant→ "assistant"          (read-only: grades, subjects)
 *
 * The existing `role: "provider"` on AuthUser is unchanged — it controls which
 * token bucket is used and must NOT be modified.
 */
export function useProviderRole() {
  const user_type = useAuthStore((s) => s.user?.user_type?.toLowerCase() ?? null);

  const isAdmin = user_type === "center" || user_type === "group";
  const isTeacher = user_type === "teacher";
  const isAssistant = user_type === "assistant";

  return { isAdmin, isTeacher, isAssistant, user_type };
}
