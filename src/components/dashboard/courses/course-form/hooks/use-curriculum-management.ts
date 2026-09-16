/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Course,
  CourseSection,
  CourseVenue,
  Lesson,
  LessonPublishStatus,
  LessonType,
} from "@/types/course";
import { Exam } from "@/types/exam";
import { getStoredExams } from "@/lib/exams-storage";
import { getErrorMessage } from "@/lib/api-utils";
import { coursesService } from "@/lib/api/courses-service";
import {
  useCourseSections,
  useProviderCourse,
  useCreateCourseSection,
  useUpdateCourseSection,
  useDeleteCourseSection,
  useReorderCourseSections,
} from "@/hooks/use-courses";
import { DialogType, EditingLessonState, LessonToDeleteState, ParentCourseContext } from "../types";

interface UseCurriculumManagementProps {
  courseId: string;
  locale: string;
}

export function useCurriculumManagement({ courseId, locale }: UseCurriculumManagementProps) {
  const t = useTranslations("courses.new");

  // State for sections list
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CourseSection | null>(null);
  const [editingLesson, setEditingLesson] = useState<EditingLessonState | null>(null);
  const [lessonTargetSectionId, setLessonTargetSectionId] = useState<string | undefined>(undefined);
  const [lessonToDelete, setLessonToDelete] = useState<LessonToDeleteState | null>(null);

  // Parent Course Context for auto-filling
  const [parentCourseContext, setParentCourseContext] = useState<ParentCourseContext>({
    grade: "",
    subject: "",
    teacherName: "",
    venue: "all" as CourseVenue,
  });

  // TanStack Query & Mutation hooks for Sections and Parent Course
  const isBackendCourseId = courseId && !courseId.startsWith("course-");
  const { data: parentCourse } = useProviderCourse(isBackendCourseId ? courseId : undefined);
  const { data: backendSections } = useCourseSections(isBackendCourseId ? courseId : undefined);
  const createSectionMutation = useCreateCourseSection();
  const updateSectionMutation = useUpdateCourseSection();
  const deleteSectionMutation = useDeleteCourseSection();
  const reorderSectionsMutation = useReorderCourseSections();

  // Dialog Form states: Section
  const [newSecTitle, setNewSecTitle] = useState("");
  const [newSecStatus, setNewSecStatus] = useState<LessonPublishStatus>("draft");
  const [newSecScheduledDate, setNewSecScheduledDate] = useState("");
  const [newSecIsLinkedExam, setNewSecIsLinkedExam] = useState(false);
  const [newSecLinkedExamId, setNewSecLinkedExamId] = useState("");
  const [newSecIsReqPass, setNewSecIsReqPass] = useState(false);
  const [newSecScheduleDateError, setNewSecScheduleDateError] = useState<string | null>(null);

  // Dialog Form states: Import Sections From Other Courses
  const [importCourseId, setImportCourseId] = useState("");
  const [selectedImportSectionIds, setSelectedImportSectionIds] = useState<string[]>([]);
  const [allCoursesList, setAllCoursesList] = useState<Course[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [availableImportSections, setAvailableImportSections] = useState<CourseSection[]>([]);

  // Load stored exams
  useEffect(() => {
    setAvailableExams(getStoredExams(locale));
  }, [locale]);

  // Sync parent course context from backend course data
  useEffect(() => {
    if (parentCourse) {
      setParentCourseContext({
        grade:
          parentCourse.educational_stage?.name?.[locale] ||
          parentCourse.educational_stage?.name?.ar ||
          "",
        subject: parentCourse.subject?.name?.[locale] || parentCourse.subject?.name?.ar || "",
        teacherName: parentCourse.instructor?.full_name || "",
        venue: parentCourse.delivery_mode || "all",
      });
    }
  }, [parentCourse, locale]);

  // Sync backend sections into local state when fetched
  useEffect(() => {
    if (backendSections && backendSections.length > 0) {
      const adapted: CourseSection[] = backendSections.map((sec) => {
        const titleStr = sec.title?.[locale] || sec.title?.ar || sec.title?.en || "";
        const isDraft = sec.status === "draft";
        const hasExam = Boolean(sec.exam_id);
        const mappedLessons: Lesson[] = (sec.lessons || []).map((l) => ({
          id: String(l.id),
          title: l.title?.[locale] || l.title?.ar || l.title?.en || "",
          type: (l.type === "text" ? "text" : "videoAndText") as LessonType,
          publishStatus: (l.status === "draft" ? "draft" : "published") as LessonPublishStatus,
          isDraft: l.status === "draft",
          description: l.description?.[locale] || l.description?.ar || l.description?.en || "",
        }));

        return {
          id: String(sec.id),
          title: titleStr,
          isDraft,
          status: sec.status as LessonPublishStatus,
          scheduledPublishDate: sec.scheduled_publish_at || undefined,
          isLinkedToExam: hasExam,
          linkedExamId: sec.exam_id ? String(sec.exam_id) : undefined,
          linkedExamTitle: sec.exam?.title?.[locale] || sec.exam?.title?.ar || undefined,
          isRequiredPassExamForNextSection: Boolean(sec.requires_exam_pass_to_unlock_next_section),
          lessons: mappedLessons,
        };
      });
      setSections(adapted);
    }
  }, [backendSections, locale]);

  // Load all courses for importing directly from backend
  useEffect(() => {
    let isMounted = true;
    coursesService
      .getCourses({ per_page: 50 })
      .then((res) => {
        if (!isMounted) return;
        const bList: Course[] = res.courses
          .filter((c) => String(c.id) !== courseId)
          .map((c) => ({
            id: String(c.id),
            title: c.title?.[locale] || c.title?.ar || c.title?.en || "",
            description: c.description?.[locale] || c.description?.ar || c.description?.en || "",
            coverImage: c.cover_image || "",
            subject: c.subject?.name?.[locale] || "",
            grade: c.educational_stage?.name?.[locale] || "",
            teacherName: c.instructor?.full_name || "",
            period: c.subscription_period,
            price: Number(c.base_price) || 0,
            isFree: Boolean(c.is_free),
            isDraft: c.status === "draft",
            publishStatus:
              c.status === "published"
                ? "published"
                : c.status === "scheduled"
                  ? "scheduled"
                  : "draft",
            currency: "EGP",
            date: c.created_at ? new Date(c.created_at).toLocaleDateString(locale) : "",
            numberOfLessons: c.lessons_count ?? 0,
            numberOfParticipants: c.enrolled_students_count ?? 0,
            hasOffer: false,
            hasTimeLimit: false,
            isSplitToSections: true,
            venue: c.delivery_mode || "online",
            sections: [],
          }));
        setAllCoursesList(bList);
      })
      .catch(() => {
        if (!isMounted) return;
        setAllCoursesList([]);
      });
    return () => {
      isMounted = false;
    };
  }, [locale, courseId]);

  // When source course is chosen, load its sections
  useEffect(() => {
    if (!importCourseId) {
      setAvailableImportSections([]);
      return;
    }

    if (!importCourseId.startsWith("course-")) {
      coursesService
        .getCourseContent(importCourseId)
        .then((content) => {
          const secs: CourseSection[] = (content.sections || []).map((sec) => ({
            id: String(sec.id),
            title: sec.title?.[locale] || sec.title?.ar || sec.title?.en || "",
            isDraft: sec.status === "draft",
            status:
              sec.status === "published"
                ? "published"
                : sec.status === "scheduled"
                  ? "scheduled"
                  : "draft",
            isLinkedToExam: Boolean(sec.exam_id),
            linkedExamId: sec.exam_id ? String(sec.exam_id) : undefined,
            linkedExamTitle:
              sec.exam?.title?.[locale] || sec.exam?.title?.ar || sec.exam?.title?.en || undefined,
            isRequiredPassExamForNextSection: Boolean(
              sec.requires_exam_pass_to_unlock_next_section,
            ),
            lessons: (sec.lessons || []).map((l) => ({
              id: String(l.id),
              title: l.title?.[locale] || l.title?.ar || l.title?.en || "",
              type: "videoAndText" as LessonType,
              publishStatus: "published" as LessonPublishStatus,
            })),
          }));
          setAvailableImportSections(secs);
        })
        .catch(() => {
          setAvailableImportSections([]);
        });
    } else {
      setAvailableImportSections([]);
    }
  }, [importCourseId, locale]);

  const selectedImportSectionsList = availableImportSections.filter((s) =>
    selectedImportSectionIds.includes(s.id),
  );

  const handleOpenAddSection = () => {
    setEditingSection(null);
    setNewSecTitle("");
    setNewSecStatus("draft");
    setNewSecScheduledDate("");
    setNewSecIsLinkedExam(false);
    setNewSecLinkedExamId("");
    setNewSecIsReqPass(false);
    setNewSecScheduleDateError(null);
    setActiveDialog("section");
  };

  const handleOpenEditSection = (sec: CourseSection) => {
    setEditingSection(sec);
    setNewSecTitle(sec.title || "");
    const status: LessonPublishStatus = sec.status || (sec.isDraft ? "draft" : "published");
    setNewSecStatus(status);
    setNewSecScheduledDate(sec.scheduledPublishDate || "");
    setNewSecIsLinkedExam(Boolean(sec.isLinkedToExam));
    setNewSecLinkedExamId(sec.linkedExamId || "");
    setNewSecIsReqPass(Boolean(sec.isRequiredPassExamForNextSection));
    setNewSecScheduleDateError(null);
    setActiveDialog("section");
  };

  const handleSaveSection = async () => {
    if (!newSecTitle.trim()) return;
    setNewSecScheduleDateError(null);

    if (newSecStatus === "scheduled" && parentCourse && parentCourse.status === "scheduled") {
      if (parentCourse.scheduled_publish_at && newSecScheduledDate) {
        if (newSecScheduledDate < parentCourse.scheduled_publish_at) {
          setNewSecScheduleDateError(
            t("step2.addSectionDialog.sectionDateAfterCourseScheduleError", {
              date: parentCourse.scheduled_publish_at,
            }),
          );
          return;
        }
      }
    }

    const selectedExam = availableExams.find((e) => e.id === newSecLinkedExamId);
    const parsedExamId =
      newSecIsLinkedExam && newSecLinkedExamId ? Number(newSecLinkedExamId) || null : null;

    const sectionPayload = {
      title: {
        ar: newSecTitle.trim(),
        en: newSecTitle.trim(),
      },
      exam_id: parsedExamId,
      requires_exam_pass_to_unlock_next_section: parsedExamId ? newSecIsReqPass : false,
      status: newSecStatus,
      scheduled_publish_at:
        newSecStatus === "scheduled" && newSecScheduledDate ? newSecScheduledDate : undefined,
    };

    try {
      if (isBackendCourseId) {
        if (editingSection && !editingSection.id.startsWith("sec-")) {
          await updateSectionMutation.mutateAsync({
            courseId,
            sectionId: editingSection.id,
            data: sectionPayload,
          });
          toast.success(locale === "ar" ? "تم تحديث القسم بنجاح" : "Section updated successfully");
        } else {
          await createSectionMutation.mutateAsync({
            courseId,
            data: sectionPayload,
          });
          toast.success(locale === "ar" ? "تم إنشاء القسم بنجاح" : "Section created successfully");
        }
      }

      if (editingSection) {
        const updated = sections.map((s) => {
          if (s.id === editingSection.id) {
            return {
              ...s,
              title: newSecTitle.trim(),
              isDraft: newSecStatus === "draft",
              status: newSecStatus,
              scheduledPublishDate: newSecStatus === "scheduled" ? newSecScheduledDate : undefined,
              isLinkedToExam: newSecIsLinkedExam,
              linkedExamId: newSecIsLinkedExam ? newSecLinkedExamId || undefined : undefined,
              linkedExamTitle: newSecIsLinkedExam ? selectedExam?.title : undefined,
              isRequiredPassExamForNextSection: newSecIsLinkedExam ? newSecIsReqPass : false,
            };
          }
          return s;
        });
        setSections(updated);
      } else {
        const secId = `sec-${Date.now()}`;
        const newSec: CourseSection = {
          id: secId,
          title: newSecTitle.trim(),
          isDraft: newSecStatus === "draft",
          status: newSecStatus,
          scheduledPublishDate: newSecStatus === "scheduled" ? newSecScheduledDate : undefined,
          isLinkedToExam: newSecIsLinkedExam,
          linkedExamId: newSecIsLinkedExam ? newSecLinkedExamId || undefined : undefined,
          linkedExamTitle: newSecIsLinkedExam ? selectedExam?.title : undefined,
          isRequiredPassExamForNextSection: newSecIsLinkedExam ? newSecIsReqPass : false,
          lessons: [],
        };
        const updated = [...sections, newSec];
        setSections(updated);
      }

      setEditingSection(null);
      setNewSecTitle("");
      setNewSecStatus("draft");
      setNewSecScheduledDate("");
      setNewSecIsLinkedExam(false);
      setNewSecLinkedExamId("");
      setNewSecIsReqPass(false);
      setActiveDialog(null);
    } catch (err) {
      console.error("Failed to save section:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      if (isBackendCourseId && !sectionToDelete.id.startsWith("sec-")) {
        await deleteSectionMutation.mutateAsync({
          courseId,
          sectionId: sectionToDelete.id,
        });
        toast.success(locale === "ar" ? "تم حذف القسم بنجاح" : "Section deleted successfully");
      }

      const updated = sections.filter((s) => s.id !== sectionToDelete.id);
      setSections(updated);
      setSectionToDelete(null);
    } catch (err) {
      console.error("Failed to delete section:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveLesson = (targetSecId: string, savedLesson: Lesson) => {
    const updated = sections.map((sec) => {
      const lessonExistsInSec = sec.lessons.some((l) => l.id === savedLesson.id);
      if (sec.id === targetSecId) {
        if (lessonExistsInSec) {
          return {
            ...sec,
            lessons: sec.lessons.map((l) => (l.id === savedLesson.id ? savedLesson : l)),
          };
        } else {
          return {
            ...sec,
            lessons: [...sec.lessons.filter((l) => l.id !== savedLesson.id), savedLesson],
          };
        }
      } else if (lessonExistsInSec) {
        return {
          ...sec,
          lessons: sec.lessons.filter((l) => l.id !== savedLesson.id),
        };
      }
      return sec;
    });

    setSections(updated);
    setEditingLesson(null);
    setActiveDialog(null);
  };

  const handleSaveManyLessons = (targetSecId: string, savedLessons: Lesson[]) => {
    const updated = sections.map((sec) => {
      if (sec.id === targetSecId) {
        return { ...sec, lessons: [...sec.lessons, ...savedLessons] };
      }
      return sec;
    });
    setSections(updated);
    setEditingLesson(null);
    setActiveDialog(null);
  };

  const handleDeleteLesson = () => {
    if (!lessonToDelete) return;
    const { lesson, sectionId } = lessonToDelete;
    const updated = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lessons: sec.lessons.filter((l) => l.id !== lesson.id),
        };
      }
      return sec;
    });
    setSections(updated);
    setLessonToDelete(null);
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);

    if (isBackendCourseId) {
      const validNumericIds = updated.map((s) => Number(s.id)).filter((n) => !isNaN(n) && n > 0);
      if (validNumericIds.length === updated.length) {
        try {
          await reorderSectionsMutation.mutateAsync({
            courseId,
            sectionIds: validNumericIds,
          });
        } catch (err) {
          console.error("Failed to sync section order to backend:", err);
        }
      }
    }
  };

  const handleImportSections = async () => {
    if (!importCourseId || selectedImportSectionIds.length === 0) return;
    setIsImporting(true);

    try {
      if (isBackendCourseId) {
        const creationPromises = selectedImportSectionsList.map((sec) =>
          coursesService.createSection(courseId, {
            title: {
              ar: sec.title,
              en: sec.title,
            },
            status: "draft",
          }),
        );

        const createdSections = await Promise.all(creationPromises);
        toast.success(
          locale === "ar"
            ? `تم استيراد ${createdSections.length} أقسام بنجاح!`
            : `Successfully imported ${createdSections.length} sections!`,
        );
      }

      const now = Date.now();
      const clonedSections: CourseSection[] = selectedImportSectionsList.map((sec, sIndex) => {
        const newSecId = `sec-${now}-${sIndex}`;
        return {
          id: newSecId,
          title: sec.title,
          isDraft: true,
          status: "draft",
          isLinkedToExam: Boolean(sec.isLinkedToExam),
          linkedExamId: sec.linkedExamId,
          linkedExamTitle: sec.linkedExamTitle,
          isRequiredPassExamForNextSection: Boolean(sec.isRequiredPassExamForNextSection),
          hasExamExpiryDate: sec.hasExamExpiryDate,
          examStartDate: sec.examStartDate,
          examExpiryDate: sec.examExpiryDate,
          lessons: (sec.lessons || []).map((l, lIndex) => ({
            ...l,
            id: `les-${now}-${sIndex}-${lIndex}`,
          })),
        };
      });

      const updatedSections = [...sections, ...clonedSections];
      setSections(updatedSections);

      setImportCourseId("");
      setSelectedImportSectionIds([]);
      setActiveDialog(null);
    } catch (err) {
      console.error("Failed to import sections:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setIsImporting(false);
    }
  };

  return {
    sections,
    availableExams,
    activeDialog,
    setActiveDialog,
    editingSection,
    setEditingSection,
    sectionToDelete,
    setSectionToDelete,
    editingLesson,
    setEditingLesson,
    lessonTargetSectionId,
    setLessonTargetSectionId,
    lessonToDelete,
    setLessonToDelete,
    parentCourseContext,
    // Section dialog form
    newSecTitle,
    setNewSecTitle,
    newSecStatus,
    setNewSecStatus,
    newSecScheduledDate,
    setNewSecScheduledDate,
    newSecIsLinkedExam,
    setNewSecIsLinkedExam,
    newSecLinkedExamId,
    setNewSecLinkedExamId,
    newSecIsReqPass,
    setNewSecIsReqPass,
    newSecScheduleDateError,
    // Import dialog form
    importCourseId,
    setImportCourseId,
    selectedImportSectionIds,
    setSelectedImportSectionIds,
    allCoursesList,
    availableImportSections,
    selectedImportSectionsList,
    isImporting,
    // Handlers
    handleOpenAddSection,
    handleOpenEditSection,
    handleSaveSection,
    handleDeleteSection,
    handleSaveLesson,
    handleSaveManyLessons,
    handleDeleteLesson,
    handleMoveSection,
    handleImportSections,
  };
}
