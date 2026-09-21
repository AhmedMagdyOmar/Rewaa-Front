import type {
  BackendAdmin,
  BackendAnnouncement,
  BackendEducationalStage,
  BackendPlatformSettings,
  BackendSubject,
  BackendTeacher,
} from "@/types/api-contracts";
import type {
  AnnouncementItem,
  AssistantItem,
  AssistantPermission,
  GradeItem,
  PlatformInfo,
  SubjectItem,
  Teacher,
} from "@/types/settings";

export function adaptBackendStageToGradeItem(
  stage: BackendEducationalStage,
  locale = "ar",
): GradeItem {
  return {
    id: String(stage.id),
    name: stage.name?.[locale] || stage.name?.ar || stage.name?.en || "",
    year: stage.academic_year || 1,
    studentsCount: stage.students_count || 0,
    coursesCount: stage.courses_count || 0,
    teachersCount: 0,
  };
}

export function adaptBackendSubjectToSubjectItem(
  subject: BackendSubject,
  locale = "ar",
): SubjectItem {
  return {
    id: String(subject.id),
    name: subject.name?.[locale] || subject.name?.ar || subject.name?.en || "",
    coursesCount: subject.courses_count || 0,
    teachersCount: subject.teachers_count || 0,
  };
}

export function adaptBackendTeacherToTeacher(teacher: BackendTeacher, locale = "ar"): Teacher {
  return {
    id: String(teacher.id),
    name: teacher.full_name || "",
    phone: teacher.phone || "",
    image: teacher.avatar || teacher.avatar_url || undefined,
    grades: (teacher.educational_stages || []).map(
      (s) => s.name?.[locale] || s.name?.ar || s.name?.en || String(s.id),
    ),
    subjects: (teacher.subjects || []).map(
      (s) => s.name?.[locale] || s.name?.ar || s.name?.en || String(s.id),
    ),
    stageIds: teacher.educational_stage_ids || (teacher.educational_stages || []).map((s) => s.id),
    subjectIds: teacher.subject_ids || (teacher.subjects || []).map((s) => s.id),
  };
}

export function adaptBackendAdminToTeacher(admin: BackendAdmin): Teacher {
  return {
    id: String(admin.id),
    name: admin.full_name || "",
    phone: admin.phone || "",
    image: admin.avatar_url || undefined,
    grades: [],
    subjects: [],
  };
}

export function adaptBackendAdminToAssistantItem(admin: BackendAdmin): AssistantItem {
  const rawPermissions = (admin.permissions || [])
    .map((p) => {
      if (p.includes("course")) return "manage-courses";
      if (p.includes("exam") || p.includes("question")) return "manage-exams-and-questions";
      if (p.includes("student")) return "manage-students";
      if (p.includes("bill") || p.includes("payment") || p.includes("finance"))
        return "manage-billing";
      return null;
    })
    .filter(Boolean) as AssistantPermission[];

  const permissions = Array.from(new Set(rawPermissions));

  return {
    id: String(admin.id),
    name: admin.full_name || "",
    nationalId: admin.national_id || "",
    phone: admin.phone || "",
    permissions: permissions.length > 0 ? permissions : ["manage-courses"],
  };
}

export function adaptBackendAnnouncementToUI(
  announcement: BackendAnnouncement,
  locale = "ar",
): AnnouncementItem {
  return {
    id: String(announcement.id),
    title: announcement.title?.[locale] || announcement.title?.ar || announcement.title?.en || "",
    description:
      announcement.details?.[locale] ||
      announcement.details?.ar ||
      announcement.details?.en ||
      announcement.description?.[locale] ||
      announcement.description?.ar ||
      "",
    coverImage: announcement.image || undefined,
    url: announcement.url || announcement.link || undefined,
    active: announcement.is_active ?? announcement.active ?? true,
    createdAt: announcement.created_at || new Date().toISOString(),
  };
}

export function adaptBackendPlatformSettingsToUI(
  settings?: BackendPlatformSettings | null,
  locale = "ar",
): PlatformInfo {
  return {
    communication: {
      supportPhone: settings?.support_phone || "",
      whatsappPhone: settings?.whatsapp_phone || "",
      facebookUrl: settings?.facebook_url || "",
      instagramUrl: settings?.instagram_url || "",
      tiktokUrl: settings?.tiktok_url || "",
      customLinks: (settings?.additional_links || []).map((link, idx) => ({
        id: link.id ?? `custom-link-${idx}`,
        label: link.title?.[locale] || link.title?.ar || link.title?.en || "",
        url: link.url,
      })),
    },
    whoWeAre: {
      content: settings?.about?.[locale] || settings?.about?.ar || settings?.about?.en || "",
    },
    terms: {
      content: settings?.terms?.[locale] || settings?.terms?.ar || settings?.terms?.en || "",
    },
  };
}
