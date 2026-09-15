/**
 * Unified Token Management Utility
 *
 * Supports storing, retrieving, and removing Sanctum Personal Access Tokens
 * across both browser storage and cookies for Next.js SSR / client boundary compatibility.
 */

const TOKEN_KEYS = {
  PROVIDER: "rewaa_provider_token",
  STUDENT: "rewaa_student_token",
  GENERAL: "rewaa_auth_token",
} as const;

export type AuthRole = "provider" | "student" | "general";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match && match[3] ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const authTokens = {
  getToken(role: AuthRole = "general"): string | null {
    if (typeof window === "undefined") return null;

    // Check specific role token first, then fallback
    const key =
      role === "provider"
        ? TOKEN_KEYS.PROVIDER
        : role === "student"
          ? TOKEN_KEYS.STUDENT
          : TOKEN_KEYS.GENERAL;

    const fromStorage = localStorage.getItem(key);
    if (fromStorage) return fromStorage;

    const fromCookie = getCookie(key);
    if (fromCookie) return fromCookie;

    // Fallbacks
    if (role === "general") {
      return (
        localStorage.getItem(TOKEN_KEYS.PROVIDER) ||
        localStorage.getItem(TOKEN_KEYS.STUDENT) ||
        getCookie(TOKEN_KEYS.PROVIDER) ||
        getCookie(TOKEN_KEYS.STUDENT)
      );
    }

    return null;
  },

  setToken(token: string, role: AuthRole = "general") {
    if (typeof window === "undefined") return;

    const key =
      role === "provider"
        ? TOKEN_KEYS.PROVIDER
        : role === "student"
          ? TOKEN_KEYS.STUDENT
          : TOKEN_KEYS.GENERAL;

    localStorage.setItem(key, token);
    setCookie(key, token);

    // Also sync general fallback if role-specific
    localStorage.setItem(TOKEN_KEYS.GENERAL, token);
    setCookie(TOKEN_KEYS.GENERAL, token);
  },

  clearToken(role: AuthRole = "general") {
    if (typeof window === "undefined") return;

    if (role === "provider") {
      localStorage.removeItem(TOKEN_KEYS.PROVIDER);
      removeCookie(TOKEN_KEYS.PROVIDER);
    } else if (role === "student") {
      localStorage.removeItem(TOKEN_KEYS.STUDENT);
      removeCookie(TOKEN_KEYS.STUDENT);
    } else {
      localStorage.removeItem(TOKEN_KEYS.PROVIDER);
      localStorage.removeItem(TOKEN_KEYS.STUDENT);
      localStorage.removeItem(TOKEN_KEYS.GENERAL);
      removeCookie(TOKEN_KEYS.PROVIDER);
      removeCookie(TOKEN_KEYS.STUDENT);
      removeCookie(TOKEN_KEYS.GENERAL);
    }
  },
};
