import { StudentTeacherDetailsClient } from "@/components/dashboard/student/StudentTeacherDetailsClient";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function StudentTeacherDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return <StudentTeacherDetailsClient teacherId={id} />;
}
