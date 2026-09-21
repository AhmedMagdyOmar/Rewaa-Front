"use client";

import { FileText, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppIcon, getWhatsAppUrl } from "@/components/ui/phone-link";
import { useProviderExamAttempts } from "@/hooks/use-exams";
import { useStudentDetail } from "@/hooks/use-students";
import { adaptBackendExamAttemptToExam } from "@/lib/adapters/exam-adapters";
import { adaptBackendStudentToUI } from "@/lib/adapters/student-adapter";
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { Student } from "@/types/student";
import { StudentReportView } from "./student-report-view";

interface StudentReportModalProps {
  student: Student;
  courses?: Course[];
  exams?: Exam[];
  isOpen: boolean;
  onClose: () => void;
  formatGrade: (key?: string) => string;
}

export function StudentReportModal({
  student: initialStudent,
  courses: initialCourses,
  exams: initialExams,
  isOpen,
  onClose,
  formatGrade,
}: StudentReportModalProps) {
  const locale = useLocale();
  const tDetails = useTranslations("studentsPage.details");
  const tReport = useTranslations("studentsPage.details.reportModal");

  const [isSending, setIsSending] = React.useState(false);

  const studentId = initialStudent?.id;
  const shouldFetchDetail =
    isOpen &&
    Boolean(studentId) &&
    (!initialCourses || initialCourses.length === 0 || !initialExams || initialExams.length === 0);

  const { data: backendStudent, isLoading: isStudentLoading } = useStudentDetail(
    shouldFetchDetail ? studentId : undefined,
  );
  const { data: attemptsData, isLoading: isAttemptsLoading } = useProviderExamAttempts({
    student_id: shouldFetchDetail ? studentId : undefined,
  });

  const student: Student = React.useMemo(() => {
    if (backendStudent) {
      const adapted = adaptBackendStudentToUI(backendStudent, locale);
      return {
        ...initialStudent,
        ...adapted,
      };
    }
    return initialStudent;
  }, [backendStudent, initialStudent, locale]);

  const courses: Course[] = React.useMemo(() => {
    if (initialCourses && initialCourses.length > 0) {
      return initialCourses;
    }
    if (backendStudent?.enrolled_courses && backendStudent.enrolled_courses.length > 0) {
      return backendStudent.enrolled_courses.map((ec) => ({
        id: String(ec.id),
        title:
          typeof ec.title === "string"
            ? ec.title
            : ec.title?.[locale] || ec.title?.ar || ec.title?.en || `Course #${ec.id}`,
        coverImage: ec.cover_image || "",
        description: "",
        subject: "",
        grade: student.grade || "",
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
        venue: "online",
        numberOfParticipants: 0,
        isDraft: false,
        sections: [],
      }));
    }
    return [];
  }, [initialCourses, backendStudent, student.grade, locale]);

  const exams: Exam[] = React.useMemo(() => {
    if (initialExams && initialExams.length > 0) {
      return initialExams;
    }
    if (attemptsData?.attempts && attemptsData.attempts.length > 0) {
      return attemptsData.attempts.map((attempt) =>
        adaptBackendExamAttemptToExam(attempt, locale, student.grade || ""),
      );
    }
    return [];
  }, [initialExams, attemptsData, student.grade, locale]);

  const fullName = [student.firstName, student.middleName, student.lastName, student.additionalName]
    .filter(Boolean)
    .join(" ");

  const currentYear = new Date().getFullYear();
  const avgPoints = student.averageRating
    ? Math.round(
        student.averageRating <= 5 ? (student.averageRating / 5) * 100 : student.averageRating,
      )
    : exams.length > 0
      ? Math.round(
          exams.reduce((acc, curr) => acc + (curr.score ?? curr.successRate ?? 0), 0) /
            exams.length,
        )
      : 0;

  const handleSendToParent = () => {
    if (isSending) return;

    try {
      setIsSending(true);

      const targetPhone = student.parentPhoneNumber || student.phoneNumber;

      // Determine base URL for report link with verification code
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const code = student.password || student.id.replace(/\D/g, "") || "123456";
      const reportUrl = `${origin}/${locale}/student-report/${student.id}?code=${code}`;

      const message =
        locale === "ar"
          ? `السلام عليكم ورحمة الله وبركاته،\nمرفق رابط تقرير الأداء الدراسي الشامل للطالب: *${fullName}*\nالعام الدراسي: ${currentYear}\nمتوسط التقييم: ${avgPoints}%\n\nيمكنكم الاطلاع على التقرير وتحميله عبر الرابط التالي:\n${reportUrl}`
          : `Hello,\nAttached is the comprehensive performance report link for student: *${fullName}*\nAcademic Year: ${currentYear}\nAverage Score: ${avgPoints}%\n\nYou can view and download the report via the following link:\n${reportUrl}`;

      const waBaseUrl = getWhatsAppUrl(targetPhone);
      const separator = waBaseUrl.includes("?") ? "&" : "?";
      const fullWhatsAppUrl = `${waBaseUrl}${separator}text=${encodeURIComponent(message)}`;

      window.open(fullWhatsAppUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to prepare WhatsApp message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const isDataLoading = shouldFetchDetail && (isStudentLoading || isAttemptsLoading);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b border-border bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span>{tReport("title")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-6">
          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">{tDetails("personalInfoSubtitle")}...</p>
            </div>
          ) : (
            <StudentReportView
              student={student}
              courses={courses}
              exams={exams}
              formatGrade={formatGrade}
              showDownloadButton={false}
            />
          )}
        </div>

        <DialogFooter className="p-4 pb-8 pe-8 border-t border-border bg-muted/20 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {tDetails("invoice.close")}
          </Button>
          <Button
            onClick={handleSendToParent}
            disabled={isSending || isDataLoading}
            className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <WhatsAppIcon className="size-4 fill-white" />
            )}
            {tReport("sendToParent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
