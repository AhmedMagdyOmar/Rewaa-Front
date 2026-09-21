export type Gender = "male" | "female";

export type RegistrationType = "center" | "online" | "hybrid" | "external";

export type TransactionType = "deposit" | "withdraw" | "refund" | "adjustment";

export interface StudentTransaction {
  id: string;
  studentId: string;
  type: TransactionType;
  amount: number;
  notes?: string;
  createdAt: string;
}

export type StudentStatus = "active" | "suspended";

export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  additionalName?: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  gender: Gender;
  email: string;
  image?: string;
  password?: string;
  country: string;
  countryId?: number;
  state: string; // state/governorate
  governorateId?: number;
  grade: string;
  educationalStageId?: number;
  registrationType: RegistrationType;
  coursesCount?: number;
  enrolledCourseIds?: string[];
  balance?: number;
  averageRating?: number;
  gpa?: string;
  examsPerformed?: number;
  correctQuestions?: number;
  wrongQuestions?: number;
  status?: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
}
