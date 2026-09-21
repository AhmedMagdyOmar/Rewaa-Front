import { api } from "@/lib/apiClient";
import type {
  AdjustWalletData,
  BackendStudent,
  BackendStudentOptions,
  BackendWalletTransaction,
  StudentFilterParams,
  StudentsListResponse,
  StoreStudentData,
  UpdateStudentData,
  WalletTransactionsResponse,
  ApiPaginationMeta,
} from "@/types/api-contracts";

function buildStudentFormData(
  data: StoreStudentData | UpdateStudentData,
  method?: "PUT",
): FormData {
  const formData = new FormData();

  if (method) {
    formData.append("_method", method);
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "avatar" && value instanceof File) {
      formData.append("avatar", value);
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export const studentsService = {
  async getStudents(params?: StudentFilterParams): Promise<StudentsListResponse> {
    const res = await api<
      | { students: BackendStudent[]; pagination: ApiPaginationMeta }
      | {
          data: BackendStudent[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendStudent[]
    >({
      url: "/api/dashboard/provider/students",
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        students: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("students" in res) {
      return {
        students: res.students,
        pagination: res.pagination,
      };
    }

    return {
      students: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },

  async getStudentOptions(countryId?: number | string): Promise<BackendStudentOptions> {
    const res = await api<BackendStudentOptions | { options: BackendStudentOptions }>({
      url: "/api/dashboard/provider/students/options",
      method: "GET",
      params: countryId ? { country_id: countryId } : undefined,
    });

    if ("options" in res) {
      return res.options;
    }
    return res as BackendStudentOptions;
  },

  async getStudent(id: number | string): Promise<BackendStudent> {
    const res = await api<{ student: BackendStudent } | BackendStudent>({
      url: `/api/dashboard/provider/students/${id}`,
      method: "GET",
    });

    if ("student" in res) {
      return res.student;
    }
    return res as BackendStudent;
  },

  async createStudent(data: StoreStudentData): Promise<BackendStudent> {
    const formData = buildStudentFormData(data);
    const res = await api<{ student: BackendStudent } | BackendStudent>({
      url: "/api/dashboard/provider/students",
      method: "POST",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    if ("student" in res) {
      return res.student;
    }
    return res as BackendStudent;
  },

  async updateStudent(id: number | string, data: UpdateStudentData): Promise<BackendStudent> {
    const formData = buildStudentFormData(data, "PUT");
    const res = await api<{ student: BackendStudent } | BackendStudent>({
      url: `/api/dashboard/provider/students/${id}`,
      method: "POST",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    if ("student" in res) {
      return res.student;
    }
    return res as BackendStudent;
  },

  async deleteStudent(id: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/students/${id}`,
      method: "DELETE",
    });
  },

  async updateStudentStatus(
    id: number | string,
    status: "active" | "suspended",
  ): Promise<BackendStudent> {
    const res = await api<{ student: BackendStudent } | BackendStudent>({
      url: `/api/dashboard/provider/students/${id}/status`,
      method: "PATCH",
      data: { status },
    });

    if ("student" in res) {
      return res.student;
    }
    return res as BackendStudent;
  },

  async getStudentWallet(
    id: number | string,
  ): Promise<{ balance: number | string; currency_code?: string }> {
    const res = await api<
      | { wallet: { balance: number | string; currency_code?: string } }
      | { balance: number | string; currency_code?: string }
    >({
      url: `/api/dashboard/provider/students/${id}/wallet`,
      method: "GET",
    });

    if ("wallet" in res) {
      return res.wallet;
    }
    return res as { balance: number | string; currency_code?: string };
  },

  async getStudentTransactions(
    id: number | string,
    params?: Record<string, unknown>,
  ): Promise<WalletTransactionsResponse> {
    const res = await api<
      | { transactions: BackendWalletTransaction[]; pagination: ApiPaginationMeta }
      | {
          data: BackendWalletTransaction[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendWalletTransaction[]
    >({
      url: `/api/dashboard/provider/students/${id}/wallet/transactions`,
      method: "GET",
      params,
    });

    if (Array.isArray(res)) {
      return {
        transactions: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("transactions" in res) {
      return {
        transactions: res.transactions,
        pagination: res.pagination,
      };
    }

    return {
      transactions: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },

  async adjustWallet(
    id: number | string,
    data: AdjustWalletData,
  ): Promise<BackendWalletTransaction> {
    const res = await api<{ transaction: BackendWalletTransaction } | BackendWalletTransaction>({
      url: `/api/dashboard/provider/students/${id}/wallet/adjustments`,
      method: "POST",
      data,
    });

    if ("transaction" in res) {
      return res.transaction;
    }
    return res as BackendWalletTransaction;
  },
};
