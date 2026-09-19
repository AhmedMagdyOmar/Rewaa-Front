/**
 * Central TanStack Query Key Factory
 *
 * Ensures consistent query key definitions and predictable cache invalidation
 * across Provider Dashboard, Website, and Student Portal modules.
 */

export const queryKeys = {
  // Provider Dashboard Keys
  provider: {
    all: ["provider"] as const,
    profile: () => [...queryKeys.provider.all, "profile"] as const,
    settings: () => [...queryKeys.provider.all, "settings"] as const,

    // Courses & Curriculum
    courses: {
      all: () => [...queryKeys.provider.all, "courses"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.courses.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) => [...queryKeys.provider.courses.all(), "detail", id] as const,
      options: (stageId?: number | string) =>
        [...queryKeys.provider.courses.all(), "options", { stageId }] as const,
      sections: (courseId: number | string) =>
        [...queryKeys.provider.courses.detail(courseId), "sections"] as const,
    },

    // Lessons & Templates
    lessons: {
      all: () => [...queryKeys.provider.all, "lessons"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.lessons.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) => [...queryKeys.provider.lessons.all(), "detail", id] as const,
      options: () => [...queryKeys.provider.lessons.all(), "options"] as const,
      templates: () => [...queryKeys.provider.lessons.all(), "templates"] as const,
    },

    // Exams & Question Bank
    exams: {
      all: () => [...queryKeys.provider.all, "exams"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.exams.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) => [...queryKeys.provider.exams.all(), "detail", id] as const,
      options: () => [...queryKeys.provider.exams.all(), "options"] as const,
      attempts: (examId?: number | string) =>
        [...queryKeys.provider.exams.all(), "attempts", { examId }] as const,
      complaints: (examId?: number | string, filters?: Record<string, unknown>) =>
        [...queryKeys.provider.exams.detail(examId || ""), "complaints", filters ?? {}] as const,
    },
    questions: {
      all: () => [...queryKeys.provider.all, "questions"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.questions.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) =>
        [...queryKeys.provider.questions.all(), "detail", id] as const,
      options: () => [...queryKeys.provider.questions.all(), "options"] as const,
    },

    // Students Directory
    students: {
      all: () => [...queryKeys.provider.all, "students"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.students.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) =>
        [...queryKeys.provider.students.all(), "detail", id] as const,
      options: () => [...queryKeys.provider.students.all(), "options"] as const,
      wallet: (id: number | string) =>
        [...queryKeys.provider.students.detail(id), "wallet"] as const,
      transactions: (id: number | string) =>
        [...queryKeys.provider.students.detail(id), "transactions"] as const,
    },

    // Activation Codes
    codes: {
      all: () => [...queryKeys.provider.all, "codes"] as const,
      groups: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.codes.all(), "groups", filters ?? {}] as const,
      groupCodes: (groupId: number | string, filters?: Record<string, unknown>) =>
        [...queryKeys.provider.codes.all(), "group", groupId, filters ?? {}] as const,
    },

    // Finance & Orders
    finance: {
      all: () => [...queryKeys.provider.all, "finance"] as const,
      orders: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "orders", filters ?? {}] as const,
      orderDetail: (id: number | string) =>
        [...queryKeys.provider.finance.all(), "order", id] as const,
      payments: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "payments", filters ?? {}] as const,
      paymentAccounts: () => [...queryKeys.provider.finance.all(), "paymentAccounts"] as const,
      summary: () => [...queryKeys.provider.finance.all(), "summary"] as const,
      transactions: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "transactions", filters ?? {}] as const,
    },
  },

  // Student Portal Keys
  student: {
    all: ["student"] as const,
    profile: () => [...queryKeys.student.all, "profile"] as const,
    options: () => [...queryKeys.student.all, "options"] as const,
    myCourses: (filters?: Record<string, unknown>) =>
      [...queryKeys.student.all, "myCourses", filters ?? {}] as const,
    courseDetail: (courseId: number | string) =>
      [...queryKeys.student.all, "course", courseId] as const,
    courseContent: (courseId: number | string) =>
      [...queryKeys.student.courseDetail(courseId), "content"] as const,
    lesson: (courseId: number | string, lessonId: number | string) =>
      [...queryKeys.student.courseDetail(courseId), "lesson", lessonId] as const,
    examAttempts: (courseId: number | string, examId: number | string) =>
      [...queryKeys.student.courseDetail(courseId), "exam", examId, "attempts"] as const,
    examAttemptDetail: (
      courseId: number | string,
      examId: number | string,
      attemptId: number | string,
    ) =>
      [...queryKeys.student.courseDetail(courseId), "exam", examId, "attempt", attemptId] as const,
    wallet: () => [...queryKeys.student.all, "wallet"] as const,
    walletTransactions: (filters?: Record<string, unknown>) =>
      [...queryKeys.student.wallet(), "transactions", filters ?? {}] as const,
  },

  // Public / Shared Website Keys
  website: {
    all: ["website"] as const,
    courses: (filters?: Record<string, unknown>) =>
      [...queryKeys.website.all, "courses", filters ?? {}] as const,
    courseDetail: (slugOrId: string | number) =>
      [...queryKeys.website.all, "course", slugOrId] as const,
    announcements: () => [...queryKeys.website.all, "announcements"] as const,
    faqs: () => [...queryKeys.website.all, "faqs"] as const,
    countries: () => [...queryKeys.website.all, "countries"] as const,
    governorates: (countryId?: number | string) =>
      [...queryKeys.website.all, "governorates", { countryId }] as const,
    page: (slug: string) => [...queryKeys.website.all, "page", slug] as const,
  },
};
