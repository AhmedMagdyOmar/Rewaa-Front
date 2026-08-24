import { CourseVenue } from "./course";

export type BillingRequestStatus = "pending" | "accepted" | "rejected";

export type PaymentMethod = "vodafoneCash" | "creditCard" | "fawry" | "instaPay";

export interface BillingRequestItem {
  id: string;
  studentId: string;
  studentFullName: string;
  studentPhoneNumber: string;
  studentEmail?: string;
  grade: string; // e.g. "grade1", "grade2", "grade3"
  amount: number;
  paymentMethod?: PaymentMethod;
  courseId: string;
  courseName: string;
  venue: CourseVenue; // "center" | "online" | "all"
  status: BillingRequestStatus;
  createdAt: string; // ISO date string or formatted date
  transactionTime: string; // e.g. "14:30"
  phoneUsedForTransaction: string; // e.g. "+201012345678"
  proofType: "screenshot" | "receipt";
  proofUrl: string;
  rejectionReason?: string;
}
