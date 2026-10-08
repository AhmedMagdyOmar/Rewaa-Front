import { api } from "@/lib/apiClient";

export interface StudentTeacher {
  id: number | string;
  name: string;
  avatar: string | null;
  bio?: string | null;
  subject: string | null;
  subjects?: string[];
}

export interface StudentTeachersResponse {
  teachers: StudentTeacher[];
}

export interface StudentTeacherDetailsResponse {
  teacher: StudentTeacher;
}

export const studentTeachersService = {
  /**
   * Fetch teachers visible to current student/platform
   * GET /api/website/teachers
   */
  async getTeachers(): Promise<StudentTeacher[]> {
    const res = await api<
      StudentTeachersResponse | { data: { teachers: StudentTeacher[] } } | StudentTeacher[]
    >({
      url: "/api/website/teachers",
      method: "GET",
    });

    if (Array.isArray(res)) {
      return res;
    }
    if (res && "teachers" in res && Array.isArray(res.teachers)) {
      return res.teachers;
    }
    if (
      res &&
      "data" in res &&
      res.data &&
      "teachers" in res.data &&
      Array.isArray(res.data.teachers)
    ) {
      return res.data.teachers;
    }
    return [];
  },

  /**
   * Fetch single teacher details
   * GET /api/website/teachers/{id}
   */
  async getTeacher(id: string | number): Promise<StudentTeacher | null> {
    const res = await api<
      | StudentTeacherDetailsResponse
      | { data: { teacher: StudentTeacher } }
      | { teacher: StudentTeacher }
    >({
      url: `/api/website/teachers/${id}`,
      method: "GET",
    });

    if (res && "teacher" in res && res.teacher) {
      return res.teacher;
    }
    if (res && "data" in res && res.data && "teacher" in res.data && res.data.teacher) {
      return res.data.teacher;
    }
    return null;
  },
};
