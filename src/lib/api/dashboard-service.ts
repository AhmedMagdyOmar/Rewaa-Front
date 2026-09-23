import { api } from "@/lib/apiClient";
import type { BackendPayment } from "@/types/api-contracts";

export interface DashboardStudentStatistics {
  total: number;
  active_today: number;
  new_today: number;
}

export interface DashboardContentStatistics {
  courses_count: number;
  lessons_count: number;
  lectures_count: number;
  questions_count: number;
  exams_count: number;
}

export interface DashboardStageItem {
  id: number | null;
  academic_year?: number | null;
  name: Record<string, string>;
  students_count: number;
  percentage: number;
}

export interface DashboardEducationalStageDistribution {
  total_students: number;
  stages: DashboardStageItem[];
}

export interface DashboardExamActivityToday {
  data_available: boolean;
  attempts_count: number;
  students_count: number;
  passed_count: number;
  success_rate: number;
  average_grade_percentage: number;
}

export interface DashboardPaymentRequests {
  pending_count: number;
  items: BackendPayment[];
}

export interface DashboardGovernorateItem {
  id: number | null;
  name: Record<string, string>;
  students_count: number;
  percentage: number;
}

export interface DashboardGovernorateDistribution {
  total_students: number;
  top_governorates: DashboardGovernorateItem[];
  remaining: {
    students_count: number;
    percentage: number;
  };
  all_governorates: DashboardGovernorateItem[];
}

export interface BackendDashboardStatistics {
  students: DashboardStudentStatistics;
  content: DashboardContentStatistics;
  educational_stage_distribution: DashboardEducationalStageDistribution;
  exam_activity_today: DashboardExamActivityToday;
  latest_payment_requests: DashboardPaymentRequests;
  governorate_distribution: DashboardGovernorateDistribution;
}

export const dashboardService = {
  /**
   * Fetch live statistics for provider dashboard overview
   */
  async getStatistics(): Promise<BackendDashboardStatistics> {
    return api<BackendDashboardStatistics>({
      url: "/api/dashboard/provider/dashboard/statistics",
      method: "GET",
    });
  },
};
