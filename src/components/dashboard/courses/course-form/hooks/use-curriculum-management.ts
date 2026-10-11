/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Course, CourseSection, Lesson, LessonPublishStatus, LessonType } from "@/types/course";
import { Exam } from "@/types/exam";
import { getErrorMessage } from "@/lib/api-utils";
import { coursesService } from "@/lib/api/courses-service";
import { examsService } from "@/lib/api/exams-service";
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
  useBulkCreateLessons,
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
  });

  const queryClient = useQueryClient();
  const isBackendCourseId = Boolean(courseId && !courseId.startsWith("course-"));
  const { data: parentCourse } = useProviderCourse(isBackendCourseId ? courseId : undefined);
  const { data: backendSections } = useCourseSections(isBackendCourseId ? courseId : undefined);
  const { data: allProviderExamsData } = useProviderExams({ per_page: 100 });
  const { data: lessonOptionsData } = useProviderLessonOptions(
    parentCourse?.educational_stage_id || undefined,
  );

  const createSectionMutation = useCreateCourseSection();
  const updateSectionMutation = useUpdateCourseSection();
  const deleteSectionMutation = useDeleteCourseSection();
  const reorderSectionsMutation = useReorderCourseSections();

  // Lesson Mutations
  const createLessonMutation = useCreateLesson();
  const bulkCreateLessonsMutation = useBulkCreateLessons();
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
        educationalStageId: parentCourse.educational_stage_id,
        subjectId: parentCourse.subject_id,
        grade:
          parentCourse.educational_stage?.name?.[locale] ||
          parentCourse.educational_stage?.name?.ar ||
          "",
        subject: parentCourse.subject?.name?.[locale] || parentCourse.subject?.name?.ar || "",
        teacherName: parentCourse.instructor?.full_name || "",
      });
    }
  }, [parentCourse, locale, courseId]);

  // Sync available exams for the course matching educational stage and subject
  useEffect(() => {
    const courseStageId = parentCourse?.educational_stage_id;
    const courseSubjectId = parentCourse?.subject_id;
    const courseInstructorId = parentCourse?.instructor_id;

    if (allProviderExamsData?.exams && allProviderExamsData.exams.length > 0) {
      const filtered = allProviderExamsData.exams.filter((e) => {
        if (
          courseStageId &&
          e.educational_stage_id &&
          Number(e.educational_stage_id) !== Number(courseStageId)
        ) {
          return false;
        }
        if (courseSubjectId && e.subject_id && Number(e.subject_id) !== Number(courseSubjectId)) {
          return false;
        }
        if (
          courseInstructorId &&
          e.instructor_id &&
          Number(e.instructor_id) !== Number(courseInstructorId)
        ) {
          return false;
        }
        return true;
      });

      setAvailableExams(
        filtered.map((e) => ({
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
          category: "test",
          examType: e.is_standalone ? "independent" : "course-dependent",
          courseId: e.course_id ? String(e.course_id) : undefined,
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
      const filtered = lessonOptionsData.exams.filter((e) => {
        if (
          courseStageId &&
          e.educational_stage_id &&
          Number(e.educational_stage_id) !== Number(courseStageId)
        ) {
          return false;
        }
        if (courseSubjectId && e.subject_id && Number(e.subject_id) !== Number(courseSubjectId)) {
          return false;
        }
        if (
          courseInstructorId &&
          e.instructor_id &&
          Number(e.instructor_id) !== Number(courseInstructorId)
        ) {
          return false;
        }
        return true;
      });

      setAvailableExams(
        filtered.map((e) => ({
          id: String(e.id),
          title: e.title?.[locale] || e.title?.ar || e.title?.en || "",
          description: "",
          subject: parentCourseContext.subject || "",
          grade: parentCourseContext.grade || "",
          teacherName: parentCourseContext.teacherName || "",
          category: "test",
          examType: "independent",
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
  }, [allProviderExamsData, lessonOptionsData, parentCourse, locale, parentCourseContext]);

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
      .getCourses({
        per_page: 50,
        ...(parentCourse?.educational_stage_id
          ? { educational_stage_id: parentCourse.educational_stage_id }
          : {}),
        ...(parentCourse?.subject_id ? { subject_id: parentCourse.subject_id } : {}),
      })
      .then((res) => {
        if (!isMounted) return;
        const bList: Course[] = res.courses
          .filter((c) => {
            if (String(c.id) === courseId) return false;
            if (
              parentCourse?.educational_stage_id &&
              c.educational_stage_id &&
              Number(c.educational_stage_id) !== Number(parentCourse.educational_stage_id)
            ) {
              return false;
            }
            if (
              parentCourse?.subject_id &&
              c.subject_id &&
              Number(c.subject_id) !== Number(parentCourse.subject_id)
            ) {
              return false;
            }
            return true;
          })
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
  }, [locale, courseId, parentCourse]);

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
    let parsedExamId =
      newSecIsLinkedExam && newSecLinkedExamId ? Number(newSecLinkedExamId) || null : null;

    try {
      if (isBackendCourseId) {
        // Clone the selected exam into this course unless it's already the section's current exam
        const isSameAsCurrent =
          Boolean(editingSection?.linkedExamId) &&
          String(editingSection?.linkedExamId) === String(parsedExamId);
        if (parsedExamId && selectedExam && !isSameAsCurrent) {
          try {
            const clonedExam = await examsService.createExam({
              source_exam_id: parsedExamId,
              course_id: Number(courseId),
              scope: "course",
            });
            parsedExamId = clonedExam.id;
          } catch (cloneErr) {
            console.error("Failed to clone exam for section:", cloneErr);
            toast.error(
              locale === "ar"
                ? "فشل في ربط الامتحان بالقسم (تعذر نسخ الامتحان للدورة)"
                : "Failed to clone exam for course section",
            );
            return;
          }
        }

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
              linkedExamId: newSecIsLinkedExam && parsedExamId ? String(parsedExamId) : undefined,
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
          linkedExamId: newSecIsLinkedExam && parsedExamId ? String(parsedExamId) : undefined,
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
        let lessonExamId =
          savedLesson.isLinkedToExam && savedLesson.linkedExamId
            ? Number(savedLesson.linkedExamId)
            : null;

        const selectedLessonExam = availableExams.find((e) => e.id === savedLesson.linkedExamId);

        // Clone the selected exam into this course unless it's already the lesson's current exam
        const currentLessonExamId = sections
          .flatMap((s) => s.lessons || [])
          .find((l) => l.id === savedLesson.id)?.linkedExamId;
        const isSameAsCurrentLessonExam =
          Boolean(currentLessonExamId) && String(currentLessonExamId) === String(lessonExamId);
        if (lessonExamId && selectedLessonExam && !isSameAsCurrentLessonExam) {
          try {
            const clonedExam = await examsService.createExam({
              source_exam_id: lessonExamId,
              course_id: Number(courseId),
              scope: "course",
            });
            lessonExamId = clonedExam.id;
            finalLesson = {
              ...finalLesson,
              linkedExamId: String(clonedExam.id),
            };
          } catch (cloneErr) {
            console.error("Failed to clone exam for lesson:", cloneErr);
            toast.error(
              locale === "ar"
                ? "فشل في ربط الامتحان بالدرس (تعذر نسخ الامتحان للدورة)"
                : "Failed to clone exam for lesson",
            );
            return;
          }
        }

        const newPdfFiles = (savedLesson.pdfFiles || [])
          .map((p) => p.rawFile)
          .filter(Boolean) as File[];
        const newImageFiles = (savedLesson.imageFiles || [])
          .map((img) => img.rawFile)
          .filter(Boolean) as File[];

        if (isExistingBackendLesson) {
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
            has_exam: Boolean(savedLesson.isLinkedToExam && lessonExamId),
            exam_id: lessonExamId,
            requires_exam_pass_to_unlock_next_lesson: Boolean(savedLesson.isRequiredPassExam),
            is_active: true,
          };

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
          // 1. Create Standalone Template Lesson in the Lesson Bank
          const templatePayload = {
            classification: "standalone" as const,
            educational_stage_id: parentCourse?.educational_stage_id || undefined,
            subject_id: parentCourse?.subject_id || undefined,
            ...(lessonOptionsData?.requires_instructor_selection && parentCourse?.instructor_id
              ? { instructor_id: parentCourse.instructor_id }
              : {}),
            type: (savedLesson.type === "text" ? "text_only" : "video_and_text") as
              | "text_only"
              | "video_and_text",
            title: { ar: savedLesson.title, en: savedLesson.title },
            description: savedLesson.description
              ? { ar: savedLesson.description, en: savedLesson.description }
              : undefined,
            video_url: savedLesson.lectureVideoLink || undefined,
            cover_image: savedLesson.coverImageFile || undefined,
            has_pdf_attachments: Boolean(savedLesson.hasPdfAttachments),
            pdf_files: newPdfFiles.length > 0 ? newPdfFiles : undefined,
            has_explanatory_images: Boolean(savedLesson.hasImageAttachments),
            explanatory_images: newImageFiles.length > 0 ? newImageFiles : undefined,
            has_exam: false,
            requires_exam_pass_to_unlock_next_lesson: false,
            is_active: true,
          };

          const templateRes = await createLessonMutation.mutateAsync(templatePayload);

          // 2. Create Course Clone Lesson referencing the standalone template
          const clonePayload = {
            classification: "course" as const,
            course_id: Number(courseId),
            course_section_id: Number(targetSecId),
            original_lesson_id: templateRes.id,
            type: (savedLesson.type === "text" ? "text_only" : "video_and_text") as
              | "text_only"
              | "video_and_text",
            title: { ar: savedLesson.title, en: savedLesson.title },
            description: savedLesson.description
              ? { ar: savedLesson.description, en: savedLesson.description }
              : undefined,
            video_url: savedLesson.lectureVideoLink || undefined,
            cover_image: savedLesson.coverImageFile || undefined,
            has_pdf_attachments: Boolean(savedLesson.hasPdfAttachments),
            has_explanatory_images: Boolean(savedLesson.hasImageAttachments),
            has_exam: Boolean(savedLesson.isLinkedToExam && lessonExamId),
            exam_id: lessonExamId,
            requires_exam_pass_to_unlock_next_lesson: Boolean(savedLesson.isRequiredPassExam),
            is_active: true,
          };

          const res = await createLessonMutation.mutateAsync(clonePayload);
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
      throw err;
    }
  };

  const handleSaveManyLessons = async (targetSecId: string, savedLessons: Lesson[]) => {
    try {
      const isBackendSec = !targetSecId.startsWith("sec-");
      let attachedLessons = [...savedLessons];

      if (isBackendCourseId && isBackendSec) {
        // Collect numeric source lesson ids
        const lessonIds = savedLessons
          .map((l) => {
            const explicitOriginal = (l as unknown as { original_lesson_id?: number })
              .original_lesson_id;
            if (explicitOriginal && !Number.isNaN(Number(explicitOriginal))) {
              return Number(explicitOriginal);
            }
            const idNum = Number(l.id);
            return !Number.isNaN(idNum) && !l.id.startsWith("les-") ? idNum : undefined;
          })
          .filter((id): id is number => typeof id === "number" && id > 0);

        if (lessonIds.length > 0) {
          const res = await bulkCreateLessonsMutation.mutateAsync({
            course_id: Number(courseId),
            course_section_id: Number(targetSecId),
            lesson_ids: lessonIds,
          });

          attachedLessons = res.map((b) => ({
            id: String(b.id),
            title: b.title?.[locale] || b.title?.ar || b.title?.en || "",
            description: b.description?.[locale] || b.description?.ar || "",
            writtenText: b.description?.[locale] || b.description?.ar || "",
            type: b.type === "text_only" ? "text" : "videoAndText",
            coverImage: b.cover_image || b.cover_image_url || undefined,
            lectureVideoLink: b.video_url || undefined,
            lessonCategory: "course-dependent",
            educational_stage_id: b.educational_stage_id || undefined,
            subject_id: b.subject_id || undefined,
            hasPdfAttachments: Boolean(b.has_pdf_attachments),
            pdfFiles: (b.pdf_attachments || []).map((p) => ({
              id: String(p.id),
              title: p.name || "PDF",
              fileUrl: p.url,
              fileType: "pdf" as const,
              sizeInBytes: p.size,
            })),
            hasImageAttachments: Boolean(b.has_explanatory_images),
            imageFiles: (b.explanatory_images || []).map((img) => ({
              id: String(img.id),
              title: img.name || "Image",
              fileUrl: img.url,
              fileType: "image" as const,
              sizeInBytes: img.size,
            })),
            isLinkedToExam: Boolean(b.has_exam),
            linkedExamId: b.exam_id ? String(b.exam_id) : undefined,
            linkedExamTitle: b.exam?.title?.[locale] || b.exam?.title?.ar || undefined,
            isRequiredPassExam: Boolean(b.requires_exam_pass_to_unlock_next_lesson),
          }));

          toast.success(
            locale === "ar"
              ? `تم إضافة ${attachedLessons.length} دروس بنجاح`
              : `Successfully added ${attachedLessons.length} lessons`,
          );
        }
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
      throw err;
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
          let sectionExamId =
            sec.isLinkedToExam && sec.linkedExamId ? Number(sec.linkedExamId) : null;
          if (sectionExamId) {
            try {
              const clonedSectionExam = await examsService.createExam({
                source_exam_id: sectionExamId,
                course_id: Number(courseId),
                scope: "course",
              });
              sectionExamId = clonedSectionExam.id;
            } catch (cloneErr) {
              console.error("Failed to clone exam for imported section:", cloneErr);
            }
          }

          const createdSection = await coursesService.createSection(courseId, {
            title: {
              ar: sec.title,
              en: sec.title,
            },
            exam_id: sectionExamId,
            requires_exam_pass_to_unlock_next_section: sectionExamId
              ? Boolean(sec.isRequiredPassExamForNextSection)
              : false,
            status: "draft",
          });

          if (sec.lessons && sec.lessons.length > 0) {
            const lessonPromises = sec.lessons.map(async (l) => {
              let lessonExamId = l.isLinkedToExam && l.linkedExamId ? Number(l.linkedExamId) : null;

              if (lessonExamId) {
                try {
                  const clonedExam = await examsService.createExam({
                    source_exam_id: lessonExamId,
                    course_id: Number(courseId),
                    scope: "course",
                  });
                  lessonExamId = clonedExam.id;
                } catch (cloneErr) {
                  console.error("Failed to clone exam for imported lesson:", cloneErr);
                }
              }

              return createLessonMutation.mutateAsync({
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
                has_exam: Boolean(l.isLinkedToExam && lessonExamId),
                exam_id: l.isLinkedToExam && lessonExamId ? lessonExamId : null,
                requires_exam_pass_to_unlock_next_lesson: Boolean(l.isRequiredPassExam),
                is_active: true,
              });
            });

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
