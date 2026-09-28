import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  studentProfileService,
  BackendWebsiteStudentProfile,
  UpdateStudentWebsiteProfilePayload,
} from "@/lib/api/student-profile-service";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UpdateProviderPasswordPayload } from "@/types/api-contracts";

export function useStudentProfileQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.student.profile(),
    queryFn: () => studentProfileService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
    ...options,
  });
}

export function useStudentProfileOptions(countryId?: number | string) {
  return useQuery({
    queryKey: queryKeys.student.options(),
    queryFn: () => studentProfileService.getOptions(countryId),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useUpdateStudentProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: UpdateStudentWebsiteProfilePayload | FormData) =>
      studentProfileService.updateProfile(data),
    onSuccess: (updatedProfile: BackendWebsiteStudentProfile) => {
      // Invalidate student profile query cache
      queryClient.setQueryData(queryKeys.student.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.student.profile() });

      // Synchronize Zustand auth store
      if (currentUser) {
        setUser(
          {
            ...currentUser,
            full_name: updatedProfile.full_name,
            email: updatedProfile.email || currentUser.email,
            avatarUrl: updatedProfile.avatar_url || currentUser.avatarUrl,
          },
          "student",
        );
      }
    },
  });
}

export function useUpdateStudentPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProviderPasswordPayload) => studentProfileService.updatePassword(data),
    onSuccess: (updatedProfile: BackendWebsiteStudentProfile) => {
      queryClient.setQueryData(queryKeys.student.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.student.profile() });
    },
  });
}
