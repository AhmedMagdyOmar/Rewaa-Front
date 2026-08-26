// ─── Question Entity (standalone — future question-bank CRUD pages) ───────────

export type QuestionType = "mcq" | "text" | "true/false";

export type QuestionKind =
  | "theoretical"
  | "practical"
  | "application-based"
  | "analytical"
  | "oral"
  | "skill-based";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface MCQOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionName: string; // short label / title
  questionContent: string; // full markdown body
  modelAnswer: string;
  type: QuestionType;
  options?: MCQOption[]; // only when type === "mcq"
  grade: number; // points awarded
  hint?: string;
  required: boolean; // default true
  questionType: QuestionKind;
  difficulty: QuestionDifficulty;
  hasAnswerExplanation: boolean; // default false
  answerExplanation?: string;
}

// ─── ExamSection ──────────────────────────────────────────────────────────────

export interface ExamSection {
  id: string;
  title: string;
  subtitle?: string;
  questions: Question[];
}

// ─── Exam Entity ──────────────────────────────────────────────────────────────

export type ExamCategory =
  | "final"
  | "midterm"
  | "test"
  | "yearWork"
  | "comprehensive"
  | "unit"
  | "quiz"
  | "placement";

export type ExamType = "independent" | "course-dependent";
export type ExamVenue = "center" | "online" | "all";

export interface Exam {
  // ── Identifiers & linking ─────────────────────────────────────────────────
  id: string;
  title: string;
  description?: string; // Markdown — not shown in list page
  subject: string;
  grade: string;
  teacherName: string;
  category: ExamCategory;
  examType: ExamType;
  venue?: ExamVenue; // independent only
  courseId?: string; // FK → Course.id
  courseTitle?: string; // denormalized
  sectionId?: string; // FK → CourseSection.id
  lessonId?: string; // FK → Lesson.id for fast display
  coursesCount?: number; // how many courses include this exam (from backend)

  // ── Settings (not shown in list page) ────────────────────────────────────
  triesAllowed: number; // default 1
  durationMinutes: number;
  passingPercentage: number; // 0–100
  showModelAnswers: boolean;
  randomizeQuestionsOrder: boolean;
  randomizeMCQChoices: boolean;

  // ── Content ───────────────────────────────────────────────────────────────
  examSections: ExamSection[];

  // ── Stats (shown in list page) ────────────────────────────────────────────
  numberOfQuestions: number; // denormalized count for fast display
  numberOfStudents: number;
  successRate: number; // 0–100
  timesUsed: number;

  // ── Dates ─────────────────────────────────────────────────────────────────
  createdAt: string; // ISO date string
}
