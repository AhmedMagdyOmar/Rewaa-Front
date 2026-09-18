/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CourseVenue, LessonPublishStatus } from "@/types/course";
import { getErrorMessage } from "@/lib/api-utils";
import {
  useProviderCourse,
  useProviderCourseOptions,
  useCreateCourse,
  useUpdateCourse,
} from "@/hooks/use-courses";

interface UseCourseFormProps {
  initialCourseId?: string;
  onSuccessStepChange?: (nextStep: 1 | 2) => void;
}

export function useCourseForm({ initialCourseId, onSuccessStepChange }: UseCourseFormProps = {}) {
  const t = useTranslations("courses.new");
  const locale = useLocale();
  const router = useRouter();

  // Loading & Step state
  const [isLoaded, setIsLoaded] = useState(!initialCourseId);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(initialCourseId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Field State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewVideoLink, setPreviewVideoLink] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);

  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [period, setPeriod] = useState<string>("monthly");

  const [isFree, setIsFree] = useState(false);
  const [coursePrice, setCoursePrice] = useState<number | "">("");
  const [currency, setCurrency] = useState("EGP");
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState<number | "">("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerEndDate, setOfferEndDate] = useState("");

  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimitValue, setTimeLimitValue] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [venue, setVenue] = useState<CourseVenue>("hybrid");
  const [coursePublishStatus, setCoursePublishStatus] = useState<LessonPublishStatus>("draft");
  const [courseScheduledPublishDate, setCourseScheduledPublishDate] = useState("");

  // TanStack Query & Mutation hooks
  const selectedStageId = grade ? Number(grade) : undefined;
  const { data: courseOptions } = useProviderCourseOptions(selectedStageId);
  const { data: initialBackendCourse, isLoading: isBackendCourseLoading } =
    useProviderCourse(initialCourseId);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    if (newGrade !== grade) {
      setSubject("");
    }
  };

  // Sync initial backend course data when editing
  useEffect(() => {
    if (!initialCourseId) {
      setIsLoaded(true);
      return;
    }

    if (initialBackendCourse) {
      const bCourse = initialBackendCourse;
      setTitle(bCourse.title?.[locale] || bCourse.title?.ar || bCourse.title?.en || "");
      setDescription(
        bCourse.description?.[locale] || bCourse.description?.ar || bCourse.description?.en || "",
      );
      setPreviewVideoLink(bCourse.intro_video_url || "");
      setCoverImage(bCourse.cover_image || null);

      if (bCourse.status) {
        setCoursePublishStatus(bCourse.status);
      }
      setCourseScheduledPublishDate(bCourse.scheduled_publish_at || "");

      if (bCourse.instructor) {
        setTeacherName(String(bCourse.instructor_id));
      } else if (bCourse.instructor_id) {
        setTeacherName(String(bCourse.instructor_id));
      }

      setPeriod(bCourse.subscription_period || "monthly");
      setIsActive(bCourse.is_active !== undefined ? Boolean(bCourse.is_active) : true);

      setIsFree(Boolean(bCourse.is_free));
      setCoursePrice(
        bCourse.base_price !== undefined && bCourse.base_price !== null && bCourse.base_price !== ""
          ? Number(bCourse.base_price)
          : "",
      );
      setCurrency(bCourse.currency_code || "EGP");
      setHasOffer(Boolean(bCourse.has_discount));
      setOfferPercentage(bCourse.discount_percentage ? Number(bCourse.discount_percentage) : "");
      setOfferStartDate(bCourse.discount_starts_at || "");
      setOfferEndDate(bCourse.discount_ends_at || "");
      setHasTimeLimit(Boolean(bCourse.has_limited_access));
      setTimeLimitValue(bCourse.access_duration_days ? Number(bCourse.access_duration_days) : "");
      setVenue(bCourse.delivery_mode);

      if (bCourse.educational_stage_id) {
        setGrade(String(bCourse.educational_stage_id));
      }
      if (bCourse.subject_id) {
        setSubject(String(bCourse.subject_id));
      }

      setIsLoaded(true);
      return;
    } else if (!isBackendCourseLoading) {
      setIsLoaded(true);
    }
  }, [initialCourseId, initialBackendCourse, isBackendCourseLoading, locale]);

  const buildCoursePayload = (targetStatusOverride?: string) => {
    const stageId = Number(grade) || courseOptions?.educational_stages?.[0]?.id || 1;
    const subjectId = Number(subject) || courseOptions?.subjects?.[0]?.id || 1;
    const instructorId = Number(teacherName) || courseOptions?.instructors?.[0]?.id || undefined;
    const deliveryMode = venue || "hybrid";
    const subPeriod = period || "monthly";

    const isNewCourse =
      !initialCourseId && (!createdCourseId || createdCourseId.startsWith("course-"));
    const targetStatus =
      targetStatusOverride ||
      (isNewCourse
        ? "draft"
        : coursePublishStatus === "scheduled"
          ? "scheduled"
          : coursePublishStatus === "published"
            ? "published"
            : "draft");

    return {
      title: {
        ar: title.trim(),
        en: title.trim(),
      },
      description: {
        ar: description.trim(),
        en: description.trim(),
      },
      intro_video_url: previewVideoLink.trim() || undefined,
      cover_image: coverImageFile,
      ...(removeCoverImage ? { remove_cover_image: true } : {}),
      educational_stage_id: stageId,
      subject_id: subjectId,
      ...(courseOptions?.requires_instructor_selection && instructorId
        ? { instructor_id: instructorId }
        : {}),
      subscription_period: subPeriod,
      is_free: isFree,
      base_price: isFree ? 0 : Number(coursePrice) || 0,
      currency_code: currency || "EGP",
      has_discount: hasOffer,
      discount_percentage: hasOffer && offerPercentage ? Number(offerPercentage) : undefined,
      discount_starts_at: hasOffer && offerStartDate ? offerStartDate : undefined,
      discount_ends_at: hasOffer && offerEndDate ? offerEndDate : undefined,
      has_limited_access: hasTimeLimit,
      access_duration_days: hasTimeLimit && timeLimitValue ? Number(timeLimitValue) : undefined,
      uses_student_groups: false,
      delivery_mode: deliveryMode,
      status: targetStatus,
      scheduled_publish_at:
        targetStatus === "scheduled" && courseScheduledPublishDate
          ? courseScheduledPublishDate
          : undefined,
      is_active: isActive,
    };
  };

  const handleSubmit = async (e: React.SubmitEvent, isDraftOnly = false) => {
    e.preventDefault();
    if (isDraftOnly) {
      setIsSavingDraft(true);
    } else {
      setIsSubmitting(true);
    }

    const isNewCourse =
      !initialCourseId && (!createdCourseId || createdCourseId.startsWith("course-"));
    const targetStatus = isDraftOnly || isNewCourse ? "draft" : undefined;
    const coursePayload = buildCoursePayload(targetStatus);

    try {
      let savedCourseId = createdCourseId || initialCourseId;

      if (savedCourseId && !savedCourseId.startsWith("course-")) {
        await updateCourseMutation.mutateAsync({
          id: savedCourseId,
          data: coursePayload,
        });
      } else {
        const created = await createCourseMutation.mutateAsync(coursePayload);
        savedCourseId = String(created.id);
        setCreatedCourseId(savedCourseId);
      }

      setIsSavingDraft(false);
      setIsSubmitting(false);

      if (isDraftOnly) {
        setSuccessMessage(t("actions.draftSaved"));
        toast.success(t("actions.draftSaved"));
        setTimeout(() => {
          router.push("/dashboard/courses");
        }, 1000);
      } else {
        toast.success(
          locale === "ar"
            ? "تم حفظ تفاصيل الدورة بنجاح! يمكنك الآن إضافة الأقسام والدروس."
            : "Course details saved successfully! You can now add sections and lessons.",
        );
        setCurrentStep(2);
        onSuccessStepChange?.(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setIsSavingDraft(false);
      setIsSubmitting(false);
      console.error("Course save failed:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdatePublishStatus = (status: LessonPublishStatus) => {
    setCoursePublishStatus(status);
  };

  const handleUpdateScheduledPublishDate = (date: string) => {
    setCourseScheduledPublishDate(date);
  };

  const handleFinishCourse = async () => {
    const courseId = createdCourseId || initialCourseId;
    if (!courseId || courseId.startsWith("course-")) {
      router.push("/dashboard/courses");
      return;
    }

    try {
      // Use regular PUT /courses/{id} with full payload
      const fullPayload = buildCoursePayload(coursePublishStatus);
      await updateCourseMutation.mutateAsync({
        id: courseId,
        data: fullPayload,
      });

      toast.success(
        coursePublishStatus === "published"
          ? locale === "ar"
            ? "تم نشر الدورة بنجاح!"
            : "Course published successfully!"
          : coursePublishStatus === "scheduled"
            ? locale === "ar"
              ? "تم جدولة نشر الدورة بنجاح!"
              : "Course scheduled successfully!"
            : locale === "ar"
              ? "تم حفظ الدورة كمسودة بنجاح!"
              : "Course saved as draft!",
      );
      router.push("/dashboard/courses");
    } catch (err) {
      console.error("Failed to update course publish status:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const isInfoAndPriceComplete =
    Boolean(title && description && grade && subject && teacherName) &&
    (isFree || Boolean(coursePrice));

  return {
    isLoaded,
    currentStep,
    setCurrentStep,
    createdCourseId,
    setCreatedCourseId,
    isSubmitting,
    isSavingDraft,
    successMessage,
    isInfoAndPriceComplete,
    courseOptions,
    // Fields
    title,
    setTitle,
    description,
    setDescription,
    previewVideoLink,
    setPreviewVideoLink,
    coverImage,
    setCoverImage,
    coverImageFile,
    setCoverImageFile,
    removeCoverImage,
    setRemoveCoverImage,
    grade,
    setGrade: handleGradeChange,
    subject,
    setSubject,
    teacherName,
    setTeacherName,
    period,
    setPeriod,
    isFree,
    setIsFree,
    coursePrice,
    setCoursePrice,
    currency,
    setCurrency,
    hasOffer,
    setHasOffer,
    offerPercentage,
    setOfferPercentage,
    offerStartDate,
    setOfferStartDate,
    offerEndDate,
    setOfferEndDate,
    hasTimeLimit,
    setHasTimeLimit,
    timeLimitValue,
    setTimeLimitValue,
    isActive,
    setIsActive,
    venue,
    setVenue,
    coursePublishStatus,
    setCoursePublishStatus: handleUpdatePublishStatus,
    courseScheduledPublishDate,
    setCourseScheduledPublishDate: handleUpdateScheduledPublishDate,
    // Actions
    handleSubmit,
    handleFinish: handleFinishCourse,
  };
}
