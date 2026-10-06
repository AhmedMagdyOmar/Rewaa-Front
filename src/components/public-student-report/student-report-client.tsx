"use client";

import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { StudentReportView } from "@/components/dashboard/students/student-report-view";
import { Button } from "@/components/ui/button";
import { adaptBackendExamAttemptToExam } from "@/lib/adapters/exam-adapters";
import { adaptBackendStudentToUI } from "@/lib/adapters/student-adapter";
import { studentsService } from "@/lib/api/students-service";
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { Student } from "@/types/student";

interface StudentReportClientProps {
  studentId: string;
}

export function StudentReportClient({ studentId }: StudentReportClientProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const t = useTranslations("publicStudentReport");
  const tGrades = useTranslations("courses.new.grades");

  const [student, setStudent] = React.useState<Student | null>(null);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const formatGrade = React.useCallback(
    (key?: string) => {
      if (!key) return "-";
      return tGrades.has(key as Parameters<typeof tGrades.has>[0])
        ? tGrades(key as Parameters<typeof tGrades>[0])
        : key;
    },
    [tGrades],
  );

  // Load student and related data via public secure API
  const loadReport = React.useCallback(
    async (token?: string) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        if (!token) {
          setErrorMessage(t("invalidToken"));
          setIsLoading(false);
          return;
        }

        const backendData = await studentsService.getPublicStudentReport(studentId, { token });
        if (backendData) {
          const foundStudent = adaptBackendStudentToUI(backendData, locale);

          let studentCourses: Course[] = [];
          if (backendData.enrolled_courses && backendData.enrolled_courses.length > 0) {
            studentCourses = backendData.enrolled_courses.map((ec) => ({
              id: String(ec.id),
              title:
                typeof ec.title === "string"
                  ? ec.title
                  : ec.title?.[locale] || ec.title?.ar || ec.title?.en || `Course #${ec.id}`,
              coverImage: ec.cover_image || "",
              description: "",
              subject: "",
              grade: foundStudent?.grade || "",
              teacherName: "",
              period: "term",
              date: "",
              numberOfLessons: ec.progress?.total_lessons ?? 0,
              progressPercentage: ec.progress?.percentage ?? 0,
              completedLessons: ec.progress?.completed_lessons ?? 0,
              totalLessons: ec.progress?.total_lessons ?? 0,
              price: 0,
              isFree: false,
              currency: "EGP",
              hasOffer: false,
              hasTimeLimit: false,
              isSplitToSections: false,
              numberOfParticipants: 0,
              isDraft: false,
              sections: [],
            }));
          }

          let studentExams: Exam[] = [];
          if (backendData.exam_attempts && backendData.exam_attempts.length > 0) {
            studentExams = backendData.exam_attempts.map((attempt) =>
              adaptBackendExamAttemptToExam(attempt, locale, foundStudent?.grade || ""),
            );
          }

          setStudent(foundStudent);
          setCourses(studentCourses);
          setExams(studentExams);
        }
      } catch (err: unknown) {
        const status =
          (err as { status: number })?.status ||
          (err as { response: { status: number } }).response?.status;
        if (status === 404) {
          setErrorMessage(t("studentNotFound"));
        } else {
          setErrorMessage(t("invalidToken"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [locale, studentId, t],
  );

  React.useEffect(() => {
    const urlToken = searchParams.get("token")?.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport(urlToken);
  }, [searchParams, loadReport]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error State (Invalid Token / Student Not Found / Missing Token)
  if (errorMessage || !student) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4 px-4">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="size-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {errorMessage || t("studentNotFound")}
        </h1>
        <Button asChild variant="outline">
          <Link href={`/${locale}`}>
            <ArrowLeft className="size-4 rtl:rotate-180 me-2" />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
    );
  }

  // Success -> Show Full Comprehensive Report with Download as PDF button
  return (
    <div className="max-w-4xl mx-auto my-6 sm:my-10 px-4 sm:px-6 space-y-6">
      <StudentReportView
        student={student}
        courses={courses}
        exams={exams}
        formatGrade={formatGrade}
        showDownloadButton={true}
      />
    </div>
  );
}
