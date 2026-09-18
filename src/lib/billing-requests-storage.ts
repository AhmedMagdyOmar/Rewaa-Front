import { BillingRequestItem } from "@/types/billing-request";

export const initialBillingRequests: BillingRequestItem[] = [
  {
    id: "REQ-2026-001",
    studentId: "std-1",
    studentFullName: "أحمد محمد علي حسن",
    studentPhoneNumber: "+201012345678",
    studentEmail: "ahmed.ali@example.com",
    grade: "grade3",
    amount: 450,
    paymentMethod: "vodafoneCash",
    courseId: "crs-1",
    courseName: "فيزياء الثانوية العامة - المراجعة النهائية",
    venue: "onsite",
    status: "pending",
    createdAt: "2026-08-16",
    transactionTime: "14:30",
    phoneUsedForTransaction: "+201012345678",
    proofType: "screenshot",
    proofUrl: "/proof-placeholders/photo-1554224154-26032ffc0d07.jpg",
  },
  {
    id: "REQ-2026-002",
    studentId: "std-2",
    studentFullName: "سارة محمود إبراهيم",
    studentPhoneNumber: "+201123456789",
    studentEmail: "sara.ibrahim@example.com",
    grade: "grade2",
    amount: 350,
    paymentMethod: "instaPay",
    courseId: "crs-2",
    courseName: "الكيمياء العضوية الشاملة",
    venue: "online",
    status: "pending",
    createdAt: "2026-08-16",
    transactionTime: "12:15",
    phoneUsedForTransaction: "+201123456789",
    proofType: "screenshot",
    proofUrl: "/proof-placeholders/photo-1554224155-8d04cb21cd6c.jpg",
  },
  {
    id: "REQ-2026-003",
    studentId: "std-3",
    studentFullName: "عمر خالد يوسف الخولي",
    studentPhoneNumber: "+201234567890",
    studentEmail: "omar.youssef@example.com",
    grade: "grade1",
    amount: 300,
    paymentMethod: "creditCard",
    courseId: "crs-3",
    courseName: "أساسيات الرياضيات والتحليل",
    venue: "onsite",
    status: "accepted",
    createdAt: "2026-08-15",
    transactionTime: "18:45",
    phoneUsedForTransaction: "+201234567890",
    proofType: "receipt",
    proofUrl: "/proof-placeholders/photo-1554224155-6726b3ff858f.jpg",
  },
  {
    id: "REQ-2026-004",
    studentId: "std-4",
    studentFullName: "مريم أحمد سامي",
    studentPhoneNumber: "+201005556677",
    studentEmail: "maryam.samy@example.com",
    grade: "grade3",
    amount: 500,
    paymentMethod: "vodafoneCash",
    courseId: "crs-1",
    courseName: "فيزياء الثانوية العامة - المراجعة النهائية",
    venue: "online",
    status: "rejected",
    createdAt: "2026-08-14",
    transactionTime: "09:20",
    phoneUsedForTransaction: "+201005556677",
    proofType: "screenshot",
    proofUrl: "/proof-placeholders/photo-1554224155-6726b3ff858f.jpg",
    rejectionReason: "الصورة غير واضحة ورقم العملية لا يطابق سجلات المحفظة.",
  },
  {
    id: "REQ-2026-005",
    studentId: "std-5",
    studentFullName: "يوسف طارق مصطفى",
    studentPhoneNumber: "+201551122334",
    studentEmail: "youssef.tariq@example.com",
    grade: "grade2",
    amount: 400,
    paymentMethod: "fawry",
    courseId: "crs-4",
    courseName: "شرح منهج الأحياء - الترم الأول",
    venue: "onsite",
    status: "pending",
    createdAt: "2026-08-16",
    transactionTime: "16:00",
    phoneUsedForTransaction: "+201551122334",
    proofType: "receipt",
    proofUrl: "/proof-placeholders/photo-1563986768609-322da13575f3.jpg",
  },
  {
    id: "REQ-2026-006",
    studentId: "std-6",
    studentFullName: "نور إبراهيم حسن",
    studentPhoneNumber: "+201066778899",
    studentEmail: "nour.ibrahim@example.com",
    grade: "grade1",
    amount: 350,
    paymentMethod: "instaPay",
    courseId: "crs-2",
    courseName: "الكيمياء العضوية الشاملة",
    venue: "online",
    status: "accepted",
    createdAt: "2026-08-13",
    transactionTime: "11:10",
    phoneUsedForTransaction: "+201066778899",
    proofType: "screenshot",
    proofUrl: "/proof-placeholders/photo-1563986768609-322da13575f3.jpg",
  },
];

const STORAGE_KEY = "rewaa_billing_requests";

export function getStoredBillingRequests(): BillingRequestItem[] {
  if (typeof window === "undefined") {
    return initialBillingRequests;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load billing requests from localStorage:", error);
  }

  saveStoredBillingRequests(initialBillingRequests);
  return initialBillingRequests;
}

export function saveStoredBillingRequests(requests: BillingRequestItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event("rewaa_billing_requests_updated"));
  } catch (error) {
    console.error("Failed to save billing requests to localStorage:", error);
  }
}

export function updateBillingRequestStatus(
  id: string,
  status: "accepted" | "rejected",
  rejectionReason?: string,
): BillingRequestItem[] {
  const current = getStoredBillingRequests();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
      };
    }
    return item;
  });
  saveStoredBillingRequests(updated);
  return updated;
}

export function resetStoredBillingRequests(): BillingRequestItem[] {
  if (typeof window === "undefined") {
    return initialBillingRequests;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBillingRequests));
    window.dispatchEvent(new Event("rewaa_billing_requests_updated"));
    return initialBillingRequests;
  } catch (error) {
    console.error("Failed to reset billing requests in localStorage:", error);
    return initialBillingRequests;
  }
}
