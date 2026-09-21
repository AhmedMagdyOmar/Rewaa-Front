export interface Teacher {
  id: string;
  name: string;
  phone: string;
  image?: string;
  grades: string[]; // e.g. ["grade_1", "grade_2"] or display names
  subjects: string[]; // e.g. ["math", "physics"] or display names
  stageIds?: number[];
  subjectIds?: number[];
}

export interface GradeItem {
  id: string;
  name: string;
  year: number; // 1 to 12
  studentsCount: number;
  coursesCount: number;
  teachersCount: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  coursesCount: number;
  teachersCount: number;
}

export type AssistantPermission =
  | "manage-courses"
  | "manage-exams-and-questions"
  | "manage-students"
  | "manage-billing";

export interface AssistantItem {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  permissions: AssistantPermission[];
}

export interface PlatformCustomLink {
  id: string;
  label: string;
  url: string;
}

export interface PlatformInfoGroupCommunication {
  supportPhone: string;
  whatsappPhone: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  customLinks: PlatformCustomLink[];
}

export interface PlatformInfoGroupWhoWeAre {
  content: string;
}

export interface PlatformInfoGroupTerms {
  content: string;
}

export interface PlatformInfo {
  communication: PlatformInfoGroupCommunication;
  whoWeAre: PlatformInfoGroupWhoWeAre;
  terms: PlatformInfoGroupTerms;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  url?: string;
  active: boolean;
  createdAt: string;
}
