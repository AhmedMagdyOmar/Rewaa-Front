import { api } from "@/lib/apiClient";
import type {
  ActivationCodeGroupsListResponse,
  ActivationCodesListResponse,
  ApiPaginationMeta,
  BackendActivationCode,
  BackendActivationCodeGroup,
} from "@/types/api-contracts";

export interface CodeGroupFilterParams {
  search?: string;
  course_id?: number | string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface CodeFilterParams {
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface StoreCodeGroupData {
  course_id: number | string;
  price: number;
  quantity: number;
  prefix?: string;
  expires_at: string;
}

export interface StoreCodeData {
  code?: string;
  price: number;
  expires_at: string;
}

export interface BulkStoreCodesData {
  quantity: number;
  price: number;
  expires_at: string;
}

export interface UpdateCodeData {
  code: string;
  price: number;
  status: string;
  expires_at: string;
}

const groupSortMap: Record<string, string> = {
  latest: "latest",
  newest: "latest",
  oldest: "oldest",
  price_desc: "price_desc",
  priceDesc: "price_desc",
  price_asc: "price_asc",
  priceAsc: "price_asc",
  codes_desc: "codes_desc",
  totalCodesDescSort: "codes_desc",
};

const codeSortMap: Record<string, string> = {
  latest: "latest",
  newest: "latest",
  oldest: "oldest",
  price_desc: "price_desc",
  priceDesc: "price_desc",
  costDesc: "price_desc",
  price_asc: "price_asc",
  priceAsc: "price_asc",
  costAsc: "price_asc",
};

export const activationCodesService = {
  async getCodeGroups(params?: CodeGroupFilterParams): Promise<ActivationCodeGroupsListResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.course_id && params.course_id !== "all") {
      const parsedId = Number(params.course_id);
      if (!isNaN(parsedId)) {
        queryParams.course_id = parsedId;
      }
    }
    if (params?.sort) {
      queryParams.sort = groupSortMap[params.sort] || "latest";
    }
    if (params?.page) queryParams.page = params.page;
    if (params?.per_page) queryParams.per_page = params.per_page;

    const res = await api<
      | {
          groups: BackendActivationCodeGroup[];
          pagination: ApiPaginationMeta;
          statistics?: {
            total_codes: number;
            available_codes: number;
            sold_codes: number;
            used_codes: number;
          };
        }
      | {
          data: BackendActivationCodeGroup[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
          statistics?: {
            total_codes: number;
            available_codes: number;
            sold_codes: number;
            used_codes: number;
          };
        }
      | BackendActivationCodeGroup[]
    >({
      url: "/api/dashboard/provider/activation-code-groups",
      method: "GET",
      params: queryParams,
    });

    if (Array.isArray(res)) {
      return {
        groups: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("groups" in res) {
      return {
        groups: res.groups,
        pagination: res.pagination,
        statistics: res.statistics,
      };
    }

    return {
      groups: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
      statistics: res.statistics,
    };
  },

  async getCodeGroup(groupId: number | string): Promise<BackendActivationCodeGroup> {
    const res = await api<{ group: BackendActivationCodeGroup } | BackendActivationCodeGroup>({
      url: `/api/dashboard/provider/activation-code-groups/${groupId}`,
      method: "GET",
    });

    if ("group" in res) {
      return res.group;
    }
    return res as BackendActivationCodeGroup;
  },

  async createCodeGroup(data: StoreCodeGroupData): Promise<BackendActivationCodeGroup> {
    const res = await api<{ group: BackendActivationCodeGroup } | BackendActivationCodeGroup>({
      url: "/api/dashboard/provider/activation-code-groups",
      method: "POST",
      data,
    });

    if ("group" in res) {
      return res.group;
    }
    return res as BackendActivationCodeGroup;
  },

  async getGroupCodes(
    groupId: number | string,
    params?: CodeFilterParams,
  ): Promise<ActivationCodesListResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== "all") queryParams.status = params.status;
    if (params?.sort) {
      queryParams.sort = codeSortMap[params.sort] || "latest";
    }
    if (params?.page) queryParams.page = params.page;
    if (params?.per_page) queryParams.per_page = params.per_page;

    const res = await api<
      | { codes: BackendActivationCode[]; pagination: ApiPaginationMeta }
      | {
          data: BackendActivationCode[];
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        }
      | BackendActivationCode[]
    >({
      url: `/api/dashboard/provider/activation-code-groups/${groupId}/codes`,
      method: "GET",
      params: queryParams,
    });

    if (Array.isArray(res)) {
      return {
        codes: res,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: res.length,
          total: res.length,
        },
      };
    }

    if ("codes" in res) {
      return {
        codes: res.codes,
        pagination: res.pagination,
      };
    }

    return {
      codes: res.data ?? [],
      pagination: {
        current_page: res.current_page ?? 1,
        last_page: res.last_page ?? 1,
        per_page: res.per_page ?? 10,
        total: res.total ?? 0,
      },
    };
  },

  async createCode(groupId: number | string, data: StoreCodeData): Promise<BackendActivationCode> {
    const res = await api<{ code: BackendActivationCode } | BackendActivationCode>({
      url: `/api/dashboard/provider/activation-code-groups/${groupId}/codes`,
      method: "POST",
      data,
    });

    if ("code" in res && typeof res.code === "object" && res.code !== null) {
      return res.code as BackendActivationCode;
    }
    return res as BackendActivationCode;
  },

  async bulkStoreCodes(
    groupId: number | string,
    data: BulkStoreCodesData,
  ): Promise<BackendActivationCodeGroup> {
    const res = await api<{ group: BackendActivationCodeGroup } | BackendActivationCodeGroup>({
      url: `/api/dashboard/provider/activation-code-groups/${groupId}/codes/bulk`,
      method: "POST",
      data,
    });

    if ("group" in res) {
      return res.group;
    }
    return res as BackendActivationCodeGroup;
  },

  async generateCode(groupId: number | string): Promise<{ code: string }> {
    return api<{ code: string }>({
      url: `/api/dashboard/provider/activation-code-groups/${groupId}/generate-code`,
      method: "POST",
    });
  },

  async getCode(codeId: number | string): Promise<BackendActivationCode> {
    const res = await api<{ code: BackendActivationCode } | BackendActivationCode>({
      url: `/api/dashboard/provider/activation-codes/${codeId}`,
      method: "GET",
    });

    if ("code" in res && typeof res.code === "object" && res.code !== null) {
      return res.code as BackendActivationCode;
    }
    return res as BackendActivationCode;
  },

  async updateCode(codeId: number | string, data: UpdateCodeData): Promise<BackendActivationCode> {
    const res = await api<{ code: BackendActivationCode } | BackendActivationCode>({
      url: `/api/dashboard/provider/activation-codes/${codeId}`,
      method: "PUT",
      data,
    });

    if ("code" in res && typeof res.code === "object" && res.code !== null) {
      return res.code as BackendActivationCode;
    }
    return res as BackendActivationCode;
  },

  async deleteCode(codeId: number | string): Promise<{ message: string }> {
    return api<{ message: string }>({
      url: `/api/dashboard/provider/activation-codes/${codeId}`,
      method: "DELETE",
    });
  },

  async markCodeSold(codeId: number | string): Promise<BackendActivationCode> {
    const res = await api<{ code: BackendActivationCode } | BackendActivationCode>({
      url: `/api/dashboard/provider/activation-codes/${codeId}/mark-sold`,
      method: "POST",
    });

    if ("code" in res && typeof res.code === "object" && res.code !== null) {
      return res.code as BackendActivationCode;
    }
    return res as BackendActivationCode;
  },

  async markCodeUsed(codeId: number | string): Promise<BackendActivationCode> {
    const res = await api<{ code: BackendActivationCode } | BackendActivationCode>({
      url: `/api/dashboard/provider/activation-codes/${codeId}/mark-used`,
      method: "POST",
    });

    if ("code" in res && typeof res.code === "object" && res.code !== null) {
      return res.code as BackendActivationCode;
    }
    return res as BackendActivationCode;
  },
};
