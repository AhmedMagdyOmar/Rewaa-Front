import { ExamGradingClient } from "@/components/dashboard/exams/grading/exam-grading-client";

interface ExamGradingPageProps {
  params: Promise<{
    locale: string;
    id: string;
    attemptId: string;
  }>;
}

export default async function ExamGradingPage({ params }: ExamGradingPageProps) {
  const { id, attemptId } = await params;

  return <ExamGradingClient examId={id} attemptId={attemptId} />;
}
