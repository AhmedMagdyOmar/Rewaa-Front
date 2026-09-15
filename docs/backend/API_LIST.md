# Rewaa Platform - API Contract (Phase 1: Complete Inventory & Rundown)

> **Status**: Phase 1 Draft (Inventory, Routing, Architectural Baseline & Frontend Mapping)
> **Backend Framework**: Laravel 12+ (PHP 8.3+) with Sanctum, Spatie MediaLibrary, Astrotomic Translatable
> **Frontend Framework**: Next.js 16 (App Router), TanStack Query v5, Axios, Zustand, TailwindCSS v4
> **Total Registered API Endpoints**: 228

---

## 1. Architectural Foundations & Integration Nuances

### 1.1 Base URLs & Route Partitioning

- **Base URL (Local)**: `http://localhost:8000`
- **Routing Namespace Separation**:
  - `/api/general/*`: Public utilities (countries, static pages, faqs, geocoding)
  - `/api/website/*`: Student-facing website & learning portal (`can:app:student` + `EnsureStudentWebsiteAccess`)
  - `/api/dashboard/provider/*`: Provider/Instructor dashboard (`can:dashboard:provider`)
  - `/api/dashboard/admin/*`: Super Admin dashboard (`can:dashboard:admin`)
  - `/api/user`: Sanctum utility token user lookup

### 1.2 Global Response Envelope (`App\Support\ApiResponse`)

All API responses adhere to the standard envelope:

```json
// Success (200 / 201)
{
  "status": 200,
  "message": "Operation successful.",
  "data": { ... }
}

// Validation Failure (422)
{
  "status": 422,
  "message": "Validation Error",
  "data": null,
  "errors": {
    "field_name": ["The field is required."]
  }
}

// Authentication Failure (401)
{
  "status": 401,
  "message": "Unauthenticated, you have to login first",
  "data": null
}
```

### 1.3 Key Architectural Nuances & Critical Differences from Frontend Mocking

1. **Authentication Token Mechanism**:
   - Frontend previously configured Axios with `withCredentials: true` assuming HttpOnly cookies.
   - Backend uses **Laravel Sanctum Personal Access Tokens** returned in the response body as `{ data: { access_token: "...", token_type: "Bearer" } }`.
   - **Nuance**: Frontend Axios interceptor (`src/lib/apiClient.ts`) must attach `Authorization: Bearer <access_token>`.

2. **Localization & Language Negotiation**:
   - Backend uses `App\Http\Middleware\SetLocale` inspecting `Accept-Language` (`ar` or `en`) or session.
   - Translatable entities use Astrotomic Translatable and are automatically filtered by `FilterProviderTranslations` based on the provider tenant configuration.
   - **Nuance**: Frontend must send `Accept-Language: <locale>` with every HTTP call.

3. **Options Endpoints Pattern**:
   - In local storage mocks, dropdowns (stages, subjects, teachers, enums) were hardcoded.
   - Backend features dedicated `/options` endpoints (`courses/options`, `students/options`, `teachers/options`, `profile/options`, `exams/options`, `lessons/options`, `questions/options`) providing real-time select choices, enum constants, and active currencies.

4. **Soft Deletes & Trash Life-cycle**:
   - Backend courses, lessons, exams, and question bank support soft-deletes with `restore` and `forceDelete` operations.

5. **Standard Pagination Structure**:
   - Standard paginated endpoints return `data: { items: [...], pagination: { current_page, last_page, per_page, total } }` alongside `status_counts` for filter badges.

---

## 2. Master API Rundown by Domain

### 2.1 General & Shared Public APIs (4 Endpoints)

#### Module: `Countries` (1 routes)

| Method | Endpoint URI | Controller Action        | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :----------------------- | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/general/countries` | `CountryController@`     | —                 | ApiResponse   | `Public`                        |

#### Module: `Faqs` (1 routes)

| Method | Endpoint URI | Controller Action   | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :------------------ | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/general/faqs` | `FaqController@`         | —                 | ApiResponse   | `Public`                        |

#### Module: `Geocode` (1 routes)

| Method | Endpoint URI | Controller Action      | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :--------------------- | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/general/geocode` | `GeocodeController@show` | —                 | ApiResponse   | `Public`                        |

#### Module: `Static-pages` (1 routes)

| Method | Endpoint URI | Controller Action                  | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :--------------------------------- | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/general/static-pages/{type}` | `StaticPageController@`  | —                 | ApiResponse   | `Public`                        |

### 2.2 Website & Student Portal APIs (28 Endpoints)

#### Module: `Announcements` (1 routes)

| Method | Endpoint URI | Controller Action            | Validation (FormRequest)       | Response Resource | Auth & Guards          | Frontend Target & Mock Replaced |
| :----- | :----------- | :--------------------------- | :----------------------------- | :---------------- | :--------------------- | :------------------------------ |
| `GET   | HEAD`        | `/api/website/announcements` | `AnnouncementController@index` | —                 | `AnnouncementResource` | `Public`                        |

#### Module: `Auth` (2 routes)

| Method | Endpoint URI               | Controller Action       | Validation (FormRequest) | Response Resource | Auth & Guards                          | Frontend Target & Mock Replaced                             |
| :----- | :------------------------- | :---------------------- | :----------------------- | :---------------- | :------------------------------------- | :---------------------------------------------------------- |
| `POST` | `/api/website/auth/login`  | `AuthController@login`  | `LoginRequest`           | `ProfileResource` | `throttle`                             | Student authentication modal/page (`src/hooks/use-auth.ts`) |
| `POST` | `/api/website/auth/logout` | `AuthController@logout` | —                        | ApiResponse       | `sanctum, app:student, active-student` | Student authentication modal/page (`src/hooks/use-auth.ts`) |

#### Module: `Courses` (2 routes)

| Method | Endpoint URI | Controller Action               | Validation (FormRequest)         | Response Resource    | Auth & Guards             | Frontend Target & Mock Replaced        |
| :----- | :----------- | :------------------------------ | :------------------------------- | :------------------- | :------------------------ | :------------------------------------- |
| `GET   | HEAD`        | `/api/website/courses`          | `CourseController@available`     | `IndexCourseRequest` | `AvailableCourseResource` | `sanctum, app:student, active-student` |
| `GET   | HEAD`        | `/api/website/courses/{course}` | `CourseController@showAvailable` | `IndexCourseRequest` | `CourseDetailsResource`   | `sanctum, app:student, active-student` |

#### Module: `My-courses` (11 routes)

| Method   | Endpoint URI                                                              | Controller Action                                                  | Validation (FormRequest)      | Response Resource     | Auth & Guards                          | Frontend Target & Mock Replaced                                                          |
| :------- | :------------------------------------------------------------------------ | :----------------------------------------------------------------- | :---------------------------- | :-------------------- | :------------------------------------- | :--------------------------------------------------------------------------------------- |
| `GET     | HEAD`                                                                     | `/api/website/my-courses`                                          | `CourseController@index`      | `IndexCourseRequest`  | `CourseResource`                       | `sanctum, app:student, active-student`                                                   |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}`                                 | `CourseController@show`       | `IndexCourseRequest`  | `CourseDetailsResource`                | `sanctum, app:student, active-student`                                                   |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}/content`                         | `CourseController@content`    | `IndexCourseRequest`  | `CourseContentResource`                | `sanctum, app:student, active-student`                                                   |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}/exams/{exam}/attempts`           | `ExamAttemptController@index` | —                     | `ExamAttemptResource`                  | `sanctum, app:student, active-student`                                                   |
| `POST`   | `/api/website/my-courses/{course}/exams/{exam}/attempts`                  | `ExamAttemptController@store`                                      | —                             | `ExamAttemptResource` | `sanctum, app:student, active-student` | Student enrolled courses (`student-enrollment-storage.ts`, `student-course-progress.ts`) |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}` | `ExamAttemptController@show`  | —                     | `ExamAttemptResource`                  | `sanctum, app:student, active-student`                                                   |
| `POST`   | `/api/website/my-courses/{course}/exams/{exam}/attempts/{attempt}/submit` | `ExamAttemptController@submit`                                     | `SubmitExamAttemptRequest`    | `ExamAttemptResource` | `sanctum, app:student, active-student` | Student enrolled courses (`student-enrollment-storage.ts`, `student-course-progress.ts`) |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}/lessons/{lesson}`                | `LessonController@show`       | —                     | `LessonResource`                       | `sanctum, app:student, active-student`                                                   |
| `POST`   | `/api/website/my-courses/{course}/lessons/{lesson}/completion`            | `LessonController@complete`                                        | —                             | ApiResponse           | `sanctum, app:student, active-student` | Student enrolled courses (`student-enrollment-storage.ts`, `student-course-progress.ts`) |
| `DELETE` | `/api/website/my-courses/{course}/lessons/{lesson}/completion`            | `LessonController@incomplete`                                      | —                             | ApiResponse           | `sanctum, app:student, active-student` | Student enrolled courses (`student-enrollment-storage.ts`, `student-course-progress.ts`) |
| `GET     | HEAD`                                                                     | `/api/website/my-courses/{course}/lessons/{lesson}/media/{media}`  | `MediaController@show`        | —                     | ApiResponse                            | `sanctum, app:student, active-student`                                                   |

#### Module: `Orders` (5 routes)

| Method | Endpoint URI                                  | Controller Action                     | Validation (FormRequest)     | Response Resource   | Auth & Guards                          | Frontend Target & Mock Replaced           |
| :----- | :-------------------------------------------- | :------------------------------------ | :--------------------------- | :------------------ | :------------------------------------- | :---------------------------------------- |
| `GET   | HEAD`                                         | `/api/website/orders`                 | `OrderController@index`      | `IndexOrderRequest` | `OrderResource`                        | `sanctum, app:student, active-student`    |
| `POST` | `/api/website/orders`                         | `OrderController@store`               | `StoreOrderRequest`          | `OrderResource`     | `sanctum, app:student, active-student` | Course checkout flow & payment submission |
| `GET   | HEAD`                                         | `/api/website/orders/{order}`         | `OrderController@show`       | `IndexOrderRequest` | `OrderResource`                        | `sanctum, app:student, active-student`    |
| `POST` | `/api/website/orders/{order}/pay-with-wallet` | `OrderController@payWithWallet`       | `PayOrderWithWalletRequest`  | `OrderResource`     | `sanctum, app:student, active-student` | Course checkout flow & payment submission |
| `POST` | `/api/website/orders/{order}/payments`        | `OrderController@submitManualPayment` | `SubmitManualPaymentRequest` | `PaymentResource`   | `sanctum, app:student, active-student` | Course checkout flow & payment submission |

#### Module: `Payment-accounts` (1 routes)

| Method | Endpoint URI | Controller Action               | Validation (FormRequest)          | Response Resource   | Auth & Guards                    | Frontend Target & Mock Replaced        |
| :----- | :----------- | :------------------------------ | :-------------------------------- | :------------------ | :------------------------------- | :------------------------------------- |
| `GET   | HEAD`        | `/api/website/payment-accounts` | `OrderController@paymentAccounts` | `IndexOrderRequest` | `ProviderPaymentAccountResource` | `sanctum, app:student, active-student` |

#### Module: `Profile` (4 routes)

| Method  | Endpoint URI                    | Controller Action                  | Validation (FormRequest)    | Response Resource | Auth & Guards                          | Frontend Target & Mock Replaced                                        |
| :------ | :------------------------------ | :--------------------------------- | :-------------------------- | :---------------- | :------------------------------------- | :--------------------------------------------------------------------- |
| `GET    | HEAD`                           | `/api/website/profile`             | `ProfileController@show`    | —                 | `ProfileResource`                      | `sanctum, app:student, active-student`                                 |
| `PUT`   | `/api/website/profile`          | `ProfileController@update`         | `UpdateProfileRequest`      | `ProfileResource` | `sanctum, app:student, active-student` | Student profile page (`(student-dashboard)/student-dashboard/profile`) |
| `GET    | HEAD`                           | `/api/website/profile/options`     | `ProfileController@options` | `OptionsRequest`  | ApiResponse                            | `sanctum, app:student, active-student`                                 |
| `PATCH` | `/api/website/profile/password` | `ProfileController@updatePassword` | `UpdatePasswordRequest`     | `ProfileResource` | `sanctum, app:student, active-student` | Student profile page (`(student-dashboard)/student-dashboard/profile`) |

#### Module: `Wallet` (2 routes)

| Method | Endpoint URI | Controller Action                  | Validation (FormRequest)        | Response Resource               | Auth & Guards               | Frontend Target & Mock Replaced        |
| :----- | :----------- | :--------------------------------- | :------------------------------ | :------------------------------ | :-------------------------- | :------------------------------------- |
| `GET   | HEAD`        | `/api/website/wallet`              | `WalletController@show`         | `IndexWalletTransactionRequest` | `WalletResource`            | `sanctum, app:student, active-student` |
| `GET   | HEAD`        | `/api/website/wallet/transactions` | `WalletController@transactions` | `IndexWalletTransactionRequest` | `WalletTransactionResource` | `sanctum, app:student, active-student` |

### 2.3 Provider Dashboard APIs (151 Endpoints)

#### Module: `Activation-code-groups` (7 routes)

| Method | Endpoint URI                                                                         | Controller Action                                                            | Validation (FormRequest)              | Response Resource                 | Auth & Guards                 | Frontend Target & Mock Replaced                                                    |
| :----- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------ | :-------------------------------- | :---------------------------- | :--------------------------------------------------------------------------------- |
| `GET   | HEAD`                                                                                | `/api/dashboard/provider/activation-code-groups`                             | `ActivationCodeGroupController@index` | `IndexActivationCodeGroupRequest` | `ActivationCodeGroupResource` | `sanctum, dashboard:provider`                                                      |
| `POST` | `/api/dashboard/provider/activation-code-groups`                                     | `ActivationCodeGroupController@store`                                        | `StoreActivationCodeGroupRequest`     | `ActivationCodeGroupResource`     | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `GET   | HEAD`                                                                                | `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}`       | `ActivationCodeGroupController@show`  | —                                 | `ActivationCodeGroupResource` | `sanctum, dashboard:provider`                                                      |
| `GET   | HEAD`                                                                                | `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes` | `ActivationCodeController@index`      | `IndexActivationCodeRequest`      | `ActivationCodeResource`      | `sanctum, dashboard:provider`                                                      |
| `POST` | `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes`         | `ActivationCodeController@store`                                             | `StoreActivationCodeRequest`          | `ActivationCodeResource`          | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `POST` | `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/codes/bulk`    | `ActivationCodeController@bulkStore`                                         | `BulkStoreActivationCodeRequest`      | `ActivationCodeGroupResource`     | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `POST` | `/api/dashboard/provider/activation-code-groups/{activationCodeGroup}/generate-code` | `ActivationCodeController@generate`                                          | —                                     | ApiResponse                       | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |

#### Module: `Activation-codes` (5 routes)

| Method   | Endpoint URI                                                          | Controller Action                                           | Validation (FormRequest)        | Response Resource        | Auth & Guards                 | Frontend Target & Mock Replaced                                                    |
| :------- | :-------------------------------------------------------------------- | :---------------------------------------------------------- | :------------------------------ | :----------------------- | :---------------------------- | :--------------------------------------------------------------------------------- |
| `GET     | HEAD`                                                                 | `/api/dashboard/provider/activation-codes/{activationCode}` | `ActivationCodeController@show` | —                        | `ActivationCodeResource`      | `sanctum, dashboard:provider`                                                      |
| `PUT`    | `/api/dashboard/provider/activation-codes/{activationCode}`           | `ActivationCodeController@update`                           | `UpdateActivationCodeRequest`   | `ActivationCodeResource` | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `DELETE` | `/api/dashboard/provider/activation-codes/{activationCode}`           | `ActivationCodeController@destroy`                          | —                               | ApiResponse              | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `POST`   | `/api/dashboard/provider/activation-codes/{activationCode}/mark-sold` | `ActivationCodeController@markSold`                         | —                               | `ActivationCodeResource` | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |
| `POST`   | `/api/dashboard/provider/activation-codes/{activationCode}/mark-used` | `ActivationCodeController@markUsed`                         | —                               | `ActivationCodeResource` | `sanctum, dashboard:provider` | Code generation & groups (`activation-codes-storage.ts`, `code-groups-storage.ts`) |

#### Module: `Admins` (5 routes)

| Method   | Endpoint URI                             | Controller Action                        | Validation (FormRequest) | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :--------------------------------------- | :--------------------------------------- | :----------------------- | :---------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                    | `/api/dashboard/provider/admins`         | `AdminController@index`  | —                 | `AdminResource`               | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/admins`         | `AdminController@store`                  | `StoreAdminRequest`      | `AdminResource`   | `sanctum, dashboard:provider` | Staff accounts management       |
| `GET     | HEAD`                                    | `/api/dashboard/provider/admins/{admin}` | `AdminController@show`   | —                 | `AdminResource`               | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/admins/{admin}` | `AdminController@update`                 | `UpdateAdminRequest`     | `AdminResource`   | `sanctum, dashboard:provider` | Staff accounts management       |
| `DELETE` | `/api/dashboard/provider/admins/{admin}` | `AdminController@destroy`                | —                        | ApiResponse       | `sanctum, dashboard:provider` | Staff accounts management       |

#### Module: `Announcements` (5 routes)

| Method   | Endpoint URI                                           | Controller Action                                      | Validation (FormRequest)       | Response Resource      | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :----------------------------------------------------- | :----------------------------------------------------- | :----------------------------- | :--------------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                                  | `/api/dashboard/provider/announcements`                | `AnnouncementController@index` | —                      | `AnnouncementResource`        | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/announcements`                | `AnnouncementController@store`                         | `StoreAnnouncementRequest`     | `AnnouncementResource` | `sanctum, dashboard:provider` | Provider announcements manager  |
| `GET     | HEAD`                                                  | `/api/dashboard/provider/announcements/{announcement}` | `AnnouncementController@show`  | —                      | `AnnouncementResource`        | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/announcements/{announcement}` | `AnnouncementController@update`                        | `UpdateAnnouncementRequest`    | `AnnouncementResource` | `sanctum, dashboard:provider` | Provider announcements manager  |
| `DELETE` | `/api/dashboard/provider/announcements/{announcement}` | `AnnouncementController@destroy`                       | —                              | ApiResponse            | `sanctum, dashboard:provider` | Provider announcements manager  |

#### Module: `Auth` (2 routes)

| Method | Endpoint URI                          | Controller Action       | Validation (FormRequest) | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced                                     |
| :----- | :------------------------------------ | :---------------------- | :----------------------- | :---------------- | :---------------------------- | :------------------------------------------------------------------ |
| `POST` | `/api/dashboard/provider/auth/login`  | `AuthController@login`  | `LoginRequest`           | `AdminResource`   | `throttle`                    | Provider login/logout (`src/app/[locale]/(main)/(auth)/auth/login`) |
| `POST` | `/api/dashboard/provider/auth/logout` | `AuthController@logout` | —                        | ApiResponse       | `sanctum, dashboard:provider` | Provider login/logout (`src/app/[locale]/(main)/(auth)/auth/login`) |

#### Module: `Courses` (15 routes)

| Method   | Endpoint URI                                                  | Controller Action                                             | Validation (FormRequest)        | Response Resource       | Auth & Guards                 | Frontend Target & Mock Replaced                                |
| :------- | :------------------------------------------------------------ | :------------------------------------------------------------ | :------------------------------ | :---------------------- | :---------------------------- | :------------------------------------------------------------- |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses`                             | `CourseController@index`        | `IndexCourseRequest`    | `CourseResource`              | `sanctum, dashboard:provider`                                  |
| `POST`   | `/api/dashboard/provider/courses`                             | `CourseController@store`                                      | `StoreCourseRequest`            | `CourseResource`        | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses/options`                     | `CourseController@options`      | `CourseOptionsRequest`  | ApiResponse                   | `sanctum, dashboard:provider`                                  |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses/{course}`                    | `CourseController@show`         | —                       | `CourseResource`              | `sanctum, dashboard:provider`                                  |
| `PUT`    | `/api/dashboard/provider/courses/{course}`                    | `CourseController@update`                                     | `UpdateCourseRequest`           | `CourseResource`        | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `DELETE` | `/api/dashboard/provider/courses/{course}`                    | `CourseController@destroy`                                    | —                               | ApiResponse             | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses/{course}/content`            | `CourseController@content`      | —                       | `CourseResource`              | `sanctum, dashboard:provider`                                  |
| `PATCH`  | `/api/dashboard/provider/courses/{course}/publish`            | `CourseController@publish`                                    | —                               | `CourseResource`        | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `PATCH`  | `/api/dashboard/provider/courses/{course}/schedule`           | `CourseController@schedule`                                   | `ScheduleCourseRequest`         | `CourseResource`        | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses/{course}/sections`           | `CourseSectionController@index` | —                       | `CourseSectionResource`       | `sanctum, dashboard:provider`                                  |
| `POST`   | `/api/dashboard/provider/courses/{course}/sections`           | `CourseSectionController@store`                               | `StoreCourseSectionRequest`     | `CourseSectionResource` | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `PATCH`  | `/api/dashboard/provider/courses/{course}/sections/reorder`   | `CourseSectionController@reorder`                             | `ReorderCourseSectionsRequest`  | `CourseSectionResource` | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `GET     | HEAD`                                                         | `/api/dashboard/provider/courses/{course}/sections/{section}` | `CourseSectionController@show`  | —                       | `CourseSectionResource`       | `sanctum, dashboard:provider`                                  |
| `PUT`    | `/api/dashboard/provider/courses/{course}/sections/{section}` | `CourseSectionController@update`                              | `UpdateCourseSectionRequest`    | `CourseSectionResource` | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |
| `DELETE` | `/api/dashboard/provider/courses/{course}/sections/{section}` | `CourseSectionController@destroy`                             | —                               | ApiResponse             | `sanctum, dashboard:provider` | Course management (`courses-storage.ts`, `mockCoursesData.ts`) |

#### Module: `Dashboard` (1 routes)

| Method | Endpoint URI | Controller Action                              | Validation (FormRequest)         | Response Resource       | Auth & Guards            | Frontend Target & Mock Replaced |
| :----- | :----------- | :--------------------------------------------- | :------------------------------- | :---------------------- | :----------------------- | :------------------------------ |
| `GET   | HEAD`        | `/api/dashboard/provider/dashboard/statistics` | `DashboardController@statistics` | `IndexDashboardRequest` | `PaymentRequestResource` | `sanctum, dashboard:provider`   |

#### Module: `Educational-stages` (5 routes)

| Method   | Endpoint URI                                                    | Controller Action                                               | Validation (FormRequest)           | Response Resource          | Auth & Guards                 | Frontend Target & Mock Replaced       |
| :------- | :-------------------------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------- | :------------------------- | :---------------------------- | :------------------------------------ |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/educational-stages`                    | `EducationalStageController@index` | —                          | `EducationalStageResource`    | `sanctum, dashboard:provider`         |
| `POST`   | `/api/dashboard/provider/educational-stages`                    | `EducationalStageController@store`                              | `StoreEducationalStageRequest`     | `EducationalStageResource` | `sanctum, dashboard:provider` | Curriculum stages dropdowns & manager |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/educational-stages/{educationalStage}` | `EducationalStageController@show`  | —                          | `EducationalStageResource`    | `sanctum, dashboard:provider`         |
| `PUT`    | `/api/dashboard/provider/educational-stages/{educationalStage}` | `EducationalStageController@update`                             | `UpdateEducationalStageRequest`    | `EducationalStageResource` | `sanctum, dashboard:provider` | Curriculum stages dropdowns & manager |
| `DELETE` | `/api/dashboard/provider/educational-stages/{educationalStage}` | `EducationalStageController@destroy`                            | —                                  | ApiResponse                | `sanctum, dashboard:provider` | Curriculum stages dropdowns & manager |

#### Module: `Exam-attempts` (3 routes)

| Method  | Endpoint URI                                            | Controller Action                                 | Validation (FormRequest)      | Response Resource         | Auth & Guards                 | Frontend Target & Mock Replaced                        |
| :------ | :------------------------------------------------------ | :------------------------------------------------ | :---------------------------- | :------------------------ | :---------------------------- | :----------------------------------------------------- |
| `GET    | HEAD`                                                   | `/api/dashboard/provider/exam-attempts`           | `ExamAttemptController@index` | `IndexExamAttemptRequest` | `ExamAttemptResource`         | `sanctum, dashboard:provider`                          |
| `GET    | HEAD`                                                   | `/api/dashboard/provider/exam-attempts/{attempt}` | `ExamAttemptController@show`  | `IndexExamAttemptRequest` | `ExamAttemptResource`         | `sanctum, dashboard:provider`                          |
| `PATCH` | `/api/dashboard/provider/exam-attempts/{attempt}/grade` | `ExamAttemptController@grade`                     | `GradeExamAttemptRequest`     | `ExamAttemptResource`     | `sanctum, dashboard:provider` | Student exam review & grading (`mockExamStatsData.ts`) |

#### Module: `Exam-templates` (6 routes)

| Method   | Endpoint URI                                            | Controller Action                                               | Validation (FormRequest)         | Response Resource          | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :------------------------------------------------------ | :-------------------------------------------------------------- | :------------------------------- | :------------------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                                   | `/api/dashboard/provider/exam-templates`                        | `ExamTemplateController@index`   | `IndexExamTemplateRequest` | `ExamTemplateResource`        | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/exam-templates`                | `ExamTemplateController@store`                                  | `StoreExamTemplateRequest`       | `ExamTemplateResource`     | `sanctum, dashboard:provider` | Exam template library           |
| `GET     | HEAD`                                                   | `/api/dashboard/provider/exam-templates/{examTemplate}`         | `ExamTemplateController@show`    | —                          | `ExamTemplateResource`        | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/exam-templates/{examTemplate}` | `ExamTemplateController@update`                                 | `UpdateExamTemplateRequest`      | `ExamTemplateResource`     | `sanctum, dashboard:provider` | Exam template library           |
| `DELETE` | `/api/dashboard/provider/exam-templates/{examTemplate}` | `ExamTemplateController@destroy`                                | —                                | ApiResponse                | `sanctum, dashboard:provider` | Exam template library           |
| `GET     | HEAD`                                                   | `/api/dashboard/provider/exam-templates/{examTemplate}/prefill` | `ExamTemplateController@prefill` | —                          | `ExamTemplateResource`        | `sanctum, dashboard:provider`   |

#### Module: `Exams` (15 routes)

| Method   | Endpoint URI                                              | Controller Action                                         | Validation (FormRequest)       | Response Resource     | Auth & Guards                 | Frontend Target & Mock Replaced                          |
| :------- | :-------------------------------------------------------- | :-------------------------------------------------------- | :----------------------------- | :-------------------- | :---------------------------- | :------------------------------------------------------- |
| `GET     | HEAD`                                                     | `/api/dashboard/provider/exams`                           | `ExamController@index`         | `IndexExamRequest`    | `ExamResource`                | `sanctum, dashboard:provider`                            |
| `POST`   | `/api/dashboard/provider/exams`                           | `ExamController@store`                                    | `StoreExamRequest`             | `ExamResource`        | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `GET     | HEAD`                                                     | `/api/dashboard/provider/exams/options`                   | `ExamController@options`       | `ExamOptionsRequest`  | ApiResponse                   | `sanctum, dashboard:provider`                            |
| `GET     | HEAD`                                                     | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@show`          | —                     | `ExamResource`                | `sanctum, dashboard:provider`                            |
| `PUT`    | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@update`                                   | `UpdateExamRequest`            | `ExamResource`        | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `DELETE` | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@destroy`                                  | —                              | ApiResponse           | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/convert-to-course`  | `ExamController@convertToCourse`                          | `ConvertStandaloneExamRequest` | `ExamResource`        | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/publish`            | `ExamController@publish`                                  | —                              | `ExamResource`        | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/schedule`           | `ExamController@schedule`                                 | `ScheduleExamRequest`          | `ExamResource`        | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `GET     | HEAD`                                                     | `/api/dashboard/provider/exams/{exam}/sections`           | `ExamSectionController@index`  | —                     | `ExamSectionResource`         | `sanctum, dashboard:provider`                            |
| `POST`   | `/api/dashboard/provider/exams/{exam}/sections`           | `ExamSectionController@store`                             | `StoreExamSectionRequest`      | `ExamSectionResource` | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/sections/reorder`   | `ExamSectionController@reorder`                           | `ReorderExamSectionsRequest`   | `ExamSectionResource` | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `GET     | HEAD`                                                     | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@show`   | —                     | `ExamSectionResource`         | `sanctum, dashboard:provider`                            |
| `PUT`    | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@update`                            | `UpdateExamSectionRequest`     | `ExamSectionResource` | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |
| `DELETE` | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@destroy`                           | —                              | ApiResponse           | `sanctum, dashboard:provider` | Exam management (`exams-storage.ts`, `mockExamsData.ts`) |

#### Module: `Finance` (2 routes)

| Method | Endpoint URI | Controller Action                             | Validation (FormRequest)        | Response Resource      | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :-------------------------------------------- | :------------------------------ | :--------------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/dashboard/provider/finance/instructors` | `FinanceController@instructors` | `FinanceReportRequest` | ApiResponse   | `sanctum, dashboard:provider`   |
| `GET   | HEAD`        | `/api/dashboard/provider/finance/summary`     | `FinanceController@summary`     | `FinanceReportRequest` | ApiResponse   | `sanctum, dashboard:provider`   |

#### Module: `Lesson-templates` (6 routes)

| Method   | Endpoint URI                                                | Controller Action                                                   | Validation (FormRequest)           | Response Resource            | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :---------------------------------------------------------- | :------------------------------------------------------------------ | :--------------------------------- | :--------------------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                                       | `/api/dashboard/provider/lesson-templates`                          | `LessonTemplateController@index`   | `IndexLessonTemplateRequest` | `LessonTemplateResource`      | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/lesson-templates`                  | `LessonTemplateController@store`                                    | `StoreLessonTemplateRequest`       | `LessonTemplateResource`     | `sanctum, dashboard:provider` | Lesson template library         |
| `GET     | HEAD`                                                       | `/api/dashboard/provider/lesson-templates/{lessonTemplate}`         | `LessonTemplateController@show`    | —                            | `LessonTemplateResource`      | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/lesson-templates/{lessonTemplate}` | `LessonTemplateController@update`                                   | `UpdateLessonTemplateRequest`      | `LessonTemplateResource`     | `sanctum, dashboard:provider` | Lesson template library         |
| `DELETE` | `/api/dashboard/provider/lesson-templates/{lessonTemplate}` | `LessonTemplateController@destroy`                                  | —                                  | ApiResponse                  | `sanctum, dashboard:provider` | Lesson template library         |
| `GET     | HEAD`                                                       | `/api/dashboard/provider/lesson-templates/{lessonTemplate}/prefill` | `LessonTemplateController@prefill` | —                            | `LessonTemplateResource`      | `sanctum, dashboard:provider`   |

#### Module: `Lessons` (7 routes)

| Method   | Endpoint URI                               | Controller Action                          | Validation (FormRequest)   | Response Resource      | Auth & Guards                 | Frontend Target & Mock Replaced                                |
| :------- | :----------------------------------------- | :----------------------------------------- | :------------------------- | :--------------------- | :---------------------------- | :------------------------------------------------------------- |
| `GET     | HEAD`                                      | `/api/dashboard/provider/lessons`          | `LessonController@index`   | `IndexLessonRequest`   | `LessonResource`              | `sanctum, dashboard:provider`                                  |
| `POST`   | `/api/dashboard/provider/lessons`          | `LessonController@store`                   | `StoreLessonRequest`       | `LessonResource`       | `sanctum, dashboard:provider` | Lesson management (`lessons-storage.ts`, `mockLessonsData.ts`) |
| `GET     | HEAD`                                      | `/api/dashboard/provider/lessons/options`  | `LessonController@options` | `LessonOptionsRequest` | ApiResponse                   | `sanctum, dashboard:provider`                                  |
| `PATCH`  | `/api/dashboard/provider/lessons/reorder`  | `LessonController@reorder`                 | `ReorderLessonsRequest`    | `LessonResource`       | `sanctum, dashboard:provider` | Lesson management (`lessons-storage.ts`, `mockLessonsData.ts`) |
| `GET     | HEAD`                                      | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@show`    | —                      | `LessonResource`              | `sanctum, dashboard:provider`                                  |
| `PUT`    | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@update`                  | `UpdateLessonRequest`      | `LessonResource`       | `sanctum, dashboard:provider` | Lesson management (`lessons-storage.ts`, `mockLessonsData.ts`) |
| `DELETE` | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@destroy`                 | —                          | ApiResponse            | `sanctum, dashboard:provider` | Lesson management (`lessons-storage.ts`, `mockLessonsData.ts`) |

#### Module: `Media` (1 routes)

| Method | Endpoint URI | Controller Action                       | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :-------------------------------------- | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/dashboard/provider/media/{media}` | `MediaController@show`   | —                 | ApiResponse   | `sanctum, dashboard:provider`   |

#### Module: `Notifications` (3 routes)

| Method   | Endpoint URI                                                | Controller Action                       | Validation (FormRequest)       | Response Resource          | Auth & Guards                 | Frontend Target & Mock Replaced    |
| :------- | :---------------------------------------------------------- | :-------------------------------------- | :----------------------------- | :------------------------- | :---------------------------- | :--------------------------------- |
| `GET     | HEAD`                                                       | `/api/dashboard/provider/notifications` | `NotificationController@index` | `IndexNotificationRequest` | `NotificationResource`        | `sanctum, dashboard:provider`      |
| `DELETE` | `/api/dashboard/provider/notifications/{notification}`      | `NotificationController@destroy`        | `ManageNotificationRequest`    | ApiResponse                | `sanctum, dashboard:provider` | Notifications dispatch & broadcast |
| `PATCH`  | `/api/dashboard/provider/notifications/{notification}/read` | `NotificationController@markAsRead`     | `ManageNotificationRequest`    | `NotificationResource`     | `sanctum, dashboard:provider` | Notifications dispatch & broadcast |

#### Module: `Orders` (2 routes)

| Method | Endpoint URI | Controller Action                        | Validation (FormRequest) | Response Resource   | Auth & Guards   | Frontend Target & Mock Replaced |
| :----- | :----------- | :--------------------------------------- | :----------------------- | :------------------ | :-------------- | :------------------------------ |
| `GET   | HEAD`        | `/api/dashboard/provider/orders`         | `OrderController@index`  | `IndexOrderRequest` | `OrderResource` | `sanctum, dashboard:provider`   |
| `GET   | HEAD`        | `/api/dashboard/provider/orders/{order}` | `OrderController@show`   | —                   | `OrderResource` | `sanctum, dashboard:provider`   |

#### Module: `Payment-accounts` (4 routes)

| Method   | Endpoint URI                                                | Controller Action                          | Validation (FormRequest)         | Response Resource                | Auth & Guards                    | Frontend Target & Mock Replaced                      |
| :------- | :---------------------------------------------------------- | :----------------------------------------- | :------------------------------- | :------------------------------- | :------------------------------- | :--------------------------------------------------- |
| `GET     | HEAD`                                                       | `/api/dashboard/provider/payment-accounts` | `PaymentAccountController@index` | —                                | `ProviderPaymentAccountResource` | `sanctum, dashboard:provider`                        |
| `POST`   | `/api/dashboard/provider/payment-accounts`                  | `PaymentAccountController@store`           | `StorePaymentAccountRequest`     | `ProviderPaymentAccountResource` | `sanctum, dashboard:provider`    | Provider bank accounts setup (`settings-storage.ts`) |
| `PUT`    | `/api/dashboard/provider/payment-accounts/{paymentAccount}` | `PaymentAccountController@update`          | `UpdatePaymentAccountRequest`    | `ProviderPaymentAccountResource` | `sanctum, dashboard:provider`    | Provider bank accounts setup (`settings-storage.ts`) |
| `DELETE` | `/api/dashboard/provider/payment-accounts/{paymentAccount}` | `PaymentAccountController@destroy`         | —                                | ApiResponse                      | `sanctum, dashboard:provider`    | Provider bank accounts setup (`settings-storage.ts`) |

#### Module: `Payment-requests` (1 routes)

| Method | Endpoint URI | Controller Action                          | Validation (FormRequest)     | Response Resource     | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :----------------------------------------- | :--------------------------- | :-------------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/dashboard/provider/payment-requests` | `PaymentController@requests` | `IndexPaymentRequest` | ApiResponse   | `sanctum, dashboard:provider`   |

#### Module: `Payments` (5 routes)

| Method | Endpoint URI                                         | Controller Action                                  | Validation (FormRequest)  | Response Resource     | Auth & Guards                 | Frontend Target & Mock Replaced      |
| :----- | :--------------------------------------------------- | :------------------------------------------------- | :------------------------ | :-------------------- | :---------------------------- | :----------------------------------- |
| `GET   | HEAD`                                                | `/api/dashboard/provider/payments`                 | `PaymentController@index` | `IndexPaymentRequest` | ApiResponse                   | `sanctum, dashboard:provider`        |
| `GET   | HEAD`                                                | `/api/dashboard/provider/payments/{payment}`       | `PaymentController@show`  | —                     | `PaymentResource`             | `sanctum, dashboard:provider`        |
| `POST` | `/api/dashboard/provider/payments/{payment}/approve` | `PaymentController@approve`                        | —                         | `PaymentResource`     | `sanctum, dashboard:provider` | Manual payment review / verification |
| `GET   | HEAD`                                                | `/api/dashboard/provider/payments/{payment}/proof` | `PaymentController@proof` | —                     | ApiResponse                   | `sanctum, dashboard:provider`        |
| `POST` | `/api/dashboard/provider/payments/{payment}/reject`  | `PaymentController@reject`                         | `RejectPaymentRequest`    | `PaymentResource`     | `sanctum, dashboard:provider` | Manual payment review / verification |

#### Module: `Platform-settings` (5 routes)

| Method   | Endpoint URI                                                              | Controller Action                                  | Validation (FormRequest)         | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced                                       |
| :------- | :------------------------------------------------------------------------ | :------------------------------------------------- | :------------------------------- | :---------------- | :---------------------------- | :-------------------------------------------------------------------- |
| `GET     | HEAD`                                                                     | `/api/dashboard/provider/platform-settings`        | `PlatformSettingController@show` | —                 | ApiResponse                   | `sanctum, dashboard:provider`                                         |
| `PUT`    | `/api/dashboard/provider/platform-settings`                               | `PlatformSettingController@update`                 | `UpdatePlatformSettingRequest`   | ApiResponse       | `sanctum, dashboard:provider` | Platform configuration (`settings-storage.ts`, `mockSettingsData.ts`) |
| `POST`   | `/api/dashboard/provider/platform-settings/additional-links`              | `PlatformSettingController@addAdditionalLink`      | `StoreAdditionalLinkRequest`     | ApiResponse       | `sanctum, dashboard:provider` | Platform configuration (`settings-storage.ts`, `mockSettingsData.ts`) |
| `DELETE` | `/api/dashboard/provider/platform-settings/additional-links/{identifier}` | `PlatformSettingController@deleteAdditionalLink`   | —                                | ApiResponse       | `sanctum, dashboard:provider` | Platform configuration (`settings-storage.ts`, `mockSettingsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/platform-settings/languages`                     | `PlatformSettingController@updateSupportedLocales` | `UpdateSupportedLocalesRequest`  | ApiResponse       | `sanctum, dashboard:provider` | Platform configuration (`settings-storage.ts`, `mockSettingsData.ts`) |

#### Module: `Profile` (6 routes)

| Method  | Endpoint URI                                   | Controller Action                                | Validation (FormRequest)              | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced      |
| :------ | :--------------------------------------------- | :----------------------------------------------- | :------------------------------------ | :---------------- | :---------------------------- | :----------------------------------- |
| `GET    | HEAD`                                          | `/api/dashboard/provider/profile`                | `ProfileController@getProfile`        | —                 | `AdminResource`               | `sanctum, dashboard:provider`        |
| `PUT`   | `/api/dashboard/provider/profile`              | `ProfileController@update`                       | `UpdateProfileRequest`                | `AdminResource`   | `sanctum, dashboard:provider` | Provider admin profile & preferences |
| `PATCH` | `/api/dashboard/provider/profile/dark-mode`    | `ProfileController@updateDarkModePreference`     | `UpdateDarkModePreferenceRequest`     | `AdminResource`   | `sanctum, dashboard:provider` | Provider admin profile & preferences |
| `PATCH` | `/api/dashboard/provider/profile/locale`       | `ProfileController@changeLocale`                 | `ChangeLocaleRequest`                 | `AdminResource`   | `sanctum, dashboard:provider` | Provider admin profile & preferences |
| `PATCH` | `/api/dashboard/provider/profile/notification` | `ProfileController@updateNotificationPreference` | `UpdateNotificationPreferenceRequest` | `AdminResource`   | `sanctum, dashboard:provider` | Provider admin profile & preferences |
| `PATCH` | `/api/dashboard/provider/profile/password`     | `ProfileController@updatePassword`               | `UpdatePasswordRequest`               | `AdminResource`   | `sanctum, dashboard:provider` | Provider admin profile & preferences |

#### Module: `Question-templates` (6 routes)

| Method   | Endpoint URI                                                    | Controller Action                                                       | Validation (FormRequest)             | Response Resource              | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :-------------------------------------------------------------- | :---------------------------------------------------------------------- | :----------------------------------- | :----------------------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/question-templates`                            | `QuestionTemplateController@index`   | `IndexQuestionTemplateRequest` | `QuestionTemplateResource`    | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/question-templates`                    | `QuestionTemplateController@store`                                      | `StoreQuestionTemplateRequest`       | `QuestionTemplateResource`     | `sanctum, dashboard:provider` | Question template library       |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/question-templates/{questionTemplate}`         | `QuestionTemplateController@show`    | —                              | `QuestionTemplateResource`    | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/question-templates/{questionTemplate}` | `QuestionTemplateController@update`                                     | `UpdateQuestionTemplateRequest`      | `QuestionTemplateResource`     | `sanctum, dashboard:provider` | Question template library       |
| `DELETE` | `/api/dashboard/provider/question-templates/{questionTemplate}` | `QuestionTemplateController@destroy`                                    | —                                    | ApiResponse                    | `sanctum, dashboard:provider` | Question template library       |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/question-templates/{questionTemplate}/prefill` | `QuestionTemplateController@prefill` | —                              | `QuestionTemplateResource`    | `sanctum, dashboard:provider`   |

#### Module: `Questions` (7 routes)

| Method   | Endpoint URI                                   | Controller Action                              | Validation (FormRequest)     | Response Resource        | Auth & Guards                 | Frontend Target & Mock Replaced        |
| :------- | :--------------------------------------------- | :--------------------------------------------- | :--------------------------- | :----------------------- | :---------------------------- | :------------------------------------- |
| `GET     | HEAD`                                          | `/api/dashboard/provider/questions`            | `QuestionController@index`   | `IndexQuestionRequest`   | `QuestionResource`            | `sanctum, dashboard:provider`          |
| `POST`   | `/api/dashboard/provider/questions`            | `QuestionController@store`                     | `StoreQuestionRequest`       | `QuestionResource`       | `sanctum, dashboard:provider` | Question bank (`questions-storage.ts`) |
| `GET     | HEAD`                                          | `/api/dashboard/provider/questions/options`    | `QuestionController@options` | `QuestionOptionsRequest` | ApiResponse                   | `sanctum, dashboard:provider`          |
| `PATCH`  | `/api/dashboard/provider/questions/reorder`    | `QuestionController@reorder`                   | `ReorderQuestionsRequest`    | `QuestionResource`       | `sanctum, dashboard:provider` | Question bank (`questions-storage.ts`) |
| `GET     | HEAD`                                          | `/api/dashboard/provider/questions/{question}` | `QuestionController@show`    | —                        | `QuestionResource`            | `sanctum, dashboard:provider`          |
| `PUT`    | `/api/dashboard/provider/questions/{question}` | `QuestionController@update`                    | `UpdateQuestionRequest`      | `QuestionResource`       | `sanctum, dashboard:provider` | Question bank (`questions-storage.ts`) |
| `DELETE` | `/api/dashboard/provider/questions/{question}` | `QuestionController@destroy`                   | —                            | ApiResponse              | `sanctum, dashboard:provider` | Question bank (`questions-storage.ts`) |

#### Module: `Roles` (6 routes)

| Method   | Endpoint URI                           | Controller Action                           | Validation (FormRequest)     | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :------------------------------------- | :------------------------------------------ | :--------------------------- | :---------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                  | `/api/dashboard/provider/roles`             | `RoleController@index`       | —                 | `RoleResource`                | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/roles`        | `RoleController@store`                      | `StoreRoleRequest`           | `RoleResource`    | `sanctum, dashboard:provider` | RBAC roles & permissions        |
| `GET     | HEAD`                                  | `/api/dashboard/provider/roles/permissions` | `RoleController@permissions` | —                 | ApiResponse                   | `sanctum, dashboard:provider`   |
| `GET     | HEAD`                                  | `/api/dashboard/provider/roles/{role}`      | `RoleController@show`        | —                 | `RoleResource`                | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/roles/{role}` | `RoleController@update`                     | `UpdateRoleRequest`          | `RoleResource`    | `sanctum, dashboard:provider` | RBAC roles & permissions        |
| `DELETE` | `/api/dashboard/provider/roles/{role}` | `RoleController@destroy`                    | —                            | ApiResponse       | `sanctum, dashboard:provider` | RBAC roles & permissions        |

#### Module: `Students` (10 routes)

| Method   | Endpoint URI                                                    | Controller Action                                                | Validation (FormRequest)        | Response Resource               | Auth & Guards                 | Frontend Target & Mock Replaced                                                       |
| :------- | :-------------------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------ | :------------------------------ | :---------------------------- | :------------------------------------------------------------------------------------ |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/students`                               | `StudentController@index`       | `IndexStudentRequest`           | `StudentResource`             | `sanctum, dashboard:provider`                                                         |
| `POST`   | `/api/dashboard/provider/students`                              | `StudentController@store`                                        | `StoreStudentRequest`           | `StudentResource`               | `sanctum, dashboard:provider` | Student directory & wallet adjustments (`students-storage.ts`, `mockStudentsData.ts`) |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/students/options`                       | `StudentController@options`     | `StudentOptionsRequest`         | ApiResponse                   | `sanctum, dashboard:provider`                                                         |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/students/{student}`                     | `StudentController@show`        | —                               | `StudentResource`             | `sanctum, dashboard:provider`                                                         |
| `PUT`    | `/api/dashboard/provider/students/{student}`                    | `StudentController@update`                                       | `UpdateStudentRequest`          | `StudentResource`               | `sanctum, dashboard:provider` | Student directory & wallet adjustments (`students-storage.ts`, `mockStudentsData.ts`) |
| `DELETE` | `/api/dashboard/provider/students/{student}`                    | `StudentController@destroy`                                      | —                               | ApiResponse                     | `sanctum, dashboard:provider` | Student directory & wallet adjustments (`students-storage.ts`, `mockStudentsData.ts`) |
| `PATCH`  | `/api/dashboard/provider/students/{student}/status`             | `StudentController@updateStatus`                                 | `UpdateStudentStatusRequest`    | `StudentResource`               | `sanctum, dashboard:provider` | Student directory & wallet adjustments (`students-storage.ts`, `mockStudentsData.ts`) |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/students/{student}/wallet`              | `WalletController@show`         | —                               | `WalletResource`              | `sanctum, dashboard:provider`                                                         |
| `POST`   | `/api/dashboard/provider/students/{student}/wallet/adjustments` | `WalletController@adjust`                                        | `AdjustWalletRequest`           | `WalletTransactionResource`     | `sanctum, dashboard:provider` | Student directory & wallet adjustments (`students-storage.ts`, `mockStudentsData.ts`) |
| `GET     | HEAD`                                                           | `/api/dashboard/provider/students/{student}/wallet/transactions` | `WalletController@transactions` | `IndexWalletTransactionRequest` | `WalletTransactionResource`   | `sanctum, dashboard:provider`                                                         |

#### Module: `Subjects` (5 routes)

| Method   | Endpoint URI                                 | Controller Action                            | Validation (FormRequest)  | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced         |
| :------- | :------------------------------------------- | :------------------------------------------- | :------------------------ | :---------------- | :---------------------------- | :-------------------------------------- |
| `GET     | HEAD`                                        | `/api/dashboard/provider/subjects`           | `SubjectController@index` | —                 | `SubjectResource`             | `sanctum, dashboard:provider`           |
| `POST`   | `/api/dashboard/provider/subjects`           | `SubjectController@store`                    | `StoreSubjectRequest`     | `SubjectResource` | `sanctum, dashboard:provider` | Curriculum subjects dropdowns & manager |
| `GET     | HEAD`                                        | `/api/dashboard/provider/subjects/{subject}` | `SubjectController@show`  | —                 | `SubjectResource`             | `sanctum, dashboard:provider`           |
| `PUT`    | `/api/dashboard/provider/subjects/{subject}` | `SubjectController@update`                   | `UpdateSubjectRequest`    | `SubjectResource` | `sanctum, dashboard:provider` | Curriculum subjects dropdowns & manager |
| `DELETE` | `/api/dashboard/provider/subjects/{subject}` | `SubjectController@destroy`                  | —                         | ApiResponse       | `sanctum, dashboard:provider` | Curriculum subjects dropdowns & manager |

#### Module: `Teachers` (6 routes)

| Method   | Endpoint URI                                 | Controller Action                            | Validation (FormRequest)    | Response Resource | Auth & Guards                 | Frontend Target & Mock Replaced |
| :------- | :------------------------------------------- | :------------------------------------------- | :-------------------------- | :---------------- | :---------------------------- | :------------------------------ |
| `GET     | HEAD`                                        | `/api/dashboard/provider/teachers`           | `TeacherController@index`   | —                 | `TeacherResource`             | `sanctum, dashboard:provider`   |
| `POST`   | `/api/dashboard/provider/teachers`           | `TeacherController@store`                    | `StoreTeacherRequest`       | `TeacherResource` | `sanctum, dashboard:provider` | Teacher roster & dropdowns      |
| `GET     | HEAD`                                        | `/api/dashboard/provider/teachers/options`   | `TeacherController@options` | —                 | ApiResponse                   | `sanctum, dashboard:provider`   |
| `GET     | HEAD`                                        | `/api/dashboard/provider/teachers/{teacher}` | `TeacherController@show`    | —                 | `TeacherResource`             | `sanctum, dashboard:provider`   |
| `PUT`    | `/api/dashboard/provider/teachers/{teacher}` | `TeacherController@update`                   | `UpdateTeacherRequest`      | `TeacherResource` | `sanctum, dashboard:provider` | Teacher roster & dropdowns      |
| `DELETE` | `/api/dashboard/provider/teachers/{teacher}` | `TeacherController@destroy`                  | —                           | ApiResponse       | `sanctum, dashboard:provider` | Teacher roster & dropdowns      |

### 2.4 Admin Dashboard (Super Admin) APIs (44 Endpoints)

#### Module: `Admins` (5 routes)

| Method   | Endpoint URI                          | Controller Action                     | Validation (FormRequest) | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :------------------------------------ | :------------------------------------ | :----------------------- | :---------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                 | `/api/dashboard/admin/admins`         | `AdminController@index`  | —                 | `AdminResource`            | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/admins`         | `AdminController@store`               | `StoreAdminRequest`      | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                 | `/api/dashboard/admin/admins/{admin}` | `AdminController@show`   | —                 | `AdminResource`            | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/admins/{admin}` | `AdminController@update`              | `UpdateAdminRequest`     | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/admins/{admin}` | `AdminController@destroy`             | —                        | ApiResponse       | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Auth` (2 routes)

| Method | Endpoint URI                       | Controller Action       | Validation (FormRequest) | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :----- | :--------------------------------- | :---------------------- | :----------------------- | :---------------- | :------------------------- | :------------------------------ |
| `POST` | `/api/dashboard/admin/auth/login`  | `AuthController@login`  | `LoginRequest`           | `AdminResource`   | `throttle`                 | Super Admin management portal   |
| `POST` | `/api/dashboard/admin/auth/logout` | `AuthController@logout` | —                        | ApiResponse       | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Countries` (5 routes)

| Method   | Endpoint URI                               | Controller Action                          | Validation (FormRequest)  | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :----------------------------------------- | :----------------------------------------- | :------------------------ | :---------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                      | `/api/dashboard/admin/countries`           | `CountryController@index` | —                 | `CountryResource`          | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/countries`           | `CountryController@store`                  | `StoreCountryRequest`     | `CountryResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                      | `/api/dashboard/admin/countries/{country}` | `CountryController@show`  | —                 | `CountryResource`          | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/countries/{country}` | `CountryController@update`                 | `UpdateCountryRequest`    | `CountryResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/countries/{country}` | `CountryController@destroy`                | —                         | ApiResponse       | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Educational-stages` (5 routes)

| Method   | Endpoint URI                                                 | Controller Action                                            | Validation (FormRequest)           | Response Resource          | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :--------------------------------- | :------------------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                                        | `/api/dashboard/admin/educational-stages`                    | `EducationalStageController@index` | —                          | `EducationalStageResource` | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/educational-stages`                    | `EducationalStageController@store`                           | `StoreEducationalStageRequest`     | `EducationalStageResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                                        | `/api/dashboard/admin/educational-stages/{educationalStage}` | `EducationalStageController@show`  | —                          | `EducationalStageResource` | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/educational-stages/{educationalStage}` | `EducationalStageController@update`                          | `UpdateEducationalStageRequest`    | `EducationalStageResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/educational-stages/{educationalStage}` | `EducationalStageController@destroy`                         | —                                  | ApiResponse                | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Governorates` (5 routes)

| Method   | Endpoint URI                                      | Controller Action                                 | Validation (FormRequest)      | Response Resource         | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :------------------------------------------------ | :------------------------------------------------ | :---------------------------- | :------------------------ | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                             | `/api/dashboard/admin/governorates`               | `GovernorateController@index` | `IndexGovernorateRequest` | `GovernorateResource`      | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/governorates`               | `GovernorateController@store`                     | `StoreGovernorateRequest`     | `GovernorateResource`     | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                             | `/api/dashboard/admin/governorates/{governorate}` | `GovernorateController@show`  | —                         | `GovernorateResource`      | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/governorates/{governorate}` | `GovernorateController@update`                    | `UpdateGovernorateRequest`    | `GovernorateResource`     | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/governorates/{governorate}` | `GovernorateController@destroy`                   | —                             | ApiResponse               | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Profile` (6 routes)

| Method  | Endpoint URI                                | Controller Action                                | Validation (FormRequest)              | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :------ | :------------------------------------------ | :----------------------------------------------- | :------------------------------------ | :---------------- | :------------------------- | :------------------------------ |
| `GET    | HEAD`                                       | `/api/dashboard/admin/profile`                   | `ProfileController@getProfile`        | —                 | `AdminResource`            | `sanctum, dashboard:admin`      |
| `PUT`   | `/api/dashboard/admin/profile`              | `ProfileController@update`                       | `UpdateProfileRequest`                | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `PATCH` | `/api/dashboard/admin/profile/dark-mode`    | `ProfileController@updateDarkModePreference`     | `UpdateDarkModePreferenceRequest`     | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `PATCH` | `/api/dashboard/admin/profile/locale`       | `ProfileController@changeLocale`                 | `ChangeLocaleRequest`                 | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `PATCH` | `/api/dashboard/admin/profile/notification` | `ProfileController@updateNotificationPreference` | `UpdateNotificationPreferenceRequest` | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |
| `PATCH` | `/api/dashboard/admin/profile/password`     | `ProfileController@updatePassword`               | `UpdatePasswordRequest`               | `AdminResource`   | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Providers` (5 routes)

| Method   | Endpoint URI                                | Controller Action                           | Validation (FormRequest)   | Response Resource  | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :------------------------------------------ | :------------------------------------------ | :------------------------- | :----------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                       | `/api/dashboard/admin/providers`            | `ProviderController@index` | —                  | `ProviderResource`         | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/providers`            | `ProviderController@store`                  | `StoreProviderRequest`     | `ProviderResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                       | `/api/dashboard/admin/providers/{provider}` | `ProviderController@show`  | —                  | `ProviderResource`         | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/providers/{provider}` | `ProviderController@update`                 | `UpdateProviderRequest`    | `ProviderResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/providers/{provider}` | `ProviderController@destroy`                | —                          | ApiResponse        | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Roles` (6 routes)

| Method   | Endpoint URI                        | Controller Action                        | Validation (FormRequest)     | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :---------------------------------- | :--------------------------------------- | :--------------------------- | :---------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                               | `/api/dashboard/admin/roles`             | `RoleController@index`       | —                 | `RoleResource`             | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/roles`        | `RoleController@store`                   | `StoreRoleRequest`           | `RoleResource`    | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                               | `/api/dashboard/admin/roles/permissions` | `RoleController@permissions` | —                 | ApiResponse                | `sanctum, dashboard:admin`      |
| `GET     | HEAD`                               | `/api/dashboard/admin/roles/{role}`      | `RoleController@show`        | —                 | `RoleResource`             | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/roles/{role}` | `RoleController@update`                  | `UpdateRoleRequest`          | `RoleResource`    | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/roles/{role}` | `RoleController@destroy`                 | —                            | ApiResponse       | `sanctum, dashboard:admin` | Super Admin management portal   |

#### Module: `Subjects` (5 routes)

| Method   | Endpoint URI                              | Controller Action                         | Validation (FormRequest)  | Response Resource | Auth & Guards              | Frontend Target & Mock Replaced |
| :------- | :---------------------------------------- | :---------------------------------------- | :------------------------ | :---------------- | :------------------------- | :------------------------------ |
| `GET     | HEAD`                                     | `/api/dashboard/admin/subjects`           | `SubjectController@index` | —                 | `SubjectResource`          | `sanctum, dashboard:admin`      |
| `POST`   | `/api/dashboard/admin/subjects`           | `SubjectController@store`                 | `StoreSubjectRequest`     | `SubjectResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `GET     | HEAD`                                     | `/api/dashboard/admin/subjects/{subject}` | `SubjectController@show`  | —                 | `SubjectResource`          | `sanctum, dashboard:admin`      |
| `PUT`    | `/api/dashboard/admin/subjects/{subject}` | `SubjectController@update`                | `UpdateSubjectRequest`    | `SubjectResource` | `sanctum, dashboard:admin` | Super Admin management portal   |
| `DELETE` | `/api/dashboard/admin/subjects/{subject}` | `SubjectController@destroy`               | —                         | ApiResponse       | `sanctum, dashboard:admin` | Super Admin management portal   |

### 2.5 Utility APIs (1 Endpoints)

#### Module: `Root` (1 routes)

| Method | Endpoint URI | Controller Action | Validation (FormRequest) | Response Resource | Auth & Guards | Frontend Target & Mock Replaced |
| :----- | :----------- | :---------------- | :----------------------- | :---------------- | :------------ | :------------------------------ |
| `GET   | HEAD`        | `/api/user`       | `Closure@`               | —                 | ApiResponse   | `sanctum`                       |

---

## 3. Frontend LocalStorage & Mock Data Assimilation Matrix

| Frontend Mock / Storage File            | LocalStorage Key / Mock Source | Replaced by Backend API Endpoints                                                         | Migration Complexity                                                                         |
| :-------------------------------------- | :----------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| `src/lib/courses-storage.ts`            | `rewaa_courses_`               | `GET                                                                                      | POST /api/dashboard/provider/courses`, `GET /courses/options`, `PUT /courses/{course}`       |
| `src/lib/lessons-storage.ts`            | `rewaa_lessons_`               | `GET                                                                                      | POST /api/dashboard/provider/lessons`, `GET /lessons/options`, `PUT /lessons/{lesson}`       |
| `src/lib/exams-storage.ts`              | `rewaa_exams_`                 | `GET                                                                                      | POST /api/dashboard/provider/exams`, `GET /exams/options`, `PUT /exams/{exam}`               |
| `src/lib/questions-storage.ts`          | `rewaa_questions_`             | `GET                                                                                      | POST /api/dashboard/provider/questions`, `GET /questions/options`, question templates        |
| `src/lib/students-storage.ts`           | `rewaa_students_`              | `GET                                                                                      | POST /api/dashboard/provider/students`, `PATCH /students/{student}/status`, wallet endpoints |
| `src/lib/activation-codes-storage.ts`   | `rewaa_activation_codes_`      | `GET /api/dashboard/provider/activation-codes`, `/export`, `PATCH /{code}/status`         | Medium (Batch export, status toggle)                                                         |
| `src/lib/code-groups-storage.ts`        | `rewaa_code_groups_`           | `GET                                                                                      | POST /api/dashboard/provider/activation-code-groups`                                         |
| `src/lib/billing-requests-storage.ts`   | `rewaa_billing_requests_`      | `GET /api/dashboard/provider/orders`, `POST /payments/{payment}/approve`, `reject`        | Medium (Receipt image view, approve/reject mutation)                                         |
| `src/lib/financial-summary-storage.ts`  | `rewaa_financial_summary_`     | `GET /api/dashboard/provider/finance/summary`, `/finance/transactions`                    | Low (KPI cards & revenue charts)                                                             |
| `src/lib/settings-storage.ts`           | `rewaa_settings_`              | `GET                                                                                      | PUT /api/dashboard/provider/platform-settings`, `payment-accounts`                           |
| `src/lib/student-enrollment-storage.ts` | `rewaa_student_enrollment`     | `GET /api/website/my-courses`, `POST /api/website/orders`                                 | High (Course purchase checkout, enrollment check)                                            |
| `src/lib/student-course-progress.ts`    | `rewaa_student_progress`       | `GET /api/website/my-courses/{course}/content`, `POST/DELETE lessons/{lesson}/completion` | High (Curriculum tree, checkmark sync, exam attempt result)                                  |

---

## 4. Next Phases Execution Roadmap

- **Phase 2: Request & Response Schemas & Core Infrastructure**
  - Complete schema definition for every FormRequest (validation rules, types, defaults, required vs optional).
  - Response schemas for every JsonResource, including nested relationships, timestamps, and translatable attributes.
  - Reconfiguration of `src/lib/apiClient.ts` (Sanctum Bearer token storage & injection, `Accept-Language` headers, envelope unwrapping).
- **Phase 3: Provider Dashboard Assimilation Deep Dive**
  - Detailed endpoint-by-endpoint guide for Courses, Lessons, Exams, Questions, Students, Codes, Finance, and Settings.
  - TanStack Query hook design, optimistic updates, and cache invalidation strategies.
- **Phase 4: Website & Student Portal Assimilation Deep Dive**
  - Public catalog browsing, student authentication, my-courses learning player, exam taker engine, checkout & wallet payment flow.
- **Phase 5: Super Admin Dashboard & System Shared APIs Assimilation**
  - Admin multi-tenant governance, provider onboarding, global taxonomy, and shared reference data.
