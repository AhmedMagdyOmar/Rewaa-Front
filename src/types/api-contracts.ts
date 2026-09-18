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
  cover_image?: string | null;
  cover_image_url?: string | null;
  type?: string;
  type_label?: string;
  classification?: string;
  status?: string;
  scheduled_publish_at?: string | null;
  position?: number;
  views_count?: number;
  has_pdf_attachments?: boolean;
  pdf_attachments?: Array<{
    id: number;
    name: string;
    file_name?: string;
    mime_type: string | null;
    size: number;
    url: string;
  }>;
  has_explanatory_images?: boolean;
  explanatory_images?: Array<{
    id: number;
    name: string;
    file_name?: string;
    mime_type: string | null;
    size: number;
    url: string;
  }>;
  exam_id?: number | null;
  exam?: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  } | null;
  requires_exam_pass_to_unlock_next_lesson?: boolean;
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

// -------------------------------------------------------------
// Lessons Contracts (Provider Dashboard)
// -------------------------------------------------------------

export type LessonClassification = "standalone" | "course";
export type LessonTypeBackend = "video_and_text" | "text_only";
export type LessonStatusBackend = "draft" | "scheduled" | "published";

export interface BackendLessonMediaItem {
  id: number;
  source: "upload" | "asset" | string;
  name: string;
  file_name?: string;
  mime_type: string | null;
  size: number;
  url: string;
}

export interface BackendLesson {
  id: number;
  provider_id: number;
  created_by_id: number;
  lesson_template_id?: number | null;
  lesson_template?: {
    id: number;
    name: string;
  } | null;
  original_lesson_id?: number | null;
  is_clone?: boolean;
  instructor_id: number;
  course_id?: number | null;
  course_section_id?: number | null;
  course?: {
    id: number;
    title: Record<string, string>;
    cover_image?: string | null;
  } | null;
  course_section?: {
    id: number;
    title: Record<string, string>;
    position: number;
  } | null;
  classification: LessonClassification;
  classification_label?: string;
  is_standalone: boolean;
  educational_stage_id?: number | null;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  } | null;
  subject_id?: number | null;
  subject?: {
    id: number;
    name: Record<string, string>;
  } | null;
  type: LessonTypeBackend;
  type_label?: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  video_url?: string | null;
  cover_image_url?: string | null;
  cover_image?: string | null;
  instructor?: {
    id: number;
    full_name: string;
    avatar?: string | null;
  } | null;
  completions_count?: number;
  delivery_mode?: CourseDeliveryMode | null;
  delivery_mode_label?: string | null;
  has_pdf_attachments: boolean;
  pdf_attachments: BackendLessonMediaItem[];
  has_explanatory_images: boolean;
  explanatory_images: BackendLessonMediaItem[];
  position: number;
  has_exam: boolean;
  exam_id?: number | null;
  exam?: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  } | null;
  requires_exam_pass_to_unlock_next_lesson: boolean;
  status: LessonStatusBackend;
  status_label?: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BackendLessonOptions {
  classifications: Record<string, string>;
  lesson_types: Record<string, string>;
  delivery_modes: Record<string, string>;
  statuses: Record<string, string>;
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
  courses: Array<{
    id: number;
    title: Record<string, string>;
    instructor_id: number;
    instructor?: { id: number; full_name: string } | null;
    sections: Array<{
      id: number;
      title: Record<string, string>;
      position: number;
    }>;
  }>;
  exams: Array<{
    id: number;
    course_id?: number | null;
    instructor_id: number;
    educational_stage_id: number;
    subject_id: number;
    title: Record<string, string>;
    passing_percentage: number;
  }>;
}

export interface LessonStatusCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
  draft_and_scheduled?: number;
}

export interface LessonClassificationCounts {
  all: number;
  standalone: number;
  course: number;
}

export interface LessonListResponse {
  lessons: BackendLesson[];
  status_counts: LessonStatusCounts;
  classification_counts?: LessonClassificationCounts;
  pagination: ApiPaginationMeta;
}

export interface LessonFilterParams {
  search?: string;
  status?: string;
  statuses?: string[];
  classification?: LessonClassification;
  course_id?: number | string;
  course_section_id?: number | string;
  exclude_clones?: boolean;
  sort?: "latest" | "oldest" | string;
  page?: number;
  per_page?: number;
}

export interface StoreLessonData {
  lesson_template_id?: number;
  original_lesson_id?: number;
  classification: LessonClassification;
  course_id?: number;
  course_section_id?: number;
  educational_stage_id?: number;
  subject_id?: number;
  instructor_id?: number;
  delivery_mode?: string;
  type: LessonTypeBackend;
  title: { ar: string; en?: string };
  description?: { ar?: string; en?: string };
  video_url?: string;
  cover_image?: File | null;
  cover_image_url?: string;
  has_pdf_attachments: boolean;
  pdf_files?: File[];
  has_explanatory_images: boolean;
  explanatory_images?: File[];
  has_exam: boolean;
  exam_id?: number | null;
  requires_exam_pass_to_unlock_next_lesson: boolean;
  status: LessonStatusBackend | string;
  scheduled_publish_at?: string;
  is_active: boolean;
}

export interface UpdateLessonData extends Partial<StoreLessonData> {
  remove_cover_image?: boolean;
  delete_media_ids?: number[];
  delete_media_asset_ids?: number[];
}

export interface ReorderLessonsData {
  classification: LessonClassification;
  course_id?: number;
  course_section_id?: number;
  lesson_ids: number[];
}
