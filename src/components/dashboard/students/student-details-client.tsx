/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit2,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

import { DashboardCard } from "@/components/dashboard/overview/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneLink, WhatsAppIcon, getWhatsAppUrl } from "@/components/ui/phone-link";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProviderExamAttempts } from "@/hooks/use-exams";
import {
  useAdjustStudentWallet,
  useStudentDetail,
  useStudentTransactions,
  useStudentWallet,
} from "@/hooks/use-students";
import { adaptBackendExamAttemptToExam } from "@/lib/adapters/exam-adapters";
import {
  adaptBackendStudentToUI,
  adaptBackendWalletTransactionToUI,
} from "@/lib/adapters/student-adapter";
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { RegistrationType, Student, StudentTransaction, TransactionType } from "@/types/student";
import { toast } from "sonner";
import { BalanceTransactionDialog } from "./balance-transaction-dialog";
import { StudentInvoiceModal } from "./student-invoice-modal";
import { StudentReportModal } from "./student-report-modal";

interface StudentDetailsClientProps {
  studentId: string;
}

const REGISTRATION_TYPE_BADGES: Record<RegistrationType, string> = {
  center: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  online: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  hybrid: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  external: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

function formatDate(iso?: string, locale: string = "ar") {
  if (!iso) return "-";
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function StudentDetailsClient({ studentId }: StudentDetailsClientProps) {
  const locale = useLocale();

  const t = useTranslations("studentsPage");
  const tDetails = useTranslations("studentsPage.details");
  const tModal = useTranslations("studentsPage.transactionModal");
  const tGrades = useTranslations("courses.new.grades");

  const { data: backendStudent, isLoading } = useStudentDetail(studentId);
  const { data: walletData } = useStudentWallet(studentId);
  const { data: txData } = useStudentTransactions(studentId);
  const { data: attemptsData } = useProviderExamAttempts({ student_id: studentId });
  const adjustWalletMutation = useAdjustStudentWallet();

  const student: Student | null = React.useMemo(() => {
    if (!backendStudent) return null;
    const base = adaptBackendStudentToUI(backendStudent, locale);
    if (walletData && typeof walletData.balance !== "undefined") {
      const num = Number(walletData.balance);
      base.balance = isNaN(num) ? 0 : num;
    }
    return base;
  }, [backendStudent, walletData, locale]);

  const transactions: StudentTransaction[] = React.useMemo(() => {
    if (!txData?.transactions) return [];
    return txData.transactions.map(adaptBackendWalletTransactionToUI);
  }, [txData]);

  const studentExams = React.useMemo<Exam[]>(() => {
    if (!attemptsData?.attempts || attemptsData.attempts.length === 0) {
      return [];
    }
    return attemptsData.attempts.map((attempt) =>
      adaptBackendExamAttemptToExam(attempt, locale, student?.grade || ""),
    );
  }, [attemptsData, locale, student?.grade]);

  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [student?.image]);

  const [isTransactionOpen, setIsTransactionOpen] = React.useState(false);
  const [selectedInvoiceTransaction, setSelectedInvoiceTransaction] =
    React.useState<StudentTransaction | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);

  const formatGrade = React.useCallback(
    (key?: string) => {
      if (!key) return "";
      return tGrades.has(key as Parameters<typeof tGrades.has>[0])
        ? tGrades(key as Parameters<typeof tGrades>[0])
        : key;
    },
    [tGrades],
  );

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        {tDetails("personalInfoSubtitle")}...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Users className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{tDetails("notFoundTitle")}</h2>
        <p className="text-sm text-muted-foreground">{tDetails("notFoundDesc")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/students`}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {tDetails("backToStudents")}
          </Link>
        </Button>
      </div>
    );
  }

  const fullName = [student.firstName, student.middleName, student.lastName, student.additionalName]
    .filter(Boolean)
    .join(" ");

  const regTypeLabel = t(
    `registrationTypes.${student.registrationType}` as Parameters<typeof t>[0],
  );

  const enrolledCoursesList =
    backendStudent?.enrolled_courses && backendStudent.enrolled_courses.length > 0
      ? backendStudent.enrolled_courses.map((ec) => ({
          id: String(ec.id),
          title:
            typeof ec.title === "string"
              ? ec.title
              : ec.title?.[locale] || ec.title?.ar || ec.title?.en || `Course #${ec.id}`,
          cover_image: ec.cover_image,
          grade: student.grade,
          teacherName: "",
          progressPercentage: ec.progress?.percentage ?? 0,
          completedLessons: ec.progress?.completed_lessons ?? 0,
          totalLessons: ec.progress?.total_lessons ?? 0,
        }))
      : [];

  const studentCoursesForReport: Course[] =
    backendStudent?.enrolled_courses && backendStudent.enrolled_courses.length > 0
      ? backendStudent.enrolled_courses.map((ec) => ({
          id: String(ec.id),
          title:
            typeof ec.title === "string"
              ? ec.title
              : ec.title?.[locale] || ec.title?.ar || ec.title?.en || `Course #${ec.id}`,
          coverImage: ec.cover_image || "",
          description: "",
          subject: "",
          grade: student?.grade || "",
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
        }))
      : [];

  // Performance calculation numbers derived from real student record and exam attempts
  const examsCount =
    student.examsPerformed && student.examsPerformed > 0
      ? student.examsPerformed
      : studentExams.length;
  const avgScore =
    student.averageRating && student.averageRating > 0
      ? Math.round(
          student.averageRating <= 5 ? (student.averageRating / 5) * 100 : student.averageRating,
        )
      : studentExams.length > 0
        ? Math.round(
            studentExams.reduce((acc, curr) => acc + (curr.score ?? curr.successRate ?? 0), 0) /
              studentExams.length,
          )
        : 0;

  const attempts = attemptsData?.attempts || [];
  const summaryCorrect = attempts.reduce(
    (acc, a) => acc + (a.result_summary?.correct_answers_count ?? 0),
    0,
  );
  const summaryIncorrect = attempts.reduce(
    (acc, a) => acc + (a.result_summary?.incorrect_answers_count ?? 0),
    0,
  );
  const hasAttemptSummaries = attempts.some((a) => a.result_summary != null);

  const correctQuestions = hasAttemptSummaries ? summaryCorrect : (student.correctQuestions ?? 0);
  const wrongQuestions = hasAttemptSummaries ? summaryIncorrect : (student.wrongQuestions ?? 0);
  const totalQuestions = correctQuestions + wrongQuestions;
  const correctPct = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  const handleTransactionSubmit = ({
    type,
    amount,
    notes,
  }: {
    type: TransactionType;
    amount: number;
    notes?: string;
  }) => {
    if (!student) return;
    const direction = type === "withdraw" ? "debit" : "credit";
    const reason = type === "deposit" ? "admin_top_up" : "adjustment";
    const fundingSource = type === "deposit" ? "cash" : undefined;
    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });

    adjustWalletMutation.mutate(
      {
        studentId: student.id,
        data: {
          direction,
          amount,
          reason,
          funding_source: fundingSource,
          notes,
          idempotency_key: idempotencyKey,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar" ? "تم تعديل رصيد الطالب بنجاح" : "Student balance updated successfully",
          );
          setIsTransactionOpen(false);
        },
        onError: (err: unknown) => {
          const validationErrors =
            (err as { validationErrors?: unknown })?.validationErrors ||
            (err as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors).flat()[0] as string;
            if (firstError) {
              toast.error(firstError);
              return;
            }
          }
          const message =
            (err as { apiMessage?: string })?.apiMessage ||
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as { message?: string })?.message ||
            (locale === "ar"
              ? "حدث خطأ أثناء تعديل الرصيد"
              : "An error occurred while updating balance");
          toast.error(message);
        },
      },
    );
  };

  const handleOpenInvoice = (tx: StudentTransaction) => {
    setSelectedInvoiceTransaction(tx);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: STUDENT INFO BANNER / HEADER CARD
          - Image/Avatar
          - Full Name
          - Subtitle: Grade + Joined Date + Location
          - CTAs: Edit, Manage Balance, Send Message
      ────────────────────────────────────────────────────────────────────────────── */}
      <DashboardCard className="overflow-hidden border-border/80 shadow-xs">
        <div className="p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-linear-to-r from-primary/5 via-card to-card">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
            {/* Standard Round Back Button Header Navigation Component */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
              >
                <Link href={`/${locale}/dashboard/students`}>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>

            {/* Avatar / Image Div */}
            <div className="relative size-20 sm:size-24 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center shadow-xs">
              {student.image && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.image}
                  alt={fullName}
                  className="size-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-2xl font-black text-primary">
                  {locale === "ar"
                    ? `${student.firstName[0] || ""}. ${student.lastName[0] || ""}.`
                    : `${student.firstName[0] || ""}${student.lastName[0] || ""}`}
                </span>
              )}
            </div>

            {/* Student Meta Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {fullName}
                </h1>
                {student.status === "suspended" && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold"
                  >
                    {t("statuses.suspended")}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${REGISTRATION_TYPE_BADGES[student.registrationType]}`}
                >
                  {regTypeLabel}
                </Badge>
              </div>

              {/* Subtitle: Grade + Joined Date + Country & State */}
              <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <GraduationCap className="size-3.5 text-primary" />
                  {formatGrade(student.grade)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {tDetails("joinedIn", { date: formatDate(student.createdAt, locale) })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {student.country} - {student.state}
                </span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-muted-foreground">
                <PhoneLink
                  phone={student.phoneNumber}
                  className="flex items-center gap-1 text-muted-foreground hover:text-emerald-600"
                  title={locale === "ar" ? "هاتف الطالب (واتساب)" : "Student Phone (WhatsApp)"}
                >
                  <WhatsAppIcon className="size-3.5" />
                  <span dir="ltr">{student.phoneNumber}</span>
                </PhoneLink>
                {student.parentPhoneNumber && (
                  <PhoneLink
                    phone={student.parentPhoneNumber}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-600 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40"
                    title={
                      locale === "ar" ? "هاتف ولي الأمر (واتساب)" : "Guardian Phone (WhatsApp)"
                    }
                  >
                    <UserCheck className="size-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-medium text-foreground/80">
                      {locale === "ar" ? "ولي الأمر:" : "Guardian:"}
                    </span>
                    <WhatsAppIcon className="size-3 text-emerald-600 shrink-0" />
                    <span dir="ltr">{student.parentPhoneNumber}</span>
                  </PhoneLink>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="size-3 text-muted-foreground" />
                  {student.email}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center sm:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
            {/* Edit Button */}
            <Button asChild variant="outline" size="sm" className="gap-2 font-semibold">
              <Link href={`/${locale}/dashboard/students/${student.id}/edit`}>
                <Edit2 className="size-3.5" />
                <span>{tDetails("editStudent")}</span>
              </Link>
            </Button>

            {/* Generate Report Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsReportOpen(true)}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
            >
              <FileText className="size-3.5" />
              <span>{tDetails("generateReport")}</span>
            </Button>

            {/* Manage Balance Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTransactionOpen(true)}
              className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 font-semibold"
            >
              <Wallet className="size-3.5" />
              <span>{tDetails("manageBalance")}</span>
            </Button>

            {/* Send Message CTA (Links to WhatsApp) */}
            <Button asChild size="sm" variant="default" className="gap-2 font-semibold shadow-xs">
              <a
                href={getWhatsAppUrl(student.phoneNumber)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="size-3.5" />
                <span>{tDetails("sendMessage")}</span>
              </a>
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: METRICS & STATS DIV
          - Average score in exams
          - Current balance
          - Number of courses enrolled in
          - Number of exams performed
          - Performance in questions: progress bar (green correct, red wrong)
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Avg Score */}
        <DashboardCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-card hover:border-primary/40 transition-colors">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black text-foreground">{avgScore}%</p>
            <p className="text-xs text-muted-foreground font-medium">{tDetails("avgExamScore")}</p>
          </div>
        </DashboardCard>

        {/* Metric 2: Current Balance */}
        <DashboardCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-linear-to-br from-emerald-500/10 via-card to-card border-emerald-500/20">
          <div className="size-11 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black text-foreground" dir="ltr">
              {student.balance ?? 0} {tDetails("currency")}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {tDetails("currentBalance")}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 3: Courses Count */}
        <DashboardCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-card hover:border-primary/40 transition-colors">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black text-foreground">{student.coursesCount || 0}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {tDetails("enrolledCoursesCount")}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 4: Exams Performed */}
        <DashboardCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-card hover:border-primary/40 transition-colors">
          <div className="size-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black text-foreground">{examsCount}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {tDetails("examsPerformed")}
            </p>
          </div>
        </DashboardCard>

        {/* Metric 5: Performance in Questions (Green / Red Progress Bar) */}
        <DashboardCard className="p-4 space-y-2 bg-card sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">{tDetails("questionPerformance")}</span>
            <span className="font-mono text-muted-foreground">
              {totalQuestions > 0 ? `${correctPct}%` : "-"}
            </span>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            {totalQuestions > 0 ? (
              <>
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${correctPct}%` }}
                  title={`${correctQuestions} ${tDetails("correctQuestions")}`}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${100 - correctPct}%` }}
                  title={`${wrongQuestions} ${tDetails("wrongQuestions")}`}
                />
              </>
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              {correctQuestions} {tDetails("correctQuestions")}
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <span className="size-2 rounded-full bg-rose-500 inline-block" />
              {wrongQuestions} {tDetails("wrongQuestions")}
            </span>
          </div>
        </DashboardCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: TAB SELECTOR DIV
          - Courses
          - Exams
          - Billing History
      ────────────────────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="courses" className="rounded-lg text-xs sm:text-sm font-bold">
            <BookOpen className="size-4 me-2 hidden sm:inline-block" />
            {tDetails("tabs.courses")}
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg text-xs sm:text-sm font-bold">
            <FileCheck2 className="size-4 me-2 hidden sm:inline-block" />
            {tDetails("tabs.exams")}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg text-xs sm:text-sm font-bold">
            <Wallet className="size-4 me-2 hidden sm:inline-block" />
            {tDetails("tabs.billingHistory")}
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: COURSES ───────────────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-4">
          {enrolledCoursesList.length === 0 ? (
            <DashboardCard className="p-8 text-center text-muted-foreground border-dashed">
              {tDetails("noCoursesEnrolled")}
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCoursesList.map((course, idx) => {
                const progressPct = course.progressPercentage ?? 0;
                const courseExamsCount = 4 - idx;
                const courseCorrectAnswers = 35 - idx * 5;

                return (
                  <DashboardCard
                    key={course.id}
                    className="p-5 space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {formatGrade(course.grade)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                          #{course.id}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-foreground text-base line-clamp-1">
                          {course.title}
                        </h4>
                        {course.teacherName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {course.teacherName}
                          </p>
                        )}
                      </div>

                      {/* Course Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">
                            {tDetails("coursesTab.progress")}
                          </span>
                          <span className="text-primary">{progressPct}%</span>
                        </div>
                        <Progress value={progressPct} className="h-2" />
                      </div>
                    </div>

                    {/* Stats & Joined Date Under Course Card */}
                    <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="size-3.5 text-primary" />
                          {tDetails("coursesTab.examsPerformed", { count: courseExamsCount })}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3.5" />
                          {tDetails("coursesTab.correctQuestions", { count: courseCorrectAnswers })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>{tDetails("coursesTab.joinedDate")}:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(student.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </DashboardCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: EXAMS ────────────────────────────────────────────────────── */}
        <TabsContent value="exams" className="space-y-4">
          {studentExams.length === 0 ? (
            <DashboardCard className="p-8 text-center text-muted-foreground border-dashed">
              {tDetails("examsTab.empty")}
            </DashboardCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentExams.map((exam) => {
                const score = exam.successRate;
                const isPassed = score >= (exam.passingPercentage || 60);
                return (
                  <DashboardCard
                    key={exam.id}
                    className="p-4 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
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
                      <span className="text-xs text-muted-foreground">
                        {formatDate(exam.createdAt, locale)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-sm line-clamp-1">
                        {exam.title}
                      </h4>
                      {exam.courseTitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.courseTitle}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{tDetails("examsTab.score")}</span>
                        <span
                          className={
                            isPassed ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"
                          }
                        >
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  </DashboardCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: BILLING HISTORY ───────────────────────────────────────────── */}
        <TabsContent value="billing" className="space-y-4">
          <DashboardCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-30">{tDetails("billingTab.id")}</TableHead>
                    <TableHead>{tDetails("billingTab.type")}</TableHead>
                    <TableHead>{tDetails("billingTab.amount")}</TableHead>
                    <TableHead>{tDetails("billingTab.date")}</TableHead>
                    <TableHead>{tDetails("billingTab.notes")}</TableHead>
                    <TableHead className="text-end">{tDetails("billingTab.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {tDetails("billingTab.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isDeposit = tx.type === "deposit" || tx.type === "refund";
                      return (
                        <TableRow key={tx.id} className="hover:bg-muted/20">
                          <TableCell className="font-mono font-medium text-xs" dir="ltr">
                            #{tx.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                isDeposit
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}
                            >
                              {tModal(`types.${tx.type}` as Parameters<typeof tModal>[0])}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-foreground" dir="ltr">
                            {isDeposit ? "+" : "-"}
                            {tx.amount} {tDetails("currency")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(tx.createdAt, locale)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-50 truncate">
                            {tx.notes || "-"}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenInvoice(tx)}
                                className="h-8 gap-1 text-xs font-semibold hover:text-primary"
                              >
                                <Eye className="size-3.5" />
                                <span>{tDetails("billingTab.viewInvoice")}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>

      {/* Balance Transaction Dialog */}
      <BalanceTransactionDialog
        studentName={fullName}
        studentId={student.id}
        currentBalance={student.balance ?? 0}
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onConfirm={handleTransactionSubmit}
      />

      {/* Printable Invoice Modal */}
      {selectedInvoiceTransaction && (
        <StudentInvoiceModal
          student={student}
          transaction={selectedInvoiceTransaction}
          isOpen={isInvoiceOpen}
          onClose={() => {
            setIsInvoiceOpen(false);
            setSelectedInvoiceTransaction(null);
          }}
        />
      )}

      {/* Student Comprehensive Report Modal */}
      <StudentReportModal
        student={student}
        courses={studentCoursesForReport}
        exams={studentExams}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        formatGrade={formatGrade}
      />
    </div>
  );
}
