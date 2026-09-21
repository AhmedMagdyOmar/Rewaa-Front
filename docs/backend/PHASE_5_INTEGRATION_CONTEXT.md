# Rewaa Platform: Phase 5 Integration Context & Reference Document

## Operations, Finance, Activation Codes & Platform Settings

> **Document Purpose**: This document provides an exhaustive, authoritative technical context for **Phase 5 of the Frontend-Backend Integration Plan** (Provider Operations, Students Directory, Activation Codes, Billing/Finance Ledger & Platform Settings). It documents all backend endpoints, validation schemas, frontend component touchpoints, mock files to deprecate, type mappings, and architectural patterns so future sessions and tasks have complete context.
>
> **Target Path**: `frontend/docs/backend/PHASE_5_INTEGRATION_CONTEXT.md`  
> **Created**: September 2026  
> **Backend Framework**: Laravel 12 (PHP 8.3+) with Sanctum (`can:dashboard:provider`), Spatie MediaLibrary, Astrotomic Translatable  
> **Frontend Framework**: Next.js 16 (App Router), TanStack Query v5, Axios (`apiClient`), TypeScript, Tailwind CSS, `next-intl`

---

## 1. Scope & Core Objectives of Phase 5

In Phase 5, we transition all remaining Provider Dashboard Operational, Financial, Code Generation, and Settings modules from client-side LocalStorage and mock datasets to live Laravel backend endpoints.

### Objectives:

1. **Students Directory & Management**:
   - Live paginated student roster with server-side filters (country, governorate, stage, registration type, status, search).
   - Student manual creation and profile updating (`multipart/form-data` with avatar).
   - Student status toggling (`PATCH /status` -> active/suspended).
   - Student Wallet ledger & adjustments (`POST /wallet/adjustments` with direction, amount, reason, idempotency key).
2. **Activation Codes & Batch Management**:
   - Activation Code Groups listing and creation (`POST /api/dashboard/provider/activation-code-groups`).
   - Group Codes listing with status tabs (`available`, `sold`, `used`).
   - Bulk cryptographic code generation (`POST /activation-code-groups/{group}/codes/bulk` and `/codes`).
   - Status updates (`/mark-sold`, `/mark-used`, `PUT /activation-codes/{code}`).
3. **Billing, Orders, Payments & Financial Reports**:
   - Orders list & detail views (`/api/dashboard/provider/orders`).
   - Payment receipts verification queue (`/api/dashboard/provider/payments` & `/payment-requests`).
   - Payment approvals (`POST /payments/{payment}/approve` -> automatically provisions course enrollment) and rejections (`POST /payments/{payment}/reject` with reason).
   - Payment proof preview (`GET /payments/{payment}/proof`).
   - Provider payment accounts configuration (`/api/dashboard/provider/payment-accounts` -> Instapay, Vodafone Cash, Bank Accounts).
   - Financial Ledger & KPIs (`/api/dashboard/provider/finance/summary`, `/finance/instructors`).
4. **Platform Settings, Staff & Profile**:
   - Educational stages (`/api/dashboard/provider/educational-stages`) and Subjects (`/api/dashboard/provider/subjects`) CRUD.
   - Staff / Admins / Assistants accounts management (`/api/dashboard/provider/admins`, `/roles`, `/roles/permissions`).
   - Announcements manager (`/api/dashboard/provider/announcements` with image uploads and max 3 active rules).
   - Platform Settings (`/api/dashboard/provider/platform-settings` -> social links, terms, about us, supported languages).
   - Provider Admin Profile (`/api/dashboard/provider/profile`, `/dark-mode`, `/locale`, `/password`, `/notification`).

---

## 2. Mock Storage Files & Deprecation Targets

| Mock / Storage File                                                                                                    | Replaced By Backend API Endpoints                                                                                                                           | Impacted Frontend Views & Components                                                                                                                                                  |
| :--------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/students-storage.ts` & `mockStudentsData.ts`                                                                  | `/api/dashboard/provider/students/*`, `/wallet/*`                                                                                                           | `src/components/dashboard/students/*`, `manage-students-client.tsx`, `student-details-client.tsx`, `student-form.tsx`, `balance-transaction-dialog.tsx`                               |
| `src/lib/activation-codes-storage.ts`, `code-groups-storage.ts`, `mockActivationCodesData.ts`, `mockCodeGroupsData.ts` | `/api/dashboard/provider/activation-code-groups/*`, `/activation-codes/*`                                                                                   | `src/components/dashboard/courses/codes/*`, `group-codes-client.tsx`, `create-batch-codes-dialog.tsx`, `create-code-dialog.tsx`, `edit-code-dialog.tsx`                               |
| `src/lib/billing-requests-storage.ts`, `financial-summary-storage.ts`                                                  | `/api/dashboard/provider/payments/*`, `/orders/*`, `/payment-requests/*`, `/finance/*`                                                                      | `src/components/dashboard/billing/*`, `billing-requests-client.tsx`, `billing-summary-client.tsx`, `request-details-modal.tsx`                                                        |
| `src/lib/settings-storage.ts`, `mockSettingsData.ts`                                                                   | `/api/dashboard/provider/educational-stages/*`, `/subjects/*`, `/admins/*`, `/announcements/*`, `/platform-settings/*`, `/profile/*`, `/payment-accounts/*` | `src/components/dashboard/settings/*`, `teachers-section.tsx`, `assistants-section.tsx`, `grades-section.tsx`, `subjects-section.tsx`, `announcements-section.tsx`, `platform-info/*` |

---

## 3. Backend API Route Catalog & Endpoints Specifications

### 3.1. Students & Student Wallet Module

| Method         | Endpoint URI                                                     | Controller & Action              | Form Request / Rules                                                                                                                                                                                                                          | Resource Envelope                                        |
| :------------- | :--------------------------------------------------------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `GET`          | `/api/dashboard/provider/students`                               | `StudentController@index`        | `IndexStudentRequest` (`search`, `country_id`, `governorate_id`, `educational_stage_id`, `registration_type`, `status`, `sort`, `per_page`, `page`)                                                                                           | `PaginatedResponse<StudentResource>`                     |
| `GET`          | `/api/dashboard/provider/students/options`                       | `StudentController@options`      | `StudentOptionsRequest` (`country_id`)                                                                                                                                                                                                        | `ApiResponse<{ countries, stages, registration_types }>` |
| `POST`         | `/api/dashboard/provider/students`                               | `StudentController@store`        | `StoreStudentRequest` (`first_name`, `last_name`, `phone_code`, `phone`, `parent_phone_code`, `parent_phone`, `email`, `password`, `gender`, `country_id`, `governorate_id`, `educational_stage_id`, `registration_type`, `status`, `avatar`) | `StudentResource`                                        |
| `GET`          | `/api/dashboard/provider/students/{student}`                     | `StudentController@show`         | —                                                                                                                                                                                                                                             | `StudentResource` (with enrollments, stats, wallet)      |
| `POST` / `PUT` | `/api/dashboard/provider/students/{student}`                     | `StudentController@update`       | `UpdateStudentRequest` (`_method=PUT` for multipart with `avatar`, `remove_avatar`)                                                                                                                                                           | `StudentResource`                                        |
| `DELETE`       | `/api/dashboard/provider/students/{student}`                     | `StudentController@destroy`      | —                                                                                                                                                                                                                                             | `ApiResponse<{ message }>`                               |
| `PATCH`        | `/api/dashboard/provider/students/{student}/status`              | `StudentController@updateStatus` | `UpdateStudentStatusRequest` (`status`: `"active"` \| `"suspended"`)                                                                                                                                                                          | `StudentResource`                                        |
| `GET`          | `/api/dashboard/provider/students/{student}/wallet`              | `WalletController@show`          | —                                                                                                                                                                                                                                             | `WalletResource` (`balance`, `currency_code`)            |
| `POST`         | `/api/dashboard/provider/students/{student}/wallet/adjustments`  | `WalletController@adjust`        | `AdjustWalletRequest` (`direction`: `"credit"` \| `"debit"`, `amount`: number, `reason`: `"manual_adjustment"`, `notes`?: string, `idempotency_key`: string)                                                                                  | `WalletTransactionResource`                              |
| `GET`          | `/api/dashboard/provider/students/{student}/wallet/transactions` | `WalletController@transactions`  | `IndexWalletTransactionRequest` (`direction`, `reason`, `per_page`, `page`)                                                                                                                                                                   | `PaginatedResponse<WalletTransactionResource>`           |

---

### 3.2. Activation Codes & Groups Module

| Method   | Endpoint URI                                                           | Controller & Action                   | Form Request / Rules                                                                                         | Resource Envelope                                |
| :------- | :--------------------------------------------------------------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `GET`    | `/api/dashboard/provider/activation-code-groups`                       | `ActivationCodeGroupController@index` | `IndexActivationCodeGroupRequest` (`search`, `course_id`, `sort`, `per_page`, `page`)                        | `PaginatedResponse<ActivationCodeGroupResource>` |
| `POST`   | `/api/dashboard/provider/activation-code-groups`                       | `ActivationCodeGroupController@store` | `StoreActivationCodeGroupRequest` (`course_id`, `price`, `quantity`, `prefix`?, `expires_at`)                | `ActivationCodeGroupResource`                    |
| `GET`    | `/api/dashboard/provider/activation-code-groups/{group}`               | `ActivationCodeGroupController@show`  | —                                                                                                            | `ActivationCodeGroupResource`                    |
| `GET`    | `/api/dashboard/provider/activation-code-groups/{group}/codes`         | `ActivationCodeController@index`      | `IndexActivationCodeRequest` (`search`, `status`: `"available"` \| `"sold"` \| `"used"`, `per_page`, `page`) | `PaginatedResponse<ActivationCodeResource>`      |
| `POST`   | `/api/dashboard/provider/activation-code-groups/{group}/codes`         | `ActivationCodeController@store`      | `StoreActivationCodeRequest` (`code`?, `price`, `expires_at`)                                                | `ActivationCodeResource`                         |
| `POST`   | `/api/dashboard/provider/activation-code-groups/{group}/codes/bulk`    | `ActivationCodeController@bulkStore`  | `BulkStoreActivationCodeRequest` (`quantity`, `price`, `expires_at`)                                         | `ActivationCodeGroupResource`                    |
| `POST`   | `/api/dashboard/provider/activation-code-groups/{group}/generate-code` | `ActivationCodeController@generate`   | —                                                                                                            | `ApiResponse<{ code: string }>`                  |
| `GET`    | `/api/dashboard/provider/activation-codes/{code}`                      | `ActivationCodeController@show`       | —                                                                                                            | `ActivationCodeResource`                         |
| `PUT`    | `/api/dashboard/provider/activation-codes/{code}`                      | `ActivationCodeController@update`     | `UpdateActivationCodeRequest` (`code`, `price`, `status`, `expires_at`)                                      | `ActivationCodeResource`                         |
| `DELETE` | `/api/dashboard/provider/activation-codes/{code}`                      | `ActivationCodeController@destroy`    | —                                                                                                            | `ApiResponse<{ message }>`                       |
| `POST`   | `/api/dashboard/provider/activation-codes/{code}/mark-sold`            | `ActivationCodeController@markSold`   | —                                                                                                            | `ActivationCodeResource`                         |
| `POST`   | `/api/dashboard/provider/activation-codes/{code}/mark-used`            | `ActivationCodeController@markUsed`   | —                                                                                                            | `ActivationCodeResource`                         |

---

### 3.3. Billing, Payments, Orders & Financial Reports

| Method   | Endpoint URI                                         | Controller & Action                | Form Request / Rules                                                                                                                                                                                        | Resource Envelope                               |
| :------- | :--------------------------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| `GET`    | `/api/dashboard/provider/orders`                     | `OrderController@index`            | `IndexOrderRequest` (`status`, `student_id`, `instructor_id`, `date_from`, `date_to`, `per_page`, `page`)                                                                                                   | `PaginatedResponse<OrderResource>`              |
| `GET`    | `/api/dashboard/provider/orders/{order}`             | `OrderController@show`             | —                                                                                                                                                                                                           | `OrderResource` (with items, payments, student) |
| `GET`    | `/api/dashboard/provider/payments`                   | `PaymentController@index`          | `IndexPaymentRequest` (`status`: `"pending"` \| `"approved"` \| `"rejected"`, `method`, `student_id`, `instructor_id`, `search`, `date_from`, `date_to`, `sort`, `per_page`, `page`)                        | `PaginatedResponse<PaymentResource>`            |
| `GET`    | `/api/dashboard/provider/payment-requests`           | `PaymentController@requests`       | `IndexPaymentRequest` (Pending receipt approvals list)                                                                                                                                                      | `PaginatedResponse<PaymentResource>`            |
| `GET`    | `/api/dashboard/provider/payments/{payment}`         | `PaymentController@show`           | —                                                                                                                                                                                                           | `PaymentResource`                               |
| `POST`   | `/api/dashboard/provider/payments/{payment}/approve` | `PaymentController@approve`        | — (Approves payment and executes student enrollment)                                                                                                                                                        | `PaymentResource`                               |
| `POST`   | `/api/dashboard/provider/payments/{payment}/reject`  | `PaymentController@reject`         | `RejectPaymentRequest` (`reason`: string)                                                                                                                                                                   | `PaymentResource`                               |
| `GET`    | `/api/dashboard/provider/payments/{payment}/proof`   | `PaymentController@proof`          | — (Returns file download/stream or binary URL)                                                                                                                                                              | Binary Stream / URL                             |
| `GET`    | `/api/dashboard/provider/payment-accounts`           | `PaymentAccountController@index`   | —                                                                                                                                                                                                           | `ApiResponse<ProviderPaymentAccountResource[]>` |
| `POST`   | `/api/dashboard/provider/payment-accounts`           | `PaymentAccountController@store`   | `StorePaymentAccountRequest` (`type`: `"bank"` \| `"instapay"` \| `"vodafone_cash"` \| `"wallet"`, `account_name`: { ar, en }, `account_number`: string, `instructions`?: { ar, en }, `is_active`: boolean) | `ProviderPaymentAccountResource`                |
| `PUT`    | `/api/dashboard/provider/payment-accounts/{account}` | `PaymentAccountController@update`  | `UpdatePaymentAccountRequest`                                                                                                                                                                               | `ProviderPaymentAccountResource`                |
| `DELETE` | `/api/dashboard/provider/payment-accounts/{account}` | `PaymentAccountController@destroy` | —                                                                                                                                                                                                           | `ApiResponse<{ message }>`                      |
| `GET`    | `/api/dashboard/provider/finance/summary`            | `FinanceController@summary`        | `FinanceReportRequest` (`year`?, `instructor_id`?, `date_from`?, `date_to`?)                                                                                                                                | `ApiResponse<FinanceSummaryResource>`           |
| `GET`    | `/api/dashboard/provider/finance/instructors`        | `FinanceController@instructors`    | `FinanceReportRequest`                                                                                                                                                                                      | `ApiResponse<InstructorFinanceSummary[]>`       |

---

### 3.4. Platform Settings, Announcements, Academic Config & Staff

| Method   | Endpoint URI                                                      | Controller & Action                              | Form Request / Rules                                                                                                                                                                                     | Resource Envelope                         |
| :------- | :---------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| `GET`    | `/api/dashboard/provider/educational-stages`                      | `EducationalStageController@index`               | —                                                                                                                                                                                                        | `ApiResponse<EducationalStageResource[]>` |
| `POST`   | `/api/dashboard/provider/educational-stages`                      | `EducationalStageController@store`               | `StoreEducationalStageRequest` (`name`: { ar, en }, `desc`?: { ar, en }, `academic_year`?: number, `is_active`?: boolean, `image`?: File)                                                                | `EducationalStageResource`                |
| `PUT`    | `/api/dashboard/provider/educational-stages/{stage}`              | `EducationalStageController@update`              | `UpdateEducationalStageRequest`                                                                                                                                                                          | `EducationalStageResource`                |
| `DELETE` | `/api/dashboard/provider/educational-stages/{stage}`              | `EducationalStageController@destroy`             | —                                                                                                                                                                                                        | `ApiResponse<{ message }>`                |
| `GET`    | `/api/dashboard/provider/subjects`                                | `SubjectController@index`                        | —                                                                                                                                                                                                        | `ApiResponse<SubjectResource[]>`          |
| `POST`   | `/api/dashboard/provider/subjects`                                | `SubjectController@store`                        | `StoreSubjectRequest` (`name`: { ar, en }, `desc`?: { ar, en }, `educational_stage_ids`?: number[], `is_active`?: boolean, `image`?: File)                                                               | `SubjectResource`                         |
| `PUT`    | `/api/dashboard/provider/subjects/{subject}`                      | `SubjectController@update`                       | `UpdateSubjectRequest`                                                                                                                                                                                   | `SubjectResource`                         |
| `DELETE` | `/api/dashboard/provider/subjects/{subject}`                      | `SubjectController@destroy`                      | —                                                                                                                                                                                                        | `ApiResponse<{ message }>`                |
| `GET`    | `/api/dashboard/provider/admins`                                  | `AdminController@index`                          | —                                                                                                                                                                                                        | `ApiResponse<AdminResource[]>`            |
| `POST`   | `/api/dashboard/provider/admins`                                  | `AdminController@store`                          | `StoreAdminRequest` (`full_name`, `email`, `national_id`?, `phone_code`?, `phone`?, `password`, `is_active`, `role_ids`?, `permissions`?)                                                                | `AdminResource`                           |
| `PUT`    | `/api/dashboard/provider/admins/{admin}`                          | `AdminController@update`                         | `UpdateAdminRequest`                                                                                                                                                                                     | `AdminResource`                           |
| `DELETE` | `/api/dashboard/provider/admins/{admin}`                          | `AdminController@destroy`                        | —                                                                                                                                                                                                        | `ApiResponse<{ message }>`                |
| `GET`    | `/api/dashboard/provider/roles`                                   | `RoleController@index`                           | —                                                                                                                                                                                                        | `ApiResponse<RoleResource[]>`             |
| `GET`    | `/api/dashboard/provider/roles/permissions`                       | `RoleController@permissions`                     | —                                                                                                                                                                                                        | `ApiResponse<string[]>`                   |
| `GET`    | `/api/dashboard/provider/announcements`                           | `AnnouncementController@index`                   | —                                                                                                                                                                                                        | `ApiResponse<AnnouncementResource[]>`     |
| `POST`   | `/api/dashboard/provider/announcements`                           | `AnnouncementController@store`                   | `StoreAnnouncementRequest` (`title`: { ar, en }, `details`: { ar, en }, `link`?, `is_active`: boolean, `image`?: File)                                                                                   | `AnnouncementResource`                    |
| `PUT`    | `/api/dashboard/provider/announcements/{announcement}`            | `AnnouncementController@update`                  | `UpdateAnnouncementRequest`                                                                                                                                                                              | `AnnouncementResource`                    |
| `DELETE` | `/api/dashboard/provider/announcements/{announcement}`            | `AnnouncementController@destroy`                 | —                                                                                                                                                                                                        | `ApiResponse<{ message }>`                |
| `GET`    | `/api/dashboard/provider/platform-settings`                       | `PlatformSettingController@show`                 | —                                                                                                                                                                                                        | `ApiResponse<PlatformSettingsResource>`   |
| `PUT`    | `/api/dashboard/provider/platform-settings`                       | `PlatformSettingController@update`               | `UpdatePlatformSettingRequest` (`support_phone_code`, `support_phone`, `whatsapp_phone_code`, `whatsapp_phone`, `facebook_url`, `instagram_url`, `tiktok_url`, `about`: { ar, en }, `terms`: { ar, en }) | `ApiResponse<PlatformSettingsResource>`   |
| `POST`   | `/api/dashboard/provider/platform-settings/additional-links`      | `PlatformSettingController@addAdditionalLink`    | `StoreAdditionalLinkRequest` (`title`: { ar, en }, `url`: string)                                                                                                                                        | `ApiResponse`                             |
| `DELETE` | `/api/dashboard/provider/platform-settings/additional-links/{id}` | `PlatformSettingController@deleteAdditionalLink` | —                                                                                                                                                                                                        | `ApiResponse`                             |
| `GET`    | `/api/dashboard/provider/profile`                                 | `ProfileController@getProfile`                   | —                                                                                                                                                                                                        | `AdminResource`                           |
| `PUT`    | `/api/dashboard/provider/profile`                                 | `ProfileController@update`                       | `UpdateProfileRequest` (`full_name`, `email`, `phone_code`, `phone`, `flag` / avatar)                                                                                                                    | `AdminResource`                           |
| `PATCH`  | `/api/dashboard/provider/profile/password`                        | `ProfileController@updatePassword`               | `UpdatePasswordRequest` (`current_password`, `password`, `password_confirmation`)                                                                                                                        | `AdminResource`                           |

---

## 4. TanStack Query Keys Design (`queryKeys.provider`)

From `src/lib/api/queryKeys.ts`:

```typescript
export const queryKeys = {
  provider: {
    all: ["provider"] as const,
    profile: () => [...queryKeys.provider.all, "profile"] as const,
    settings: () => [...queryKeys.provider.all, "settings"] as const,

    // Students Directory & Wallet
    students: {
      all: () => [...queryKeys.provider.all, "students"] as const,
      list: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.students.all(), "list", filters ?? {}] as const,
      detail: (id: number | string) =>
        [...queryKeys.provider.students.all(), "detail", id] as const,
      options: (countryId?: number | string) =>
        [...queryKeys.provider.students.all(), "options", { countryId }] as const,
      wallet: (id: number | string) =>
        [...queryKeys.provider.students.detail(id), "wallet"] as const,
      transactions: (id: number | string, filters?: Record<string, unknown>) =>
        [...queryKeys.provider.students.detail(id), "transactions", filters ?? {}] as const,
    },

    // Activation Codes
    codes: {
      all: () => [...queryKeys.provider.all, "codes"] as const,
      groups: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.codes.all(), "groups", filters ?? {}] as const,
      groupDetail: (id: number | string) =>
        [...queryKeys.provider.codes.all(), "groupDetail", id] as const,
      groupCodes: (groupId: number | string, filters?: Record<string, unknown>) =>
        [...queryKeys.provider.codes.all(), "group", groupId, filters ?? {}] as const,
    },

    // Finance, Payments & Orders
    finance: {
      all: () => [...queryKeys.provider.all, "finance"] as const,
      orders: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "orders", filters ?? {}] as const,
      orderDetail: (id: number | string) =>
        [...queryKeys.provider.finance.all(), "order", id] as const,
      payments: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "payments", filters ?? {}] as const,
      paymentRequests: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "paymentRequests", filters ?? {}] as const,
      paymentAccounts: () => [...queryKeys.provider.finance.all(), "paymentAccounts"] as const,
      summary: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "summary", filters ?? {}] as const,
      instructorsSummary: (filters?: Record<string, unknown>) =>
        [...queryKeys.provider.finance.all(), "instructorsSummary", filters ?? {}] as const,
    },

    // Settings Submodules
    stages: () => [...queryKeys.provider.all, "stages"] as const,
    subjects: () => [...queryKeys.provider.all, "subjects"] as const,
    admins: () => [...queryKeys.provider.all, "admins"] as const,
    roles: () => [...queryKeys.provider.all, "roles"] as const,
    permissions: () => [...queryKeys.provider.all, "permissions"] as const,
    announcements: () => [...queryKeys.provider.all, "announcements"] as const,
    platformSettings: () => [...queryKeys.provider.all, "platformSettings"] as const,
  },
};
```

---

## 5. Implementation Roadmap for Phase 5 Sub-Modules

### Sub-Module 5.1: Students Directory & Wallet Adjustments

- **Hooks**: `src/hooks/use-students.ts` (queries for list, details, options, wallet, transactions; mutations for create, update, delete, status toggle, wallet adjustment).
- **Adapters**: `src/lib/adapters/student-adapter.ts` (normalizing backend `StudentResource` and `WalletTransactionResource` to UI models).
- **Views**:
  - `src/components/dashboard/students/manage-students-client.tsx`
  - `src/components/dashboard/students/student-details-client.tsx`
  - `src/components/dashboard/students/student-form.tsx` (`new-student-client.tsx`, `edit-student-client.tsx`)
  - `src/components/dashboard/students/balance-transaction-dialog.tsx`
  - `src/components/dashboard/students/delete-student-dialog.tsx`

### Sub-Module 5.2: Activation Codes & Batch Groups

- **Hooks**: `src/hooks/use-activation-codes.ts` (queries for groups list, group detail, group codes list; mutations for create group, bulk generate codes, single code CRUD, mark sold/used).
- **Adapters**: `src/lib/adapters/activation-code-adapter.ts`.
- **Views**:
  - `src/components/dashboard/courses/codes/group-codes-client.tsx`
  - `src/components/dashboard/courses/codes/create-batch-codes-dialog.tsx`
  - `src/components/dashboard/courses/codes/create-code-dialog.tsx`
  - `src/components/dashboard/courses/codes/edit-code-dialog.tsx`
  - `src/components/dashboard/courses/codes/delete-code-dialog.tsx`

### Sub-Module 5.3: Billing, Payments Queue & Finance Summary

- **Hooks**: `src/hooks/use-billing.ts` and `src/hooks/use-finance.ts` (queries for orders, payments, payment requests, payment accounts, finance summary; mutations for approve payment, reject payment, payment accounts CRUD).
- **Adapters**: `src/lib/adapters/billing-adapter.ts`.
- **Views**:
  - `src/components/dashboard/billing/billing-requests-client.tsx`
  - `src/components/dashboard/billing/billing-summary-client.tsx`
  - `src/components/dashboard/billing/request-details-modal.tsx`
  - `src/components/dashboard/students/student-invoice-modal.tsx`

### Sub-Module 5.4: Platform Settings, Staff & Profile

- **Hooks**: `src/hooks/use-settings.ts` (queries & mutations for stages, subjects, admins, roles, announcements, platform settings, profile).
- **Adapters**: `src/lib/adapters/settings-adapter.ts`.
- **Views**:
  - `src/components/dashboard/settings/teachers-section.tsx` & `teacher-dialog.tsx`
  - `src/components/dashboard/settings/assistants-section.tsx` & `assistant-dialog.tsx`
  - `src/components/dashboard/settings/grades-section.tsx` & `grade-dialog.tsx`
  - `src/components/dashboard/settings/subjects-section.tsx` & `subject-dialog.tsx`
  - `src/components/dashboard/settings/announcements-section.tsx` & `announcement-dialog.tsx`
  - `src/components/dashboard/settings/platform-info/*` (`communication-group.tsx`, `terms-group.tsx`, `who-we-are-group.tsx`, `add-link-dialog.tsx`)

---

## 6. Key Gotchas & Technical Guidelines

1. **Bilingual Form Data**:
   - Backend expects `{ ar: string, en: string }` or nested `title[ar]`, `title[en]` for translatable models (stages, subjects, announcements, platform settings).
2. **File Uploads & Method Spoofing**:
   - When updating models with file uploads (student avatar, stage image, subject image, announcement cover), always use `FormData` with `_method: "PUT"` and dispatch via `POST`.
3. **Idempotency Keys**:
   - Wallet adjustments (`POST /wallet/adjustments`) require an `idempotency_key` (e.g. `crypto.randomUUID()`) to prevent accidental double-credits or debits.
4. **Cache Invalidation Flow**:
   - Approving a payment receipt (`POST /payments/{payment}/approve`) must invalidate `queryKeys.provider.finance.payments()`, `queryKeys.provider.finance.paymentRequests()`, `queryKeys.provider.students.detail()`, and `queryKeys.provider.finance.summary()`.
5. **Pagination & Filters**:
   - Ensure table components preserve pagination query params (`page`, `per_page`) alongside URL state and search debounce filters.
