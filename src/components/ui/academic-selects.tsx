/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { CheckIcon, ChevronDownIcon, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStoredCourses } from "@/lib/courses-storage";
import { lessonsService } from "@/lib/api/lessons-service";
import { getStoredTeachers } from "@/lib/settings-storage";
import { cn } from "@/lib/utils";
import { Teacher } from "@/types/settings";

const triggerBaseStyles = cn(
  "flex h-8 w-full flex-1 min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 px-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
);

import { Plus } from "lucide-react";
import { QuickAddDialog } from "@/components/ui/quick-add-dialog";
import {
  getStoredGrades,
  getStoredSubjects,
  saveGrade,
  saveSubject,
  saveTeacher,
} from "@/lib/settings-storage";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  label?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  // Quick-Add capability
  allowAdd?: boolean;
  addButtonTooltip?: string;
  onAddNewOption?: (name: string) => void | Promise<void>;
  addDialogTitle?: string;
  addDialogDescription?: string;
  addInputLabel?: string;
  addInputPlaceholder?: string;
}

export function ComboboxSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyLabel = "لا توجد نتائج.",
  disabled,
  required,
  id,
  className,
  triggerClassName,
  showIcon = false,
  icon,
  allowAdd = false,
  addButtonTooltip,
  onAddNewOption,
  addDialogTitle,
  addDialogDescription,
  addInputLabel,
  addInputPlaceholder,
}: ComboboxSelectProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("common.quickAdd");
  const [open, setOpen] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const selectedOption = options.find(
    (opt) =>
      opt.value === value ||
      (value && typeof value === "string" && opt.label?.trim() === value.trim()) ||
      (value !== undefined && value !== null && String(opt.value) === String(value)),
  );

  const handleAdd = async (newName: string) => {
    if (onAddNewOption) {
      await onAddNewOption(newName);
    }
    setTimeout(() => {
      onValueChange(newName);
    }, 50);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          {showIcon && (icon || <User className="size-4 text-muted-foreground shrink-0" />)}
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="flex items-center gap-2 w-full min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                triggerBaseStyles,
                !value && "text-muted-foreground",
                isRTL ? "text-right" : "text-left",
                triggerClassName,
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <span className="line-clamp-1 flex items-center gap-1.5 flex-1">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-36 p-0"
            align="start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Command dir={isRTL ? "rtl" : "ltr"}>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.label} ___ ${opt.value}`}
                      onSelect={() => {
                        onValueChange(opt.value === value ? "" : opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-2 text-sm outline-hidden select-none",
                        isRTL ? "pl-8 pr-1.5 text-right" : "pr-8 pl-1.5 text-left",
                      )}
                    >
                      <span className="flex-1 line-clamp-1">{opt.label}</span>
                      <span
                        className={cn(
                          "pointer-events-none absolute flex size-4 items-center justify-center",
                          isRTL ? "left-2" : "right-2",
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            "pointer-events-none size-4",
                            value === opt.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {allowAdd && (
          <Button
            type="button"
            variant="default"
            size="icon"
            className="shrink-0 h-8 w-8"
            disabled={disabled}
            onClick={() => setIsAddOpen(true)}
            title={addButtonTooltip || t("addOption")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {allowAdd && (
        <QuickAddDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          title={addDialogTitle}
          description={addDialogDescription}
          inputLabel={addInputLabel}
          inputPlaceholder={addInputPlaceholder}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

// --- Grade Select ---
export interface GradeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  allowAdd?: boolean;
  grades?: Array<{ id: string | number; name: string }>;
}

export function GradeSelect({
  value,
  onValueChange,
  label,
  placeholder,
  disabled,
  required,
  id = "grade-select",
  className,
  triggerClassName,
  showAllOption = false,
  allOptionLabel,
  allowAdd = false,
  grades,
}: GradeSelectProps) {
  const tGrades = useTranslations("courses.new.grades");
  const [storedGradesList, setStoredGradesList] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  React.useEffect(() => {
    if (grades) return;
    const load = () => {
      const g = getStoredGrades();
      setStoredGradesList(g.map((item) => ({ id: item.id, name: item.name })));
    };
    load();
    window.addEventListener("rewaa_grades_updated", load);
    return () => window.removeEventListener("rewaa_grades_updated", load);
  }, [grades]);

  const defaultGrades = grades
    ? grades.map((g) => ({ value: String(g.id), label: g.name }))
    : [
        { value: "grade1", label: tGrades("grade1") },
        { value: "grade2", label: tGrades("grade2") },
        { value: "grade3", label: tGrades("grade3") },
        { value: "university", label: tGrades("university") },
      ];

  const customGrades = grades
    ? []
    : storedGradesList
        .filter((sg) => !defaultGrades.some((dg) => dg.value === sg.name || dg.label === sg.name))
        .map((sg) => ({ value: sg.name, label: sg.name }));

  const options: ComboboxOption[] = [
    ...(showAllOption ? [{ value: "all", label: allOptionLabel || "كل المراحل" }] : []),
    ...defaultGrades,
    ...customGrades,
  ];

  const handleAddGrade = (name: string) => {
    saveGrade({ name, year: 10 });
  };

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder || tGrades("grade1")}
      searchPlaceholder="ابحث عن مرحلة..."
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      allowAdd={allowAdd}
      onAddNewOption={handleAddGrade}
      addDialogTitle="إضافة مرحلة دراسية جديدة"
      addInputLabel="اسم المرحلة الدراسية"
      addInputPlaceholder="مثال: الصف الرابع الابتدائي"
    />
  );
}

// --- Subject Select ---
export interface SubjectSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  allowAdd?: boolean;
  subjects?: Array<{ id: string | number; name: string }>;
}

export function SubjectSelect({
  value,
  onValueChange,
  label,
  placeholder,
  disabled,
  required,
  id = "subject-select",
  className,
  triggerClassName,
  showAllOption = false,
  allOptionLabel,
  allowAdd = false,
  subjects,
}: SubjectSelectProps) {
  const tSubjects = useTranslations("courses.new.subjects");
  const [storedSubjectsList, setStoredSubjectsList] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  React.useEffect(() => {
    if (subjects) return;
    const load = () => {
      const s = getStoredSubjects();
      setStoredSubjectsList(s.map((item) => ({ id: item.id, name: item.name })));
    };
    load();
    window.addEventListener("rewaa_subjects_updated", load);
    return () => window.removeEventListener("rewaa_subjects_updated", load);
  }, [subjects]);

  const defaultSubjects = subjects
    ? subjects.map((s) => ({ value: String(s.id), label: s.name }))
    : [
        { value: "physics", label: tSubjects("physics") },
        { value: "chemistry", label: tSubjects("chemistry") },
        { value: "mathematics", label: tSubjects("mathematics") },
        { value: "biology", label: tSubjects("biology") },
        { value: "arabic", label: tSubjects("arabic") },
        { value: "english", label: tSubjects("english") },
      ];

  const customSubjects = subjects
    ? []
    : storedSubjectsList
        .filter((sb) => !defaultSubjects.some((ds) => ds.value === sb.name || ds.label === sb.name))
        .map((sb) => ({ value: sb.name, label: sb.name }));

  const options: ComboboxOption[] = [
    ...(showAllOption ? [{ value: "all", label: allOptionLabel || "كل المواد" }] : []),
    ...defaultSubjects,
    ...customSubjects,
  ];

  const handleAddSubject = (name: string) => {
    saveSubject({ name });
  };

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder || tSubjects("physics")}
      searchPlaceholder="ابحث عن مادة..."
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      allowAdd={allowAdd}
      onAddNewOption={handleAddSubject}
      addDialogTitle="إضافة مادة دراسية جديدة"
      addInputLabel="اسم المادة الدراسية"
      addInputPlaceholder="مثال: الجيولوجيا وعلوم البيئة"
    />
  );
}

// --- Teacher Select ---
export interface TeacherSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  showIcon?: boolean;
  teachers?: (Teacher | { id: number | string; full_name?: string; name?: string })[];
  allowAdd?: boolean;
}

export function TeacherSelect({
  value,
  onValueChange,
  label,
  placeholder = "اختر المعلم...",
  disabled,
  required,
  id = "teacher-select",
  className,
  triggerClassName,
  showIcon = false,
  teachers,
  allowAdd = false,
}: TeacherSelectProps) {
  const [internalTeachers, setInternalTeachers] = React.useState<Teacher[]>([]);

  React.useEffect(() => {
    if (teachers) return;
    const loadTeachers = () => setInternalTeachers(getStoredTeachers());
    loadTeachers();
    window.addEventListener("rewaa_teachers_updated", loadTeachers);
    return () => window.removeEventListener("rewaa_teachers_updated", loadTeachers);
  }, [teachers]);

  const activeTeachers = teachers || internalTeachers;
  const options: ComboboxOption[] = activeTeachers.map((tch) => {
    const labelStr =
      "full_name" in tch && tch.full_name ? tch.full_name : tch.name || String(tch.id);
    const valueStr = String(tch.id ?? tch.name);
    return {
      value: valueStr,
      label: labelStr,
    };
  });

  const handleAddTeacher = (name: string) => {
    saveTeacher({
      name,
      phone: "01000000000",
      subjects: [],
      grades: [],
    });
  };

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="ابحث عن معلم..."
      emptyLabel="لا يوجد معلم بهذا الاسم."
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      showIcon={showIcon}
      allowAdd={allowAdd}
      onAddNewOption={handleAddTeacher}
      addDialogTitle="إضافة معلم جديد"
      addInputLabel="اسم المعلم"
      addInputPlaceholder="مثال: أ. محمد علي"
    />
  );
}

// --- Exam Select ---
export interface ExamSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  exams?: Array<{ id: string; title: string; teacherName?: string }>;
  showNoneOption?: boolean;
  noneOptionLabel?: string;
  emptyLabel?: string;
  showTeacherNameInOption?: boolean;
  allowAdd?: boolean;
}

export function ExamSelect({
  value,
  onValueChange,
  label,
  placeholder = "اختر الامتحان...",
  disabled,
  required,
  id = "exam-select",
  className,
  triggerClassName,
  exams,
  showNoneOption = false,
  noneOptionLabel = "بدون امتحان",
  emptyLabel = "لا يوجد امتحان بهذا الاسم.",
  showTeacherNameInOption = false,
  allowAdd = false,
}: ExamSelectProps) {
  const locale = useLocale();
  const [internalExams, setInternalExams] = React.useState<
    Array<{ id: string; title: string; teacherName?: string }>
  >([]);

  React.useEffect(() => {
    if (exams) return;
    let isMounted = true;
    (async () => {
      try {
        const { examsService } = await import("@/lib/api/exams-service");
        const res = await examsService.getExams({ per_page: 100 });
        if (isMounted) {
          setInternalExams(
            res.exams.map((e) => ({
              id: String(e.id),
              title: e.title[locale] || e.title.ar || "",
              teacherName: e.instructor?.full_name,
            })),
          );
        }
      } catch {
        // Fallback gracefully to empty array
        if (isMounted) setInternalExams([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [exams, locale]);

  const activeExams = exams || internalExams;

  const options: ComboboxOption[] = [
    ...(showNoneOption ? [{ value: "none", label: noneOptionLabel }] : []),
    ...activeExams.map((exam) => ({
      value: exam.id,
      label: `${exam.title}${
        showTeacherNameInOption && exam.teacherName ? ` (${exam.teacherName})` : ""
      }`,
    })),
  ];

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="ابحث عن امتحان..."
      emptyLabel={emptyLabel}
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      allowAdd={allowAdd}
    />
  );
}

// --- Course Select ---
export interface CourseSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  courses?: Array<{ id: string; title: string }>;
  showAllOption?: boolean;
  allOptionLabel?: string;
  emptyLabel?: string;
  allowAdd?: boolean;
}

export function CourseSelect({
  value,
  onValueChange,
  label,
  placeholder = "اختر الكورس...",
  disabled,
  required,
  id = "course-select",
  className,
  triggerClassName,
  courses,
  showAllOption = false,
  allOptionLabel = "كل الكورسات",
  emptyLabel = "لا يوجد كورس بهذا الاسم.",
  allowAdd = false,
}: CourseSelectProps) {
  const locale = useLocale();
  const [internalCourses, setInternalCourses] = React.useState<
    Array<{ id: string; title: string }>
  >([]);

  React.useEffect(() => {
    if (courses) return;
    const loaded = getStoredCourses(locale);
    setInternalCourses(loaded.map((c) => ({ id: c.id, title: c.title })));
  }, [courses, locale]);

  const activeCourses = courses || internalCourses;

  const options: ComboboxOption[] = [
    ...(showAllOption ? [{ value: "all", label: allOptionLabel }] : []),
    ...activeCourses.map((c) => ({
      value: c.id,
      label: c.title,
    })),
  ];

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="ابحث عن كورس..."
      emptyLabel={emptyLabel}
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      allowAdd={allowAdd}
    />
  );
}

// --- Lesson Select ---
export interface LessonSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  lessons?: Array<{ id: string; title: string }>;
  showAllOption?: boolean;
  allOptionLabel?: string;
  emptyLabel?: string;
  allowAdd?: boolean;
}

export function LessonSelect({
  value,
  onValueChange,
  label,
  placeholder = "اختر الدرس...",
  disabled,
  required,
  id = "lesson-select",
  className,
  triggerClassName,
  lessons,
  showAllOption = false,
  allOptionLabel = "كل الدروس",
  emptyLabel = "لا يوجد درس بهذا الاسم.",
  allowAdd = false,
}: LessonSelectProps) {
  const locale = useLocale();
  const [internalLessons, setInternalLessons] = React.useState<
    Array<{ id: string; title: string }>
  >([]);

  React.useEffect(() => {
    if (lessons) return;
    let isMounted = true;
    lessonsService
      .getLessons({ per_page: 100 })
      .then((res) => {
        if (!isMounted) return;
        setInternalLessons(
          res.lessons.map((l) => {
            const titleStr =
              typeof l.title === "string"
                ? l.title
                : locale === "ar"
                  ? l.title?.ar || l.title?.en || ""
                  : l.title?.en || l.title?.ar || "";
            return { id: String(l.id), title: titleStr };
          }),
        );
      })
      .catch(() => {
        // Silently handle if unauthenticated or network failure
      });
    return () => {
      isMounted = false;
    };
  }, [lessons, locale]);

  const activeLessons = lessons || internalLessons;

  const options: ComboboxOption[] = [
    ...(showAllOption ? [{ value: "all", label: allOptionLabel }] : []),
    ...activeLessons.map((l) => ({
      value: l.id,
      label: l.title,
    })),
  ];

  return (
    <ComboboxSelect
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="ابحث عن درس..."
      emptyLabel={emptyLabel}
      disabled={disabled}
      required={required}
      className={className}
      triggerClassName={triggerClassName}
      allowAdd={allowAdd}
    />
  );
}

// --- Multi Lesson Select ---
export interface MultiLessonSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  lessons?: Array<{ id: string; title: string }>;
  emptyLabel?: string;
  allowAdd?: boolean;
  onAddNewOption?: (name: string) => void | Promise<void>;
}

export function MultiLessonSelect({
  value = [],
  onValueChange,
  label,
  placeholder = "اختر الدروس...",
  disabled,
  required,
  id = "multi-lesson-select",
  className,
  triggerClassName,
  lessons,
  emptyLabel = "لا يوجد درس بهذا الاسم.",
  allowAdd = false,
  onAddNewOption,
}: MultiLessonSelectProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("common.quickAdd");
  const [open, setOpen] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [internalLessons, setInternalLessons] = React.useState<
    Array<{ id: string; title: string }>
  >([]);

  React.useEffect(() => {
    if (lessons) return;
    let isMounted = true;
    lessonsService
      .getLessons({ per_page: 100 })
      .then((res) => {
        if (!isMounted) return;
        setInternalLessons(
          res.lessons.map((l) => {
            const titleStr =
              typeof l.title === "string"
                ? l.title
                : locale === "ar"
                  ? l.title?.ar || l.title?.en || ""
                  : l.title?.en || l.title?.ar || "";
            return { id: String(l.id), title: titleStr };
          }),
        );
      })
      .catch(() => {
        // Silently handle if unauthenticated or network failure
      });
    return () => {
      isMounted = false;
    };
  }, [lessons, locale]);

  const activeLessons = lessons || internalLessons;

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onValueChange(value.filter((v) => v !== optValue));
    } else {
      onValueChange([...value, optValue]);
    }
  };

  const handleAdd = async (newName: string) => {
    if (onAddNewOption) {
      await onAddNewOption(newName);
    }
    setTimeout(() => {
      onValueChange([...value, newName]);
    }, 50);
  };

  const selectedLabels = activeLessons.filter((l) => value.includes(l.id)).map((l) => l.title);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="flex items-center gap-2 w-full min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                triggerBaseStyles,
                "h-auto min-h-8 py-1.5 px-2.5",
                value.length === 0 && "text-muted-foreground",
                isRTL ? "text-right" : "text-left",
                triggerClassName,
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className="flex flex-wrap items-center gap-1 flex-1">
                {selectedLabels.length > 0 ? (
                  selectedLabels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {lbl}
                    </span>
                  ))
                ) : (
                  <span>{placeholder}</span>
                )}
              </div>
              <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-48 p-0"
            align="start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Command dir={isRTL ? "rtl" : "ltr"}>
              <CommandInput placeholder="ابحث عن درس..." />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {activeLessons.map((l) => {
                    const isSelected = value.includes(l.id);
                    return (
                      <CommandItem
                        key={l.id}
                        value={l.title}
                        onSelect={() => toggleOption(l.id)}
                        className={cn(
                          "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-2 text-sm outline-hidden select-none",
                          isRTL ? "pl-8 pr-1.5 text-right" : "pr-8 pl-1.5 text-left",
                        )}
                      >
                        <span className="flex-1 line-clamp-1">{l.title}</span>
                        <span
                          className={cn(
                            "pointer-events-none absolute flex size-4 items-center justify-center",
                            isRTL ? "left-2" : "right-2",
                          )}
                        >
                          <CheckIcon
                            className={cn(
                              "pointer-events-none size-4",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {allowAdd && (
          <Button
            type="button"
            variant="default"
            size="icon"
            className="shrink-0 h-8 w-8"
            disabled={disabled}
            onClick={() => setIsAddOpen(true)}
            title={t("addOption")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {allowAdd && (
        <QuickAddDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          title="إضافة درس جديد"
          description="أدخل عنوان الدرس الجديد لإضافته وتحديده."
          inputLabel="عنوان الدرس"
          inputPlaceholder="مثال: مقدمة في الحركة الدائرية"
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
