import {
  AnnouncementData,
  settingsService,
  StaffAdminData,
  StageData,
  SubjectData,
  TeacherData,
} from "@/lib/api/settings-service";
import type { BackendPlatformSettings } from "@/types/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const settingsKeys = {
  all: ["settings"] as const,
  stages: () => [...settingsKeys.all, "stages"] as const,
  subjects: (stageId?: number | string) => [...settingsKeys.all, "subjects", stageId] as const,
  teachers: () => [...settingsKeys.all, "teachers"] as const,
  admins: (role?: string) => [...settingsKeys.all, "admins", role] as const,
  announcements: () => [...settingsKeys.all, "announcements"] as const,
  platformSettings: () => [...settingsKeys.all, "platform-settings"] as const,
};

// Teachers Hooks
export function useTeachersList() {
  return useQuery({
    queryKey: settingsKeys.teachers(),
    queryFn: () => settingsService.getTeachers(),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherData | FormData) => settingsService.createTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.teachers() });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teacherId,
      data,
    }: {
      teacherId: number | string;
      data: Partial<TeacherData> | FormData;
    }) => settingsService.updateTeacher(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.teachers() });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherId: number | string) => settingsService.deleteTeacher(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.teachers() });
    },
  });
}

// Stages Hooks
export function useStagesList() {
  return useQuery({
    queryKey: settingsKeys.stages(),
    queryFn: () => settingsService.getStages(),
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StageData) => settingsService.createStage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stages() });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, data }: { stageId: number | string; data: Partial<StageData> }) =>
      settingsService.updateStage(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stages() });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stageId: number | string) => settingsService.deleteStage(stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stages() });
    },
  });
}

// Subjects Hooks
export function useSubjectsList(stageId?: number | string) {
  return useQuery({
    queryKey: settingsKeys.subjects(stageId),
    queryFn: () => settingsService.getSubjects(stageId),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubjectData) => settingsService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.subjects() });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, data }: { subjectId: number | string; data: Partial<SubjectData> }) =>
      settingsService.updateSubject(subjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.subjects() });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: number | string) => settingsService.deleteSubject(subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.subjects() });
    },
  });
}

// Staff / Admins / Teachers / Assistants Hooks
export function useStaffAdminsList(role?: "teacher" | "assistant" | string) {
  return useQuery({
    queryKey: settingsKeys.admins(role),
    queryFn: () => settingsService.getAdmins(role),
  });
}

export function useCreateStaffAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffAdminData) => settingsService.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins() });
    },
  });
}

export function useUpdateStaffAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, data }: { adminId: number | string; data: Partial<StaffAdminData> }) =>
      settingsService.updateAdmin(adminId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins() });
    },
  });
}

export function useDeleteStaffAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adminId: number | string) => settingsService.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins() });
    },
  });
}

// Announcements Hooks
export function useAnnouncementsList() {
  return useQuery({
    queryKey: settingsKeys.announcements(),
    queryFn: () => settingsService.getAnnouncements(),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnnouncementData) => settingsService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.announcements() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      announcementId,
      data,
    }: {
      announcementId: number | string;
      data: Partial<AnnouncementData>;
    }) => settingsService.updateAnnouncement(announcementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.announcements() });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number | string) =>
      settingsService.deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.announcements() });
    },
  });
}

// Platform Settings Hooks
export function usePlatformSettings() {
  return useQuery({
    queryKey: settingsKeys.platformSettings(),
    queryFn: () => settingsService.getPlatformSettings(),
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BackendPlatformSettings>) =>
      settingsService.updatePlatformSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.platformSettings() });
    },
  });
}
