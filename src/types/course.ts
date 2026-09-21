export type CoursePeriod = "monthly" | "yearly" | "term" | (string & {});
export type CourseDeliveryMode = "online" | "onsite" | "hybrid";
export type CourseVenue = CourseDeliveryMode;
export type CourseBadge = "featured" | "revision" | "new" | "bestseller" | "limited";
export type LessonType = "videoAndText" | "text";
export type LessonClassification = "standalone" | "course";
export type LessonCategory = "independent" | "course-dependent" | "standalone" | "course";
export type LessonPublishStatus = "draft" | "published" | "scheduled";

export interface LessonAttachment {
  id: string;
  title: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "doc" | "zip";
  sizeInBytes?: number;
  rawFile?: File;
  isExisting?: boolean;
}

export interface Lesson {
  id: string;
  type?: LessonType;
  title: string;
  description?: string;
  coverImage?: string;
  cover_image_url?: string;
  cover_image?: string;
  coverImageFile?: File | null;
  removeCoverImage?: boolean;
  video_url?: string;
  videoUrl?: string;
  lectureVideoLink?: string;
  grade?: string;
  subject?: string;
  teacherName?: string;
  teacherImage?: string;

  // Attachments and Exams
  hasPdfAttachments?: boolean;
  pdfFiles?: LessonAttachment[];
  hasImageAttachments?: boolean;
  imageFiles?: LessonAttachment[];
  deleteMediaIds?: number[];
  isLinkedToExam?: boolean;
  linkedExamId?: string; // FK → Exam.id
  linkedExamTitle?: string; // denormalized
  isRequiredPassExam?: boolean;

  // Organization and publish status
  venue?: CourseVenue;
  classification?: LessonClassification;
  lessonCategory?: LessonCategory;
  courseId?: string; // FK → Course.id
  courseTitle?: string; // denormalized
  sectionId?: string; // FK → CourseSection.id
  sectionTitle?: string; // denormalized
  completionsCount?: number; // how many students completed this lesson (from backend)
  publishStatus?: LessonPublishStatus;
  scheduledPublishDate?: string;
  isActive?: boolean;

  attachments?: LessonAttachment[];
  // Deprecated legacy aliases
  writtenText?: string;
  coursesCount?: number;
  viewsCount?: number;
  courseIds?: string[];
}

export interface CourseSection {
  id: string;
  title: string;
  isDraft: boolean;
  status?: LessonPublishStatus;
  scheduledPublishDate?: string;
  isLinkedToExam: boolean;
  linkedExamId?: string; // FK → Exam.id (replaces embedded ExamContent)
  linkedExamTitle?: string;
  isRequiredPassExamForNextSection: boolean;
  hasExamExpiryDate?: boolean;
  examStartDate?: string;
  examExpiryDate?: string;
  lessons: Lesson[];
}

export interface CourseFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface CourseRatingReview {
  id: string;
  userName: string;
  userImage?: string;
  rating: number; // 1 to 5
  comment?: string;
  date: string;
}

export interface Course {
  id: string;
  coverImage: string;
  title: string;
  description: string;
  previewVideoLink?: string;
  subject: string;
  grade: string;
  teacherName: string;
  teacherImage?: string;
  period: CoursePeriod;
  date: string;
  numberOfLessons: number;
  price: number;
  isFree: boolean;
  currency: string;
  hasOffer: boolean;
  offerPercentage?: string;
  offerStartDate?: string;
  offerEndDate?: string;
  hasTimeLimit: boolean;
  timeLimitValue?: number;
  isSplitToSections: boolean;
  venue: CourseVenue;
  numberOfParticipants: number;
  isDraft: boolean;
  publishStatus?: LessonPublishStatus;
  sections: CourseSection[];
  faqs?: CourseFAQ[];
  ratingsReviews?: CourseRatingReview[];
  averageRating?: number;
  totalRatingsCount?: number;
  durationHours?: number;
  badge?: CourseBadge;
  scheduledPublishDate?: string;
  progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
}
