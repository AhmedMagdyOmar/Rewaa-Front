import "server-only";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { cookies, headers } from "next/headers";
import type { ApiResponse } from "@/types/api-contracts";
import type { CustomAxiosError } from "./apiClient";

const TOKEN_KEYS = {
  PROVIDER: "rewaa_provider_token",
  STUDENT: "rewaa_student_token",
  GENERAL: "rewaa_auth_token",
  AUTH: "rewaa_auth",
} as const;

export type ServerAuthRole = "provider" | "student" | "general";

/**
 * Creates an Axios instance specifically pre-configured for Next.js Server Components,
 * Server Actions, and Route Handlers. Automatically forwards auth tokens, incoming
 * cookies, and active locale from server context.
 */
export async function createServerApiInstance(roleOverride?: ServerAuthRole) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const backendUrl =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const instance = axios.create({
    baseURL: backendUrl,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use(async (config) => {
    const url = config.url || "";

    // 1. Determine role context if not overridden
    let role: ServerAuthRole = roleOverride ?? "general";
    if (!roleOverride) {
      if (url.includes("/dashboard/provider")) {
        role = "provider";
      } else if (url.includes("/website")) {
        role = "student";
      }
    }

    // 2. Extract token from server cookies
    const token =
      role === "provider"
        ? (cookieStore.get(TOKEN_KEYS.PROVIDER)?.value ??
          cookieStore.get(TOKEN_KEYS.GENERAL)?.value ??
          cookieStore.get(TOKEN_KEYS.AUTH)?.value)
        : role === "student"
          ? (cookieStore.get(TOKEN_KEYS.STUDENT)?.value ??
            cookieStore.get(TOKEN_KEYS.GENERAL)?.value ??
            cookieStore.get(TOKEN_KEYS.AUTH)?.value)
          : (cookieStore.get(TOKEN_KEYS.GENERAL)?.value ??
            cookieStore.get(TOKEN_KEYS.AUTH)?.value ??
            cookieStore.get(TOKEN_KEYS.PROVIDER)?.value ??
            cookieStore.get(TOKEN_KEYS.STUDENT)?.value);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Forward Cookie header so Laravel Sanctum session-based auth / state works
    const cookieString = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    if (cookieString) {
      config.headers.Cookie = cookieString;
    }

    // 4. Forward Accept-Language / active locale
    const acceptLanguage = headerStore.get("accept-language");
    if (acceptLanguage) {
      config.headers["Accept-Language"] = acceptLanguage;
    }

    return config;
  });

  // Response unwrapping matching client-side apiClient
  instance.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (
        body &&
        typeof body === "object" &&
        "data" in body &&
        "status" in body &&
        typeof (body as ApiResponse).status === "number"
      ) {
        return body.data;
      }
      return body;
    },
    async (error: AxiosError) => {
      const customError: CustomAxiosError = error;
      if (error.response) {
        const { status, data } = error.response;
        const errorData = data as Record<string, unknown> | undefined;

        if (errorData && typeof errorData.message === "string") {
          customError.apiMessage = errorData.message;
        }

        if (status === 422 && errorData && errorData.errors) {
          customError.validationErrors = errorData.errors as Record<string, string[]>;
        }
      }
      return Promise.reject(customError);
    },
  );

  return instance;
}

/**
 * Server-side API invoker function for Server Components and Actions.
 *
 * @example
 * ```ts
 * const profile = await serverApi<AuthControllerGetProfile200>({
 *   url: "/api/dashboard/provider/profile",
 * });
 * ```
 */
export async function serverApi<T = unknown>(
  config: AxiosRequestConfig,
  role?: ServerAuthRole,
): Promise<T> {
  const instance = await createServerApiInstance(role);
  const response = await instance(config);
  return response as unknown as T;
}
