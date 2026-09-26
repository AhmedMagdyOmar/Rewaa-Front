import { api } from "@/lib/apiClient";
import type {
  RedeemActivationCodePayload,
  RedeemActivationCodeResponse,
} from "@/types/api-contracts";

export const studentActivationCodesService = {
  /**
   * Redeem an activation code to instantly enroll into a course.
   * POST /api/website/activation-codes/redeem
   */
  async redeemCode(payload: RedeemActivationCodePayload): Promise<RedeemActivationCodeResponse> {
    const res = await api<RedeemActivationCodeResponse | { data: RedeemActivationCodeResponse }>({
      url: "/api/website/activation-codes/redeem",
      method: "POST",
      data: payload,
    });

    if (res && "data" in res && res.data) {
      return res.data;
    }
    return res as RedeemActivationCodeResponse;
  },
};
