import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { authTokens } from "./auth-token";
import type { ApiResponse } from "@/types/api-contracts";

export interface CustomAxiosError extends AxiosError {
  validationErrors?: Record<string, string[]>;
  apiMessage?: string;
}

/**
 * Pre-configured Axios instance for application-wide API requests.
 * Includes base URL from environment, content-type headers, and withCredentials.
 */
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

/**
 * Request Interceptor:
 * 1. Attaches Laravel Sanctum Bearer token dynamically.
 * 2. Injects active locale for Astrotomic Translatable & SetLocale middleware.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Determine role context from URL path if applicable
    const url = config.url || "";

    // If request targets Next.js internal auth handlers (/api/auth/*), do not prefix with external backend URL
    if (url.startsWith("/api/auth/")) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        config.baseURL = appUrl;
      } else if (typeof window !== "undefined") {
        config.baseURL = window.location.origin;
      }
    }

    let role: "provider" | "student" | "general" = "general";
    if (url.includes("/dashboard/provider")) {
      role = "provider";
    } else if (url.includes("/website")) {
      role = "student";
    }

    const token = authTokens.getToken(role);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inject active locale from HTML lang attribute or fallback
    if (typeof window !== "undefined") {
      const htmlLang = document.documentElement.lang;
      const locale = htmlLang === "en" ? "en" : "ar";
      config.headers["Accept-Language"] = locale;
    } else {
      config.headers["Accept-Language"] = "ar";
    }

    // 3. For FormData (multipart uploads), delete default Content-Type header so browser/axios sets multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor:
 * 1. Unwraps Laravel standard ApiResponse envelope: { status, message, data }.
 * 2. Transforms Laravel 422 Validation Error into standard validationErrors map.
 * 3. Handles 401 Unauthorized global redirect / notification hooks.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    const body = response.data;

    // Unwrap Laravel ApiResponse envelope if present
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

      // Capture Laravel message if available
      if (errorData && typeof errorData.message === "string") {
        customError.apiMessage = errorData.message;
      }

      // 422 Unprocessable Entity - Validation Errors
      if (status === 422 && errorData && errorData.errors) {
        customError.validationErrors = errorData.errors as Record<string, string[]>;
      }

      // 401 Unauthorized - Expired or invalid token
      if (status === 401) {
        if (typeof window !== "undefined") {
          // Optional: Dispatched event or callback can be registered here
          window.dispatchEvent(
            new CustomEvent("rewaa:unauthorized", { detail: { url: error.config?.url } }),
          );
        }
      }
    }

    return Promise.reject(customError);
  },
);

/**
 * Custom Axios API client for making HTTP requests with proper error handling.
 *
 * @param config - Axios request configuration
 * @param options - Axios request options (merged with base config)
 * @returns Promise with unwrapped API response data
 *
 * @example
 * ```ts
 * const courses = await api<Course[]>({ url: "/api/dashboard/provider/courses" });
 * ```
 */
export const api = async <T = unknown>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await axiosInstance({
    ...config,
    ...options,
  });

  // If interceptor already unwrapped response.data, axios returns it as response directly
  // or as response.data depending on axios client build. We normalize it safely:
  return response as unknown as T;
};
