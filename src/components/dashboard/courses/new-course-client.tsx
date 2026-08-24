/* eslint-disable react-hooks/set-state-in-effect */
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
  Plus,
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
  const tCourses = useTranslations("courses");
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
  const [badge, setBadge] = useState<CourseBadge | "none">("none");

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
      setBadge((existing.badge as CourseBadge) || "none");

      // Matching for Grade
      const knownGrades: Record<string, string[]> = {
        grade1: [t("grades.grade1"), "الأول", "1st", "10", "grade1"],
        grade2: [t("grades.grade2"), "الثاني", "2nd", "11", "grade2"],
        grade3: [t("grades.grade3"), "الثالث", "3rd", "12", "grade3"],
        university: [t("grades.university"), "جامع", "University", "university"],
      };
      const exGrade = (existing.grade || "").toLowerCase();
      const matchedGradeKey =
        Object.keys(knownGrades).find((key) =>
          knownGrades[key].some((val) => val && exGrade.includes(val.toLowerCase())),
        ) ||
        (["grade1", "grade2", "grade3", "university"].includes(existing.grade)
          ? existing.grade
          : "");
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
        (["mathematics", "physics", "chemistry", "biology", "english", "arabic"].includes(
          existing.subject,
        )
          ? existing.subject
          : "");
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

  const handleSubmit = (e: React.FormEvent, isDraftOnly = false) => {
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

    const updatedCourse: Course = {
      id: courseIdToUse,
      coverImage: finalCoverImage,
      title: courseTitle,
      description: description || "",
      previewVideoLink: previewVideoLink || undefined,
      subject: subject
        ? t(`subjects.${subject}`)
        : existingCourse?.subject || (locale === "ar" ? "عام" : "General"),
      grade: grade
        ? t(`grades.${grade}`)
        : existingCourse?.grade || (locale === "ar" ? "جميع المراحل" : "All Grades"),
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
      badge: badge !== "none" ? badge : undefined,
      numberOfParticipants: existingCourse?.numberOfParticipants || 0,
      isDraft: existingCourse ? existingCourse.isDraft : true,
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
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link href={`/${locale}/dashboard/courses`}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {initialCourseId ? t("editTitle") : t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {initialCourseId ? t("editSubtitle") : t("subtitle")}
          </p>
        </div>
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

                {/* Course Badge (Radio Group) */}
                <FormRadioGroup
                  name="badge-option"
                  title={t("fields.badge")}
                  subtitle={t("fields.badgeSubtitle")}
                  icon={Tag}
                  value={badge}
                  onValueChange={(val) => setBadge(val as typeof badge)}
                  options={[
                    { id: "none", label: tCourses("badge.none"), desc: tCourses("badge.noneDesc") },
                    {
                      id: "featured",
                      label: tCourses("badge.featured"),
                      desc: tCourses("badge.featuredDesc"),
                    },
                    { id: "new", label: tCourses("badge.new"), desc: tCourses("badge.newDesc") },
                    {
                      id: "revision",
                      label: tCourses("badge.revision"),
                      desc: tCourses("badge.revisionDesc"),
                    },
                    {
                      id: "bestseller",
                      label: tCourses("badge.bestseller"),
                      desc: tCourses("badge.bestsellerDesc"),
                    },
                    {
                      id: "limited",
                      label: tCourses("badge.limited"),
                      desc: tCourses("badge.limitedDesc"),
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStoredExams } from "@/lib/exams-storage";
import {
  CourseSection,
  CourseBadge,
  CourseVenue,
  Lesson,
  LessonPublishStatus,
} from "@/types/course";
import { Exam } from "@/types/exam";
import {
  ArrowDown,
  ArrowUp,
  Clock as ClockIcon,
  Edit2,
  FileQuestion,
  FileText as FileTextIcon,
  FolderPlus,
  ListOrdered,
  Paperclip,
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
  const router = useRouter();
  const t = useTranslations("courses.new");

  // State for sections list
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [activeDialog, setActiveDialog] = useState<
    "section" | "lesson" | "exam" | "arrange" | null
  >(null);
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; sectionId: string } | null>(
    null,
  );
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
  const [newSecScheduledEndDate, setNewSecScheduledEndDate] = useState("");
  const [newSecIsLinkedExam, setNewSecIsLinkedExam] = useState(false);
  const [newSecLinkedExamId, setNewSecLinkedExamId] = useState("");
  const [newSecIsReqPass, setNewSecIsReqPass] = useState(false);

  // Dialog Form states: Exam
  const [newExamTargetSecId, setNewExamTargetSecId] = useState("");
  const [newExamSelectedId, setNewExamSelectedId] = useState("");
  const [newExamIsReqPass, setNewExamIsReqPass] = useState(false);
  const [isConfirmExamRedirectOpen, setIsConfirmExamRedirectOpen] = useState(false);

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

  // Triggered when user confirms leaving course to build a new exam
  const handleConfirmCreateNewExam = () => {
    // Ensure current course draft state is saved with current sections
    syncSectionsToStorage(sections);
    setIsConfirmExamRedirectOpen(false);
    setActiveDialog(null);
    router.push(`/${locale}/dashboard/exams/new`);
  };

  // Handlers for creating objects
  const handleAddSection = () => {
    if (!newSecTitle.trim()) return;
    const secId = `sec-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedExam = availableExams.find((e) => e.id === newSecLinkedExamId);
    const newSec: CourseSection = {
      id: secId,
      title: newSecTitle,
      isDraft: newSecStatus === "draft",
      status: newSecStatus,
      scheduledPublishDate: newSecStatus === "scheduled" ? newSecScheduledDate : undefined,
      scheduledEndDate: newSecStatus === "scheduled" ? newSecScheduledEndDate : undefined,
      isLinkedToExam: newSecIsLinkedExam,
      linkedExamId: newSecIsLinkedExam ? newSecLinkedExamId || undefined : undefined,
      linkedExamTitle: newSecIsLinkedExam ? selectedExam?.title : undefined,
      isRequiredPassExamForNextSection: newSecIsLinkedExam ? newSecIsReqPass : false,
      lessons: [],
    };
    const updated = [...sections, newSec];
    setSections(updated);
    syncSectionsToStorage(updated);
    setNewSecTitle("");
    setNewSecStatus("draft");
    setNewSecScheduledDate("");
    setNewSecScheduledEndDate("");
    setNewSecIsLinkedExam(false);
    setNewSecLinkedExamId("");
    setNewSecIsReqPass(false);
    setActiveDialog(null);
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

  const handleAddExam = () => {
    if (!newExamTargetSecId || !newExamSelectedId) return;

    const examTitleToLink = availableExams.find((e) => e.id === newExamSelectedId)?.title;

    const updatedSections = sections.map((sec) => {
      if (sec.id === newExamTargetSecId) {
        return {
          ...sec,
          isLinkedToExam: true,
          linkedExamId: newExamSelectedId,
          linkedExamTitle: examTitleToLink,
          isRequiredPassExamForNextSection: newExamIsReqPass,
        };
      }
      return sec;
    });

    setSections(updatedSections);
    syncSectionsToStorage(updatedSections);

    // Reset state
    setNewExamSelectedId("");
    setNewExamTargetSecId("");
    setNewExamIsReqPass(false);
    setActiveDialog(null);
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
    { key: "exam", label: t("actions.addExam"), icon: FileQuestion },
    { key: "arrange", label: t("actions.arrangeSections"), icon: ListOrdered },
  ] as const;

  const buttons = isSplitToSections ? allButtons : allButtons.filter((b) => b.key !== "section");

  return (
    <div className="space-y-6">
      {/* 4 ACTION BUTTONS AT TOP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeDialog === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                if (btn.key === "lesson") setEditingLesson(null);
                setActiveDialog(btn.key);
              }}
              className={cn(
                "py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 border shadow-2xs group cursor-pointer",
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
            {sections.map((sec, sIdx) => (
              <div key={sec.id} className="border rounded-xl p-4 bg-muted/20 space-y-3">
                {/* Section Header */}
                <div className="flex items-center justify-between font-semibold text-foreground text-base">
                  <span className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {sIdx + 1}
                    </span>
                    {sec.title}
                  </span>
                  {sec.isLinkedToExam && !sec.linkedExamId && (
                    <span className="text-xs font-normal px-2.5 py-1 rounded-md bg-warning-bg/10 text-warning border border-warning/20">
                      {t("step2.pleaseAddExamBadge")}
                    </span>
                  )}
                </div>

                {/* Section Lessons & Linked Exam */}
                {sec.lessons.length > 0 || (sec.isLinkedToExam && sec.linkedExamId) ? (
                  <div className="pl-6 rtl:pl-0 rtl:pr-6 space-y-2 border-l rtl:border-l-0 rtl:border-r border-border">
                    {sec.lessons.map((les, lIdx) => (
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

                          {/* Badges for Lesson attributes */}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {les.type === "text"
                              ? t("step2.addLessonDialog.typeOptions.text")
                              : t("step2.addLessonDialog.typeOptions.videoAndText")}
                          </span>

                          {(les.hasPdfAttachments || (les.pdfFiles && les.pdfFiles.length > 0)) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                              <Paperclip className="size-3" />
                              {t("step2.pdfsBadge", {
                                count: (les.pdfFiles || []).length || 1,
                              })}
                            </span>
                          )}

                          {les.isLinkedToExam && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium flex items-center gap-1">
                              <FileQuestion className="size-3" />
                              {t("step2.examLinkedBadge")}
                            </span>
                          )}

                          {les.publishStatus === "scheduled" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-medium flex items-center gap-1">
                              <ClockIcon className="size-3" />
                              {t("step2.scheduledBadge")}
                            </span>
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
                    ))}

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
            ))}
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

      {/* DIALOG 1: ADD SECTION */}
      <Dialog
        open={activeDialog === "section"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.addSectionDialog.title")}</DialogTitle>
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
                {locale === "ar" ? "حالة النشر" : "Publish Status"}
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

            {/* Schedule Dates (Only if status is scheduled) */}
            {newSecStatus === "scheduled" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
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
                    onChange={(e) => setNewSecScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="sec-schedule-end-date"
                    className="text-sm font-medium text-foreground"
                  >
                    {locale === "ar" ? "تاريخ الانتهاء المجدول" : "Scheduled End Date"}
                  </label>
                  <Input
                    id="sec-schedule-end-date"
                    type="date"
                    value={newSecScheduledEndDate}
                    onChange={(e) => setNewSecScheduledEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => setActiveDialog(null)}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleAddSection} disabled={!newSecTitle.trim()}>
              {t("actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: LESSON DIALOG (ADD & EDIT) */}
      <LessonDialog
        open={activeDialog === "lesson"}
        onOpenChange={(open) => {
          if (!open) setEditingLesson(null);
          setActiveDialog(open ? "lesson" : null);
        }}
        sections={sections}
        initialLesson={editingLesson?.lesson || null}
        initialSectionId={editingLesson?.sectionId}
        parentCourseContext={parentCourseContext}
        onSave={handleSaveLesson}
        onSaveMany={handleSaveManyLessons}
      />

      {/* DIALOG 3: ADD / LINK EXAM */}
      <Dialog
        open={activeDialog === "exam"}
        onOpenChange={(open) => {
          if (!open) {
            setNewExamSelectedId("");
            setNewExamTargetSecId("");
            setNewExamIsReqPass(false);
          }
          setActiveDialog(open ? "exam" : null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.addExamDialog.title")}</DialogTitle>
            <DialogDescription>{t("step2.addExamDialog.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Target Section Select */}
            <div className="flex flex-col gap-2">
              <label htmlFor="exam-sec" className="text-sm font-medium text-foreground">
                {t("step2.addExamDialog.targetSection")} <span className="text-destructive">*</span>
              </label>
              <Select value={newExamTargetSecId} onValueChange={setNewExamTargetSecId}>
                <SelectTrigger id="exam-sec">
                  <SelectValue placeholder={t("step2.addExamDialog.selectSection")} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Exam Select + Plus Button */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ExamSelect
                    value={newExamSelectedId}
                    onValueChange={setNewExamSelectedId}
                    label={locale === "ar" ? "اختر الامتحان" : "Select Exam"}
                    placeholder={
                      t("step2.addLessonDialog.selectExam") ||
                      (locale === "ar" ? "اختر الامتحان..." : "Select exam...")
                    }
                    required
                    exams={availableExams}
                    emptyLabel={locale === "ar" ? "لا توجد امتحانات متاحة" : "No exams available"}
                  />
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="shrink-0 h-9 w-9 mt-6"
                  onClick={() => setIsConfirmExamRedirectOpen(true)}
                  title={locale === "ar" ? "إنشاء امتحان جديد" : "Create new exam"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 3. Toggle: Passing Required */}
            <FormToggleSetting
              id="exam-req-pass-toggle"
              title={t("step2.addSectionDialog.isRequiredPassExam")}
              checked={newExamIsReqPass}
              onCheckedChange={setNewExamIsReqPass}
              className="bg-transparent border-0 p-0"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setActiveDialog(null);
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleAddExam}
              disabled={!newExamTargetSecId || !newExamSelectedId}
            >
              {t("actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG: LEAVE COURSE TO CREATE NEW EXAM */}
      <Dialog open={isConfirmExamRedirectOpen} onOpenChange={setIsConfirmExamRedirectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("step2.confirmLeaveForExam.title")}</DialogTitle>
            <DialogDescription className="leading-relaxed pt-1">
              {t("step2.confirmLeaveForExam.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsConfirmExamRedirectOpen(false)}
            >
              {t("step2.confirmLeaveForExam.cancel")}
            </Button>
            <Button type="button" onClick={handleConfirmCreateNewExam}>
              {t("step2.confirmLeaveForExam.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
