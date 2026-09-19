import { ExamStatsClient } from "@/components/dashboard/exams/stats/exam-stats-client";

interface ExamDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { id } = await params;

  return <ExamStatsClient examId={id} />;
}
