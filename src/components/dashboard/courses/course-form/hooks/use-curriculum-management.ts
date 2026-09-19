/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { getErrorMessage } from "@/lib/api-utils";
import { coursesService } from "@/lib/api/courses-service";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  useCourseSections,
  useProviderCourse,
  useCreateCourseSection,
  useUpdateCourseSection,
  useDeleteCourseSection,
  useReorderCourseSections,
} from "@/hooks/use-courses";
import {
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useProviderLessonOptions,
} from "@/hooks/use-lessons";
import { useProviderExams } from "@/hooks/use-exams";
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
    courseId,
    grade: "",
    subject: "",
    teacherName: "",
    venue: "hybrid" as CourseVenue,
  });

  const queryClient = useQueryClient();
  const isBackendCourseId = Boolean(courseId && !courseId.startsWith("course-"));
  const { data: parentCourse } = useProviderCourse(isBackendCourseId ? courseId : undefined);
  const { data: backendSections } = useCourseSections(isBackendCourseId ? courseId : undefined);
  const { data: courseExamsData } = useProviderExams(
    isBackendCourseId ? { course_id: Number(courseId), per_page: 100 } : undefined,
  );
  const { data: lessonOptionsData } = useProviderLessonOptions();

  const createSectionMutation = useCreateCourseSection();
  const updateSectionMutation = useUpdateCourseSection();
  const deleteSectionMutation = useDeleteCourseSection();
  const reorderSectionsMutation = useReorderCourseSections();

  // Lesson Mutations
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();

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

  // Sync parent course context from backend course data
  useEffect(() => {
    if (parentCourse) {
      setParentCourseContext({
        courseId,
        grade:
          parentCourse.educational_stage?.name?.[locale] ||
          parentCourse.educational_stage?.name?.ar ||
          "",
        subject: parentCourse.subject?.name?.[locale] || parentCourse.subject?.name?.ar || "",
        teacherName: parentCourse.instructor?.full_name || "",
        venue: parentCourse.delivery_mode || "hybrid",
      });
    }
  }, [parentCourse, locale, courseId]);

  // Sync available exams for this course from backend
  useEffect(() => {
    if (courseExamsData?.exams && courseExamsData.exams.length > 0) {
      setAvailableExams(
        courseExamsData.exams.map((e) => ({
          id: String(e.id),
          title:
            typeof e.title === "string"
              ? e.title
              : e.title?.[locale] || e.title?.ar || e.title?.en || "",
          description: "",
          subject:
            e.subject?.name?.[locale] || e.subject?.name?.ar || parentCourseContext.subject || "",
          grade:
            e.educational_stage?.name?.[locale] ||
            e.educational_stage?.name?.ar ||
            parentCourseContext.grade ||
            "",
          teacherName: e.instructor?.full_name || parentCourseContext.teacherName || "",
          venue: parentCourseContext.venue || "hybrid",
          category: "test",
          examType: "course-dependent",
          courseId,
          triesAllowed: e.max_attempts || 1,
          durationMinutes: e.duration_minutes || 60,
          passingPercentage: e.passing_percentage,
          showModelAnswers: e.show_correct_answers_after_submission,
          randomizeQuestionsOrder: e.shuffle_questions,
          randomizeMCQChoices: e.shuffle_answer_options,
          examSections: [],
          numberOfQuestions: e.questions_count || 0,
          numberOfStudents: e.students_count || 0,
          successRate: e.success_rate || 0,
          timesUsed: e.attempts_count || 0,
          createdAt: e.created_at || new Date().toISOString(),
        })),
      );
    } else if (lessonOptionsData?.exams) {
      const courseIdNum = isBackendCourseId ? Number(courseId) : null;
      const matchedExams = courseIdNum
        ? lessonOptionsData.exams.filter((e) => Number(e.course_id) === courseIdNum)
        : [];
      setAvailableExams(
        matchedExams.map((e) => ({
          id: String(e.id),
          title: e.title?.[locale] || e.title?.ar || e.title?.en || "",
          description: "",
          subject: parentCourseContext.subject || "",
          grade: parentCourseContext.grade || "",
          teacherName: parentCourseContext.teacherName || "",
          venue: parentCourseContext.venue || "hybrid",
          category: "test",
          examType: "course-dependent",
          courseId,
          triesAllowed: 1,
          durationMinutes: 60,
          passingPercentage: e.passing_percentage,
          showModelAnswers: true,
          randomizeQuestionsOrder: false,
          randomizeMCQChoices: false,
          examSections: [],
          numberOfQuestions: 0,
          numberOfStudents: 0,
          successRate: 0,
          timesUsed: 0,
          createdAt: new Date().toISOString(),
        })),
      );
    } else {
      setAvailableExams([]);
    }
  }, [
    courseExamsData,
    lessonOptionsData,
    courseId,
    isBackendCourseId,
    locale,
    parentCourseContext,
  ]);

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
          type: (l.type === "text_only" ? "text" : "videoAndText") as LessonType,
          publishStatus: (l.status === "draft"
            ? "draft"
            : l.status === "scheduled"
              ? "scheduled"
              : "published") as LessonPublishStatus,
          isDraft: l.status === "draft",
          description: l.description?.[locale] || l.description?.ar || l.description?.en || "",
          lectureVideoLink: l.video_url || l.intro_video_url || undefined,
          video_url: l.video_url || l.intro_video_url || undefined,
          videoUrl: l.video_url || l.intro_video_url || undefined,
          coverImage: l.cover_image || l.cover_image_url || undefined,
          hasPdfAttachments: Boolean(
            l.has_pdf_attachments || (l.pdf_attachments && l.pdf_attachments.length > 0),
          ),
          pdfFiles: (l.pdf_attachments || []).map((p) => ({
            id: String(p.id),
            title: p.name || p.file_name || "PDF Document",
            fileUrl: p.url,
            fileType: "pdf" as const,
            sizeInBytes: p.size,
          })),
          hasImageAttachments: Boolean(
            l.has_explanatory_images || (l.explanatory_images && l.explanatory_images.length > 0),
          ),
          imageFiles: (l.explanatory_images || []).map((img) => ({
            id: String(img.id),
            title: img.name || "Image",
            fileUrl: img.url,
            fileType: "image" as const,
            sizeInBytes: img.size,
          })),
          isLinkedToExam: Boolean(l.exam_id),
          linkedExamId: l.exam_id ? String(l.exam_id) : undefined,
          linkedExamTitle: l.exam?.title?.[locale] || l.exam?.title?.ar || undefined,
          isRequiredPassExam: Boolean(l.requires_exam_pass_to_unlock_next_lesson),
          scheduledPublishDate: l.scheduled_publish_at || undefined,
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
              type: (l.type === "text_only" ? "text" : "videoAndText") as LessonType,
              publishStatus: (l.status === "draft"
                ? "draft"
                : l.status === "scheduled"
                  ? "scheduled"
                  : "published") as LessonPublishStatus,
              isDraft: l.status === "draft",
              description: l.description?.[locale] || l.description?.ar || l.description?.en || "",
              lectureVideoLink: l.video_url || l.intro_video_url || undefined,
              video_url: l.video_url || l.intro_video_url || undefined,
              videoUrl: l.video_url || l.intro_video_url || undefined,
              coverImage: l.cover_image || l.cover_image_url || undefined,
              hasPdfAttachments: Boolean(
                l.has_pdf_attachments || (l.pdf_attachments && l.pdf_attachments.length > 0),
              ),
              pdfFiles: (l.pdf_attachments || []).map((p) => ({
                id: String(p.id),
                title: p.name || p.file_name || "PDF Document",
                fileUrl: p.url,
                fileType: "pdf" as const,
                sizeInBytes: p.size,
              })),
              hasImageAttachments: Boolean(
                l.has_explanatory_images ||
                (l.explanatory_images && l.explanatory_images.length > 0),
              ),
              imageFiles: (l.explanatory_images || []).map((img) => ({
                id: String(img.id),
                title: img.name || "Image",
                fileUrl: img.url,
                fileType: "image" as const,
                sizeInBytes: img.size,
              })),
              isLinkedToExam: Boolean(l.exam_id),
              linkedExamId: l.exam_id ? String(l.exam_id) : undefined,
              linkedExamTitle: l.exam?.title?.[locale] || l.exam?.title?.ar || undefined,
              isRequiredPassExam: Boolean(l.requires_exam_pass_to_unlock_next_lesson),
              scheduledPublishDate: l.scheduled_publish_at || undefined,
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

  const handleSaveLesson = async (targetSecId: string, savedLesson: Lesson) => {
    try {
      let finalLesson = savedLesson;
      const isBackendSec = !targetSecId.startsWith("sec-");
      const isExistingBackendLesson = !savedLesson.id.startsWith("les-");

      if (isBackendCourseId && isBackendSec) {
        const newPdfFiles = (savedLesson.pdfFiles || [])
          .map((p) => p.rawFile)
          .filter(Boolean) as File[];
        const newImageFiles = (savedLesson.imageFiles || [])
          .map((img) => img.rawFile)
          .filter(Boolean) as File[];

        const payload = {
          classification: "course" as const,
          course_id: Number(courseId),
          course_section_id: Number(targetSecId),
          type: (savedLesson.type === "text" ? "text_only" : "video_and_text") as
            | "text_only"
            | "video_and_text",
          title: { ar: savedLesson.title, en: savedLesson.title },
          description: savedLesson.description
            ? { ar: savedLesson.description, en: savedLesson.description }
            : undefined,
          video_url: savedLesson.lectureVideoLink || undefined,
          cover_image: savedLesson.coverImageFile || undefined,
          remove_cover_image: savedLesson.removeCoverImage || undefined,
          has_pdf_attachments: Boolean(savedLesson.hasPdfAttachments),
          pdf_files: newPdfFiles.length > 0 ? newPdfFiles : undefined,
          has_explanatory_images: Boolean(savedLesson.hasImageAttachments),
          explanatory_images: newImageFiles.length > 0 ? newImageFiles : undefined,
          delete_media_ids:
            savedLesson.deleteMediaIds && savedLesson.deleteMediaIds.length > 0
              ? savedLesson.deleteMediaIds
              : undefined,
          has_exam: Boolean(savedLesson.isLinkedToExam && savedLesson.linkedExamId),
          exam_id:
            savedLesson.isLinkedToExam && savedLesson.linkedExamId
              ? Number(savedLesson.linkedExamId)
              : null,
          requires_exam_pass_to_unlock_next_lesson: Boolean(savedLesson.isRequiredPassExam),
          status: savedLesson.publishStatus || "published",
          scheduled_publish_at: savedLesson.scheduledPublishDate || undefined,
          is_active: true,
        };

        if (isExistingBackendLesson) {
          const res = await updateLessonMutation.mutateAsync({
            id: savedLesson.id,
            data: payload,
          });
          finalLesson = {
            ...savedLesson,
            id: String(res.id),
            lectureVideoLink: res.video_url || undefined,
            coverImage: res.cover_image || res.cover_image_url || undefined,
            coverImageFile: null,
            removeCoverImage: false,
          };
          toast.success(locale === "ar" ? "تم تحديث الدرس بنجاح" : "Lesson updated successfully");
        } else {
          const res = await createLessonMutation.mutateAsync(payload);
          finalLesson = {
            ...savedLesson,
            id: String(res.id),
            lectureVideoLink: res.video_url || undefined,
            coverImage: res.cover_image || res.cover_image_url || undefined,
            coverImageFile: null,
            removeCoverImage: false,
          };
          toast.success(locale === "ar" ? "تم إنشاء الدرس بنجاح" : "Lesson created successfully");
        }
      }

      const updated = sections.map((sec) => {
        const lessonExistsInSec = sec.lessons.some(
          (l) => l.id === savedLesson.id || l.id === finalLesson.id,
        );
        if (sec.id === targetSecId) {
          if (lessonExistsInSec) {
            return {
              ...sec,
              lessons: sec.lessons.map((l) =>
                l.id === savedLesson.id || l.id === finalLesson.id ? finalLesson : l,
              ),
            };
          } else {
            return {
              ...sec,
              lessons: [
                ...sec.lessons.filter((l) => l.id !== savedLesson.id && l.id !== finalLesson.id),
                finalLesson,
              ],
            };
          }
        } else if (lessonExistsInSec) {
          return {
            ...sec,
            lessons: sec.lessons.filter((l) => l.id !== savedLesson.id && l.id !== finalLesson.id),
          };
        }
        return sec;
      });

      setSections(updated);
      setEditingLesson(null);
      setActiveDialog(null);
    } catch (err) {
      console.error("Failed to save lesson:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveManyLessons = async (targetSecId: string, savedLessons: Lesson[]) => {
    try {
      const isBackendSec = !targetSecId.startsWith("sec-");
      let attachedLessons = [...savedLessons];

      if (isBackendCourseId && isBackendSec) {
        const promises = savedLessons.map((l) =>
          createLessonMutation.mutateAsync({
            classification: "course",
            course_id: Number(courseId),
            course_section_id: Number(targetSecId),
            original_lesson_id: !Number.isNaN(Number(l.id)) ? Number(l.id) : undefined,
            type: l.type === "text" ? "text_only" : "video_and_text",
            title: { ar: l.title, en: l.title },
            description: l.description ? { ar: l.description, en: l.description } : undefined,
            video_url: l.lectureVideoLink || undefined,
            cover_image: l.coverImageFile || undefined,
            has_pdf_attachments: Boolean(l.hasPdfAttachments),
            has_explanatory_images: Boolean(l.hasImageAttachments),
            has_exam: Boolean(l.isLinkedToExam && l.linkedExamId),
            exam_id: l.isLinkedToExam && l.linkedExamId ? Number(l.linkedExamId) : null,
            requires_exam_pass_to_unlock_next_lesson: Boolean(l.isRequiredPassExam),
            status: l.publishStatus || "published",
            scheduled_publish_at: l.scheduledPublishDate || undefined,
            is_active: true,
          }),
        );
        const created = await Promise.all(promises);
        attachedLessons = created.map((res, i) => ({
          ...savedLessons[i],
          id: String(res.id),
        }));
        toast.success(
          locale === "ar"
            ? `تم إضافة ${created.length} دروس بنجاح`
            : `Successfully added ${created.length} lessons`,
        );
      }

      const updated = sections.map((sec) => {
        if (sec.id === targetSecId) {
          return { ...sec, lessons: [...sec.lessons, ...attachedLessons] };
        }
        return sec;
      });
      setSections(updated);
      setEditingLesson(null);
      setActiveDialog(null);
    } catch (err) {
      console.error("Failed to add lessons from bank:", err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    const { lesson, sectionId } = lessonToDelete;

    try {
      if (isBackendCourseId && !lesson.id.startsWith("les-")) {
        await deleteLessonMutation.mutateAsync(lesson.id);
        toast.success(locale === "ar" ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully");
      }

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
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      toast.error(getErrorMessage(err));
    }
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
        let totalImportedLessonsCount = 0;

        for (const sec of selectedImportSectionsList) {
          const createdSection = await coursesService.createSection(courseId, {
            title: {
              ar: sec.title,
              en: sec.title,
            },
            status: "draft",
          });

          if (sec.lessons && sec.lessons.length > 0) {
            const lessonPromises = sec.lessons.map((l) =>
              createLessonMutation.mutateAsync({
                classification: "course",
                course_id: Number(courseId),
                course_section_id: Number(createdSection.id),
                original_lesson_id: !Number.isNaN(Number(l.id)) ? Number(l.id) : undefined,
                type: l.type === "text" ? "text_only" : "video_and_text",
                title: { ar: l.title, en: l.title },
                description: l.description ? { ar: l.description, en: l.description } : undefined,
                video_url: l.lectureVideoLink || undefined,
                has_pdf_attachments: Boolean(l.hasPdfAttachments),
                has_explanatory_images: Boolean(l.hasImageAttachments),
                has_exam: Boolean(l.isLinkedToExam && l.linkedExamId),
                exam_id: l.isLinkedToExam && l.linkedExamId ? Number(l.linkedExamId) : null,
                requires_exam_pass_to_unlock_next_lesson: Boolean(l.isRequiredPassExam),
                status: l.publishStatus || "draft",
                scheduled_publish_at: l.scheduledPublishDate || undefined,
                is_active: true,
              }),
            );

            await Promise.all(lessonPromises);
            totalImportedLessonsCount += sec.lessons.length;
          }
        }

        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.courses.sections(courseId),
        });
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.provider.courses.detail(courseId), "content"],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.provider.lessons.all(),
        });

        toast.success(
          locale === "ar"
            ? `تم استيراد ${selectedImportSectionsList.length} أقسام و ${totalImportedLessonsCount} دروس بنجاح!`
            : `Successfully imported ${selectedImportSectionsList.length} sections and ${totalImportedLessonsCount} lessons!`,
        );
      } else {
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
      }

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
    isDeletingLesson: deleteLessonMutation.isPending,
    isSavingLesson: createLessonMutation.isPending || updateLessonMutation.isPending,
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
