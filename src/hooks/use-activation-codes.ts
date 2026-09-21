"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  activationCodesService,
  CodeFilterParams,
  CodeGroupFilterParams,
  BulkStoreCodesData,
  StoreCodeData,
  StoreCodeGroupData,
  UpdateCodeData,
} from "@/lib/api/activation-codes-service";

// -------------------------------------------------------------
// Queries
// -------------------------------------------------------------

export function useCodeGroupsList(filters: CodeGroupFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.provider.codes.groups(filters as Record<string, unknown>),
    queryFn: () => activationCodesService.getCodeGroups(filters),
  });
}

export function useCodeGroupDetail(groupId: number | string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.provider.codes.all(), "groupDetail", groupId],
    queryFn: () => activationCodesService.getCodeGroup(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useGroupCodesList(
  groupId: number | string | null | undefined,
  filters: CodeFilterParams = {},
) {
  return useQuery({
    queryKey: queryKeys.provider.codes.groupCodes(
      groupId || "",
      filters as Record<string, unknown>,
    ),
    queryFn: () => activationCodesService.getGroupCodes(groupId!, filters),
    enabled: Boolean(groupId),
  });
}

export function useActivationCodeDetail(codeId: number | string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.provider.codes.all(), "codeDetail", codeId],
    queryFn: () => activationCodesService.getCode(codeId!),
    enabled: Boolean(codeId),
  });
}

// -------------------------------------------------------------
// Mutations
// -------------------------------------------------------------

export function useCreateCodeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreCodeGroupData) => activationCodesService.createCodeGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
    },
  });
}

export function useCreateCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number | string; data: StoreCodeData }) =>
      activationCodesService.createCode(groupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}

export function useBulkGenerateCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number | string; data: BulkStoreCodesData }) =>
      activationCodesService.bulkStoreCodes(groupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}

export function useUpdateCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      codeId,
      data,
    }: {
      codeId: number | string;
      groupId: number | string;
      data: UpdateCodeData;
    }) => activationCodesService.updateCode(codeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}

export function useDeleteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId }: { codeId: number | string; groupId: number | string }) =>
      activationCodesService.deleteCode(codeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}

export function useMarkCodeSold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId }: { codeId: number | string; groupId: number | string }) =>
      activationCodesService.markCodeSold(codeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}

export function useMarkCodeUsed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ codeId }: { codeId: number | string; groupId: number | string }) =>
      activationCodesService.markCodeUsed(codeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.codes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.codes.groupCodes(variables.groupId),
      });
    },
  });
}
