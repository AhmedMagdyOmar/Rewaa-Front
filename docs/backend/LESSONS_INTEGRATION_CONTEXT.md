# Rewaa Platform: Lessons Engine Integration Context & Reference

> **Document Purpose**: This file provides an authoritative reference for the **Lessons Engine** (Phase 4 of the Frontend-Backend Integration Plan). It captures all domain rules, backend API contracts, frontend component mappings, file locations, and state management workflows so that any future conversation or agent can immediately resume work without re-reading the entire codebase from scratch.
>
> **Target Path**: `frontend/docs/backend/LESSONS_INTEGRATION_CONTEXT.md`  
> **Last Updated**: September 2026  
> **Backend Framework**: Laravel 12 (PHP 8.3+) with Spatie MediaLibrary, Astrotomic Translatable  
> **Frontend Framework**: Next.js 16 (App Router), TanStack Query v5, Axios, TypeScript, Tailwind CSS

---

## 1. Executive Architecture & Single Source of Truth

The Rewaa platform previously stored and managed lessons via client-side mock data and LocalStorage (`src/lib/lessons-storage.ts`, `src/lib/mockLessonsData.ts`). The goal of this phase is to eliminate all localStorage and mock dependencies for lessons and establish the Laravel backend as the single source of truth.

Lessons operate in two distinct architectural modes:

1. **Standalone Lessons** (`classification = 'standalone'`):
   - Independent lessons created from `/dashboard/lessons/new`.
   - Owned by the provider / instructor.
   - Directly associated with an `educational_stage_id`, a `subject_id`, and a `delivery_mode` (`onsite`, `online`, `hybrid`).
   - Not bound to any specific course or course section (`course_id` and `course_section_id` are `null`).
2. **Course Curriculum Lessons** (`classification = 'course'`):
   - Lessons created or attached inside a specific course's curriculum (Step 2 of Course Builder or Course Edit at `/dashboard/courses/[id]`).
   - Bound directly to `course_id` and `course_section_id`.
   - Inherit `educational_stage_id`, `subject_id`, `instructor_id`, and `delivery_mode` directly from the parent Course.
   - Reorderable within their course section via drag-and-drop / position index.

---

## 2. Backend API Inventory & Exact Contracts

All provider lesson endpoints require authentication (`auth:sanctum`, role `dashboard:provider`).

### 2.1. Endpoints Summary Table

| Method   | Endpoint                                   | Controller Action                | Purpose                                                                |
| :------- | :----------------------------------------- | :------------------------------- | :--------------------------------------------------------------------- |
| `GET`    | `/api/dashboard/provider/lessons`          | `LessonController@index`         | Paginated roster with search, filter tabs, and status counts           |
| `GET`    | `/api/dashboard/provider/lessons/options`  | `LessonController@options`       | Preloading stages, subjects, instructors, courses, sections, and exams |
| `POST`   | `/api/dashboard/provider/lessons`          | `LessonController@store`         | Create lesson (`multipart/form-data` or JSON)                          |
| `GET`    | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@show`          | Retrieve full lesson details with relations & media                    |
| `PUT`    | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@update`        | Update lesson (or POST with `_method: PUT` for FormData)               |
| `DELETE` | `/api/dashboard/provider/lessons/{lesson}` | `LessonController@destroy`       | Soft-delete a lesson                                                   |
| `PATCH`  | `/api/dashboard/provider/lessons/reorder`  | `LessonController@reorder`       | Reorder lessons within a section or group                              |
| `GET`    | `/api/dashboard/provider/lesson-templates` | `LessonTemplateController@index` | List reusable lesson templates                                         |
| `POST`   | `/api/dashboard/provider/lesson-templates` | `LessonTemplateController@store` | Create reusable lesson template                                        |

---

### 2.2. Query Parameters (`GET /api/dashboard/provider/lessons`)

Supported by `IndexLessonRequest`:

- `search` (string, optional): Full-text search matching lesson title, subject name, course title, or instructor full name.
- `status` (string, optional): `'draft'` | `'scheduled'` | `'published'`.
- `statuses` (array, optional): Filter by multiple statuses e.g. `['draft', 'scheduled']`.
- `classification` (string, optional): `'standalone'` | `'course'`.
- `course_id` (integer, optional): Filter lessons within a specific course.
- `course_section_id` (integer, optional): Filter lessons within a specific course section.
- `sort` (string, optional): `'latest'` (default, descending by id) or `'oldest'`.
- `page` (integer, optional): 1-indexed page number.
- `per_page` (integer, optional): Items per page (default 12, max 100).

#### Response Envelope

```json
{
  "status": 200,
  "message": "",
  "data": {
    "lessons": [
      /* Array of LessonResource objects */
    ],
    "status_counts": {
      "all": 25,
      "published": 18,
      "draft": 5,
      "scheduled": 2,
      "draft_and_scheduled": 7
    },
    "pagination": {
      "current_page": 1,
      "last_page": 3,
      "per_page": 12,
      "total": 25
    }
  }
}
```

---

### 2.3. Options Response (`GET /api/dashboard/provider/lessons/options`)

Supported query param: `educational_stage_id` (optional integer to cascade filter subjects/exams).

Returns:

- `classifications`: `{ "standalone": "مستقل", "course": "مرتبط بدورة" }`
- `lesson_types`: `{ "video_and_text": "فيديو مع نص", "text_only": "نص فقط" }`
- `delivery_modes`: `{ "onsite": "حضوري", "online": "أونلاين", "hybrid": "مدمج" }`
- `statuses`: `{ "draft": "مسودة", "scheduled": "مجدول", "published": "منشور" }`
- `educational_stages`: `Array<{ id: number, name: Record<string, string> }>`
- `subjects`: `Array<{ id: number, name: Record<string, string> }>`
- `instructors`: `Array<{ id: number, full_name: string }>`
- `courses`: `Array<{ id: number, title: Record<string, string>, instructor_id: number, instructor: { id, full_name }, sections: Array<{ id, title, position }> }>`
- `exams`: `Array<{ id: number, title: Record<string, string>, passing_percentage: number, course_id, instructor_id, educational_stage_id, subject_id }>`

---

### 2.4. Creation / Update Request Payload (`POST / PUT /api/dashboard/provider/lessons`)

Handled by `LessonRequest`:

| Field                                      | Type      | Required / Rules                                                         | Description                                           |
| :----------------------------------------- | :-------- | :----------------------------------------------------------------------- | :---------------------------------------------------- |
| `classification`                           | string    | `required`, `standalone` or `course`                                     | Determines association rules                          |
| `course_id`                                | integer   | Required if `classification === 'course'`, Prohibited if `standalone`    | Target course ID                                      |
| `course_section_id`                        | integer   | Required if `classification === 'course'`, Prohibited if `standalone`    | Target section ID                                     |
| `educational_stage_id`                     | integer   | Required if `standalone`, Prohibited/Auto if `course`                    | Academic stage ID                                     |
| `subject_id`                               | integer   | Required if `standalone`, Prohibited/Auto if `course`                    | Subject ID                                            |
| `instructor_id`                            | integer   | Optional/Required if multi-instructor, Prohibited if `course`            | Instructor user ID                                    |
| `delivery_mode`                            | string    | Required if `standalone`: `onsite` \| `online` \| `hybrid`               | Delivery mode                                         |
| `type`                                     | string    | `required`: `video_and_text` \| `text_only`                              | Lesson content format                                 |
| `title[ar]`                                | string    | `required`, max 255                                                      | Arabic title                                          |
| `title[en]`                                | string    | `required` (or fallback to Arabic), max 255                              | English title                                         |
| `description[ar]`                          | string    | `nullable`, text                                                         | Arabic description / written lecture                  |
| `description[en]`                          | string    | `nullable`, text                                                         | English description / written lecture                 |
| `video_url`                                | string    | Required if `video_and_text`, Prohibited if `text_only`                  | Lecture video streaming/embed URL                     |
| `cover_image`                              | File      | `nullable`, image max 4096KB                                             | Uploaded cover file                                   |
| `cover_image_url`                          | string    | `nullable`, URL or relative path                                         | External/preset cover URL                             |
| `remove_cover_image`                       | boolean   | `nullable`, for update only                                              | If true, strips existing cover                        |
| `has_pdf_attachments`                      | boolean   | `required`, boolean                                                      | Toggle for PDF files                                  |
| `pdf_files[]`                              | File[]    | Required on create if toggle is true (min 1, max 10, max 10MB each)      | Uploaded PDFs                                         |
| `has_explanatory_images`                   | boolean   | `required`, boolean                                                      | Toggle for explanatory images                         |
| `explanatory_images[]`                     | File[]    | Required on create if toggle is true (min 1, max 20, max 4MB each)       | Uploaded diagram images                               |
| `delete_media_ids[]`                       | integer[] | Optional on update                                                       | Spatie Media model IDs to delete                      |
| `delete_media_asset_ids[]`                 | integer[] | Optional on update                                                       | Shared MediaAsset IDs to detach                       |
| `has_exam`                                 | boolean   | `required`, boolean                                                      | Toggle for linked exam                                |
| `exam_id`                                  | integer   | Required if `has_exam === true`, Prohibited if false. Unique per lesson. | Linked exam ID                                        |
| `requires_exam_pass_to_unlock_next_lesson` | boolean   | `required`, boolean                                                      | If true, student must pass exam to unlock next lesson |
| `status`                                   | string    | `required`: `draft` \| `scheduled` \| `published`                        | Publishing status                                     |
| `scheduled_publish_at`                     | string    | Required if `status === 'scheduled'` (must be future ISO/date string)    | Scheduled release date                                |
| `is_active`                                | boolean   | `required`, defaults to true                                             | Active status toggle                                  |
| `lesson_template_id`                       | integer   | `nullable` on create only, prohibited on update                          | Prefill template ID                                   |

---

### 2.5. Resource Structure (`LessonResource`)

```typescript
export interface BackendLesson {
  id: number;
  provider_id: number;
  created_by_id: number;
  lesson_template_id?: number | null;
  lesson_template?: { id: number; name: string } | null;
  instructor_id: number;
  course_id?: number | null;
  course_section_id?: number | null;
  course?: {
    id: number;
    title: Record<string, string>;
  } | null;
  course_section?: {
    id: number;
    title: Record<string, string>;
    position: number;
  } | null;
  classification: "standalone" | "course";
  classification_label: string;
  is_standalone: boolean;
  educational_stage_id?: number | null;
  educational_stage?: {
    id: number;
    name: Record<string, string>;
  } | null;
  subject_id?: number | null;
  subject?: {
    id: number;
    name: Record<string, string>;
  } | null;
  type: "video_and_text" | "text_only";
  type_label: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  video_url?: string | null;
  cover_image_url?: string | null;
  cover_image?: string | null;
  instructor?: {
    id: number;
    full_name: string;
  } | null;
  delivery_mode?: "onsite" | "online" | "hybrid" | null;
  delivery_mode_label?: string | null;
  has_pdf_attachments: boolean;
  pdf_attachments: Array<{
    id: number;
    source: "upload" | "asset";
    name: string;
    file_name: string;
    mime_type: string | null;
    size: number;
    url: string;
  }>;
  has_explanatory_images: boolean;
  explanatory_images: Array<{
    id: number;
    source: "upload" | "asset";
    name: string;
    mime_type: string | null;
    size: number;
    url: string;
  }>;
  position: number;
  has_exam: boolean;
  exam_id?: number | null;
  exam?: {
    id: number;
    title: Record<string, string>;
    passing_percentage: number;
  } | null;
  requires_exam_pass_to_unlock_next_lesson: boolean;
  status: "draft" | "scheduled" | "published";
  status_label: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
```

---

## 3. Frontend Architecture & Component Inventory

### 3.1. File Map

```
frontend/
├── src/
│   ├── types/
│   │   ├── api-contracts.ts                <-- Shared Backend DTOs (BackendLesson, Options, StatusCounts)
│   │   └── course.ts                       <-- Existing UI Course/Lesson interfaces
│   ├── lib/
│   │   ├── api/
│   │   │   ├── apiClient.ts                <-- Axios wrapper with Sanctum auth & 422 error parsing
│   │   │   ├── queryKeys.ts                <-- Central TanStack key factory (`queryKeys.provider.lessons.*`)
│   │   │   ├── courses-service.ts          <-- Course and section API methods
│   │   │   └── lessons-service.ts          <-- [NEW] Lessons API methods
│   │   └── lessons-storage.ts              <-- [DEPRECATED] Compatibility bridge
│   ├── hooks/
│   │   ├── use-courses.ts                  <-- Course & Section queries/mutations
│   │   └── use-lessons.ts                  <-- [NEW] Lesson queries & mutations
│   ├── components/
│   │   ├── ui/
│   │   │   └── academic-selects.tsx        <-- LessonSelect & MultiLessonSelect
│   │   └── dashboard/
│   │       ├── courses/
│   │       │   ├── new-course-client.tsx   <-- Course Form Step 1 & 2 orchestrator
│   │       │   ├── lesson-dialog.tsx       <-- Add/Edit lesson modal inside curriculum
│   │       │   └── course-form/
│   │       │       ├── hooks/
│   │       │       │   └── use-curriculum-management.ts <-- Curriculum sections & lessons state/mutations
│   │       │       └── step2-curriculum/
│   │       │           ├── curriculum-view.tsx
│   │       │           └── dialogs/
│   │       │               └── delete-lesson-dialog.tsx <-- Curriculum lesson delete confirmation
│   │       └── lessons/
│   │           ├── manage-lessons-client.tsx <-- Roster table/grid, tabs, search, pagination
│   │           ├── lesson-card.tsx          <-- Grid card presentation
│   │           ├── new-lesson-client.tsx    <-- Standalone lesson authoring & edit form
│   │           └── delete-lesson-dialog.tsx <-- Roster lesson delete confirmation
│   └── app/
│       └── [locale]/(main)/(dashboard)/dashboard/lessons/
│           ├── page.tsx                    <-- Renders ManageLessonsClient
│           ├── new/page.tsx                <-- Renders NewLessonClient
│           └── [lessonId]/edit/page.tsx    <-- Renders NewLessonClient(initialLessonId)
```

---

## 4. Key Implementation Details by Component

### 4.1. `lessons-service.ts`

- Encapsulates Axios requests against `/api/dashboard/provider/lessons`.
- Transforms `StoreLessonData` into `FormData` if any `cover_image`, `pdf_files`, or `explanatory_images` files are present.
- Handles Laravel array notation for translatable fields: `title[ar]`, `title[en]`, `description[ar]`, `description[en]`.
- Converts booleans to `"1"` / `"0"` for multipart compatibility.
- In `updateLesson`, handles method spoofing (`_method: "PUT"`) when sending `FormData`.

### 4.2. `use-lessons.ts`

- Exposes TanStack Query hooks:
  - `useProviderLessons(filters)`: queryKey `queryKeys.provider.lessons.list(filters)`.
  - `useProviderLessonOptions(stageId)`: queryKey `queryKeys.provider.lessons.options()`.
  - `useProviderLesson(id)`: queryKey `queryKeys.provider.lessons.detail(id)`.
  - `useCreateLesson()`: invalidates `queryKeys.provider.lessons.all()` and `queryKeys.provider.courses.sections(courseId)`.
  - `useUpdateLesson()`: invalidates list and specific detail.
  - `useDeleteLesson()`: invalidates list and courses sections.

### 4.3. `ManageLessonsClient` (`manage-lessons-client.tsx`)

- Reads filters from URL search params: `search`, `tab` (`all`, `general`, `course-linked`), `sort` (`date-newest`, `date-oldest`), `page`.
- Maps tabs to backend `classification`:
  - `all` -> no classification filter.
  - `general` -> `classification: 'standalone'`.
  - `course-linked` -> `classification: 'course'`.
- Maps sort options to backend:
  - `date-newest` -> `sort: 'latest'`.
  - `date-oldest` -> `sort: 'oldest'`.
- Uses server-provided `status_counts` for tab count badges.
- Publishes/unpublishes via `useUpdateLesson({ status: nextStatus })`.
- Adds Refresh button to invalidate query.

### 4.4. `LessonDialog` (`lesson-dialog.tsx`)

- Opens from `CurriculumView` in Course Form.
- "Create" Tab:
  - Collects title, description, type, lecture video link, cover image, PDF files, explanatory images, exam linkage.
  - Target section ID selector populated from available course sections.
  - Submits to `onSave(sectionId, lessonData)`.
- "Bank" Tab:
  - Loads real provider lessons via backend query.
  - User checks multiple lessons and imports them into the target section.
  - Calls `onSaveMany(sectionId, lessons)`.
- Exam selector:
  - Dynamically populated from backend options matching the course subject/stage.

### 4.5. `useCurriculumManagement` (`use-curriculum-management.ts`)

- In edit/create mode for an existing backend course (`isBackendCourseId`):
  - `handleSaveLesson`: Calls `createLesson` or `updateLesson` mutation with `classification: 'course'`, `course_id`, and `course_section_id`.
  - `handleSaveManyLessons`: Iterates and creates/associates lessons via mutation.
  - `handleDeleteLesson`: Calls `deleteLesson` mutation.
  - Automatically re-fetches and syncs sections.

### 4.6. `NewLessonClient` (`new-lesson-client.tsx`)

- Standalone lesson create & edit.
- Mode determined by `initialLessonId`:
  - If set: fetches lesson via `useProviderLesson(initialLessonId)` and pre-fills form.
  - If null: clean creation mode.
- Academic dropdowns (educational stage, subject, instructor) dynamically loaded from `useProviderLessonOptions()`.
- Supports uploading real files (cover image, PDF attachments, explanatory images).
- Bilingual title and description support (active locale with fallback).
- Redirects to `/dashboard/lessons` with success notification.

---

## 5. Critical Gotchas & Domain Rules

1. **Unique Exam Linkage**:
   - In Laravel backend, `exam_id` in `lessons` table is **UNIQUE** (`Rule::unique(Lesson::class, 'exam_id')`). An exam can only be attached to **one** lesson at a time!
   - In `LessonRequest`, attempting to link an `exam_id` already used by another lesson triggers a 422 validation error.
2. **Scheduled Status Requires Future Date**:
   - `scheduled_publish_at` must be a valid date strictly `after:now`. If status is `scheduled` and date is in the past or missing, validation fails with 422.
3. **PDF & Image Attachment Enforcements**:
   - If `has_pdf_attachments` is `true` on creation, `pdf_files` must contain at least 1 file (and max 10, max 10MB each).
   - If `has_explanatory_images` is `true` on creation, `explanatory_images` must contain at least 1 file (and max 20, max 4MB each).
4. **Video URL Constraints**:
   - If `type === 'video_and_text'`, `video_url` is required and must be a valid URL (max 2048 chars).
   - If `type === 'text_only'`, `video_url` is prohibited.
5. **Course vs Standalone Exclusivity**:
   - When `classification === 'course'`, `course_id` and `course_section_id` are strictly required, and `educational_stage_id`, `subject_id`, `delivery_mode` must be null or match the course.
   - When `classification === 'standalone'`, `course_id` and `course_section_id` are strictly prohibited.
