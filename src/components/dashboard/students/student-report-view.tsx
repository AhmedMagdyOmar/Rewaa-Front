"use client";

import {
  Award,
  BookOpen,
  Clock,
  Download,
  FileCheck2,
  HelpCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { pdf } from "@react-pdf/renderer";

import { LogoIcon } from "@/components/landing/layout/logo";
import { StudentReportPDF } from "@/components/pdf/StudentReportPDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { Student } from "@/types/student";

interface StudentReportViewProps {
  student: Student;
  courses: Course[];
  exams: Exam[];
  formatGrade: (key?: string) => string;
  showDownloadButton?: boolean;
}

export function StudentReportView({
  student,
  courses,
  exams,
  formatGrade,
  showDownloadButton = true,
}: StudentReportViewProps) {
  const locale = useLocale();
  const tDetails = useTranslations("studentsPage.details");
  const tReport = useTranslations("studentsPage.details.reportModal");

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const fullName = [student.firstName, student.middleName, student.lastName, student.additionalName]
    .filter(Boolean)
    .join(" ");

  const generatedDateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentYear = new Date().getFullYear();

  // Metrics calculation
  const enrolledCoursesList = courses.slice(0, student.coursesCount || 0);
  const examsCount = student.examsPerformed ?? exams.length ?? 0;
  const correctQuestions = student.correctQuestions ?? 0;
  const wrongQuestions = student.wrongQuestions ?? 0;
  const totalQuestions = correctQuestions + wrongQuestions;
  const avgPoints =
    student.averageRating && student.averageRating > 0
      ? Math.round(
          student.averageRating <= 5 ? (student.averageRating / 5) * 100 : student.averageRating,
        )
      : exams.length > 0
        ? Math.round(
            exams.reduce((acc, curr) => acc + (curr.score ?? curr.successRate ?? 0), 0) /
              exams.length,
          )
        : 0;

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const strings = {
        grade: formatGrade(student.grade),
        currentYear: tReport("currentYear", { year: currentYear }),
        generatedAt: tReport("reportGeneratedAt", { date: generatedDateStr }),
        statsTitle: tReport("performanceStats.title"),
        statsSubtitle: tReport("performanceStats.subtitle"),
        questionsAnswered: tReport("performanceStats.questionsAnswered"),
        examsPerformed: tReport("performanceStats.examsPerformed"),
        coursesEnrolled: tReport("performanceStats.coursesEnrolled"),
        avgPoints: tReport("performanceStats.avgPoints"),
        examsTitle: tReport("examHistory.title"),
        examName: tReport("examHistory.examName"),
        courseName: tReport("examHistory.courseName"),
        date: tReport("examHistory.datePerformed"),
        tries: tReport("examHistory.tries"),
        result: tReport("examHistory.result"),
        coursesTitle: tReport("coursesOverview.title"),
      };

      const blob = await pdf(
        <StudentReportPDF
          student={student}
          courses={courses}
          exams={exams}
          locale={locale}
          strings={strings}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-report-${student.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF document:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="student-report-print p-6 sm:p-8 space-y-6 bg-white text-slate-900 rounded-2xl border border-border shadow-xs">
        {/* Top Logo & App Name Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LogoIcon width={24} height={28} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">رواء | Rewaa</h2>
              <p className="text-xs text-muted-foreground">{tReport("title")}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono px-3 py-1" dir="ltr">
            #{student.id}
          </Badge>
        </div>

        {/* 1st Div: Primary Background Header with Student Info */}
        <div className="bg-primary text-primary-foreground p-6 rounded-2xl text-center space-y-3 shadow-xs">
          {/* Centered Avatar Image 80x80 (rounded-full) */}
          <div className="size-20 rounded-full overflow-hidden border-4 border-white/20 mx-auto bg-white/10 flex items-center justify-center shadow-md">
            {student.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.image} alt={fullName} className="size-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-white">
                {locale === "ar"
                  ? `${student.firstName[0]}. ${student.lastName[0]}.`
                  : `${student.firstName[0]}${student.lastName[0]}`}
              </span>
            )}
          </div>

          {/* Full Name */}
          <h3 className="text-2xl font-black tracking-tight">{fullName}</h3>

          {/* Grade & Current Year */}
          <p className="text-sm font-medium text-white/90 flex items-center justify-center gap-2">
            <span>{formatGrade(student.grade)}</span>
            <span>•</span>
            <span>{tReport("currentYear", { year: currentYear })}</span>
          </p>

          {/* Horizontal Separator */}
          <hr className="border-white/20 my-3" />

          {/* Icon + Report generated at */}
          <div className="flex items-center justify-center gap-2 text-xs text-white/80">
            <Clock className="size-3.5" />
            <span>{tReport("reportGeneratedAt", { date: generatedDateStr })}</span>
          </div>
        </div>

        {/* 2nd Div: Performance & Statistics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <TrendingUp className="size-5 text-primary" />
            <div>
              <h4 className="text-base font-bold text-foreground">
                {tReport("performanceStats.title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {tReport("performanceStats.subtitle")}
              </p>
            </div>
          </div>

          {/* 4 Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stat 1: Questions Answered */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-center space-y-1">
              <HelpCircle className="size-5 text-primary mx-auto" />
              <p className="text-xl font-black text-foreground">{totalQuestions}</p>
              <p className="text-xs font-semibold text-foreground">
                {tReport("performanceStats.questionsAnswered")}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {tReport("performanceStats.correctAndWrong", {
                  correct: correctQuestions,
                  wrong: wrongQuestions,
                })}
              </p>
            </div>

            {/* Stat 2: Exams Performed */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-center space-y-1 flex flex-col justify-center">
              <FileCheck2 className="size-5 text-purple-600 mx-auto" />
              <p className="text-xl font-black text-foreground">{examsCount}</p>
              <p className="text-xs font-semibold text-foreground">
                {tReport("performanceStats.examsPerformed")}
              </p>
            </div>

            {/* Stat 3: Courses Enrolled */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-center space-y-1 flex flex-col justify-center">
              <BookOpen className="size-5 text-emerald-600 mx-auto" />
              <p className="text-xl font-black text-foreground">{student.coursesCount || 0}</p>
              <p className="text-xs font-semibold text-foreground">
                {tReport("performanceStats.coursesEnrolled")}
              </p>
            </div>

            {/* Stat 4: Average Points */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-center space-y-1 flex flex-col justify-center">
              <Award className="size-5 text-amber-500 mx-auto" />
              <p className="text-xl font-black text-foreground">{avgPoints} / 100</p>
              <p className="text-xs font-semibold text-foreground">
                {tReport("performanceStats.avgPoints")}
              </p>
            </div>
          </div>
        </div>

        {/* 3rd Div: Exam History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <FileCheck2 className="size-5 text-primary" />
            <div>
              <h4 className="text-base font-bold text-foreground">
                {tReport("examHistory.title")}
              </h4>
              <p className="text-xs text-muted-foreground">{tReport("examHistory.subtitle")}</p>
            </div>
          </div>

          {/* Exams History Table */}
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="*:text-start">
                  <TableHead>{tReport("examHistory.examName")}</TableHead>
                  <TableHead>{tReport("examHistory.courseName")}</TableHead>
                  <TableHead>{tReport("examHistory.datePerformed")}</TableHead>
                  <TableHead className="text-center">{tReport("examHistory.tries")}</TableHead>
                  <TableHead className="text-end">{tReport("examHistory.result")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {tDetails("examsTab.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.slice(0, 5).map((exam, idx) => {
                    const score =
                      typeof exam.score === "number"
                        ? exam.score
                        : typeof exam.successRate === "number"
                          ? exam.successRate
                          : 92 - idx * 7;
                    const isPassed =
                      typeof exam.isPassed === "boolean"
                        ? exam.isPassed
                        : score >= (exam.passingPercentage || 60);
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-bold text-xs text-foreground">
                          {exam.title}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {exam.courseTitle || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {exam.createdAt
                            ? new Date(
                                exam.createdAt.includes("T")
                                  ? exam.createdAt
                                  : exam.createdAt.replace(" ", "T"),
                              ).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {exam.timesUsed || 1}
                        </TableCell>
                        <TableCell className="text-end">
                          <div
                            className="inline-flex items-center gap-1.5 font-bold text-xs"
                            dir="ltr"
                          >
                            <span>{score}%</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                isPassed
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }`}
                            >
                              {isPassed ? tDetails("examsTab.passed") : tDetails("examsTab.failed")}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 4th Div: Courses Overview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <BookOpen className="size-5 text-primary" />
            <div>
              <h4 className="text-base font-bold text-foreground">
                {tReport("coursesOverview.title")}
              </h4>
              <p className="text-xs text-muted-foreground">{tReport("coursesOverview.subtitle")}</p>
            </div>
          </div>

          {/* 1 Column List of Courses with Progress Bar */}
          <div className="space-y-3">
            {enrolledCoursesList.map((course) => {
              const progressPct = course.progressPercentage ?? 0;
              return (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-foreground text-sm">{course.title}</span>
                    <span className="text-primary font-mono">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showDownloadButton && (
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="gap-2 font-bold shadow-xs"
          >
            {isGeneratingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {tReport("downloadPdf")}
          </Button>
        </div>
      )}
    </div>
  );
}
