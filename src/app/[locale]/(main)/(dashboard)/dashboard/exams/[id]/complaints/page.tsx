import { ExamComplaintsClient } from "@/components/dashboard/exams/complaints/exam-complaints-client";

interface ExamComplaintsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function ExamComplaintsPage({ params }: ExamComplaintsPageProps) {
  const { id } = await params;

  return <ExamComplaintsClient examId={id} />;
}
