import { ExamFormClient } from "@/components/dashboard/exams/exam-form-client";

interface EditExamPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { id } = await params;

  return <ExamFormClient mode="edit" examId={id} />;
}
