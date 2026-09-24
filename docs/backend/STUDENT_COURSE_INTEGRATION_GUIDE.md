# Student Portal & Course Pages Integration Guide

This document captures architectural specifications, endpoint contracts, DTO formats, and gotchas discovered during the backend integration of the **Student My Courses page** (`/student-dashboard/courses`), serving as a reference guide for upcoming pages (e.g., **Courses Explore Page**, **Course Details Page**, **Curriculum / Lesson Player**, **Exam Taking Engine**).

---

## 1. Authentication & API Client Conventions

- **Auth Guard**: Student routes are guarded by Sanctum (`CheckAbilities:app:student`) and `EnsureStudentWebsiteAccess`.
- **Bearer Token**: Automatically injected by `src/lib/apiClient.ts` from the auth store / cookies.
- **Locale Header**: `Accept-Language: ar|en` is sent automatically by `apiClient.ts`.
- **Response Wrapper**: Standard Laravel envelope `ApiResponse<T>`:
  ```json
  {
    "status": 200,
    "message": "",
    "data": { ... }
  }
  ```

---

## 2. API Endpoints & Contract Mapping

### A. My Enrolled Courses

- **Endpoint**: `GET /api/website/my-courses`
- **Controller**: `App\Http\Controllers\Api\Website\Student\Course\CourseController@index`
- **Resource**: `App\Http\Resources\Api\Website\Student\Course\CourseResource`
- **Query Parameters**:
  - `search` (string, max: 255)
  - `sort` (`latest` | `oldest` | `title_asc` | `title_desc` | `progress_asc` | `progress_desc`)
  - `educational_stage_id` (integer)
  - `subject_id` (integer)
  - `instructor_id` (integer)
  - `page` (integer)
  - `per_page` (integer, default 15)
- **Response Shape**:
  ```json
  {
    "courses": [
      {
        "enrollment_id": 1,
        "course_id": 1,
        "delivery_mode": "online",
        "selected_delivery_mode": null,
        "title": { "ar": "...", "en": "..." },
        "cover_image": "http://localhost:8000/storage/1/physics.jpg",
        "instructor": { "id": 2, "full_name": "..." },
        "purchased_price": "300.00",
        "currency_code": "EGP",
        "starts_at": "2026-09-15 22:49:11",
        "expires_at": "2027-03-15 22:49:11",
        "progress": {
          "completed_lessons": 1,
          "total_lessons": 5,
          "percentage": 20
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 4,
      "total": 1
    }
  }
  ```

### B. Explore Courses (Available Catalog)

- **Endpoint**: `GET /api/website/courses`
- **Controller**: `StudentCourseController@available`
- **Resource**: `AvailableCourseResource`
- **Query Parameters**: Same validator (`IndexCourseRequest`) as `my-courses`.
  - Supports `sort`: `latest`, `oldest`, `title_asc`, `title_desc`, `price_asc`, `price_desc`, `most_enrolled`.
- **Response Shape**:
  ```json
  {
    "courses": [
      {
        "id": 1,
        "delivery_mode": "online",
        "delivery_options": ["online"],
        "is_enrolled": false,
        "title": { "ar": "...", "en": "..." },
        "description": { "ar": "...", "en": "..." },
        "cover_image": "http://localhost:8000/storage/1/physics.jpg",
        "educational_stage": { "id": 1, "name": { "ar": "...", "en": "..." } },
        "subject": { "id": 1, "name": { "ar": "...", "en": "..." } },
        "instructor": { "id": 2, "full_name": "..." },
        "is_free": false,
        "base_price": 300,
        "currency_code": "EGP",
        "has_discount": false,
        "is_discount_active": false,
        "discount_percentage": 0,
        "discount_starts_at": null,
        "discount_ends_at": null,
        "discount_amount": 0.0,
        "final_price": 300,
        "has_limited_access": true,
        "access_duration_days": 180,
        "sections_count": 3,
        "lessons_count": 12,
        "published_at": "2026-09-01 10:00:00"
      }
    ],
    "pagination": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
  }
  ```

### C. Course Details View

- **Endpoint**:
  - Unenrolled/Catalog detail: `GET /api/website/courses/{course}` (`showAvailable`)
  - Enrolled detail: `GET /api/website/my-courses/{course}` (`show`)
- **Controller**: `StudentCourseController@showAvailable` / `StudentCourseController@show`
- **Resource**: `CourseDetailsResource`
- **Response Shape**:
  ```json
  {
    "course": {
      "id": 1,
      "title": { "ar": "...", "en": "..." },
      "description": { "ar": "...", "en": "..." },
      "cover_image": "...",
      "delivery_mode": "online",
      "educational_stage": { "id": 1, "name": { "ar": "..." } },
      "subject": { "id": 1, "name": { "ar": "..." } },
      "instructor": { "id": 2, "full_name": "..." },
      "sections_count": 3,
      "lessons_count": 12,
      "is_enrolled": true,
      "is_free": false,
      "base_price": 300,
      "final_price": 300,
      "currency_code": "EGP",
      "has_limited_access": true,
      "access_duration_days": 180,
      "enrollment": {
        "id": 1,
        "starts_at": "2026-09-15 22:49:11",
        "expires_at": "2027-03-15 22:49:11",
        "selected_delivery_mode": null
      },
      "progress": {
        "completed_lessons": 1,
        "total_lessons": 5,
        "percentage": 20
      }
    }
  }
  ```

### D. Course Curriculum & Interactive Content

- **Endpoint**: `GET /api/website/my-courses/{course}/content`
- **Resource**: `CourseContentResource`
- **Response Shape**:
  ```json
  {
    "content": {
      "course_id": 1,
      "title": { "ar": "...", "en": "..." },
      "progress": { "completed_lessons": 1, "total_lessons": 5, "percentage": 20 },
      "next_lesson": { "id": 2, "is_locked": false, "is_completed": false },
      "sections": [
        {
          "id": 1,
          "title": { "ar": "...", "en": "..." },
          "position": 1,
          "is_locked": false,
          "exam": {
            "id": 1,
            "title": { "ar": "..." },
            "passing_percentage": 50,
            "is_passed": true,
            "adopted_result": {
              "attempt_id": 1,
              "score": 20,
              "max_score": 20,
              "percentage": 100,
              "is_passed": true
            }
          },
          "lessons": [
            {
              "id": 1,
              "title": { "ar": "..." },
              "type": "video_and_text",
              "position": 1,
              "is_locked": false,
              "is_completed": true,
              "exam": null
            }
          ]
        }
      ]
    }
  }
  ```

---

## 3. Important Implementation Gotchas & Patterns

1. **NO Options Route for Student Courses**:
   - There is **no** `GET /api/website/my-courses/options` or `GET /api/website/courses/options` route.
   - Do **NOT** attempt to fetch `/options` for student course sorting.
   - Sort keys are static on the backend:
     - For `my-courses`: `latest`, `oldest`, `title_asc`, `title_desc`, `progress_asc`, `progress_desc`
     - For `courses` (explore): `latest`, `oldest`, `title_asc`, `title_desc`, `price_asc`, `price_desc`, `most_enrolled`
   - Map these to frontend translation keys (`messages/ar.json` and `messages/en.json`).

2. **Next.js `<Image />` Component with Media URLs**:
   - Backend media URLs are absolute links to local storage or CDN (e.g. `http://localhost:8000/storage/...`).
   - In Next.js components, pass `unoptimized` on the `<Image />` component or ensure error boundaries (`onError={() => setImageError(true)}`) are provided so local dev URLs render without optimizer failures.

3. **Field Names & IDs in Enrolled Courses**:
   - `CourseResource` uses `course_id` and `enrollment_id` (not top-level `id`).
   - Links should point to `/student-dashboard/courses/${course.course_id ?? course.id}`.
   - Progress is nested: `course.progress?.percentage` or `course.progress_percentage`.
   - Access expiration date is in `expires_at` or `access_ends_at`.

4. **Bilingual Fields**:
   - `title`, `description`, `educational_stage.name`, and `subject.name` are returned as `Record<string, string>` (e.g. `{"ar": "...", "en": "..."}`).
   - Safe resolution helper:
     ```ts
     const title =
       typeof item.title === "object" && item.title !== null
         ? item.title[locale] || item.title.ar || item.title.en || Object.values(item.title)[0]
         : item.title || "";
     ```

5. **Search Input Debounce**:
   - Use `DebouncedSearchInput` (`src/components/ui/debounced-search-input.tsx`) with `value` and `onValueChange: (val: string) => void` for all server-side search bars to avoid excessive API requests.

6. **Package Manager**:
   - Use `pnpm` for all commands (`pnpm tsc --noEmit`, `pnpm build`, etc.).
