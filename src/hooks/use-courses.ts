import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  coursesService,
  CourseFilterParams,
  StoreCourseData,
  UpdateCourseData,
  StoreCourseSectionData,
  UpdateCourseSectionData,
} from "@/lib/api/courses-service";

/**
 * Hook to fetch paginated courses with filtering
 */
export function useProviderCourses(filters?: CourseFilterParams) {
  return useQuery({
    queryKey: queryKeys.provider.courses.list(filters as Record<string, unknown>),
    queryFn: () => coursesService.getCourses(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch course options (stages, subjects, instructors, etc.)
 */
export function useProviderCourseOptions(stageId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.courses.options(stageId),
    queryFn: () => coursesService.getCourseOptions(stageId),
    staleTime: 5 * 60 * 1000, // cache options for 5 minutes
  });
}

/**
 * Hook to fetch a single course details
 */
export function useProviderCourse(courseId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.courses.detail(courseId || ""),
    queryFn: () => coursesService.getCourse(courseId!),
    enabled: Boolean(courseId),
  });
}

/**
 * Hook to fetch course with complete curriculum content (sections and lessons)
 */
export function useProviderCourseContent(courseId?: number | string) {
  return useQuery({
    queryKey: [...queryKeys.provider.courses.detail(courseId || ""), "content"],
    queryFn: () => coursesService.getCourseContent(courseId!),
    enabled: Boolean(courseId),
  });
}

/**
 * Hook to create a course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreCourseData | FormData) => coursesService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
    },
  });
}

/**
 * Hook to update an existing course
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateCourseData | FormData }) =>
      coursesService.updateCourse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to delete a course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => coursesService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
    },
  });
}

/**
 * Hook to publish a course immediately
 */
export function usePublishCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => coursesService.publishCourse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.detail(id) });
    },
  });
}

/**
 * Hook to schedule course publication
 */
export function useScheduleCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduledPublishAt }: { id: number | string; scheduledPublishAt: string }) =>
      coursesService.scheduleCourse(id, scheduledPublishAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.courses.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to fetch course sections
 */
export function useCourseSections(courseId?: number | string) {
  return useQuery({
    queryKey: queryKeys.provider.courses.sections(courseId || ""),
    queryFn: () => coursesService.getSections(courseId!),
    enabled: Boolean(courseId),
  });
}

/**
 * Hook to create a section within a course
 */
export function useCreateCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number | string; data: StoreCourseSectionData }) =>
      coursesService.createSection(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.sections(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.provider.courses.detail(variables.courseId), "content"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.detail(variables.courseId),
      });
    },
  });
}

/**
 * Hook to update a section
 */
export function useUpdateCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      data,
    }: {
      courseId: number | string;
      sectionId: number | string;
      data: UpdateCourseSectionData;
    }) => coursesService.updateSection(courseId, sectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.sections(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.provider.courses.detail(variables.courseId), "content"],
      });
    },
  });
}

/**
 * Hook to delete a section
 */
export function useDeleteCourseSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
    }: {
      courseId: number | string;
      sectionId: number | string;
    }) => coursesService.deleteSection(courseId, sectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.sections(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.provider.courses.detail(variables.courseId), "content"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.detail(variables.courseId),
      });
    },
  });
}

/**
 * Hook to reorder sections
 */
export function useReorderCourseSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, sectionIds }: { courseId: number | string; sectionIds: number[] }) =>
      coursesService.reorderSections(courseId, sectionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.provider.courses.sections(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.provider.courses.detail(variables.courseId), "content"],
      });
    },
  });
}
