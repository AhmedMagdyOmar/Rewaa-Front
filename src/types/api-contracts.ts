/**
 * Standard Laravel API response envelopes and common DTO types
 * Matching App\Support\ApiResponse in backend
 */

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface ApiPaginationMeta {
  current_page: number;
  from?: number | null;
  last_page: number;
  per_page: number;
  to?: number | null;
  total: number;
}

export interface ApiPaginatedResponse<T = unknown> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page: number;
  last_page_url?: string;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

export interface LaravelValidationError {
  message: string;
  errors: Record<string, string[]>;
  status?: number;
}

export interface TranslatableField {
  ar: string;
  en: string;
}
