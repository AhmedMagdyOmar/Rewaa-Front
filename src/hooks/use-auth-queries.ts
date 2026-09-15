import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authService,
  ProviderLoginCredentials,
  ProviderLoginResponse,
  StudentLoginCredentials,
  StudentLoginResponse,
} from "@/lib/api/auth-service";
import { queryKeys } from "@/lib/api/queryKeys";

/**
 * Provider Authentication Hooks
 */
export function useProviderLogin() {
  const queryClient = useQueryClient();

  return useMutation<ProviderLoginResponse, Error, ProviderLoginCredentials>({
    mutationFn: (credentials) => authService.providerLogin(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.provider.profile(), data.user);
    },
  });
}

export function useProviderLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authService.providerLogout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.provider.all });
    },
  });
}

export function useProviderProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.provider.profile(),
    queryFn: () => authService.getProviderProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
    ...options,
  });
}

/**
 * Student Authentication Hooks
 */
export function useStudentLogin() {
  const queryClient = useQueryClient();

  return useMutation<StudentLoginResponse, Error, StudentLoginCredentials>({
    mutationFn: (credentials) => authService.studentLogin(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.student.profile(), data.student);
    },
  });
}

export function useStudentLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authService.studentLogout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.student.all });
    },
  });
}

export function useStudentProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.student.profile(),
    queryFn: () => authService.getStudentProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
    ...options,
  });
}
