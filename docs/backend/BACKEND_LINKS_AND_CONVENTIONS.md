# Rewaa Platform - Backend Links & Integration Conventions Guide

## 1. Architectural Blueprint & Conventions

Across the codebase (`frontend/src`), all backend interactions strictly adhere to a **4-tier layered architecture**:

```text
[UI Component / View]
       │  (Calls TanStack Query Hook with reactive filters/params)
       ▼
[Custom Hook (`src/hooks/use-*.ts`)]
       │  (Manages Query Key Factory, Stale Time, Invalidation, Mutations)
       ▼
[Domain Service (`src/lib/api/*-service.ts`)]
       │  (Calls api<T>() with typed URLs, methods, params, FormData mapping)
       ▼
[Axios Client Engine (`src/lib/apiClient.ts`)]
          - Injects Bearer token automatically based on URL role context (`/dashboard/provider` vs `/website`)
          - Injects `Accept-Language` from active HTML/i18n locale
          - Automatically unwraps Laravel's `ApiResponse` envelope (`{ status, message, data }` -> `data`)
          - Normalizes Laravel 422 validation errors and 401 unauthorized handling
```

---

## 2. API Contract & Type Authority (`src/types/api-contracts.ts`)

The backend is the **sole source of truth** for types and response models:

- **No Mock Interfaces**: Domain models mirror Laravel Eloquent resources (`CourseResource`, `AvailableCourseResource`, `WalletResource`, `AnnouncementResource`, `ProfileResource`, etc.).
- **Bilingual Fields**: Stored as localized dictionaries: `Record<string, string>` (e.g. `{ ar: "...", en: "..." }`).
- **Pagination**: Uniform pagination structure `ApiPaginationMeta` (`current_page`, `last_page`, `per_page`, `total`).
- **Tab Counts**: Tab counters (`all`, `published`, `draft`, `scheduled` or `required`, `completed`) are returned directly by the server in list responses, avoiding client-side counting.

---

## 3. Query Key Factory Pattern (`src/lib/api/queryKeys.ts`)

Every query in the platform uses `queryKeys` for strict cache namespace isolation and predictable invalidation:

### Provider Dashboard Scope:

- `queryKeys.provider.courses.all()`
- `queryKeys.provider.courses.list(filters)`
- `queryKeys.provider.courses.detail(id)`
- `queryKeys.provider.courses.options(stageId)`
- `queryKeys.provider.lessons.list(filters)`
- `queryKeys.provider.exams.list(filters)`
- `queryKeys.provider.students.list(filters)`
- `queryKeys.provider.students.wallet(studentId)`

### Student Learning Portal Scope:

- `queryKeys.student.all`: Base student cache tag
- `queryKeys.student.profile()`: `GET /api/website/profile`
- `queryKeys.student.wallet()`: `GET /api/website/wallet`
- `queryKeys.student.walletTransactions(filters)`: `GET /api/website/wallet/transactions`
- `queryKeys.student.myCourses(filters)`: `GET /api/website/my-courses`
- `queryKeys.student.exploreCourses(filters)`: `GET /api/website/courses`
- `queryKeys.student.courseDetail(courseId)`: `GET /api/website/courses/{id}` or `my-courses/{id}`
- `queryKeys.student.courseContent(courseId)`: `GET /api/website/my-courses/{id}/content`
- `queryKeys.student.lesson(courseId, lessonId)`: `GET /api/website/my-courses/{id}/lessons/{id}`
- `queryKeys.student.standaloneLessons(filters)`: `GET /api/website/lessons`
- `queryKeys.student.exams(filters)`: `GET /api/website/exams`
- `queryKeys.student.generalExams(filters)`: `GET /api/website/general-exams`
- `queryKeys.student.examDetail(examId)`: `GET /api/website/exams/{id}`
- `queryKeys.student.examResult(examId)`: `GET /api/website/exams/{id}/result`
- `queryKeys.student.attemptDetail(attemptId)`: `GET /api/website/exam-attempts/{id}`

### Public / Website Scope:

- `queryKeys.website.announcements()`: `GET /api/website/announcements`
- `queryKeys.website.faqs()`: `GET /api/general/faqs`
- `queryKeys.website.countries()`: `GET /api/general/countries`
- `queryKeys.website.governorates(countryId)`: `GET /api/general/governorates`

---

## 4. Key Implementation Patterns Observed

### 4.1 URL Filter State Synchronization

Components like `ManageCoursesClient`, `StudentCoursesClient`, `StudentExploreCoursesClient`, and `StudentExamsClient` synchronize search, tab, and sorting with Next.js URL query params (`useSearchParams` + `router.push`).

### 4.2 Handling Multipart / Form-Data Mutations

When sending files (covers, avatars, attachments), services construct `FormData` and pass `_method: "PUT"` for update requests because PHP/Laravel natively parses multipart payloads reliably via `POST` with method spoofing.

### 4.3 Resilience Strategy for Student Course Details

- If a course is unenrolled: `GET /api/website/courses/{id}`.
- If enrolled: `GET /api/website/my-courses/{id}`.
- `useStudentCourseDetail` chains these with a fallback to ensure smooth navigation whether a student accesses a course from the discovery catalog or their enrolled library.

### 4.4 Automated Cache Invalidation on Mutations

When a student completes an action:

- **Enrollment / Order creation** (`useStudentEnroll`):
  - Invalidates `queryKeys.student.all` and `queryKeys.student.myCourses()`.
- **Lesson Completion** (`useToggleLessonCompletion`):
  - Invalidates `queryKeys.student.courseContent(courseId)`, `queryKeys.student.myCourses()`, and `queryKeys.student.standaloneLessons()`.
- **Exam Attempt Submission** (`useSubmitExamAttempt`):
  - Invalidates `queryKeys.student.exams()`, `queryKeys.student.attemptDetail(attemptId)`, `queryKeys.student.courseContent(courseId)`.
