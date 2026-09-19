import { CourseVenue, Lesson, LessonPublishStatus } from "@/types/course";

export interface NewCourseClientProps {
  initialCourseId?: string;
}

export type StepNumber = 1 | 2;

export type DialogType = "section" | "lesson" | "arrange" | "import" | null;

export interface ParentCourseContext {
  courseId?: string;
  grade: string;
  subject: string;
  teacherName: string;
  venue: CourseVenue;
}

export interface EditingLessonState {
  lesson: Lesson;
  sectionId: string;
}

export interface LessonToDeleteState {
  lesson: Lesson;
  sectionId: string;
}

import { LucideIcon } from "lucide-react";

export interface StepItem {
  id: number;
  label: string;
  icon: LucideIcon;
  complete: boolean;
}

export interface CourseFormState {
  title: string;
  description: string;
  previewVideoLink: string;
  coverImage: string | null;
  coverImageFile: File | null;
  removeCoverImage: boolean;
  grade: string;
  subject: string;
  teacherName: string;
  period: string;
  isFree: boolean;
  coursePrice: number | "";
  currency: string;
  hasOffer: boolean;
  offerPercentage: number | "";
  offerStartDate: string;
  offerEndDate: string;
  hasTimeLimit: boolean;
  timeLimitValue: number | "";
  isActive: boolean;
  venue: CourseVenue;
  coursePublishStatus: LessonPublishStatus;
  courseScheduledPublishDate: string;
}
