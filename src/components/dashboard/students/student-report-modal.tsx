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
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { Student } from "@/types/student";
import { StudentReportView } from "./student-report-view";

interface StudentReportModalProps {
  student: Student;
  courses: Course[];
  exams: Exam[];
  isOpen: boolean;
  onClose: () => void;
  formatGrade: (key?: string) => string;
}

export function StudentReportModal({
  student,
  courses,
  exams,
  isOpen,
  onClose,
  formatGrade,
}: StudentReportModalProps) {
  const locale = useLocale();
  const tDetails = useTranslations("studentsPage.details");
  const tReport = useTranslations("studentsPage.details.reportModal");

  const [isSending, setIsSending] = React.useState(false);

  const fullName = [student.firstName, student.middleName, student.lastName, student.additionalName]
    .filter(Boolean)
    .join(" ");

  const currentYear = new Date().getFullYear();
  const avgPoints = 88; // out of 100

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
          <StudentReportView
            student={student}
            courses={courses}
            exams={exams}
            formatGrade={formatGrade}
            showDownloadButton={false}
          />
        </div>

        <DialogFooter className="p-4 pb-8 pe-8 border-t border-border bg-muted/20 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {tDetails("invoice.close")}
          </Button>
          <Button
            onClick={handleSendToParent}
            disabled={isSending}
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
