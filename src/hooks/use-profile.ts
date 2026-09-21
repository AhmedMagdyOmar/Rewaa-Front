import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/lib/api/profile-service";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
  BackendProviderProfile,
  UpdateProviderPasswordPayload,
  UpdateProviderProfilePayload,
} from "@/types/api-contracts";

export function useProviderProfileQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.provider.profile(),
    queryFn: () => profileService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
    ...options,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: UpdateProviderProfilePayload | FormData) =>
      profileService.updateProfile(data),
    onSuccess: (updatedProfile: BackendProviderProfile) => {
      // Invalidate profile query in cache
      queryClient.setQueryData(queryKeys.provider.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.profile() });

      // Synchronize Zustand auth store
      if (currentUser) {
        setUser(
          {
            ...currentUser,
            full_name: updatedProfile.full_name,
            email: updatedProfile.email,
            avatarUrl: updatedProfile.flag || updatedProfile.avatar_url || currentUser.avatarUrl,
            user_type: updatedProfile.user_type || currentUser.user_type,
          },
          "provider",
        );
      }
    },
  });
}

export function useUpdatePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProviderPasswordPayload) => profileService.updatePassword(data),
    onSuccess: (updatedProfile: BackendProviderProfile) => {
      queryClient.setQueryData(queryKeys.provider.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.profile() });
    },
  });
}

export function useUpdateLocaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locale: string) => profileService.changeLocale(locale),
    onSuccess: (updatedProfile: BackendProviderProfile) => {
      queryClient.setQueryData(queryKeys.provider.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.profile() });
    },
  });
}

export function useUpdateNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allow_notification: boolean) =>
      profileService.updateNotificationPreference(allow_notification),
    onSuccess: (updatedProfile: BackendProviderProfile) => {
      queryClient.setQueryData(queryKeys.provider.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.profile() });
    },
  });
}

export function useUpdateDarkModeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allow_dark_mode: boolean) =>
      profileService.updateDarkModePreference(allow_dark_mode),
    onSuccess: (updatedProfile: BackendProviderProfile) => {
      queryClient.setQueryData(queryKeys.provider.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.profile() });
    },
  });
}
