import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { studentTeachersService, StudentTeacher } from "@/lib/api/student-teachers-service";

/**
 * Fetch teachers for the student dashboard teachers carousel
 * GET /api/website/teachers
 */
export function useStudentTeachers() {
  return useQuery<StudentTeacher[]>({
    queryKey: queryKeys.student.teachers(),
    queryFn: () => studentTeachersService.getTeachers(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a single teacher's details
 * GET /api/website/teachers/{id}
 */
export function useStudentTeacher(id: string | number | undefined | null) {
  return useQuery<StudentTeacher | null>({
    queryKey: queryKeys.student.teacher(id ?? ""),
    queryFn: () => (id ? studentTeachersService.getTeacher(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
