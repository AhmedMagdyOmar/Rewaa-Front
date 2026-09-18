import { BackendCourse } from "@/types/api-contracts";
import { Course } from "@/types/course";
import { CourseVenueFilter, FilterTab, SortOption } from "../course-filters";

/**
 * Adapter: converts BackendCourse to legacy Course format for CourseCard
 */
export function adaptBackendCourseToCourse(backend: BackendCourse, locale: string): Course {
  const title = backend.title?.[locale] || backend.title?.ar || backend.title?.en || "";
  const description =
    backend.description?.[locale] || backend.description?.ar || backend.description?.en || "";

  const status = backend.status;
  const isDraft = status === "draft";
  const isScheduled = status === "scheduled";
  const publishStatus = status === "published" ? "published" : isScheduled ? "scheduled" : "draft";

  return {
    id: String(backend.id),
    coverImage: backend.cover_image || "",
    title,
    description,
    previewVideoLink: backend.intro_video_url || undefined,
    subject:
      backend.subject?.name?.[locale] ||
      backend.subject?.name?.ar ||
      backend.subject?.name?.en ||
      "",
    grade:
      backend.educational_stage?.name?.[locale] ||
      backend.educational_stage?.name?.ar ||
      backend.educational_stage?.name?.en ||
      "",
    teacherName: backend.instructor?.full_name || "",
    teacherImage:
      (backend.instructor as { avatar?: string } | null | undefined)?.avatar || undefined,
    period: backend.subscription_period || "monthly",
    date: backend.created_at ? backend.created_at.split(" ")[0] : "",
    numberOfLessons: backend.lessons_count || 0,
    price: Number(backend.final_price ?? backend.base_price) || 0,
    isFree: Boolean(backend.is_free),
    currency: backend.currency_code || "EGP",
    hasOffer: Boolean(backend.has_discount),
    offerPercentage: backend.discount_percentage ? `${backend.discount_percentage}%` : undefined,
    offerStartDate: backend.discount_starts_at || undefined,
    offerEndDate: backend.discount_ends_at || undefined,
    hasTimeLimit: Boolean(backend.has_limited_access),
    timeLimitValue: backend.access_duration_days || undefined,
    isSplitToSections: true,
    venue: backend.delivery_mode || "hybrid",
    numberOfParticipants: backend.enrolled_students_count || 0,
    isDraft,
    publishStatus,
    scheduledPublishDate: backend.scheduled_publish_at || undefined,
    sections: [],
  };
}

/**
 * Maps frontend sort option to backend sort key
 */
export function mapSortToBackend(sortBy: SortOption): string {
  switch (sortBy) {
    case "date-oldest":
      return "oldest";
    case "sales-desc":
      return "students_desc";
    case "price-asc":
      return "price_asc";
    case "price-desc":
      return "price_desc";
    case "date-newest":
    default:
      return "latest";
  }
}

/**
 * Maps frontend venue filter to backend delivery_mode param
 */
export function mapVenueFilterToDeliveryMode(venueFilter: CourseVenueFilter): string | undefined {
  if (venueFilter === "all") return undefined;
  return venueFilter;
}

/**
 * Maps frontend tab to backend status param
 */
export function mapTabToStatusParam(activeTab: FilterTab): string | undefined {
  if (activeTab === "published") return "published";
  if (activeTab === "draft") return "draft";
  if (activeTab === "scheduled") return "scheduled";
  return undefined;
}
