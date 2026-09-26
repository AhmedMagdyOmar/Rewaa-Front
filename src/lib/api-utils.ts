import { CustomAxiosError } from "./apiClient";

interface ApiErrorPayload {
  message?: string | string[];
  statusCode?: number;
  status?: number;
  errors?: Record<string, string[]>;
}

interface DataType {
  data?: ApiErrorPayload;
  status?: number;
}

/**
 * Extracts a human-readable error message from an API response, Axios error,
 * or Laravel 422 validation errors dictionary.
 *
 * @param error - The error object from mutation or query
 * @param dataObj - Fallback response object
 * @returns A string containing the friendly error message
 */
export function getErrorMessage(error: unknown, dataObj?: unknown): string | null {
  if (!error && !dataObj) return null;

  // 1. Check CustomAxiosError with Laravel validation errors
  const axiosErr = error as CustomAxiosError;
  if (axiosErr?.validationErrors) {
    const firstKey = Object.keys(axiosErr.validationErrors)[0];
    if (firstKey && axiosErr.validationErrors[firstKey]?.length > 0) {
      return axiosErr.validationErrors[firstKey][0];
    }
  }

  // 1b. Check direct error.response.data for Laravel validation errors
  const resData = (axiosErr?.response?.data || {}) as Record<string, unknown>;
  if (resData.errors && typeof resData.errors === "object") {
    const errorsObj = resData.errors as Record<string, string[]>;
    const firstKey = Object.keys(errorsObj)[0];
    if (firstKey && Array.isArray(errorsObj[firstKey]) && errorsObj[firstKey].length > 0) {
      return errorsObj[firstKey][0];
    }
  }

  // 2. Check apiMessage from Laravel ApiResponse or response.data.message
  if (axiosErr?.apiMessage) {
    return axiosErr.apiMessage;
  }
  if (typeof resData.message === "string" && resData.message) {
    return resData.message;
  }

  // 3. Check generic API error payload
  const dtoErr = error as ApiErrorPayload;
  if (dtoErr?.message) {
    if (Array.isArray(dtoErr.message)) {
      return dtoErr.message.join(", ");
    }
    return dtoErr.message;
  }

  // 4. Fallback data object - check if it contains an application-level error (4xx/5xx)
  const data = dataObj as DataType & { statusCode?: number };
  const status = data?.status || data?.statusCode;
  if (status && status >= 400 && data.data) {
    if (Array.isArray(data.data.message)) {
      return data.data.message.join(", ");
    }
    return data.data.message || "An error occurred";
  }

  // 5. Standard Error object (ignore generic Axios error messages like "Request failed with status code 422")
  if (error instanceof Error && error.message) {
    if (!error.message.includes("Request failed with status code")) {
      return error.message;
    }
  }

  // If there is no error and data is successful (e.g. 200/201), there is no error!
  if (!error) {
    return null;
  }

  return null;
}
