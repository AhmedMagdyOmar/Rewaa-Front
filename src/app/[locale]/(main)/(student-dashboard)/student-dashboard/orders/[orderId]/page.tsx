import { StudentOrderDetailClient } from "@/components/dashboard/student/orders/StudentOrderDetailClient";

interface StudentOrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function StudentOrderDetailPage({ params }: StudentOrderDetailPageProps) {
  const { orderId } = await params;

  return <StudentOrderDetailClient orderId={orderId} />;
}
