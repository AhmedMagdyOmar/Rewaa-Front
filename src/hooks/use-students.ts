"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentsService } from "@/lib/api/students-service";
import type {
  AdjustWalletData,
  StudentFilterParams,
  StoreStudentData,
  UpdateStudentData,
} from "@/types/api-contracts";

// -------------------------------------------------------------
// Queries
// -------------------------------------------------------------

export function useStudentsList(filters: StudentFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.provider.students.list(filters as Record<string, unknown>),
    queryFn: () => studentsService.getStudents(filters),
  });
}

export function useStudentDetail(studentId: number | string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.provider.students.detail(studentId || ""),
    queryFn: () => studentsService.getStudent(studentId!),
    enabled: Boolean(studentId),
  });
}

export function useStudentOptions(countryId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.students.options(countryId),
    queryFn: () => studentsService.getStudentOptions(countryId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentWallet(studentId: number | string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.provider.students.wallet(studentId || ""),
    queryFn: () => studentsService.getStudentWallet(studentId!),
    enabled: Boolean(studentId),
  });
}

export function useStudentTransactions(
  studentId: number | string | null | undefined,
  filters: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: queryKeys.provider.students.transactions(studentId || "", filters),
    queryFn: () => studentsService.getStudentTransactions(studentId!, filters),
    enabled: Boolean(studentId),
  });
}

// -------------------------------------------------------------
// Mutations
// -------------------------------------------------------------

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreStudentData) => studentsService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.students.all() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: number | string; data: UpdateStudentData }) =>
      studentsService.updateStudent(studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.students.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.students.detail(variables.studentId),
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: number | string) => studentsService.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.students.all() });
    },
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      status,
    }: {
      studentId: number | string;
      status: "active" | "suspended";
    }) => studentsService.updateStudentStatus(studentId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.students.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.students.detail(variables.studentId),
      });
    },
  });
}

export function useAdjustStudentWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: number | string; data: AdjustWalletData }) =>
      studentsService.adjustWallet(studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.students.wallet(variables.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.students.transactions(variables.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.students.detail(variables.studentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.students.all() });
    },
  });
}
