/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */
"use client";

import { FormTimelineSidebar } from "@/components/dashboard/common/form-timeline-sidebar";
import {
  ExamSelect,
  GradeSelect,
  SubjectSelect,
  TeacherSelect,
} from "@/components/ui/academic-selects";
import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectWithAdd } from "@/components/ui/select-with-add";
import {
  getStoredCourses,
  getStoredCustomPeriods,
  saveStoredCourses,
  saveStoredCustomPeriod,
} from "@/lib/courses-storage";
import { getStoredTeachers } from "@/lib/settings-storage";
import { cn } from "@/lib/utils";
import { Course } from "@/types/course";
import { Teacher } from "@/types/settings";
import "@mdxeditor/editor/style.css";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Tag,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SUBJECT_COVER_PLACEHOLDERS: Record<string, string> = {
  physics: "/courses/physics.jpg",
  chemistry: "/courses/chemistry.jpg",
  biology: "/courses/biology.webp",
  mathematics: "/courses/math.jpg",
  english: "/courses/english.png",
  arabic: "/courses/arabic.jpg",
};

const DEFAULT_COVER_PLACEHOLDER = "/courses/physics.jpg";

interface NewCourseClientProps {
  initialCourseId?: string;
}

export function NewCourseClient({ initialCourseId }: NewCourseClientProps = {}) {
  const t = useTranslations("courses.new");
  const locale = useLocale();
  const router = useRouter();

  // Loading State
  const [isLoaded, setIsLoaded] = useState(!initialCourseId);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewVideoLink, setPreviewVideoLink] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [period, setPeriod] = useState<string>("monthly");
  const [customPeriods, setCustomPeriods] = useState<{ id: string; name: string }[]>([]);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");

  const handleAddPeriod = () => {
    const name = newPeriodName.trim();
    if (!name) return;

    saveStoredCustomPeriod(name);

    setCustomPeriods((prev) =>
      prev.some((p) => p.id === name) ? prev : [...prev, { id: name, name }],
    );

    setNewPeriodName("");
    setIsAddPeriodOpen(false);

    // Delay setting the period to allow the new <SelectItem> to mount in the DOM first
    setTimeout(() => {
      setPeriod(name);
    }, 50);
  };

  // Teachers state
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const loadTeachers = () => {
      setAvailableTeachers(getStoredTeachers());
    };
    loadTeachers();
    window.addEventListener("rewaa_teachers_updated", loadTeachers);
    return () => window.removeEventListener("rewaa_teachers_updated", loadTeachers);
  }, []);

  // Load custom periods from local storage & listen for updates
  useEffect(() => {
    const loadPeriods = () => {
      const stored = getStoredCustomPeriods();
      if (stored.length > 0) {
        setCustomPeriods((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          stored.forEach((name) => {
            if (!map.has(name)) map.set(name, { id: name, name });
          });
          return Array.from(map.values());
        });
      }
    };
    loadPeriods();
    window.addEventListener("rewaa_periods_updated", loadPeriods);
    return () => window.removeEventListener("rewaa_periods_updated", loadPeriods);
  }, []);

  const [isFree, setIsFree] = useState(false);
  const [coursePrice, setCoursePrice] = useState<number | "">("");
  const [currency, setCurrency] = useState("EGP");
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState<number | "">("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerEndDate, setOfferEndDate] = useState("");

  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimitValue, setTimeLimitValue] = useState<number | "">("");
  const [isSplitToSections, setIsSplitToSections] = useState(true);
  const [venue, setVenue] = useState<"online" | "center" | "all">("all");
  const [coursePublishStatus, setCoursePublishStatus] = useState<LessonPublishStatus>("published");
  const [courseScheduledPublishDate, setCourseScheduledPublishDate] = useState("");

  // Active step state: 1 = Info & Price, 2 = Curriculum & Lectures
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(initialCourseId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing course data if editing
  useEffect(() => {
    if (!initialCourseId) {
      setIsLoaded(true);
      return;
    }
    const courses = getStoredCourses(locale);
    const existing = courses.find((c) => c.id === initialCourseId);

    if (existing) {
      // Direct value assignments
      setTitle(existing.title || "");
      setDescription(existing.description || "");
      setPreviewVideoLink(existing.previewVideoLink || "");
      if (existing.coverImage) setCoverImage(existing.coverImage);
      setTeacherName(existing.teacherName || "");

      // Publish status
      if (existing.publishStatus) {
        setCoursePublishStatus(existing.publishStatus);
      } else if (existing.isDraft !== undefined) {
        setCoursePublishStatus(existing.isDraft ? "draft" : "published");
      }
      setCourseScheduledPublishDate(existing.scheduledPublishDate || "");

      // Period parsing
      const rawPeriod = existing.period || "";
      if (["monthly", "yearly", "termBased"].includes(rawPeriod)) {
        setPeriod(rawPeriod);
      } else if (rawPeriod) {
        setCustomPeriods((prev) =>
          prev.some((p) => p.id === rawPeriod)
            ? prev
            : [...prev, { id: rawPeriod, name: rawPeriod }],
        );
        setPeriod(rawPeriod);
      } else {
        setPeriod("monthly");
      }

      setIsFree(Boolean(existing.isFree));
      setCoursePrice(existing.price ?? "");
      setCurrency(existing.currency || "EGP");
      setHasOffer(Boolean(existing.hasOffer));
      if (existing.offerPercentage) {
        const parsedPct = parseInt(existing.offerPercentage.replace(/\D/g, ""), 10);
        setOfferPercentage(isNaN(parsedPct) ? "" : parsedPct);
      }
      setOfferStartDate(existing.offerStartDate || "");
      setOfferEndDate(existing.offerEndDate || "");
      setHasTimeLimit(Boolean(existing.hasTimeLimit));
      setTimeLimitValue(existing.timeLimitValue ?? "");
      setIsSplitToSections(
        existing.isSplitToSections !== undefined ? Boolean(existing.isSplitToSections) : true,
      );
      setVenue(existing.venue || "all");

      // Matching for Grade (Grades 1 to 12 + University)
      const knownGrades: Record<string, string[]> = {
        grade1: [t("grades.grade1"), "الأول الثانوي", "الأول ثانوي", "10", "grade10", "grade1"],
        grade2: [t("grades.grade2"), "الثاني الثانوي", "الثاني ثانوي", "11", "grade11", "grade2"],
        grade3: [t("grades.grade3"), "الثالث الثانوي", "الثالث ثانوي", "12", "grade12", "grade3"],
        grade_1: ["الأول الابتدائي", "اول ابتدائي", "1st primary", "grade1"],
        grade_2: ["الثاني الابتدائي", "ثاني ابتدائي", "2nd primary", "grade2"],
        grade_3: ["الثالث الابتدائي", "ثالث ابتدائي", "3rd primary", "grade3"],
        grade_4: ["الرابع الابتدائي", "رابع ابتدائي", "4th primary", "grade4"],
        grade_5: ["الخامس الابتدائي", "خامس ابتدائي", "5th primary", "grade5"],
        grade_6: ["السادس الابتدائي", "سادس ابتدائي", "6th primary", "grade6"],
        grade_7: ["الأول الإعدادي", "اول اعدادي", "1st prep", "grade7"],
        grade_8: ["الثاني الإعدادي", "ثاني اعدادي", "2nd prep", "grade8"],
        grade_9: ["الثالث الإعدادي", "ثالث اعدادي", "3rd prep", "grade9"],
        grade_10: ["الأول الثانوي", "اول ثانوي", "1st sec", "grade10"],
        grade_11: ["الثاني الثانوي", "ثاني ثانوي", "2nd sec", "grade11"],
        grade_12: ["الثالث الثانوي", "ثالث ثانوي", "3rd sec", "grade12"],
        university: [t("grades.university"), "جامع", "University", "university"],
      };
      const exGrade = (existing.grade || "").toLowerCase();
      const matchedGradeKey =
        Object.keys(knownGrades).find((key) =>
          knownGrades[key].some((val) => val && exGrade.includes(val.toLowerCase())),
        ) ||
        existing.grade ||
        "";
      setGrade(matchedGradeKey);

      // Matching for Subject
      const knownSubjects: Record<string, string[]> = {
        mathematics: [t("subjects.mathematics"), "رياضيات", "math", "calculus"],
        physics: [t("subjects.physics"), "فيزياء", "physic"],
        chemistry: [t("subjects.chemistry"), "كيمياء", "chemist"],
        biology: [t("subjects.biology"), "أحياء", "احياء", "biolog"],
        english: [t("subjects.english"), "إنجليزية", "انجليزية", "english"],
        arabic: [t("subjects.arabic"), "عربية", "عربى", "arabic"],
      };
      const exSubj = (existing.subject || "").toLowerCase();
      const matchedSubjKey =
        Object.keys(knownSubjects).find((key) =>
          knownSubjects[key].some((val) => val && exSubj.includes(val.toLowerCase())),
        ) ||
        existing.subject ||
        "";
      setSubject(matchedSubjKey);
    }

    // Unblock the form rendering once values are populated
    setIsLoaded(true);
  }, [initialCourseId, locale, t]);

  // Helper to resolve cover image or fallback based on selected subject
  const resolveCoverImage = () => {
    if (coverImage) return coverImage;
    return SUBJECT_COVER_PLACEHOLDERS[subject] || DEFAULT_COVER_PLACEHOLDER;
  };

  const handleSubmit = (e: React.SubmitEvent, isDraftOnly = false) => {
    e.preventDefault();
    if (isDraftOnly) {
      setIsSavingDraft(true);
    } else {
      setIsSubmitting(true);
    }

    const existingCourses = getStoredCourses(locale);
    const courseIdToUse =
      createdCourseId || `course-${Math.floor(100000 + Math.random() * 900000)}`;
    setCreatedCourseId(courseIdToUse);

    const existingCourse = existingCourses.find((c) => c.id === courseIdToUse);
    const finalCoverImage = resolveCoverImage();
    const courseTitle = title || (locale === "ar" ? "مسودة دورة جديدة" : "New Course Draft");

    let finalSections: CourseSection[] = existingCourse?.sections || [];
    if (!isSplitToSections) {
      if (finalSections.length === 0) {
        finalSections = [
          {
            id: `sec-default-${courseIdToUse}`,
            title: courseTitle,
            isDraft: false,
            isLinkedToExam: false,
            isRequiredPassExamForNextSection: false,
            lessons: [],
          },
        ];
      } else {
        const allLessons = finalSections.flatMap((s) => s.lessons);
        finalSections = [
          {
            ...finalSections[0],
            title: courseTitle,
            lessons: allLessons,
          },
        ];
      }
    }

    const STANDARD_SUBJECT_KEYS = [
      "physics",
      "chemistry",
      "mathematics",
      "biology",
      "arabic",
      "english",
    ];

    const STANDARD_GRADE_KEYS = ["grade1", "grade2", "grade3", "university"];

    const resolvedSubject = subject
      ? STANDARD_SUBJECT_KEYS.includes(subject)
        ? t(`subjects.${subject}`)
        : subject
      : existingCourse?.subject || (locale === "ar" ? "عام" : "General");

    const resolvedGrade = grade
      ? STANDARD_GRADE_KEYS.includes(grade)
        ? t(`grades.${grade}`)
        : grade
      : existingCourse?.grade || (locale === "ar" ? "جميع المراحل" : "All Grades");

    const updatedCourse: Course = {
      id: courseIdToUse,
      coverImage: finalCoverImage,
      title: courseTitle,
      description: description || "",
      previewVideoLink: previewVideoLink || undefined,
      subject: resolvedSubject,
      grade: resolvedGrade,
      teacherName: teacherName || (locale === "ar" ? "معلم جديد" : "New Teacher"),
      period: period,
      date: existingCourse?.date || new Date().toISOString().split("T")[0],
      numberOfLessons: existingCourse?.numberOfLessons || 0,
      price: isFree ? 0 : Number(coursePrice) || 0,
      isFree: isFree,
      currency: currency,
      hasOffer: hasOffer,
      offerPercentage: hasOffer && offerPercentage ? `${offerPercentage}%` : undefined,
      offerStartDate: hasOffer && offerStartDate ? offerStartDate : undefined,
      offerEndDate: hasOffer && offerEndDate ? offerEndDate : undefined,
      hasTimeLimit: hasTimeLimit,
      timeLimitValue: hasTimeLimit && timeLimitValue ? Number(timeLimitValue) : undefined,
      isSplitToSections: isSplitToSections,
      venue: venue,
      badge: undefined,
      numberOfParticipants: existingCourse?.numberOfParticipants || 0,
      isDraft: isDraftOnly ? true : coursePublishStatus === "draft",
      publishStatus: isDraftOnly ? "draft" : coursePublishStatus,
      scheduledPublishDate:
        coursePublishStatus === "scheduled" ? courseScheduledPublishDate : undefined,
      sections: finalSections,
    };

    try {
      const filtered = existingCourses.filter((c) => c.id !== courseIdToUse);
      const updatedCourses = [updatedCourse, ...filtered];
      saveStoredCourses(locale, updatedCourses);
    } catch (err) {
      console.error("Failed to save course:", err);
    }

    setTimeout(() => {
      setIsSavingDraft(false);
      setIsSubmitting(false);

      if (isDraftOnly) {
        setSuccessMessage(t("actions.draftSaved"));
        setTimeout(() => {
          router.push("/dashboard/courses");
        }, 1200);
      } else {
        // Proceed to Step 2 (Curriculum & Lectures)
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 400);
  };

  // Step indicator setup
  const isInfoAndPriceComplete =
    Boolean(title && description && grade && subject && teacherName) &&
    (isFree || Boolean(coursePrice));

  const steps = [
    {
      id: 1,
      label: t("steps.infoAndPrice"),
      icon: FileText,
      complete: isInfoAndPriceComplete,
    },
    {
      id: 2,
      label: t("steps.lectures"),
      icon: BookOpen,
      complete: false,
    },
  ];

  // Prevent form render until data successfully hydrates
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {locale === "ar" ? "جاري تحميل بيانات الدورة..." : "Loading course data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <Link href={`/${locale}/dashboard/courses`}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {currentStep === 2 && title.trim()
                ? title
                : initialCourseId
                  ? t("editTitle")
                  : t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep === 2
                ? t("step2.subtitle")
                : initialCourseId
                  ? t("editSubtitle")
                  : t("subtitle")}
            </p>
          </div>
        </div>

        {/* Step 2 Header: Course Publish Status Select & Schedule Dates */}
        {currentStep === 2 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select
              value={coursePublishStatus}
              onValueChange={(val: LessonPublishStatus) => {
                setCoursePublishStatus(val);
                // Sync status to localStorage if courseId exists
                const targetId = createdCourseId || initialCourseId;
                if (targetId) {
                  try {
                    const courses = getStoredCourses(locale);
                    const idx = courses.findIndex((c) => c.id === targetId);
                    if (idx !== -1) {
                      courses[idx] = {
                        ...courses[idx],
                        publishStatus: val,
                        isDraft: val === "draft",
                        scheduledPublishDate:
                          val === "scheduled" ? courseScheduledPublishDate : undefined,
                      };
                      saveStoredCourses(locale, courses);
                    }
                  } catch (err) {
                    console.error("Failed to update course publish status:", err);
                  }
                }
              }}
            >
              <SelectTrigger className="w-36 h-9 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{locale === "ar" ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="published">{locale === "ar" ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="scheduled">{locale === "ar" ? "مجدول" : "Scheduled"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Scheduled Date Input with Label */}
            {coursePublishStatus === "scheduled" && (
              <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="course-scheduled-publish-date"
                    className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {locale === "ar" ? "تاريخ النشر:" : "Publish Date:"}
                  </label>
                  <Input
                    id="course-scheduled-publish-date"
                    type="date"
                    value={courseScheduledPublishDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCourseScheduledPublishDate(val);
                      const targetId = createdCourseId || initialCourseId;
                      if (targetId) {
                        try {
                          const courses = getStoredCourses(locale);
                          const idx = courses.findIndex((c) => c.id === targetId);
                          if (idx !== -1) {
                            courses[idx] = {
                              ...courses[idx],
                              scheduledPublishDate: val,
                            };
                            saveStoredCourses(locale, courses);
                          }
                        } catch (err) {
                          console.error("Failed to update schedule date:", err);
                        }
                      }
                    }}
                    className="h-9 w-36 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {successMessage}
        </div>
      )}

      {/* Main layout: Sidebar (3 cols) + Form (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reusable Vertical Timeline Sidebar */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <FormTimelineSidebar
            timelineTitle={t("timelineTitle")}
            steps={steps}
            currentStep={currentStep}
            disclaimerTitle={t("disclaimerTitle")}
            disclaimerDescription={t("disclaimerDescription")}
            onStepClick={
              initialCourseId || createdCourseId
                ? (stepId) => setCurrentStep(stepId as 1 | 2)
                : undefined
            }
          />
        </div>

        {/* Main Form Area (9 cols on lg) */}
        <main className="lg:col-span-9 order-1 lg:order-2">
          {currentStep === 1 ? (
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
              {/* 1. MAIN INFORMATION */}
              <FormSectionCard
                title={t("sections.mainInfo.title")}
                description={t("sections.mainInfo.description")}
                icon={BookOpen}
                contentClassName="space-y-8"
              >
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="course-title" className="text-sm font-medium text-foreground">
                    {t("fields.title")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="course-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("fields.titlePlaceholder")}
                    required
                  />
                </div>

                {/* Description (Markdown) */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="course-description"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("fields.description")} <span className="text-destructive">*</span>
                  </label>
                  <FormMarkdownEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={t("fields.descriptionPlaceholder")}
                  />
                </div>

                {/* Preview Video Link */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="course-preview-video"
                    className="text-sm font-medium text-foreground flex items-center gap-1.5"
                  >
                    <Video className="size-4 text-muted-foreground" />
                    {t("fields.previewVideoLink")}
                  </label>
                  <Input
                    id="course-preview-video"
                    type="url"
                    value={previewVideoLink}
                    onChange={(e) => setPreviewVideoLink(e.target.value)}
                    placeholder={t("fields.previewVideoLinkPlaceholder")}
                  />
                </div>

                {/* Cover Image Upload Area */}
                <ImageUploadField
                  id="course-cover-image"
                  label={t("fields.coverImage")}
                  labelIcon={<ImageIcon className="size-4 text-muted-foreground" />}
                  value={coverImage}
                  onChange={(dataUrl) => setCoverImage(dataUrl)}
                  onClear={() => setCoverImage("")}
                  aspectRatio="video"
                  prompt={t("fields.coverImageDrag")}
                  hint={t("fields.coverImageNote")}
                  changePrompt={t("fields.coverImageDrag")}
                  previewAlt="Course cover"
                />
              </FormSectionCard>

              {/* 2. CATEGORY INFORMATION */}
              <FormSectionCard
                title={t("sections.categoryInfo.title")}
                description={t("sections.categoryInfo.description")}
                icon={Tag}
                contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {/* Grade */}
                <GradeSelect
                  value={grade}
                  onValueChange={setGrade}
                  label={t("fields.grade")}
                  placeholder={t("fields.selectGrade")}
                  required
                />

                {/* Subject */}
                <SubjectSelect
                  value={subject}
                  onValueChange={setSubject}
                  label={t("fields.subject")}
                  placeholder={t("fields.selectSubject")}
                  required
                />

                {/* Teacher Select */}
                <TeacherSelect
                  value={teacherName}
                  onValueChange={setTeacherName}
                  label={t("fields.teacherName")}
                  placeholder={t("fields.selectTeacher")}
                  required
                  showIcon
                  teachers={availableTeachers}
                />

                {/* Period */}
                <SelectWithAdd
                  value={period}
                  onValueChange={(val) => setPeriod(val)}
                  label={
                    <span>
                      {t("fields.period")} <span className="text-destructive">*</span>
                    </span>
                  }
                  placeholder={t("fields.selectPeriod")}
                  options={[
                    { value: "monthly", label: t("periodOptions.monthly") },
                    { value: "yearly", label: t("periodOptions.yearly") },
                    { value: "termBased", label: t("periodOptions.termBased") },
                    ...customPeriods.map((cp) => ({ value: cp.id, label: cp.name })),
                  ]}
                  allowAdd
                  onAddNewOption={(name) => {
                    saveStoredCustomPeriod(name);
                    setCustomPeriods((prev) =>
                      prev.some((p) => p.id === name) ? prev : [...prev, { id: name, name }],
                    );
                  }}
                  addDialogTitle={t("periodOptions.addPeriodDialogTitle")}
                  addDialogDescription={t("periodOptions.addPeriodDialogDesc")}
                  addInputLabel={t("periodOptions.periodNameLabel")}
                  addInputPlaceholder={t("periodOptions.periodNamePlaceholder")}
                  addButtonTooltip={t("periodOptions.addPeriod")}
                />
              </FormSectionCard>

              {/* 3. PRICE INFORMATION */}
              <FormSectionCard
                title={t("sections.priceInfo.title")}
                description={t("sections.priceInfo.description")}
                icon={Coins}
                contentClassName="space-y-5"
              >
                {/* isFree Toggle */}
                <FormToggleSetting
                  id="is-free-toggle"
                  title={t("fields.isFree")}
                  subtitle={t("fields.isFreeSubtitle")}
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />

                {!isFree && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                    {/* Course Price */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="course-price" className="text-sm font-medium text-foreground">
                        {t("fields.coursePrice")} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="course-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={coursePrice}
                        onChange={(e) =>
                          setCoursePrice(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="299.00"
                        required={!isFree}
                      />
                    </div>

                    {/* Currency - Removed `|| undefined` */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("fields.currency")}
                      </label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-full h-12! py-3!">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EGP">{t("currencies.EGP")}</SelectItem>
                          <SelectItem value="USD">{t("currencies.USD")}</SelectItem>
                          <SelectItem value="SAR">{t("currencies.SAR")}</SelectItem>
                          <SelectItem value="AED">{t("currencies.AED")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* hasOffer Toggle */}
                <FormToggleSetting
                  id="has-offer-toggle"
                  title={t("fields.hasOffer")}
                  subtitle={t("fields.hasOfferSubtitle")}
                  checked={hasOffer}
                  onCheckedChange={setHasOffer}
                />

                {/* Offer details (conditional) */}
                {hasOffer && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="offer-percentage"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("fields.offerPercentage")} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="offer-percentage"
                        type="number"
                        min="1"
                        max="100"
                        value={offerPercentage}
                        onChange={(e) =>
                          setOfferPercentage(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="20"
                        required={hasOffer}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="offer-start-date"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("fields.offerStartDate")}
                      </label>
                      <Input
                        id="offer-start-date"
                        type="date"
                        value={offerStartDate}
                        onChange={(e) => setOfferStartDate(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="offer-end-date"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("fields.offerEndDate")}
                      </label>
                      <Input
                        id="offer-end-date"
                        type="date"
                        value={offerEndDate}
                        onChange={(e) => setOfferEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </FormSectionCard>

              {/* 4. ADVANCED SETTINGS */}
              <FormSectionCard
                title={t("sections.advancedSettings.title")}
                description={t("sections.advancedSettings.description")}
                icon={Layers}
                contentClassName="space-y-5"
              >
                {/* hasTimeLimit Toggle */}
                <FormToggleSetting
                  id="has-time-limit-toggle"
                  title={t("fields.hasTimeLimit")}
                  subtitle={t("fields.hasTimeLimitSubtitle")}
                  icon={Clock}
                  checked={hasTimeLimit}
                  onCheckedChange={setHasTimeLimit}
                />

                {/* timeLimitValue (conditional) */}
                {hasTimeLimit && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 max-w-sm">
                    <label htmlFor="time-limit-val" className="text-sm font-medium text-foreground">
                      {t("fields.timeLimitValue")} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Input
                        id="time-limit-val"
                        type="number"
                        min="1"
                        value={timeLimitValue}
                        onChange={(e) =>
                          setTimeLimitValue(e.target.value ? Number(e.target.value) : "")
                        }
                        placeholder="90"
                        required={hasTimeLimit}
                      />
                    </div>
                  </div>
                )}

                {/* isSplitToSections Toggle */}
                <FormToggleSetting
                  id="is-split-to-sections-toggle"
                  title={t("fields.isSplitToSections")}
                  subtitle={t("fields.isSplitToSectionsSubtitle")}
                  icon={Layers}
                  checked={isSplitToSections}
                  onCheckedChange={setIsSplitToSections}
                />

                {/* Venue (Radio Group with 3 options) */}
                <FormRadioGroup
                  name="venue-option"
                  title={t("fields.venue")}
                  subtitle={t("fields.venueSubtitle")}
                  icon={MapPin}
                  value={venue}
                  onValueChange={(val) => setVenue(val as typeof venue)}
                  options={[
                    {
                      id: "online",
                      label: t("venues.online.label"),
                      desc: t("venues.online.desc"),
                    },
                    {
                      id: "center",
                      label: t("venues.center.label"),
                      desc: t("venues.center.desc"),
                    },
                    {
                      id: "all",
                      label: t("venues.all.label"),
                      desc: t("venues.all.desc"),
                    },
                  ]}
                />
              </FormSectionCard>

              {/* CTA Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting || isSavingDraft}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : initialCourseId ? (
                    t("actions.saveAndPublish")
                  ) : (
                    t("actions.createCourse")
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* STEP 2: COURSE CURRICULUM & LECTURES */
            <Step2CurriculumView
              courseId={createdCourseId!}
              locale={locale}
              isEditing={Boolean(initialCourseId)}
              onBackToStep1={() => setCurrentStep(1)}
              onFinish={() => router.push("/dashboard/courses")}
            />
          )}
        </main>
      </div>
      {/* Add New Period Dialog */}
      <Dialog open={isAddPeriodOpen} onOpenChange={setIsAddPeriodOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{t("periodOptions.addPeriodDialogTitle")}</DialogTitle>
            <DialogDescription>{t("periodOptions.addPeriodDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("periodOptions.periodNameLabel")}
            </label>
            <Input
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              placeholder={t("periodOptions.periodNamePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPeriod();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewPeriodName("");
                setIsAddPeriodOpen(false);
              }}
            >
              {t("periodOptions.cancel")}
            </Button>
            <Button type="button" disabled={!newPeriodName.trim()} onClick={handleAddPeriod}>
              {t("periodOptions.savePeriod")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { LessonDialog } from "./lesson-dialog";

/* STEP 2 COMPONENT WITH 4 ACTION BUTTONS AND DIALOGS */

import { CourseSelect, MultiLessonSelect } from "@/components/ui/academic-selects";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredExams } from "@/lib/exams-storage";
import { CourseSection, CourseVenue, Lesson, LessonPublishStatus } from "@/types/course";
import { Exam } from "@/types/exam";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Edit2,
  FileQuestion,
  FileText as FileTextIcon,
  FolderPlus,
  ListOrdered,
  Paperclip,
  Plus as PlusIcon,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";

interface Step2CurriculumViewProps {
  courseId: string;
  locale: string;
  isEditing?: boolean;
  onBackToStep1: () => void;
  onFinish: () => void;
}

function Step2CurriculumView({
  courseId,
  locale,
  isEditing,
  onBackToStep1,
  onFinish,
}: Step2CurriculumViewProps) {
  const t = useTranslations("courses.new");

  // State for sections list
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [activeDialog, setActiveDialog] = useState<
    "section" | "lesson" | "arrange" | "import" | null
  >(null);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CourseSection | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; sectionId: string } | null>(
    null,
  );
  const [lessonTargetSectionId, setLessonTargetSectionId] = useState<string | undefined>(undefined);
  const [lessonToDelete, setLessonToDelete] = useState<{
    lesson: Lesson;
    sectionId: string;
  } | null>(null);

  // Parent Course Context for auto-filling
  const [parentCourseContext, setParentCourseContext] = useState({
    grade: "",
    subject: "",
    teacherName: "",
    venue: "all" as CourseVenue,
  });

  const [isSplitToSections, setIsSplitToSections] = useState(true);

  // Load stored exams for exam select dropdown
  useEffect(() => {
    setAvailableExams(getStoredExams(locale));
  }, [locale]);

  // Load existing sections and parent course info
  useEffect(() => {
    if (!courseId) return;
    const courses = getStoredCourses(locale);
    const existing = courses.find((c) => c.id === courseId);
    if (existing) {
      const courseIsSplit = existing.isSplitToSections !== false;
      setIsSplitToSections(courseIsSplit);

      let loadedSections = existing.sections || [];
      if (!courseIsSplit) {
        const courseTitle = existing.title || (locale === "ar" ? "قسم الدورة" : "Course Section");
        if (loadedSections.length === 0) {
          loadedSections = [
            {
              id: `sec-default-${courseId}`,
              title: courseTitle,
              isDraft: false,
              isLinkedToExam: false,
              isRequiredPassExamForNextSection: false,
              lessons: [],
            },
          ];
        } else {
          const allLessons = loadedSections.flatMap((s) => s.lessons);
          loadedSections = [
            {
              ...loadedSections[0],
              title: courseTitle,
              lessons: allLessons,
            },
          ];
        }
      }
      setSections(loadedSections);
      setParentCourseContext({
        grade: existing.grade || "",
        subject: existing.subject || "",
        teacherName: existing.teacherName || "",
        venue: existing.venue || "all",
      });
    }
  }, [courseId, locale]);

  // Dialog Form states: Section
  const [newSecTitle, setNewSecTitle] = useState("");
  const [newSecStatus, setNewSecStatus] = useState<LessonPublishStatus>("draft");
  const [newSecScheduledDate, setNewSecScheduledDate] = useState("");
  const [newSecIsLinkedExam, setNewSecIsLinkedExam] = useState(false);
  const [newSecLinkedExamId, setNewSecLinkedExamId] = useState("");
  const [newSecIsReqPass, setNewSecIsReqPass] = useState(false);
  const [newSecHasExamExpiry, setNewSecHasExamExpiry] = useState(false);
  const [newSecExamStartDate, setNewSecExamStartDate] = useState("");
  const [newSecExamExpiryDate, setNewSecExamExpiryDate] = useState("");
  const [newSecExamDateError, setNewSecExamDateError] = useState<string | null>(null);
  const [newSecScheduleDateError, setNewSecScheduleDateError] = useState<string | null>(null);

  // Dialog Form states: Import Sections From Other Courses
  const [importCourseId, setImportCourseId] = useState("");
  const [selectedImportSectionIds, setSelectedImportSectionIds] = useState<string[]>([]);
  const [allCoursesList, setAllCoursesList] = useState<Course[]>([]);

  // Load all courses for importing (excluding current course)
  useEffect(() => {
    const loaded = getStoredCourses(locale);
    setAllCoursesList(loaded.filter((c) => c.id !== courseId));
  }, [locale, courseId]);

  const selectedImportCourse = allCoursesList.find((c) => c.id === importCourseId);
  const availableImportSections = selectedImportCourse?.sections || [];
  const selectedImportSectionsList = availableImportSections.filter((s) =>
    selectedImportSectionIds.includes(s.id),
  );

  const handleImportSections = () => {
    if (!importCourseId || selectedImportSectionIds.length === 0) return;

    // Deep clone selected sections with fresh unique IDs
    const now = Date.now();
    const clonedSections: CourseSection[] = selectedImportSectionsList.map((sec, sIndex) => {
      const newSecId = `sec-${now}-${sIndex}`;
      return {
        ...sec,
        id: newSecId,
        lessons: (sec.lessons || []).map((l, lIndex) => ({
          ...l,
          id: `les-${now}-${sIndex}-${lIndex}`,
        })),
      };
    });

    const updatedSections = [...sections, ...clonedSections];
    setSections(updatedSections);
    syncSectionsToStorage(updatedSections);

    // Reset & close dialog
    setImportCourseId("");
    setSelectedImportSectionIds([]);
    setActiveDialog(null);
  };

  // Sync sections to localStorage course object
  const syncSectionsToStorage = (updatedSections: CourseSection[]) => {
    try {
      const courses = getStoredCourses(locale);
      const targetIndex = courses.findIndex((c) => c.id === courseId);
      if (targetIndex !== -1) {
        const totalLessonsCount = updatedSections.reduce((acc, sec) => acc + sec.lessons.length, 0);
        courses[targetIndex] = {
          ...courses[targetIndex],
          sections: updatedSections,
          numberOfLessons: totalLessonsCount,
          isDraft: true,
        };
        saveStoredCourses(locale, courses);
      }
    } catch (err) {
      console.error("Failed to sync sections:", err);
    }
  };

  const handleOpenAddSection = () => {
    setEditingSection(null);
    setNewSecTitle("");
    setNewSecStatus("draft");
    setNewSecScheduledDate("");
    setNewSecIsLinkedExam(false);
    setNewSecLinkedExamId("");
    setNewSecIsReqPass(false);
    setNewSecHasExamExpiry(false);
    setNewSecExamStartDate("");
    setNewSecExamExpiryDate("");
    setNewSecExamDateError(null);
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
    setNewSecHasExamExpiry(Boolean(sec.hasExamExpiryDate));
    setNewSecExamStartDate(sec.examStartDate || "");
    setNewSecExamExpiryDate(sec.examExpiryDate || "");
    setNewSecExamDateError(null);
    setNewSecScheduleDateError(null);
    setActiveDialog("section");
  };

  const handleSaveSection = () => {
    if (!newSecTitle.trim()) return;
    setNewSecExamDateError(null);
    setNewSecScheduleDateError(null);

    // Validation for section schedule dates against parent course if section is scheduled
    if (newSecStatus === "scheduled") {
      // Check against course scheduled dates from storage if existing
      const storedCourses = getStoredCourses(locale);
      const currentCourse = storedCourses.find((c) => c.id === courseId);
      if (currentCourse && currentCourse.publishStatus === "scheduled") {
        if (currentCourse.scheduledPublishDate && newSecScheduledDate) {
          if (newSecScheduledDate < currentCourse.scheduledPublishDate) {
            setNewSecScheduleDateError(
              t("step2.addSectionDialog.sectionDateAfterCourseScheduleError", {
                date: currentCourse.scheduledPublishDate,
              }),
            );
            return;
          }
        }
      }
    }

    // Validation for exam expiry dates if enabled
    if (newSecIsLinkedExam && newSecHasExamExpiry) {
      if (newSecStatus === "scheduled" && newSecScheduledDate) {
        if (newSecExamStartDate && newSecExamStartDate < newSecScheduledDate) {
          setNewSecExamDateError(
            t("step2.addSectionDialog.examDateAfterScheduleError", { date: newSecScheduledDate }),
          );
          return;
        }
        if (newSecExamExpiryDate && newSecExamExpiryDate < newSecScheduledDate) {
          setNewSecExamDateError(
            t("step2.addSectionDialog.examDateAfterScheduleError", { date: newSecScheduledDate }),
          );
          return;
        }
      }

      if (
        newSecExamStartDate &&
        newSecExamExpiryDate &&
        newSecExamExpiryDate < newSecExamStartDate
      ) {
        setNewSecExamDateError(t("step2.addSectionDialog.examEndDateAfterStartError"));
        return;
      }
    }

    const selectedExam = availableExams.find((e) => e.id === newSecLinkedExamId);

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
            hasExamExpiryDate: newSecIsLinkedExam ? newSecHasExamExpiry : false,
            examStartDate:
              newSecIsLinkedExam && newSecHasExamExpiry ? newSecExamStartDate : undefined,
            examExpiryDate:
              newSecIsLinkedExam && newSecHasExamExpiry ? newSecExamExpiryDate : undefined,
          };
        }
        return s;
      });
      setSections(updated);
      syncSectionsToStorage(updated);
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
        hasExamExpiryDate: newSecIsLinkedExam ? newSecHasExamExpiry : false,
        examStartDate: newSecIsLinkedExam && newSecHasExamExpiry ? newSecExamStartDate : undefined,
        examExpiryDate:
          newSecIsLinkedExam && newSecHasExamExpiry ? newSecExamExpiryDate : undefined,
        lessons: [],
      };
      const updated = [...sections, newSec];
      setSections(updated);
      syncSectionsToStorage(updated);
    }

    setEditingSection(null);
    setNewSecTitle("");
    setNewSecStatus("draft");
    setNewSecScheduledDate("");
    setNewSecIsLinkedExam(false);
    setNewSecLinkedExamId("");
    setNewSecIsReqPass(false);
    setNewSecHasExamExpiry(false);
    setNewSecExamStartDate("");
    setNewSecExamExpiryDate("");
    setNewSecExamDateError(null);
    setActiveDialog(null);
  };

  const handleDeleteSection = () => {
    if (!sectionToDelete) return;
    const updated = sections.filter((s) => s.id !== sectionToDelete.id);
    setSections(updated);
    syncSectionsToStorage(updated);
    setSectionToDelete(null);
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
    syncSectionsToStorage(updated);
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
    syncSectionsToStorage(updated);
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
    syncSectionsToStorage(updated);
    setLessonToDelete(null);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);
    syncSectionsToStorage(updated);
  };

  const allButtons = [
    { key: "section", label: t("actions.addSection"), icon: FolderPlus },
    { key: "lesson", label: t("actions.addLesson"), icon: VideoIcon },
    { key: "arrange", label: t("actions.arrangeSections"), icon: ListOrdered },
    { key: "import", label: t("actions.importFromCourses"), icon: Download },
  ] as const;

  const buttons = isSplitToSections
    ? allButtons
    : allButtons.filter((b) => b.key !== "section" && b.key !== "import");

  return (
    <div className="space-y-6">
      {/* ACTION BUTTONS AT TOP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeDialog === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                if (btn.key === "section") {
                  handleOpenAddSection();
                } else if (btn.key === "lesson") {
                  setEditingLesson(null);
                  setLessonTargetSectionId(undefined);
                  setActiveDialog("lesson");
                } else if (btn.key === "import") {
                  setImportCourseId("");
                  setSelectedImportSectionIds([]);
                  setActiveDialog("import");
                } else {
                  setActiveDialog(btn.key);
                }
              }}
              className={cn(
                "py-3.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer text-center",
                isActive
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-card text-primary border-input hover:bg-primary hover:text-white hover:border-primary",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Curriculum View Card */}
      <FormSectionCard
        title={t("step2.title")}
        description={t("step2.subtitle")}
        icon={BookOpen}
        contentClassName="space-y-4"
      >
        {sections.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
            <FolderPlus className="size-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("step2.noSections")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((sec, sIdx) => {
              const secPublishStatus = sec.status || (sec.isDraft ? "draft" : "published");
              return (
                <div key={sec.id} className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold text-foreground text-base">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                        {sIdx + 1}
                      </span>
                      <span className="text-sm sm:text-base font-semibold">{sec.title}</span>

                      {/* Publish Status Badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium capitalize",
                          secPublishStatus === "published" &&
                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          secPublishStatus === "draft" &&
                            "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          secPublishStatus === "scheduled" &&
                            "bg-purple-500/10 text-purple-600 border-purple-500/20",
                        )}
                      >
                        {secPublishStatus === "published"
                          ? locale === "ar"
                            ? "منشور"
                            : "Published"
                          : secPublishStatus === "scheduled"
                            ? locale === "ar"
                              ? "مجدول"
                              : "Scheduled"
                            : locale === "ar"
                              ? "مسودة"
                              : "Draft"}
                      </Badge>

                      {/* Linked to Exam indicator (Icon + Check without circle) */}
                      {sec.isLinkedToExam && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1"
                        >
                          <FileQuestion className="size-3 shrink-0" />
                          <Check className="size-3 text-amber-600 shrink-0 stroke-[2.5]" />
                        </Badge>
                      )}

                      {sec.isLinkedToExam && !sec.linkedExamId && (
                        <span className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-warning-bg/10 text-warning border border-warning/20">
                          {t("step2.pleaseAddExamBadge")}
                        </span>
                      )}
                    </div>

                    {/* Section Header Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Add Lesson to this section button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setEditingLesson(null);
                          setLessonTargetSectionId(sec.id);
                          setActiveDialog("lesson");
                        }}
                        className="gap-1 text-xs text-primary hover:bg-none"
                        title={
                          locale === "ar" ? "إضافة درس لهذا القسم" : "Add lesson to this section"
                        }
                      >
                        <PlusIcon className="size-3.5" />
                      </Button>

                      {/* Edit Section */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenEditSection(sec)}
                        className="text-muted-foreground hover:text-primary h-7 w-7"
                        title={locale === "ar" ? "تعديل القسم" : "Edit section"}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      {/* Delete Section */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSectionToDelete(sec)}
                        className="text-muted-foreground hover:text-destructive h-7 w-7"
                        title={locale === "ar" ? "حذف القسم" : "Delete section"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Section Lessons & Linked Exam */}
                  {sec.lessons.length > 0 || (sec.isLinkedToExam && sec.linkedExamId) ? (
                    <div className="pl-6 rtl:pl-0 rtl:pr-6 space-y-2 border-l rtl:border-l-0 rtl:border-r border-border">
                      {sec.lessons.map((les, lIdx) => {
                        const lesPublishStatus = les.publishStatus || "published";
                        const isDifferentStatus = lesPublishStatus !== secPublishStatus;

                        return (
                          <div
                            key={les.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-lg bg-background border gap-2"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {les.type === "text" ? (
                                <FileTextIcon className="size-4 text-emerald-500 shrink-0" />
                              ) : (
                                <VideoIcon className="size-4 text-primary shrink-0" />
                              )}
                              <span className="font-semibold text-foreground">
                                {lIdx + 1}. {les.title}
                              </span>

                              {/* Lesson Type Icon Badge with Tooltip */}
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      tabIndex={0}
                                      className={cn(
                                        "size-5 rounded-full flex items-center justify-center shrink-0 cursor-help",
                                        les.type === "text"
                                          ? "bg-emerald-500/10 text-emerald-600"
                                          : "bg-primary/10 text-primary",
                                      )}
                                    >
                                      {les.type === "text" ? (
                                        <FileTextIcon className="size-3 shrink-0" />
                                      ) : (
                                        <VideoIcon className="size-3 shrink-0" />
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {les.type === "text"
                                      ? t("step2.addLessonDialog.typeOptions.text")
                                      : t("step2.addLessonDialog.typeOptions.videoAndText")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {(les.hasPdfAttachments ||
                                (les.pdfFiles && les.pdfFiles.length > 0)) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                                  <Paperclip className="size-3" />
                                  {t("step2.pdfsBadge", {
                                    count: (les.pdfFiles || []).length || 1,
                                  })}
                                </span>
                              )}

                              {les.isLinkedToExam && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1"
                                >
                                  <FileQuestion className="size-3 shrink-0" />
                                  <span>{t("step2.examLinkedBadge")}</span>
                                </Badge>
                              )}

                              {/* Publish Status Badge if different from parent section */}
                              {isDifferentStatus && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-medium capitalize",
                                    lesPublishStatus === "published" &&
                                      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                    lesPublishStatus === "draft" &&
                                      "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                    lesPublishStatus === "scheduled" &&
                                      "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                  )}
                                >
                                  {lesPublishStatus === "published"
                                    ? locale === "ar"
                                      ? "منشور"
                                      : "Published"
                                    : lesPublishStatus === "scheduled"
                                      ? locale === "ar"
                                        ? "مجدول"
                                        : "Scheduled"
                                      : locale === "ar"
                                        ? "مسودة"
                                        : "Draft"}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setEditingLesson({ lesson: les, sectionId: sec.id });
                                  setActiveDialog("lesson");
                                }}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setLessonToDelete({ lesson: les, sectionId: sec.id });
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Linked Exam item under lessons */}
                      {sec.isLinkedToExam && sec.linkedExamId && (
                        <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-warning/10 border border-warning/20">
                          <span className="font-medium text-warning flex items-center gap-2">
                            <FileQuestion className="size-3.5 text-warning" />
                            {t("step2.addSectionDialog.isLinkedToExam")}:{" "}
                            {availableExams.find((e) => e.id === sec.linkedExamId)?.title ||
                              sec.linkedExamTitle ||
                              `#${sec.linkedExamId}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-6 rtl:pl-0 rtl:pr-6">
                      {t("step2.noLessons")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </FormSectionCard>

      {/* Step 2 Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBackToStep1}>
          {t("actions.backToMainInfo")}
        </Button>
        <Button type="button" onClick={onFinish} className="gap-2">
          <CheckCircle2 className="size-4" />
          {isEditing ? t("actions.saveAndPublish") : t("actions.finishAndPublish")}
        </Button>
      </div>

      {/* DIALOG 1: ADD & EDIT SECTION */}
      <Dialog
        open={activeDialog === "section"}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSection(null);
            setActiveDialog(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection
                ? t("step2.addSectionDialog.editTitle")
                : t("step2.addSectionDialog.title")}
            </DialogTitle>
            <DialogDescription>{t("step2.addSectionDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sec-title" className="text-sm font-medium text-foreground">
                {t("step2.addSectionDialog.sectionTitle")}
              </label>
              <Input
                id="sec-title"
                value={newSecTitle}
                onChange={(e) => setNewSecTitle(e.target.value)}
                placeholder={t("step2.addSectionDialog.sectionTitlePlaceholder")}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {locale === "ar" ? "إعدادات النشر" : "Publish Status"}
              </label>
              <Select
                value={newSecStatus}
                onValueChange={(val) => setNewSecStatus(val as LessonPublishStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{locale === "ar" ? "مسودة" : "Draft"}</SelectItem>
                  <SelectItem value="published">
                    {locale === "ar" ? "منشور" : "Published"}
                  </SelectItem>
                  <SelectItem value="scheduled">
                    {locale === "ar" ? "مجدول" : "Scheduled"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Date (Only if status is scheduled) */}
            {newSecStatus === "scheduled" &&
              (() => {
                const storedCourses = getStoredCourses(locale);
                const currentCourse = storedCourses.find((c) => c.id === courseId);
                const courseMinDate =
                  currentCourse?.publishStatus === "scheduled"
                    ? currentCourse.scheduledPublishDate
                    : undefined;

                return (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="sec-schedule-date"
                        className="text-sm font-medium text-foreground flex items-center gap-1"
                      >
                        {locale === "ar" ? "تاريخ النشر المجدول" : "Scheduled Publish Date"}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="sec-schedule-date"
                        type="date"
                        value={newSecScheduledDate}
                        min={courseMinDate}
                        onChange={(e) => {
                          setNewSecScheduledDate(e.target.value);
                          setNewSecScheduleDateError(null);
                        }}
                        required
                      />
                    </div>

                    {newSecScheduleDateError && (
                      <p className="text-xs text-destructive font-medium animate-in fade-in">
                        {newSecScheduleDateError}
                      </p>
                    )}
                  </div>
                );
              })()}

            {/* Toggle: Link to Exam */}
            <FormToggleSetting
              id="link-exam-toggle"
              title={t("step2.addSectionDialog.isLinkedToExam")}
              checked={newSecIsLinkedExam}
              onCheckedChange={setNewSecIsLinkedExam}
              className="bg-transparent border-0 p-0!"
            />

            {/* Select Exam (shown when link to exam is on) */}
            {newSecIsLinkedExam && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <ExamSelect
                  value={newSecLinkedExamId}
                  onValueChange={setNewSecLinkedExamId}
                  label={locale === "ar" ? "اختر الامتحان" : "Select Exam"}
                  placeholder={
                    t("step2.addLessonDialog.selectExam") ||
                    (locale === "ar" ? "اختر الامتحان..." : "Select exam...")
                  }
                  exams={availableExams}
                  emptyLabel={locale === "ar" ? "لا توجد امتحانات متاحة" : "No exams available"}
                />
              </div>
            )}

            {/* Toggle: Exam pass required (only shown if link to exam is enabled) */}
            {newSecIsLinkedExam && (
              <FormToggleSetting
                id="req-pass-toggle"
                title={t("step2.addSectionDialog.isRequiredPassExam")}
                checked={newSecIsReqPass}
                onCheckedChange={setNewSecIsReqPass}
                className="bg-transparent border-0 p-0 animate-in fade-in slide-in-from-top-1"
              />
            )}

            {/* Toggle: Add Expiry Date (only shown if link to exam is enabled) */}
            {newSecIsLinkedExam && (
              <div className="space-y-3 pt-1 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
                <FormToggleSetting
                  id="sec-exam-expiry-toggle"
                  title={t("step2.addSectionDialog.hasExamExpiryDate")}
                  subtitle={t("step2.addSectionDialog.hasExamExpiryDateSubtitle")}
                  checked={newSecHasExamExpiry}
                  onCheckedChange={setNewSecHasExamExpiry}
                  className="bg-transparent border-0 p-0"
                />

                {newSecHasExamExpiry && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="sec-exam-start-date"
                          className="text-xs font-medium text-foreground"
                        >
                          {t("step2.addSectionDialog.examStartDate")}
                        </label>
                        <Input
                          id="sec-exam-start-date"
                          type="date"
                          value={newSecExamStartDate}
                          min={
                            newSecStatus === "scheduled" && newSecScheduledDate
                              ? newSecScheduledDate
                              : undefined
                          }
                          onChange={(e) => {
                            setNewSecExamStartDate(e.target.value);
                            setNewSecExamDateError(null);
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="sec-exam-expiry-date"
                          className="text-xs font-medium text-foreground"
                        >
                          {t("step2.addSectionDialog.examExpiryDate")}
                        </label>
                        <Input
                          id="sec-exam-expiry-date"
                          type="date"
                          value={newSecExamExpiryDate}
                          min={
                            newSecExamStartDate ||
                            (newSecStatus === "scheduled" && newSecScheduledDate
                              ? newSecScheduledDate
                              : undefined)
                          }
                          onChange={(e) => {
                            setNewSecExamExpiryDate(e.target.value);
                            setNewSecExamDateError(null);
                          }}
                        />
                      </div>
                    </div>

                    {newSecExamDateError && (
                      <p className="text-xs text-destructive font-medium animate-in fade-in">
                        {newSecExamDateError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEditingSection(null);
                setActiveDialog(null);
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleSaveSection} disabled={!newSecTitle.trim()}>
              {editingSection
                ? locale === "ar"
                  ? "حفظ التعديلات"
                  : "Save Changes"
                : t("actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: LESSON DIALOG (ADD & EDIT) */}
      <LessonDialog
        open={activeDialog === "lesson"}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLesson(null);
            setLessonTargetSectionId(undefined);
          }
          setActiveDialog(open ? "lesson" : null);
        }}
        sections={sections}
        initialLesson={editingLesson?.lesson || null}
        initialSectionId={editingLesson?.sectionId || lessonTargetSectionId}
        parentCourseContext={parentCourseContext}
        onSave={handleSaveLesson}
        onSaveMany={handleSaveManyLessons}
      />

      {/* DIALOG 4: ARRANGE SECTIONS */}
      <Dialog
        open={activeDialog === "arrange"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.arrangeDialog.title")}</DialogTitle>
            <DialogDescription>{t("step2.arrangeDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                {t("step2.noSections")}
              </p>
            ) : (
              sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/40"
                >
                  <span className="text-sm font-medium text-foreground">
                    {idx + 1}. {sec.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, "up")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, "down")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setActiveDialog(null)}>
              {t("step2.arrangeDialog.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4.5: IMPORT SECTIONS FROM OTHER COURSES */}
      <Dialog
        open={activeDialog === "import"}
        onOpenChange={(open) => {
          if (!open) {
            setImportCourseId("");
            setSelectedImportSectionIds([]);
            setActiveDialog(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Download className="size-5 text-primary" />
              {t("step2.importFromCoursesDialog.title")}
            </DialogTitle>
            <DialogDescription>{t("step2.importFromCoursesDialog.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step A: Select Source Course */}
            <div className="flex flex-col gap-1.5">
              <CourseSelect
                value={importCourseId}
                onValueChange={(val) => {
                  setImportCourseId(val);
                  setSelectedImportSectionIds([]);
                }}
                label={t("step2.importFromCoursesDialog.selectCourse")}
                placeholder={t("step2.importFromCoursesDialog.selectCoursePlaceholder")}
                courses={allCoursesList.map((c) => ({
                  id: c.id,
                  title: c.title || (locale === "ar" ? "دورة بدون عنوان" : "Untitled Course"),
                }))}
                emptyLabel={t("step2.importFromCoursesDialog.noCoursesAvailable")}
              />
            </div>

            {/* Step B: Multi-Select Sections from Chosen Course */}
            {importCourseId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                {availableImportSections.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                    {t("step2.importFromCoursesDialog.noSectionsInCourse")}
                  </p>
                ) : (
                  <>
                    <MultiLessonSelect
                      id="multi-import-section-select"
                      value={selectedImportSectionIds}
                      onValueChange={setSelectedImportSectionIds}
                      label={t("step2.importFromCoursesDialog.selectSections")}
                      placeholder={t("step2.importFromCoursesDialog.selectSectionsPlaceholder")}
                      lessons={availableImportSections.map((s) => ({
                        id: s.id,
                        title: s.title,
                      }))}
                      emptyLabel={t("step2.importFromCoursesDialog.noSectionsInCourse")}
                    />

                    {/* Selected Sections List (without action button) */}
                    {selectedImportSectionsList.length > 0 && (
                      <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
                        <h4 className="text-sm font-bold text-foreground">
                          {t("step2.importFromCoursesDialog.selectedSections")} (
                          {selectedImportSectionsList.length})
                        </h4>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {selectedImportSectionsList.map((sec, idx) => (
                            <div
                              key={sec.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-foreground truncate">
                                  {sec.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full font-medium">
                                {locale === "ar"
                                  ? `${sec.lessons?.length || 0} درس`
                                  : `${sec.lessons?.length || 0} lessons`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setImportCourseId("");
                setSelectedImportSectionIds([]);
                setActiveDialog(null);
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleImportSections}
              disabled={!importCourseId || selectedImportSectionIds.length === 0}
            >
              {t("step2.importFromCoursesDialog.importAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: DELETE LESSON CONFIRMATION */}
      <Dialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.deleteLessonDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("step2.deleteLessonDialog.description", {
                title: lessonToDelete?.lesson.title || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setLessonToDelete(null)}>
              {t("step2.deleteLessonDialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteLesson}>
              {t("step2.deleteLessonDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: DELETE SECTION CONFIRMATION */}
      <Dialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.deleteSectionDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("step2.deleteSectionDialog.description", {
                title: sectionToDelete?.title || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSectionToDelete(null)}>
              {t("step2.deleteSectionDialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSection}>
              {t("step2.deleteSectionDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
