import { ExamSubmissionsClient } from "@/components/dashboard/exams/submissions/exam-submissions-client";

interface ExamSubmissionsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function ExamSubmissionsPage({ params }: ExamSubmissionsPageProps) {
  const { id } = await params;

  return <ExamSubmissionsClient examId={id} />;
}
