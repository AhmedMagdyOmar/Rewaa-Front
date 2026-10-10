import { api } from "@/lib/apiClient";
import { authTokens } from "@/lib/auth-token";
import { useAuthStore } from "@/lib/stores/auth-store";

export interface ProviderLoginCredentials {
  email: string;
  password: string;
  token?: string;
}

export interface TeacherTokenValidationResponse {
  valid: boolean;
  email: string;
  full_name: string;
}

export interface ProviderLoginResponse {
  user: {
    id: number;
    provider_id: number | null;
    full_name: string;
    email: string;
    phone_code: string | null;
    phone: string | null;
    user_type: string;
    roles?: Array<{ id: number; name: string }>;
    permissions?: string[];
  };
  access_token: string;
  token_type: string;
}

export interface StudentRegisterPayload {
  first_name: string;
  father_name?: string;
  family_name: string;
  additional_name?: string;
  phone_code: string;
  phone: string;
  guardian_phone_code: string;
  guardian_phone: string;
  email?: string;
  password: string;
  password_confirmation: string;
  gender: "male" | "female";
  country_id: number;
  governorate_id: number;
  educational_stage_id: number;
  provider_id?: number;
}

export interface RegisterOptionsResponse {
  genders: Array<{ value: string; label: string }>;
  countries: Array<{
    id: number;
    country_code: string | null;
    flag: string | null;
    name: Record<string, string>;
  }>;
  governorates: Array<{
    id: number;
    country_id: number;
    name: Record<string, string>;
  }>;
  educational_stages: Array<{
    id: number;
    name: Record<string, string>;
  }>;
}

export interface StudentLoginCredentials {
  login: string; // email, phone, or std-123
  password: string;
  phone_code?: string;
}

export interface StudentLoginResponse {
  student: {
    id: number;
    student_code: string;
    full_name: string;
    first_name?: string;
    family_name?: string;
    email: string;
    phone: string;
    phone_code?: string;
    status?: string;
    courses_count?: number;
    avatar_url?: string | null;
  };
  access_token: string;
  token_type: string;
}

export const authService = {
  /**
   * Provider / Assistant Dashboard Login
   */
  async providerLogin(credentials: ProviderLoginCredentials): Promise<ProviderLoginResponse> {
    const data = await api<ProviderLoginResponse>({
      url: "/api/dashboard/provider/auth/login",
      method: "POST",
      data: credentials,
    });

    if (data?.access_token) {
      authTokens.setToken(data.access_token, "provider");
      // Set role cookie for middleware routing
      if (typeof document !== "undefined") {
        document.cookie = `rewaa_role=assistant; path=/; SameSite=Lax`;
        document.cookie = `rewaa_auth=${encodeURIComponent(data.access_token)}; path=/; SameSite=Lax`;
      }
      // Hydrate the Zustand auth store
      const u = data.user;
      useAuthStore.getState().setUser(
        {
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: "provider",
          user_type: u.user_type ?? null,
        },
        "provider",
      );
    }

    return data;
  },

  /**
   * Validate teacher invite token
   */
  async validateTeacherToken(token: string): Promise<TeacherTokenValidationResponse> {
    const res = await api<TeacherTokenValidationResponse>({
      url: `/api/dashboard/provider/auth/validate-token?token=${encodeURIComponent(token)}`,
      method: "GET",
    });
    return res;
  },

  /**
   * Provider Dashboard Logout
   */
  async providerLogout(): Promise<void> {
    try {
      await api({
        url: "/api/dashboard/provider/auth/logout",
        method: "POST",
      });
    } finally {
      authTokens.clearToken("provider");
      useAuthStore.getState().clearUser();
      if (typeof document !== "undefined") {
        document.cookie = `rewaa_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `rewaa_auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      }
    }
  },

  /**
   * Provider Profile
   */
  async getProviderProfile(): Promise<ProviderLoginResponse["user"]> {
    const res = await api<{ user: ProviderLoginResponse["user"] }>({
      url: "/api/dashboard/provider/profile",
      method: "GET",
    });
    return res.user;
  },

  /**
   * Student Website Portal Login
   */
  async studentLogin(credentials: StudentLoginCredentials): Promise<StudentLoginResponse> {
    const data = await api<StudentLoginResponse>({
      url: "/api/website/auth/login",
      method: "POST",
      data: credentials,
    });

    if (data?.access_token) {
      authTokens.setToken(data.access_token, "student");
      if (typeof document !== "undefined") {
        document.cookie = `rewaa_role=student; path=/; SameSite=Lax`;
        document.cookie = `rewaa_auth=${encodeURIComponent(data.access_token)}; path=/; SameSite=Lax`;
      }
      // Hydrate the Zustand auth store
      const s = data.student;
      useAuthStore.getState().setUser(
        {
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          role: "student",
          avatar_url: s.avatar_url ?? null,
          avatarUrl: s.avatar_url ?? null,
        },
        "student",
      );
    }

    return data;
  },

  /**
   * Student Website Portal Logout
   */
  async studentLogout(): Promise<void> {
    try {
      await api({
        url: "/api/website/auth/logout",
        method: "POST",
      });
    } finally {
      authTokens.clearToken("student");
      useAuthStore.getState().clearUser();
      if (typeof document !== "undefined") {
        document.cookie = `rewaa_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `rewaa_auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      }
    }
  },

  /**
   * Student Website Portal Register
   */
  async studentRegister(payload: StudentRegisterPayload): Promise<StudentLoginResponse> {
    const data = await api<StudentLoginResponse>({
      url: "/api/website/auth/register",
      method: "POST",
      data: payload,
    });

    if (data?.access_token) {
      authTokens.setToken(data.access_token, "student");
      if (typeof document !== "undefined") {
        document.cookie = `rewaa_role=student; path=/; SameSite=Lax`;
        document.cookie = `rewaa_auth=${encodeURIComponent(data.access_token)}; path=/; SameSite=Lax`;
      }
      // Hydrate the Zustand auth store
      const s = data.student;
      useAuthStore.getState().setUser(
        {
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          role: "student",
          avatar_url: s.avatar_url ?? null,
          avatarUrl: s.avatar_url ?? null,
        },
        "student",
      );
    }

    return data;
  },

  /**
   * Public Registration Options (Countries, Governorates, Stages)
   */
  async getRegisterOptions(params?: {
    country_id?: number;
    provider_id?: number;
  }): Promise<RegisterOptionsResponse> {
    return api<RegisterOptionsResponse>({
      url: "/api/website/auth/options",
      method: "GET",
      params,
    });
  },

  /**
   * Student Profile
   */
  async getStudentProfile(): Promise<StudentLoginResponse["student"]> {
    const res = await api<
      StudentLoginResponse["student"] | { student?: StudentLoginResponse["student"] }
    >({
      url: "/api/website/profile",
      method: "GET",
    });
    return (
      (res as { student?: StudentLoginResponse["student"] })?.student ??
      (res as StudentLoginResponse["student"])
    );
  },
};
