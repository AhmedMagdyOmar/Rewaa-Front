import { BackendActivationCode, BackendActivationCodeGroup } from "@/types/api-contracts";
import { ActivationCode, CodeStatus } from "@/types/activation-code";
import { CodeGroup } from "@/types/code-group";

export function adaptBackendCodeGroupToUI(
  group: BackendActivationCodeGroup,
  locale: string = "ar",
): CodeGroup {
  const courseTitle = group.course?.title
    ? group.course.title[locale] || group.course.title.ar || group.course.title.en || ""
    : "";

  return {
    id: String(group.id),
    courseId: String(group.course_id),
    courseTitle,
    price: Number(group.price || 0),
    totalCodes: group.total_codes ?? group.quantity ?? 0,
    availableCodes: group.available_codes ?? 0,
    soldCodes: group.sold_codes ?? 0,
    usedCodes: group.used_codes ?? 0,
    codePrefix: group.code_prefix || group.prefix || undefined,
    expiryDate: group.expires_at || "",
    createdAt: group.created_at || "",
  };
}

export function adaptBackendActivationCodeToUI(
  code: BackendActivationCode,
  locale: string = "ar",
): ActivationCode {
  const courseTitle = code.course?.title
    ? code.course.title[locale] || code.course.title.ar || code.course.title.en || ""
    : "";

  return {
    id: String(code.id),
    groupId: String(code.activation_code_group_id || code.group_id || ""),
    courseId: String(code.course_id),
    courseTitle,
    code: code.code,
    cost: Number(code.price ?? code.cost ?? 0),
    status: (code.status as CodeStatus) || "available",
    expiryDate: code.expires_at || "",
    createdAt: code.created_at || "",
  };
}
