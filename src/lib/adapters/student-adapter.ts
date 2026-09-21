import { BackendStudent, BackendWalletTransaction } from "@/types/api-contracts";
import {
  Student,
  StudentTransaction,
  Gender,
  RegistrationType,
  StudentStatus,
  TransactionType,
} from "@/types/student";

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string" || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

export function adaptBackendStudentToUI(student: BackendStudent, locale: string = "ar"): Student {
  const localizedStageName = student.educational_stage?.name
    ? student.educational_stage.name[locale] ||
      student.educational_stage.name.ar ||
      student.educational_stage.name.en ||
      ""
    : "";

  const localizedCountryName = student.country?.name
    ? student.country.name[locale] || student.country.name.ar || student.country.name.en || ""
    : "";

  const localizedGovernorateName = student.governorate?.name
    ? student.governorate.name[locale] ||
      student.governorate.name.ar ||
      student.governorate.name.en ||
      ""
    : "";

  const walletBalance =
    typeof student.wallet?.balance === "number"
      ? student.wallet.balance
      : typeof student.balance === "number"
        ? student.balance
        : Number(student.wallet?.balance ?? student.balance ?? 0);

  return {
    id: String(student.id),
    firstName: student.first_name || "",
    middleName: student.father_name || "",
    lastName: student.family_name || "",
    additionalName: student.additional_name || "",
    phoneNumber: student.phone || "",
    parentPhoneNumber: student.guardian_phone || "",
    gender: (student.gender as Gender) || "male",
    email: student.email || "",
    image: resolveImageUrl(student.avatar),
    country: localizedCountryName || (locale === "ar" ? "مصر" : "Egypt"),
    countryId: student.country_id ?? student.country?.id,
    state: localizedGovernorateName || (locale === "ar" ? "القاهرة" : "Cairo"),
    governorateId: student.governorate_id ?? student.governorate?.id,
    grade:
      localizedStageName ||
      (student.educational_stage_id
        ? `الصف ${student.educational_stage_id}`
        : locale === "ar"
          ? "الصف الأول الثانوي"
          : "Grade 10"),
    educationalStageId: student.educational_stage_id ?? student.educational_stage?.id,
    registrationType: (student.registration_type as RegistrationType) || "center",
    coursesCount:
      student.enrolled_courses_count ??
      student.courses_count ??
      student.enrolled_courses?.length ??
      0,
    enrolledCourseIds: student.enrolled_courses?.map((c) => String(c.id)) || [],
    balance: walletBalance,
    averageRating: student.average_rating ?? undefined,
    gpa: student.gpa ?? undefined,
    status: (student.status as StudentStatus) || "active",
    createdAt: student.registered_at || student.created_at,
    updatedAt: student.updated_at,
  };
}

export function adaptBackendWalletTransactionToUI(
  tx: BackendWalletTransaction,
): StudentTransaction {
  let mappedType: TransactionType = "adjustment";
  if (tx.direction === "credit") {
    mappedType = tx.reason === "refund" ? "refund" : "deposit";
  } else if (tx.direction === "debit") {
    mappedType = "withdraw";
  }

  return {
    id: String(tx.id),
    studentId: String(tx.wallet_id),
    type: mappedType,
    amount: Number(tx.amount || 0),
    notes: tx.notes || undefined,
    createdAt: tx.created_at,
  };
}
