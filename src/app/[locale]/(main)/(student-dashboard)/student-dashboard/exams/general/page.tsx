import { redirect } from "@/i18n/routing";

export default async function StudentGeneralExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/student-dashboard/exams?scope=general", locale });
}
