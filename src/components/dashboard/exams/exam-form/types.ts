import { LucideIcon } from "lucide-react";
import { ExamVenue } from "@/types/exam";

export type ExamFormStep = 1 | 2;

export interface StepItem {
  id: number;
  label: string;
  icon: LucideIcon;
  complete: boolean;
}

export type ExamDialogType =
  | "section"
  | "question"
  | "arrange"
  | "import"
  | "deleteSection"
  | "deleteQuestion"
  | null;

export interface ParentExamContext {
  examId: string | number;
  grade: string;
  subject: string;
  teacherName: string;
  venue: ExamVenue;
}
