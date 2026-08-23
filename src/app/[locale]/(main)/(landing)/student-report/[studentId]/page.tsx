import { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Loader2 } from "lucide-react";
import { StudentReportClient } from "@/components/public-student-report/student-report-client";

interface PageProps {
  params: Promise<{
    locale: string;
    studentId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "publicStudentReport" });

  return {
    title: t("pageTitle"),
    description: t("verificationSubtitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function StudentReportPage({ params }: PageProps) {
  const { studentId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <StudentReportClient studentId={studentId} />
    </Suspense>
  );
}
