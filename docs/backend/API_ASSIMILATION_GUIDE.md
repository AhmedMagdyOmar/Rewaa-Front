# Rewaa Platform - API Assimilation Guide (Frontend Integration Blueprint)

> **Status**: Phase 3 & 4 Deliverable - Complete Frontend Assimilation Blueprint
> **Scope**: Detailed assimilation of all 183 in-scope APIs (Provider Dashboard, Website & Student Portal, Shared General APIs)
> **Target Framework**: Next.js 16 (App Router), TanStack Query v5, Axios, Zustand, React 19
> **File Modification Status**: Documentation ONLY - No repository code modified.

---

## 1. Core Client Architecture & Assimilation Foundations

### 1.1 `src/lib/apiClient.ts` Modernization Blueprint

Currently, `apiClient.ts` strips the `Authorization` header assuming HttpOnly cookies and does not unwrap the Laravel `ApiResponse` envelope.
The live integration requires the following three adjustments:

```ts
// Required Axios Interceptors Blueprint
axiosInstance.interceptors.request.use((config) => {
  // 1. Inject Sanctum Bearer token from cookie/storage
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer `;
  }
  // 2. Inject active locale for Astrotomic Translatable & SetLocale middleware
  const locale = typeof window !== "undefined" ? document.documentElement.lang || "ar" : "ar";
  config.headers["Accept-Language"] = locale;
  config.headers["Accept"] = "application/json";
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    // 3. Unwrap ApiResponse envelope: { status: 200, message: "...", data: <payload> }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data; // Return pure payload
    }
    return response.data;
  },
  (error) => {
    // 4. Transform Laravel 422 Validation Error into standard UI error dictionary
    if (error.response?.status === 422 && error.response?.data?.errors) {
      error.validationErrors = error.response.data.errors;
    }
    if (error.response?.status === 401) {
      // Handle session expiration / redirect to login
    }
    return Promise.reject(error);
  },
);
```

### 1.2 TanStack Query Query Key & Cache Conventions

| Domain           | Query Key Pattern                                                  | Invalidation Trigger                                    |
| :--------------- | :----------------------------------------------------------------- | :------------------------------------------------------ |
| Courses          | `["provider", "courses", { search, status, delivery_mode, page }]` | `useCreateCourse`, `useUpdateCourse`, `useDeleteCourse` |
| Course Options   | `["provider", "courses", "options", educational_stage_id]`         | Stale time: 10 minutes                                  |
| Lessons          | `["provider", "lessons", { course_id, search, type, page }]`       | `useCreateLesson`, `useUpdateLesson`, `useDeleteLesson` |
| Exams            | `["provider", "exams", { course_id, search, page }]`               | `useCreateExam`, `useUpdateExam`, `useDeleteExam`       |
| Students         | `["provider", "students", { search, status, page }]`               | `useCreateStudent`, `useUpdateStudentStatus`            |
| Activation Codes | `["provider", "codes", group_id, { status, page }]`                | `useGenerateCodes`, `useToggleCodeStatus`               |
| Orders & Finance | `["provider", "orders", { status, date_from, date_to }]`           | `useApprovePayment`, `useRejectPayment`                 |
| Student Courses  | `["student", "my-courses", { status, page }]`                      | Order completion, course purchase                       |
| Student Progress | `["student", "course-content", course_id]`                         | `useCompleteLesson`, `useSubmitExam`                    |

---

## 2. Provider Dashboard Modules Assimilation (151 Endpoints)

### 2.1 Module: Courses Management (`courses-storage.ts` & `mockCoursesData.ts`)

- **Replaced File**: `src/lib/courses-storage.ts` (`rewaa_courses_${locale}`)
- **Client Components**: `ManageCoursesClient` (`manage-courses-client.tsx`), `NewCourseClient` (`new-course-client.tsx`), `CourseCard`, `DeleteCourseDialog`
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/courses` (List, search, filter by `status`, `delivery_mode`, `sort`, `page`, `per_page`)
  2. `GET /api/dashboard/provider/courses/options` (Preload grades, subjects, teachers, periods)
  3. `POST /api/dashboard/provider/courses` (`multipart/form-data` with `cover_image`, `intro_video_url`, translatable `title`, `description`)
  4. `GET /api/dashboard/provider/courses/{course}` (Single course details for edit)
  5. `PUT /api/dashboard/provider/courses/{course}` (Update course details)
  6. `DELETE /api/dashboard/provider/courses/{course}` (Soft delete course)
  7. `POST /api/dashboard/provider/courses/{course}/restore` (Restore soft-deleted course)
  8. `POST /api/dashboard/provider/courses/{course}/sections` (Add section)
  9. `PUT /api/dashboard/provider/courses/{course}/sections/{section}` (Update section)
  10. `DELETE /api/dashboard/provider/courses/{course}/sections/{section}` (Delete section)
  11. `POST /api/dashboard/provider/courses/{course}/sections/reorder` (Drag-and-drop section reordering)
- | **Field-by-Field Transformation Mapping**: | Frontend Component State (`Course`)        | Backend Payload / Parameter                                    | Notes |
  | :----------------------------------------- | :----------------------------------------- | :------------------------------------------------------------- | ----- |
  | `title` (string)                           | `title.ar` & `title.en` (array)            | Backend requires localized map`{ ar: "...", en: "..." }`       |
  | `description` (markdown string)            | `description.ar` & `description.en`        | Localized markdown string                                      |
  | `lectureVideoLink` / `introVideoUrl`       | `intro_video_url`                          | Valid URL string                                               |
  | `coverImage` (File / string)               | `cover_image`                              | Sent as`multipart/form-data` File binary                       |
  | `grade` (string / name)                    | `educational_stage_id` (integer)           | Must resolve Grade name to Stage ID from`/courses/options`     |
  | `subject` (string / name)                  | `subject_id` (integer)                     | Must resolve Subject name to Subject ID from`/courses/options` |
  | `teacherName`                              | `instructor_id` (integer)                  | Must resolve Teacher to instructor User ID                     |
  | `venue` ("online" \| "center")             | `delivery_mode` (`CourseDeliveryModeEnum`) | Enum value:`online`, `center`, `hybrid`                        |
  | `period` ("monthly" \| "yearly")           | `subscription_period`                      | Enum value:`monthly`, `term`, `yearly`                         |
  | `price` (number)                           | `price` (decimal)                          | Float/numeric (e.g.`250.00`)                                   |
  | `sections` (array of `CourseSection`)      | Sections endpoints                         | Managed via nested`/sections` endpoints                        |
- **Nuances & Gotchas**:
  - When editing a course with an existing image, do NOT send `cover_image` unless the user uploaded a new replacement file.
  - The backend returns `status_counts` in the `index` response (`all`, `published`, `draft`, `scheduled`, `archived`). Replace the client-side JavaScript counting in `ManageCoursesClient` with `data.status_counts`.

### 2.2 Module: Lessons & Lesson Templates (`lessons-storage.ts` & `mockLessonsData.ts`)

- **Replaced File**: `src/lib/lessons-storage.ts` (`rewaa_lessons_${locale}`)
- **Client Components**: `ManageLessonsClient` (`manage-lessons-client.tsx`), `LessonCard`, `DeleteLessonDialog`
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/lessons` (Filter by `course_id`, `search`, `type`, `sort`, `page`, `per_page`)
  2. `GET /api/dashboard/provider/lessons/options` (Options for stages, subjects, instructors)
  3. `POST /api/dashboard/provider/lessons` (Create lesson linked to course section or independent)
  4. `GET /api/dashboard/provider/lessons/{lesson}` (Show lesson content)
  5. `PUT /api/dashboard/provider/lessons/{lesson}` (Update lesson details)
  6. `DELETE /api/dashboard/provider/lessons/{lesson}` (Soft delete lesson)
  7. `POST /api/dashboard/provider/lesson-templates` (Save reusable template to library)
- | **Field-by-Field Transformation Mapping**: | Frontend Component State (`Lesson`) | Backend Payload / Parameter                   | Notes |
  | :----------------------------------------- | :---------------------------------- | :-------------------------------------------- | ----- |
  | `title`                                    | `title.ar` & `title.en`             | Localized title map                           |
  | `description`                              | `description.ar` & `description.en` | Localized description map                     |
  | `writtenText`                              | `content.ar` & `content.en`         | Written article markdown text                 |
  | `lectureVideoLink`                         | `video_url`                         | YouTube, Vimeo, or MP4 URL                    |
  | `pdfFiles` / `attachments`                 | `attachments[]`                     | File uploads attached via Spatie MediaLibrary |
  | `courseId`                                 | `course_id` (integer)               | Foreign key to`courses.id`                    |
  | `sectionId`                                | `section_id` (integer)              | Foreign key to`course_sections.id`            |
  | `isLinkedToExam`                           | `exam_id` (integer \| null)         | Linked prerequisite or post-lesson exam ID    |
  | `viewsCount`                               | `views_count` (read-only)           | Managed by server analytics                   |

### 2.3 Module: Exams & Question Bank (`exams-storage.ts`, `questions-storage.ts`, `mockExamsData.ts`)

- **Replaced Files**: `src/lib/exams-storage.ts`, `src/lib/questions-storage.ts`, `src/lib/mockExamsData.ts`
- **Client Components**: `ManageExamsClient`, `ExamCard`, Question Bank views
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/exams` (List provider exams with status counts)
  2. `GET /api/dashboard/provider/exams/options` (Options for stages, subjects, instructors)
  3. `POST /api/dashboard/provider/exams` (Create exam: duration, passing percentage, attempts limit)
  4. `POST /api/dashboard/provider/exams/{exam}/sections` (Add exam question sections)
  5. `GET /api/dashboard/provider/questions` (Query question bank with filters for subject, difficulty, type)
  6. `POST /api/dashboard/provider/questions` (Create question: MCQ options, true/false, essay, explanation)
  7. `GET /api/dashboard/provider/exam-attempts` (Review student submissions)
  8. `POST /api/dashboard/provider/exam-attempts/{attempt}/grade` (Manual grading of essay questions)
- | **Field-by-Field Transformation Mapping**:  | Frontend Component State (`Exam` / `Question`)                  | Backend Payload / Parameter                    | Notes |
  | :------------------------------------------ | :-------------------------------------------------------------- | :--------------------------------------------- | ----- |
  | `durationMinutes`                           | `duration_minutes` (integer)                                    | Allowed time limit                             |
  | `passingScore`                              | `pass_percentage` (decimal)                                     | Minimum passing score percentage (e.g.`50.00`) |
  | `maxAttempts`                               | `max_attempts` (integer)                                        | Allowed retakes count                          |
  | `questionContent`                           | `question_text.ar` & `question_text.en`                         | Markdown formatted question body               |
  | `options` (array of `MCQOption`)            | `options` (array of `{ title: {ar, en}, is_correct: boolean }`) | Multiple choice options list                   |
  | `grade` / points                            | `score` (decimal)                                               | Points allocated to question                   |
  | `difficulty` ("easy" \| "medium" \| "hard") | `difficulty` (`QuestionDifficultyEnum`)                         | Enum value                                     |
  | `answerExplanation`                         | `explanation.ar` & `explanation.en`                             | Shown to student upon review                   |

### 2.4 Module: Students Directory & Wallet Adjustments (`students-storage.ts` & `mockStudentsData.ts`)

- **Replaced File**: `src/lib/students-storage.ts` (`rewaa_students_${locale}`)
- **Client Components**: Students table, Student Details Drawer, Wallet Adjustment Modal
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/students` (Paginated roster with search, stage filter, status filter)
  2. `GET /api/dashboard/provider/students/options` (Stages, countries, governorates)
  3. `POST /api/dashboard/provider/students` (Manual student enrollment/registration by provider)
  4. `GET /api/dashboard/provider/students/{student}` (Profile, enrolled courses, attendance, wallet balance)
  5. `PATCH /api/dashboard/provider/students/{student}/status` (Toggle `active` vs `suspended`)
  6. `GET /api/dashboard/provider/students/{student}/wallet` (Wallet balance)
  7. `POST /api/dashboard/provider/students/{student}/wallet/adjustments` (Manual credit/debit adjustment)
  8. `GET /api/dashboard/provider/students/{student}/wallet/transactions` (Audit log of adjustments)
- | **Field-by-Field Transformation Mapping**: | Frontend Component State (`Student`)     | Backend Payload (`StoreStudentRequest`)        | Notes |
  | :----------------------------------------- | :--------------------------------------- | :--------------------------------------------- | ----- |
  | `firstName`                                | `first_name`                             | Required string                                |
  | `middleName`                               | `father_name`                            | Father/middle name string                      |
  | `lastName`                                 | `family_name`                            | Family/last name string                        |
  | `phoneNumber`                              | `phone_code` + `phone`                   | e.g.`phone_code: "+20"`, `phone: "1001234567"` |
  | `parentPhoneNumber`                        | `guardian_phone_code` + `guardian_phone` | Guardian phone info                            |
  | `country`                                  | `country_id`                             | Foreign key to`countries.id`                   |
  | `state` / governorate                      | `governorate_id`                         | Foreign key to`governorates.id`                |
  | `grade`                                    | `educational_stage_id`                   | Foreign key to`educational_stages.id`          |
  | `gender`                                   | `gender`                                 | `male` \| `female`                             |
  | `registrationType`                         | `registration_type`                      | `online`, `center`, `hybrid`, `external`       |
  | `status`                                   | `status`                                 | `active`, `suspended`                          |

### 2.5 Module: Activation Codes & Groups (`activation-codes-storage.ts`, `code-groups-storage.ts`)

- **Replaced Files**: `src/lib/activation-codes-storage.ts`, `src/lib/code-groups-storage.ts`
- **Client Components**: Activation Codes Manager, Batch Generator Modal, Export Dialog
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/activation-code-groups` (List code batches linked to courses/subjects)
  2. `POST /api/dashboard/provider/activation-code-groups` (Create code group batch: target course, price, expiry)
  3. `GET /api/dashboard/provider/activation-code-groups/{group}/codes` (List generated codes in group)
  4. `POST /api/dashboard/provider/activation-code-groups/{group}/codes/bulk` (Bulk generate N codes)
  5. `GET /api/dashboard/provider/activation-codes/export` (Download CSV/Excel of codes for printing)
  6. `PATCH /api/dashboard/provider/activation-codes/{code}/status` (Deactivate/activate specific code)
- **Nuance**: LocalStorage previously used client-side random string generator. Backend provides cryptographic, collision-free codes formatted as `XXXX-XXXX-XXXX-XXXX` and enforces unique constraints.

### 2.6 Module: Orders, Billing & Financial Accounting (`billing-requests-storage.ts`, `financial-summary-storage.ts`)

- **Replaced Files**: `src/lib/billing-requests-storage.ts`, `src/lib/financial-summary-storage.ts`
- **Client Components**: Orders Table, Payment Verification Modal, Financial KPI Summary
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/orders` (List student course purchases with statuses: `pending`, `paid`)
  2. `GET /api/dashboard/provider/orders/{order}` (Full invoice breakdown, student info, payment history)
  3. `GET /api/dashboard/provider/payments` (Manual bank transfer payment requests submitted by students)
  4. `POST /api/dashboard/provider/payments/{payment}/approve` (Approve payment receipt -> activates course access)
  5. `POST /api/dashboard/provider/payments/{payment}/reject` (Reject payment receipt with reason string)
  6. `GET /api/dashboard/provider/payment-accounts` (List bank/instapay accounts shown to students)
  7. `POST /api/dashboard/provider/payment-accounts` (Add provider bank account / Vodafone Cash / Instapay)
  8. `GET /api/dashboard/provider/finance/summary` (Financial KPIs: total revenue, pending revenue, month-on-month trend)
  9. `GET /api/dashboard/provider/finance/transactions` (Complete financial accounting ledger)
- **Nuance**: In `billing-requests-storage.ts`, approving a payment mutated local state. In the backend, `payments/{payment}/approve` triggers a database transaction that updates the `Payment`, updates the `Order` paid amount, and creates a `CourseEnrollment` record for the student automatically!

### 2.7 Module: Platform Settings & Provider Profile (`settings-storage.ts` & `mockSettingsData.ts`)

- **Replaced Files**: `src/lib/settings-storage.ts`, `src/lib/mockSettingsData.ts`
- **Client Components**: Settings Page (General, Branding, Payment Gateways, Localization, Profile)
- **Endpoints Utilized**:
  1. `GET /api/dashboard/provider/platform-settings` (Get branding, active languages, allowed registration modes)
  2. `PUT /api/dashboard/provider/platform-settings` (Update platform settings)
  3. `GET /api/dashboard/provider/profile` (Provider user profile)
  4. `PUT /api/dashboard/provider/profile` (Update name, email, phone, avatar)
  5. `PATCH /api/dashboard/provider/profile/password` (Change password)
  6. `PATCH /api/dashboard/provider/profile/locale` (Change preferred language)
  7. `PATCH /api/dashboard/provider/profile/dark-mode` (Toggle dark mode preference)

---

## 3. Website & Student Portal Assimilation Guide (28 Endpoints)

### 3.1 Sub-module: Public Course Catalog & Landing Page

- **Client Components**: Landing page course grid (`src/app/[locale]/(main)/(landing)`), Course Details Page
- **Endpoints Utilized**:
  1. `GET /api/website/courses` (Public available courses catalog with pagination & stage filters)
  2. `GET /api/website/courses/{course}` (Public course landing page: overview, curriculum preview, pricing, instructor)
  3. `GET /api/website/announcements` (Active provider announcements banner)
  4. `GET /api/general/countries` (Active countries for registration)
  5. `GET /api/general/faqs` (Provider FAQs)

### 3.2 Sub-module: Student Authentication & Profile

- **Replaced File**: Temporary Next.js route handlers under `src/app/api/auth/*`
- **Client Components**: Login Page, Register Page, Student Profile Page (`(student-dashboard)/student-dashboard/profile`)
- **Endpoints Utilized**:
  1. `POST /api/website/auth/login` (Login with `login` [email/phone] and `password` -> receives `access_token`)
  2. `POST /api/website/auth/logout` (Revokes Sanctum personal access token)
  3. `GET /api/website/profile` (Student profile data)
  4. `GET /api/website/profile/options` (Options for stages, governorates, genders)
  5. `PUT /api/website/profile` (Update student profile details)
  6. `PATCH /api/website/profile/password` (Update student password)
- **Nuance**: In `use-auth.ts`, the frontend currently points to `/api/auth/login`. For students, it must point to `/api/website/auth/login`, and save `access_token` into cookie/storage.

### 3.3 Sub-module: Student Enrolled Courses & Learning Player (`student-enrollment-storage.ts`, `student-course-progress.ts`)

- **Replaced Files**: `src/lib/student-enrollment-storage.ts`, `src/lib/student-course-progress.ts`
- **Client Components**: Student Dashboard (`(student-dashboard)/student-dashboard/courses`), Course Player View
- **Endpoints Utilized**:
  1. `GET /api/website/my-courses` (List enrolled courses with completion percentage)
  2. `GET /api/website/my-courses/{course}` (Enrolled course dashboard & announcement updates)
  3. `GET /api/website/my-courses/{course}/content` (Complete curriculum tree: sections, lessons, exams with completion status)
  4. `GET /api/website/my-courses/{course}/lessons/{lesson}` (Lesson content, video player URL, attachments list)
  5. `POST /api/website/my-courses/{course}/lessons/{lesson}/completion` (Mark lesson completed)
  6. `DELETE /api/website/my-courses/{course}/lessons/{lesson}/completion` (Mark lesson uncompleted)
  7. `GET /api/website/my-courses/{course}/lessons/{lesson}/media/{media}` (Stream protected video / download PDF)
- **Nuance**: The frontend previously stored lesson checkmarks in `localStorage` under `rewaa_student_progress`. Now, `POST /completion` and `DELETE /completion` update the server database in real-time, recalculating the student overall progress metric automatically.

### 3.4 Sub-module: Student Exam Taking Engine

- **Client Components**: Student Exam Player, Timed Quiz Modal, Results Summary
- **Endpoints Utilized**:
  1. `GET /api/website/my-courses/{course}/exams/{exam}/attempts` (List student prior attempts & scores)
  2. `POST /api/website/my-courses/{course}/exams/{exam}/attempts` (Start a new attempt -> starts server timer)
  3. `GET /api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}` (Active attempt state: questions, options, remaining seconds)
  4. `POST /api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}/submit` (Submit answers -> returns score & breakdown)
- **Nuance**: In local mock mode, the frontend graded MCQ answers client-side. The backend computes the grade server-side on submission and withholds correct answers until the attempt is submitted.

### 3.5 Sub-module: Course Checkout, Orders & Student Wallet

- **Client Components**: Checkout Page, Payment Modal, Student Wallet Page
- **Endpoints Utilized**:
  1. `GET /api/website/payment-accounts` (Retrieve provider bank accounts / Instapay numbers for transfer)
  2. `POST /api/website/orders` (Initiate order for course -> returns order ID & total)
  3. `POST /api/website/orders/{order}/payments` (Upload manual payment transfer screenshot / receipt)
  4. `POST /api/website/orders/{order}/pay-with-wallet` (Instant payment deducted from wallet balance)
  5. `GET /api/website/wallet` (Get student current wallet balance)
  6. `GET /api/website/wallet/transactions` (Get student wallet transaction ledger)

---

## 4. Master Migration Checklist for Developers

| Phase           | Step | Action Required                                                                               | Status     |
| :-------------- | :--- | :-------------------------------------------------------------------------------------------- | :--------- |
| **Foundations** | 1    | Update`src/lib/apiClient.ts` with Sanctum Bearer token injector & `ApiResponse` unwrapper     | Documented |
| **Foundations** | 2    | Configure`Accept-Language` header propagation from `next-intl`                                | Documented |
| **Auth**        | 3    | Create separate`useProviderAuth` and `useStudentAuth` hooks for distinct token storage        | Documented |
| **Provider**    | 4    | Migrate`ManageCoursesClient` from `courses-storage.ts` to `useCourses()` React Query hook     | Documented |
| **Provider**    | 5    | Migrate`NewCourseClient` to consume `useCourseOptions()` and mutate via `useCreateCourse()`   | Documented |
| **Provider**    | 6    | Migrate`ManageLessonsClient` from `lessons-storage.ts` to `useLessons()`                      | Documented |
| **Provider**    | 7    | Migrate`ManageExamsClient` from `exams-storage.ts` to `useExams()`                            | Documented |
| **Provider**    | 8    | Migrate Students Roster from`students-storage.ts` to `useStudents()` & wallet adjustments     | Documented |
| **Provider**    | 9    | Migrate Activation Codes from`activation-codes-storage.ts` to `useActivationCodes()`          | Documented |
| **Provider**    | 10   | Migrate Billing & Orders from`billing-requests-storage.ts` to `useOrders()` & `usePayments()` | Documented |
| **Provider**    | 11   | Migrate Settings from`settings-storage.ts` to `usePlatformSettings()`                         | Documented |
| **Student**     | 12   | Connect Public Course Catalog (`(landing)`) to `GET /api/website/courses`                     | Documented |
| **Student**     | 13   | Connect Enrolled Courses (`(student-dashboard)`) to `GET /api/website/my-courses`             | Documented |
| **Student**     | 14   | Connect Lesson Player & Completion to`GET /my-courses/{c}/lessons/{l}` & `POST /completion`   | Documented |
| **Student**     | 15   | Connect Exam Taking Engine to attempts endpoints                                              | Documented |
| **Student**     | 16   | Connect Course Checkout to`POST /orders`, `/payments`, and `/pay-with-wallet`                 | Documented |
