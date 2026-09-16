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

export type CourseStatus = "draft" | "scheduled" | "published";
export type CourseDeliveryMode = "onsite" | "online" | "hybrid";
export type SubscriptionPeriod = "monthly" | "yearly" | "term";
export type CourseSectionStatus = "draft" | "scheduled" | "published";

export interface BackendCourseOptions {
  currency_code: string[];
  subscription_periods: Record<string, string>;
  delivery_modes: Record<string, string>;
  statuses: Record<string, string>;
  section_statuses: Record<string, string>;
  educational_stages: Array<{
    id: number;
    name: Record<string, string>;
  }>;
  subjects: Array<{
    id: number;
    name: Record<string, string>;
  }>;
  instructors: Array<{
    id: number;
    full_name: string;
  }>;
  requires_instructor_selection?: boolean;
}

export interface BackendCourseSection {
  id: number;
  course_id: number;
  title: Record<string, string>;
  position: number;
  status: CourseSectionStatus;
  status_label: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  exam_id?: number | null;
  exam?: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  } | null;
  requires_exam_pass_to_unlock_next_section?: boolean;
  lessons_count: number;
  lessons?: BackendLessonItem[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendLessonItem {
  id: number;
  provider_id?: number;
  course_id?: number;
  course_section_id?: number;
  title: Record<string, string>;
  description?: Record<string, string>;
  intro_video_url?: string | null;
  type?: string;
  type_label?: string;
  classification?: string;
  status?: string;
  position?: number;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BackendCourse {
  id: number;
  provider_id: number;
  created_by_id: number;
  title: Record<string, string>;
  description?: Record<string, string>;
  intro_video_url?: string | null;
  cover_image?: string | null;
  educational_stage_id: number;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  };
  subject_id: number;
  subject?: {
    id: number;
    name: Record<string, string>;
  } | null;
  instructor_id: number;
  instructor?: {
    id: number;
    full_name: string;
  } | null;
  subscription_period: SubscriptionPeriod;
  subscription_period_label: string;
  is_free: boolean;
  base_price: number | string;
  currency_code?: string | null;
  has_discount: boolean;
  is_discount_active?: boolean;
  discount_percentage: number;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  discount_amount: number;
  final_price: number;
  has_limited_access: boolean;
  access_duration_days?: number | null;
  uses_student_groups: boolean;
  delivery_mode: CourseDeliveryMode;
  delivery_mode_label: string;
  status: CourseStatus;
  status_label: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  is_active: boolean;
  sections?: BackendCourseSection[];
  sections_count: number;
  enrolled_students_count: number;
  lessons_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseStatusCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
  draft_and_scheduled?: number;
}

export interface CourseListResponse {
  courses: BackendCourse[];
  status_counts: CourseStatusCounts;
  pagination: ApiPaginationMeta;
}
