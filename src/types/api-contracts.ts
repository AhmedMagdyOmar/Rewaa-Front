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
  video_url?: string | null;
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

// ─── Provider Exams & Question Bank DTOs ──────────────────────────────────────

export type ExamStatus = "draft" | "scheduled" | "published";
export type ExamClassification =
  | "final"
  | "midterm"
  | "test"
  | "coursework"
  | "comprehensive"
  | "unit"
  | "quiz"
  | "placement";

export type QuestionTypeBackend = "multiple_choice" | "true_false" | "essay";
export type QuestionDifficultyBackend = "easy" | "medium" | "hard";
export type QuestionClassificationBackend =
  | "theoretical"
  | "practical_applied"
  | "applied"
  | "analytical"
  | "oral"
  | "skill_based";

export interface BackendQuestionOption {
  id?: number;
  position?: number;
  text: Record<string, string>;
  is_correct: boolean;
}

export interface BackendQuestion {
  id: number;
  provider_id: number;
  created_by_id: number;
  question_template_id?: number | null;
  exam_id?: number | null;
  exam?: { id: number; title: Record<string, string> } | null;
  exam_section_id?: number | null;
  exam_section?: { id: number; title: Record<string, string>; position: number } | null;
  is_standalone: boolean;
  type: QuestionTypeBackend;
  type_label: string;
  title: Record<string, string>;
  body?: Record<string, string> | null;
  difficulty: QuestionDifficultyBackend;
  difficulty_label: string;
  classification: QuestionClassificationBackend;
  classification_label: string;
  educational_stage_id: number;
  educational_stage?: { id: number; name: Record<string, string> };
  subject_id: number;
  subject?: { id: number; name: Record<string, string> };
  instructor_id: number;
  instructor?: { id: number; full_name: string } | null;
  score: number;
  correct_answer?: boolean | null;
  position?: number | null;
  has_explanation: boolean;
  explanation?: Record<string, string> | null;
  model_answer?: Record<string, string> | null;
  options?: BackendQuestionOption[];
  usage_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BackendExamSection {
  id: number;
  exam_id: number;
  title: Record<string, string>;
  instructions?: Record<string, string> | null;
  position: number;
  is_active: boolean;
  questions?: BackendQuestion[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendExam {
  id: number;
  provider_id: number;
  created_by_id: number;
  exam_template_id?: number | null;
  title: Record<string, string>;
  description?: Record<string, string> | null;
  educational_stage_id: number;
  educational_stage?: { id: number; name: Record<string, string> };
  subject_id: number;
  subject?: { id: number; name: Record<string, string> } | null;
  instructor_id: number;
  instructor?: { id: number; full_name: string } | null;
  course_id?: number | null;
  course?: { id: number; title: Record<string, string> } | null;
  course_section_id?: number | null;
  course_section?: { id: number; title: Record<string, string> } | null;
  lesson_id?: number | null;
  lesson?: { id: number; title: Record<string, string> } | null;
  is_standalone: boolean;
  classification: ExamClassification | string;
  classification_label: string;
  duration_minutes: number;
  ends_at?: string | null;
  passing_percentage: number;
  max_attempts: number;
  questions_limit?: number | null;
  show_correct_answers_after_submission: boolean;
  shuffle_questions: boolean;
  shuffle_answer_options: boolean;
  delivery_mode: string;
  delivery_mode_label: string;
  status: ExamStatus | string;
  status_label: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  is_active: boolean;
  questions_count: number;
  questions?: BackendQuestion[];
  sections?: BackendExamSection[];
  students_count: number;
  attempts_count: number;
  success_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExamStatusCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
  draft_and_scheduled?: number;
}

export interface ExamListResponse {
  exams: BackendExam[];
  status_counts: ExamStatusCounts;
  pagination: ApiPaginationMeta;
}

export interface ExamFilterParams {
  search?: string;
  status?: string;
  statuses?: string[];
  classification?: string;
  course_id?: number | string;
  course_section_id?: number | string;
  sort?: "latest" | "oldest" | string;
  page?: number;
  per_page?: number;
}

export interface BackendExamOptions {
  classifications: Record<string, string>;
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
    educational_stage_id: number;
    subject_id: number;
    instructor_id: number;
    sections: Array<{
      id: number;
      title: Record<string, string>;
      position: number;
      exam_id?: number | null;
      lessons: Array<{
        id: number;
        title: Record<string, string>;
        position: number;
        exam_id?: number | null;
      }>;
    }>;
  }>;
}

export interface StoreExamData {
  exam_template_id?: number | null;
  title: { ar: string; en?: string };
  description?: { ar?: string; en?: string };
  educational_stage_id: number;
  subject_id: number;
  instructor_id?: number;
  course_id?: number | null;
  course_section_id?: number | null;
  lesson_id?: number | null;
  classification: string;
  duration_minutes: number;
  ends_at?: string | null;
  passing_percentage: number;
  max_attempts: number;
  questions_limit?: number | null;
  show_correct_answers_after_submission: boolean;
  shuffle_questions: boolean;
  shuffle_answer_options: boolean;
  delivery_mode: string;
  is_active: boolean;
}

export type UpdateExamData = Partial<StoreExamData>;

export interface StoreExamSectionData {
  title: { ar: string; en?: string };
  instructions?: { ar?: string; en?: string };
  is_active?: boolean;
}

export type UpdateExamSectionData = Partial<StoreExamSectionData>;

export interface QuestionListResponse {
  questions: BackendQuestion[];
  pagination: ApiPaginationMeta;
}

export interface QuestionFilterParams {
  search?: string;
  type?: string;
  difficulty?: string;
  classification?: string;
  educational_stage_id?: number | string;
  subject_id?: number | string;
  instructor_id?: number | string;
  exam_id?: number | string;
  exam_section_id?: number | string;
  is_standalone?: boolean | string;
  sort?: "latest" | "oldest" | string;
  page?: number;
  per_page?: number;
}

export interface BackendQuestionOptions {
  types: Record<string, string>;
  difficulties: Record<string, string>;
  classifications: Record<string, string>;
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
  exams: Array<{
    id: number;
    educational_stage_id: number;
    subject_id: number;
    instructor_id: number;
    title: Record<string, string>;
  }>;
  exam_sections: Array<{
    id: number;
    title: Record<string, string>;
    position: number;
  }>;
}

export interface StoreQuestionData {
  question_template_id?: number | null;
  exam_id?: number | null;
  exam_section_id?: number | null;
  type: QuestionTypeBackend;
  title: { ar: string; en?: string };
  body?: { ar?: string; en?: string };
  difficulty: QuestionDifficultyBackend;
  classification: QuestionClassificationBackend;
  educational_stage_id?: number;
  subject_id?: number;
  instructor_id?: number;
  score: number;
  has_explanation: boolean;
  explanation?: { ar?: string; en?: string };
  model_answer?: { ar?: string; en?: string };
  options?: Array<{
    text: { ar: string; en?: string };
    is_correct: boolean;
  }>;
  correct_answer?: boolean;
  is_active: boolean;
}

export type UpdateQuestionData = Partial<StoreQuestionData>;

export interface BackendExamAttemptQuestion {
  id: number;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  score: number;
  title: Record<string, string>;
  body: Record<string, string>;
  options?: Array<{
    id: number;
    position: number;
    text: Record<string, string>;
    is_correct: boolean | null;
  }>;
  submitted_answer?: string | number | boolean | null;
  is_correct?: boolean | null;
  awarded_score?: number | null;
  correct_answer?: boolean | null;
  explanation?: Record<string, string> | null;
  model_answer?: Record<string, string> | null;
}

export interface BackendExamAttempt {
  id: number;
  exam_id: number;
  exam: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  };
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  student?: {
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
    phone_code?: string | null;
    avatar?: string | null;
  } | null;
  attempt_number: number;
  status: "in_progress" | "pending_review" | "graded";
  started_at?: string | null;
  submitted_at?: string | null;
  graded_at?: string | null;
  duration_minutes: number;
  ends_at?: string | null;
  elapsed_seconds?: number | null;
  score?: number | null;
  max_score: number;
  percentage?: number | null;
  passing_percentage?: number | null;
  is_passed?: boolean | null;
  result_summary?: {
    questions_count: number;
    correct_answers_count: number;
    incorrect_answers_count: number;
    pending_review_count: number;
  } | null;
  questions?: BackendExamAttemptQuestion[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GradeExamAttemptPayload {
  answers: Array<{
    question_id: number;
    awarded_score: number;
  }>;
}

export interface ExamAttemptsListResponse {
  attempts: BackendExamAttempt[];
  pagination: ApiPaginationMeta;
}

export interface BackendExamComplaintStudent {
  id: number;
  full_name: string;
  phone_code?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface BackendExamComplaint {
  id: number;
  exam_id: number;
  body: string;
  student?: BackendExamComplaintStudent | null;
  created_at?: string | null;
}

export interface ExamComplaintFilterParams {
  search?: string;
  sort?: "latest" | "oldest" | "body_asc" | "body_desc" | "student_asc" | "student_desc";
  per_page?: number;
  page?: number;
}

export interface ExamComplaintsListResponse {
  complaints: BackendExamComplaint[];
  pagination: ApiPaginationMeta;
}

// -------------------------------------------------------------
// Students & Wallet Contracts (Provider Dashboard)
// -------------------------------------------------------------

export type BackendGender = "male" | "female";
export type BackendRegistrationType = "center" | "online" | "hybrid" | "external" | string;
export type BackendStudentStatus = "active" | "suspended";

export interface BackendStudent {
  id: number;
  provider_id?: number;
  first_name: string;
  father_name?: string | null;
  family_name: string;
  additional_name?: string | null;
  full_name?: string;
  phone_code?: string | null;
  phone?: string | null;
  guardian_phone_code?: string | null;
  guardian_phone?: string | null;
  gender: BackendGender;
  email: string;
  avatar?: string | null;
  country_id?: number | null;
  country?: {
    id: number;
    name: Record<string, string>;
  } | null;
  governorate_id?: number | null;
  governorate?: {
    id: number;
    name: Record<string, string>;
  } | null;
  educational_stage_id?: number | null;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  } | null;
  registration_type: BackendRegistrationType;
  registration_type_label?: string;
  status: BackendStudentStatus;
  status_label?: string;
  wallet?: {
    balance: number | string;
    currency_code?: string | null;
  } | null;
  balance?: number | string;
  enrolled_courses_count?: number;
  courses_count?: number;
  average_rating?: number;
  gpa?: string | null;
  enrolled_courses?: Array<{
    id: number;
    title: Record<string, string>;
    cover_image?: string | null;
    progress?: {
      completed_lessons: number;
      total_lessons: number;
      percentage: number;
    };
  }>;
  registered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentFilterParams {
  search?: string;
  country_id?: number | string;
  governorate_id?: number | string;
  educational_stage_id?: number | string;
  registration_type?: string;
  status?: string;
  sort?: string;
  per_page?: number;
  page?: number;
}

export interface StudentsListResponse {
  students: BackendStudent[];
  pagination: ApiPaginationMeta;
}

export interface BackendStudentOptions {
  countries: Array<{
    id: number;
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
  registration_types: Record<string, string>;
  statuses: Record<string, string>;
}

export interface StoreStudentData {
  first_name: string;
  father_name?: string;
  family_name: string;
  additional_name?: string;
  phone_code?: string;
  phone: string;
  guardian_phone_code?: string;
  guardian_phone: string;
  gender: BackendGender;
  email: string;
  password?: string;
  password_confirmation?: string;
  country_id?: number;
  governorate_id?: number;
  educational_stage_id?: number;
  registration_type: BackendRegistrationType;
  status: BackendStudentStatus;
  avatar?: File | null;
}

export type UpdateStudentData = Partial<StoreStudentData> & {
  remove_avatar?: boolean;
};

export interface BackendWalletTransaction {
  id: number;
  wallet_id: number;
  order_id?: number | null;
  order_number?: string | null;
  direction: "credit" | "debit";
  reason: string;
  reason_label?: string;
  funding_source?: string | null;
  amount: number | string;
  balance_before?: number | string;
  balance_after?: number | string;
  performed_by?: {
    id: number;
    full_name: string;
  } | null;
  notes?: string | null;
  created_at: string;
}

export interface AdjustWalletData {
  direction: "credit" | "debit";
  amount: number;
  reason: string;
  notes?: string;
  funding_source?: string;
  idempotency_key: string;
}

export interface WalletTransactionsResponse {
  transactions: BackendWalletTransaction[];
  pagination: ApiPaginationMeta;
}

// -------------------------------------------------------------
// Activation Codes Contracts (Provider Dashboard)
// -------------------------------------------------------------

export type BackendActivationCodeStatus = "available" | "sold" | "used";

export interface BackendActivationCodeGroup {
  id: number;
  provider_id: number;
  course_id: number;
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  price: number | string;
  quantity: number;
  total_codes?: number;
  available_codes?: number;
  sold_codes?: number;
  used_codes?: number;
  code_prefix?: string | null;
  prefix?: string | null;
  expires_at: string;
  created_at: string;
}

export interface BackendActivationCode {
  id: number;
  activation_code_group_id: number;
  group_id?: number;
  course_id: number;
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  code: string;
  price: number | string;
  cost?: number | string;
  status: BackendActivationCodeStatus;
  status_label?: string;
  student?: {
    id: number;
    full_name: string;
  } | null;
  used_at?: string | null;
  expires_at: string;
  created_at: string;
}

export interface ActivationCodeGroupsListResponse {
  groups: BackendActivationCodeGroup[];
  pagination: ApiPaginationMeta;
  statistics?: {
    total_codes: number;
    available_codes: number;
    sold_codes: number;
    used_codes: number;
  };
}

export interface ActivationCodesListResponse {
  codes: BackendActivationCode[];
  pagination: ApiPaginationMeta;
}

// -------------------------------------------------------------
// Billing, Orders & Finance Contracts (Provider Dashboard)
// -------------------------------------------------------------

export type BackendOrderStatus = "pending" | "paid" | "partially_paid" | "cancelled" | "refunded";
export type BackendPaymentStatus = "pending" | "approved" | "rejected";
export type BackendPaymentMethod =
  | "instapay"
  | "vodafone_cash"
  | "bank"
  | "wallet"
  | "fawry"
  | "credit_card"
  | string;

export interface BackendPaymentAccount {
  id: number;
  provider_id: number;
  type: BackendPaymentMethod;
  type_label?: string;
  account_name: Record<string, string>;
  account_number: string;
  instructions?: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
}

export interface BackendOrderItem {
  id: number;
  order_id?: number;
  course_id: number;
  course_title: Record<string, string>;
  instructor_id?: number | null;
  instructor_name?: string | null;
  educational_stage_name?: Record<string, string> | null;
  delivery_mode: string;
  selected_delivery_mode?: string | null;
  original_price: number | string;
  discount_amount?: number | string;
  final_price: number | string;
  access_duration_days?: number | null;
}

export interface BackendOrder {
  id: number;
  order_number: string;
  invoice_number?: string | null;
  provider_id: number;
  student_id: number;
  student?: BackendStudent | null;
  full_name?: string | null;
  phone_code?: string | null;
  phone?: string | null;
  email?: string | null;
  status: BackendOrderStatus;
  status_label?: string;
  subtotal: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  remaining_amount: number | string;
  currency_code?: string | null;
  items?: BackendOrderItem[];
  payments?: BackendPayment[];
  paid_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BackendPayment {
  id: number;
  payment_number: string;
  order_id: number;
  provider_id: number;
  student_id: number;
  student?: BackendStudent | null;
  full_name?: string | null;
  phone_code?: string | null;
  phone?: string | null;
  email?: string | null;
  order?: BackendOrder | null;
  method: BackendPaymentMethod;
  method_label?: string;
  status: BackendPaymentStatus;
  status_label?: string;
  amount: number | string;
  currency_code?: string | null;
  payment_account_id?: number | null;
  destination_account?: Record<string, unknown> | null;
  submitted_phone?: string | null;
  transaction_reference?: string | null;
  proof?: {
    url: string;
    file_name: string;
    mime_type: string;
  } | null;
  proof_endpoint?: string | null;
  reviewer?: {
    id: number;
    full_name: string;
  } | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface BackendFinancePeriodStat {
  total: string | number;
  previous_total: string | number;
  change_percentage: number;
}

export interface BackendFinanceInstructorSale {
  instructor_id: number;
  instructor_name: string;
  courses_sold: number;
  orders_count: number;
  gross_sales: string | number;
}

export interface BackendFinanceSummary {
  year: number;
  total_sales: string | number;
  paid_orders_count: number;
  monthly_sales: Record<string | number, string | number>;
  weekly_sales: Record<string | number, Record<string | number, string | number>>;
  periods: {
    today: BackendFinancePeriodStat;
    this_week: BackendFinancePeriodStat;
    this_month: BackendFinancePeriodStat;
  };
  average_monthly_sales: string | number;
  highest_month: {
    month: number | null;
    total: string | number;
  };
  lowest_month: {
    month: number | null;
    total: string | number;
  };
  instructors: BackendFinanceInstructorSale[];
}

export interface OrdersListResponse {
  orders: BackendOrder[];
  pagination: ApiPaginationMeta;
}

export interface PaymentsListResponse {
  payments: BackendPayment[];
  pagination: ApiPaginationMeta;
}

// -------------------------------------------------------------
// Settings & Platform Contracts (Provider Dashboard)
// -------------------------------------------------------------

export interface BackendEducationalStage {
  id: number;
  name: Record<string, string>;
  desc?: Record<string, string> | null;
  academic_year?: number | null;
  is_active: boolean;
  image?: string | null;
  students_count?: number;
  courses_count?: number;
  created_at?: string;
}

export interface BackendSubject {
  id: number;
  name: Record<string, string>;
  desc?: Record<string, string> | null;
  educational_stages?: BackendEducationalStage[];
  educational_stage_ids?: number[];
  is_active: boolean;
  image?: string | null;
  courses_count?: number;
  teachers_count?: number;
  created_at?: string;
}

export interface BackendTeacher {
  id: number;
  provider_id?: number;
  full_name: string;
  email: string;
  phone_code?: string | null;
  phone?: string | null;
  is_active: boolean;
  avatar?: string | null;
  avatar_url?: string | null;
  educational_stage_ids?: number[];
  subject_ids?: number[];
  educational_stages?: Array<{
    id: number;
    name: Record<string, string>;
    is_active?: boolean;
  }>;
  subjects?: Array<{
    id: number;
    name: Record<string, string>;
    is_active?: boolean;
  }>;
  courses_count?: number;
  exams_count?: number;
  lessons_count?: number;
  questions_count?: number;
  created_at?: string;
}

export interface BackendAdmin {
  id: number;
  provider_id?: number | null;
  full_name: string;
  national_id?: string | null;
  email: string;
  phone_code?: string | null;
  phone?: string | null;
  user_type?: "center" | "teacher" | "assistant" | "group" | string;
  teachers_limit?: number | null;
  flag?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  locale?: string;
  supported_locales?: string[];
  is_multilingual?: boolean;
  allow_notification?: boolean;
  allow_dark_mode?: boolean;
  roles?: Array<{
    id: number;
    name: string;
    display_name?: string;
  }>;
  permissions?: string[];
  created_at?: string;
}

export type BackendProviderProfile = BackendAdmin;

export interface UpdateProviderProfilePayload {
  full_name: string;
  email: string;
  phone_code?: string | null;
  phone?: string | null;
  flag?: File | string | null;
  remove_flag?: boolean;
}

export interface UpdateProviderPasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface BackendAnnouncement {
  id: number;
  title: Record<string, string>;
  details: Record<string, string>;
  description?: Record<string, string>;
  image?: string | null;
  link?: string | null;
  url?: string | null;
  is_active: boolean;
  active?: boolean;
  created_at: string;
}

export interface BackendPlatformSettings {
  support_phone_code?: string | null;
  support_phone?: string | null;
  whatsapp_phone_code?: string | null;
  whatsapp_phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  additional_links?: Array<{
    id: string;
    title: Record<string, string>;
    url: string;
  }>;
  about?: Record<string, string> | null;
  terms?: Record<string, string> | null;
  supported_locales?: string[];
}

// ─── Student Enrolled Courses (Website / Portal) ────────────────────────────

export interface BackendMyCourse {
  id?: number;
  course_id?: number;
  enrollment_id?: number;
  title: Record<string, string>;
  description?: Record<string, string> | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  } | null;
  subject?: {
    id: number;
    name: Record<string, string>;
  } | null;
  instructor?: {
    id: number;
    full_name: string;
    avatar?: string | null;
    avatar_url?: string | null;
  } | null;
  delivery_mode?: CourseDeliveryMode | string | null;
  selected_delivery_mode?: string | null;
  delivery_mode_label?: string;
  status?: CourseStatus | string;
  is_free?: boolean;
  final_price?: number;
  purchased_price?: number | string;
  currency_code?: string | null;
  lessons_count?: number;
  sections_count?: number;
  created_at?: string;
  starts_at?: string | null;
  expires_at?: string | null;
  access_ends_at?: string | null;
  progress_percentage?: number;
  progress?: {
    completed_lessons: number;
    total_lessons: number;
    percentage: number;
  } | null;
}

export interface MyCoursesListResponse {
  courses: BackendMyCourse[];
  pagination: ApiPaginationMeta;
}

export interface MyCoursesFilterParams {
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface MyCoursesOptions {
  sort_options: Record<string, string | Record<string, string>>;
}

// ─── Student Explore / Available Courses (Website / Portal) ─────────────────

/** Matches AvailableCourseResource from GET /api/website/courses */
export interface AvailableCourse {
  id: number;
  delivery_mode: string; // "online" | "onsite" | "hybrid"
  delivery_options: string[];
  is_enrolled: boolean; // always false — backend filters enrolled courses out
  title: Record<string, string>; // { ar: "...", en: "..." }
  description: Record<string, string>;
  cover_image: string | null;
  educational_stage: { id: number; name: Record<string, string> } | null;
  subject: { id: number; name: Record<string, string> } | null;
  instructor: { id: number; full_name: string } | null;
  is_free: boolean;
  base_price: number;
  currency_code: string;
  has_discount: boolean;
  is_discount_active: boolean;
  discount_percentage: number;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  discount_amount: number;
  final_price: number;
  has_limited_access: boolean;
  access_duration_days: number | null;
  sections_count: number;
  lessons_count: number;
  published_at: string | null;
}

export interface ExploreCoursesFilterParams {
  search?: string;
  sort?: string;
  educational_stage_id?: number;
  subject_id?: number;
  instructor_id?: number;
  page?: number;
  per_page?: number;
}

export interface ExploreCoursesListResponse {
  courses: AvailableCourse[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
  };
}

// ─── Student Course Details & Orders (Website / Portal) ──────────────────────

/** Matches CourseDetailsResource from GET /api/website/courses/{course} and GET /api/website/my-courses/{course} */
export interface BackendStudentCourseDetails {
  id: number;
  title: Record<string, string>;
  description: Record<string, string>;
  cover_image: string | null;
  delivery_mode: string | null; // "online" | "onsite" | "hybrid"
  educational_stage: { id: number; name: Record<string, string> } | null;
  subject: { id: number; name: Record<string, string> } | null;
  instructor: { id: number; full_name: string } | null;
  sections_count: number;
  lessons_count: number;
  is_enrolled: boolean;
  is_free: boolean;
  base_price: number;
  final_price: number;
  currency_code: string;
  has_limited_access: boolean;
  access_duration_days: number | null;
  enrollment?: {
    id: number;
    starts_at: string | null;
    expires_at: string | null;
    selected_delivery_mode: string | null;
  } | null;
  progress?: {
    completed_lessons: number;
    total_lessons: number;
    percentage: number;
  } | null;
}

export interface StudentCourseDetailsResponse {
  course: BackendStudentCourseDetails;
}

export interface StoreStudentOrderPayload {
  course_ids: number[];
  delivery_modes?: Record<string | number, string>;
}

export interface StoreStudentOrderResponse {
  order: BackendOrder;
}

// ─── Student Course Curriculum & Content (GET /api/website/my-courses/{id}/content) ──

export interface BackendCourseContentSectionLessonExam {
  id: number;
  title: Record<string, string>;
  passing_percentage: number;
  is_passed: boolean;
  adopted_result?: {
    attempt_id: number;
    attempt_number: number;
    score: number;
    max_score: number;
    percentage: number;
    is_passed: boolean;
  } | null;
}

export interface BackendCourseContentSectionLesson {
  id: number;
  title: Record<string, string>;
  type: string;
  position: number;
  is_locked: boolean;
  is_completed: boolean;
  exam: BackendCourseContentSectionLessonExam | null;
}

export interface BackendCourseContentSection {
  id: number;
  title: Record<string, string>;
  position: number;
  is_locked: boolean;
  exam: BackendCourseContentSectionLessonExam | null;
  lessons: BackendCourseContentSectionLesson[];
}

export interface BackendCourseContent {
  course_id: number;
  title: Record<string, string>;
  progress: {
    completed_lessons: number;
    total_lessons: number;
    percentage: number;
  };
  next_lesson: BackendCourseContentSectionLesson | null;
  sections: BackendCourseContentSection[];
}

export interface CourseContentResponse {
  content: BackendCourseContent;
}

// ─── Student Lesson Details (GET /api/website/my-courses/{course}/lessons/{lesson}) ─

export interface BackendStudentLessonMediaItem {
  id: number;
  source: "upload" | "asset" | string;
  name: string;
  file_name?: string;
  mime_type: string | null;
  size: number;
  url: string;
}

export interface BackendStudentLessonDetail {
  id: number;
  course_id?: number | null;
  section_id?: number | null;
  classification?: string;
  title: Record<string, string>;
  description: Record<string, string>;
  type: string; // "video_and_text" | "text_only"
  video_url: string | null;
  cover_image: string | null;
  position?: number;
  is_completed?: boolean;
  instructor?: { id: number; full_name: string } | null;
  educational_stage?: { id: number; name: Record<string, string> } | null;
  subject?: { id: number; name: Record<string, string> } | null;
  pdf_attachments: BackendStudentLessonMediaItem[];
  explanatory_images: BackendStudentLessonMediaItem[];
  exam?: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentLessonDetailsResponse {
  lesson: BackendStudentLessonDetail;
}

export interface StudentStandaloneLessonsFilterParams {
  tab?: "all" | "completed" | "incomplete";
  search?: string;
  type?: string;
  subject_id?: number | string;
  instructor_id?: number | string;
  sort?: "latest" | "oldest" | "title_asc" | "title_desc";
  page?: number;
  per_page?: number;
}

export interface StudentStandaloneLessonsListResponse {
  lessons: BackendStudentLessonDetail[];
  tab_counts: {
    all: number;
    completed: number;
    incomplete: number;
  };
  pagination: ApiPaginationMeta;
}

export interface LessonCompletionResponse {
  lesson_id: number;
  completed_at?: string;
  is_completed?: boolean;
}

// ─── Student Exams & Exam Attempts (Website / Student Portal) ───────────────

export interface BackendStudentExamAdoptedResult {
  attempt_id: number;
  attempt_number: number;
  score: number;
  max_score: number;
  percentage: number;
  is_passed: boolean;
  completed_at?: string | null;
}

export interface BackendStudentExam {
  id: number;
  title: Record<string, string>;
  description?: Record<string, string> | null;
  scope: "course" | "general" | string;
  classification: string;
  classification_label?: string;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  } | null;
  subject?: {
    id: number;
    name: Record<string, string>;
  } | null;
  instructor?: {
    id: number;
    full_name: string;
  } | null;
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  questions_count: number;
  duration_minutes: number;
  delivery_mode: string;
  passing_percentage: number;
  max_attempts: number;
  attempts_used: number;
  remaining_attempts: number;
  can_start: boolean;
  start_block_reason?: "exam_ended" | "no_questions" | "maximum_attempts_reached" | string | null;
  current_attempt_id?: number | null;
  result_status: "not_started" | "in_progress" | "pending_review" | "passed" | "failed";
  action: "start" | "resume" | "retry" | "view_result";
  adopted_result?: BackendStudentExamAdoptedResult | null;
  ends_at?: string | null;
}

export interface StudentExamsFilterParams {
  search?: string;
  tab?: "required" | "completed";
  sort?:
    | "latest"
    | "oldest"
    | "title_asc"
    | "title_desc"
    | "duration_asc"
    | "duration_desc"
    | "score_asc"
    | "score_desc"
    | string;
  page?: number;
  per_page?: number;
}

export interface StudentExamsListResponse {
  exams: BackendStudentExam[];
  tab_counts: {
    required: number;
    completed: number;
  };
  pagination: ApiPaginationMeta;
}

export interface StudentExamDetailResponse {
  exam: BackendStudentExam;
}

export interface BackendStudentAttemptQuestionOption {
  id: number;
  position: number;
  text: Record<string, string>;
  is_correct?: boolean | null;
}

export interface BackendStudentAttemptQuestion {
  id: number;
  type: QuestionTypeBackend;
  difficulty: QuestionDifficultyBackend;
  score: number;
  title: Record<string, string>;
  body: Record<string, string>;
  options: BackendStudentAttemptQuestionOption[];
  submitted_answer?: unknown;
  is_answered: boolean;
  is_flagged: boolean;
  answered_at?: string | null;
  is_correct?: boolean | null;
  awarded_score?: number | null;
  correct_answer?: boolean | string | null;
  explanation?: Record<string, string> | null;
  model_answer?: Record<string, string> | null;
}

export interface BackendStudentAttemptSectionPerformance {
  exam_section_id: number | null;
  title?: Record<string, string> | null;
  questions_count: number;
  correct_answers_count: number;
  score: number;
  max_score: number;
  percentage: number;
}

export interface BackendStudentExamAttempt {
  id: number;
  exam_id: number;
  exam: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  };
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  student?: {
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
    phone_code?: string | null;
    avatar?: string | null;
  } | null;
  attempt_number: number;
  status: "in_progress" | "pending_review" | "graded" | string;
  started_at?: string | null;
  expires_at?: string | null;
  ends_at?: string | null;
  submitted_at?: string | null;
  submitted_reason?: "manual" | "timeout" | string | null;
  graded_at?: string | null;
  duration_minutes: number;
  passing_percentage: number;
  attempts_used: number;
  remaining_attempts: number;
  can_retry: boolean;
  elapsed_seconds?: number | null;
  score: number | null;
  max_score: number;
  percentage: number | null;
  is_passed?: boolean | null;
  is_best_attempt?: boolean;
  adopted_result?: BackendStudentExamAdoptedResult | null;
  result_summary?: {
    questions_count: number;
    correct_answers_count: number;
    incorrect_answers_count: number;
    pending_review_count: number;
  } | null;
  section_performance: BackendStudentAttemptSectionPerformance[];
  questions: BackendStudentAttemptQuestion[];
}

export interface StudentExamAttemptResponse {
  attempt: BackendStudentExamAttempt;
}

export interface StudentExamAttemptsListResponse {
  attempts: BackendStudentExamAttempt[];
}

export interface SaveExamAnswerPayload {
  answer?: unknown;
  is_flagged?: boolean;
}

export interface SubmitExamAttemptPayload {
  answers: Array<{
    question_id: number;
    answer?: unknown;
  }>;
}
