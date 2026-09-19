# Rewaa Platform: Exams & Questions Engine Integration Context & Reference

> **Document Purpose**: This file provides an exhaustive, authoritative reference for the **Exams and Questions Engine** (Phase 4 of the Frontend-Backend Integration Plan). It captures all domain models, database rules, backend API contracts, validation constraints, frontend component mappings, file paths, and migration workflows so that any future conversation or agent can immediately resume work without re-analyzing the codebase from scratch.
>
> **Target Path**: `frontend/docs/backend/EXAMS_AND_QUESTIONS_INTEGRATION_CONTEXT.md`  
> **Created**: September 2026  
> **Backend Framework**: Laravel 12 (PHP 8.3+) with Sanctum, Astrotomic Translatable, SoftDeletes  
> **Frontend Framework**: Next.js 16 (App Router), TanStack Query v5, Axios, TypeScript, Tailwind CSS, Zustand / URL state

---

## 1. Architectural Overview & Single Source of Truth

Currently, the frontend relies on client-side mock data and LocalStorage:

- `src/lib/exams-storage.ts` (`rewaa_exams_${locale}`, `mockExamsData.ts`)
- `src/lib/questions-storage.ts` (extracts questions from stored exams or adds to exams)
- `src/lib/exam-complaints-storage.ts` (`rewaa_exam_complaints_${locale}_${examId}`, `mockExamComplaintsData.ts`)
- `src/lib/mockExamStatsData.ts` (generated random statistics for exam overview)

Our mission in Phase 4 is to:

1. **Eliminate LocalStorage and mock dependencies** across Provider Exams and Question Bank.
2. Connect all exam and question authoring, editing, sectioning, reordering, options prefetching, publishing, and filtering directly to the Laravel backend API.
3. Align frontend terminology and DTO interfaces with the backend contracts while maintaining rich UX features (such as section reordering, questions import dialog, bilingual Arabic/English inputs, and Markdown rendering).

---

## 2. Core Domain Concepts & Business Rules

### 2.1. Exam Classifications & Hierarchical Binding

In Laravel backend (`App\Enums\ExamClassificationEnum` & `App\Models\Exam`):

1. **Standalone Exam (`classification = 'standalone'` / `course_id = null`)**:
   - Independent exam owned by provider/instructor.
   - Requires `educational_stage_id`, `subject_id`, and `delivery_mode` (`onsite`, `online`, `hybrid`).
   - Can be converted to a course exam later via `PATCH /api/dashboard/provider/exams/{exam}/convert-to-course`.
2. **Course / Curriculum Exam (`classification = 'course'` / `course_id != null`)**:
   - Bound to a course (`course_id`) and a course section (`course_section_id`), or a specific lesson (`lesson_id`).
   - Academic details (`educational_stage_id`, `subject_id`, `instructor_id`) inherit from the course.
   - Can unlock subsequent course sections or lessons (`requires_exam_pass_to_unlock_next_section` / `requires_exam_pass_to_unlock_next_lesson`).

### 2.2. Exam Categories vs Classification Enum

- **Backend Classifications (`ExamClassificationEnum`)**:
  `'final'`, `'midterm'`, `'test'`, `'coursework'`, `'comprehensive'`, `'unit'`, `'quiz'`, `'placement'`.
- **Exam Statuses (`ExamStatusEnum`)**:
  `'draft'`, `'scheduled'`, `'published'`.

### 2.3. Sections & Questions Architecture

An exam can have structured sections (`ExamSection`) or unsectioned questions:

- Each `ExamSection` has a bilingual `title`, `instructions`, and a `position`.
- A `Question` can belong to an exam (`exam_id`) and optionally a section (`exam_section_id`), or be a **standalone question** in the question bank (`exam_id = null`).
- Standalone questions require `educational_stage_id`, `subject_id`, and `instructor_id`.
- Question types (`QuestionTypeEnum`):
  1. `multiple_choice`: Requires `options` array (2–20 items), bilingual `text`, each option has boolean `is_correct`. Exactly **one** option must be correct.
  2. `true_false`: Requires boolean `correct_answer`.
  3. `essay`: Requires bilingual `model_answer`.
- Question difficulties (`QuestionDifficultyEnum`):
  `'easy'`, `'medium'`, `'hard'`.
- Question classifications (`QuestionClassificationEnum`):
  `'theoretical'`, `'practical_applied'`, `'applied'`, `'analytical'`, `'oral'`, `'skill_based'`.
- Explanations:
  - If `has_explanation` is true, bilingual `explanation` is required.
  - If false, `explanation` is prohibited.

---

## 3. Backend API Inventory & Exact Route Contracts

Base URL prefix: `/api/dashboard/provider/` (Authenticated with Sanctum Bearer token, role `dashboard:provider`).

### 3.1. Exams API (`ExamController`, `ExamSectionController`)

| Method   | Endpoint                                                  | Action                           | Purpose                                                     |
| :------- | :-------------------------------------------------------- | :------------------------------- | :---------------------------------------------------------- |
| `GET`    | `/api/dashboard/provider/exams`                           | `ExamController@index`           | List exams with search, filters, status counts & pagination |
| `GET`    | `/api/dashboard/provider/exams/options`                   | `ExamController@options`         | Preload stages, subjects, instructors, courses & sections   |
| `POST`   | `/api/dashboard/provider/exams`                           | `ExamController@store`           | Create new exam                                             |
| `GET`    | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@show`            | Get exam details (sections, questions, metadata)            |
| `PUT`    | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@update`          | Update exam basic settings & rules                          |
| `DELETE` | `/api/dashboard/provider/exams/{exam}`                    | `ExamController@destroy`         | Soft-delete exam                                            |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/publish`            | `ExamController@publish`         | Publish an exam immediately                                 |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/schedule`           | `ExamController@schedule`        | Schedule exam publication at a future datetime              |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/convert-to-course`  | `ExamController@convertToCourse` | Convert standalone exam to course exam                      |
| `GET`    | `/api/dashboard/provider/exams/{exam}/sections`           | `ExamSectionController@index`    | List exam sections                                          |
| `POST`   | `/api/dashboard/provider/exams/{exam}/sections`           | `ExamSectionController@store`    | Add section to exam                                         |
| `GET`    | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@show`     | Get specific section details                                |
| `PUT`    | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@update`   | Update section title / instructions                         |
| `DELETE` | `/api/dashboard/provider/exams/{exam}/sections/{section}` | `ExamSectionController@destroy`  | Delete section                                              |
| `PATCH`  | `/api/dashboard/provider/exams/{exam}/sections/reorder`   | `ExamSectionController@reorder`  | Reorder sections by array of IDs                            |

### 3.2. Questions & Question Bank API (`QuestionController`)

| Method   | Endpoint                                       | Action                       | Purpose                                                         |
| :------- | :--------------------------------------------- | :--------------------------- | :-------------------------------------------------------------- |
| `GET`    | `/api/dashboard/provider/questions`            | `QuestionController@index`   | Filterable list of questions (subject, stage, difficulty, type) |
| `GET`    | `/api/dashboard/provider/questions/options`    | `QuestionController@options` | Preload types, difficulties, stages, subjects, exams            |
| `POST`   | `/api/dashboard/provider/questions`            | `QuestionController@store`   | Create new question (standalone or inside exam/section)         |
| `GET`    | `/api/dashboard/provider/questions/{question}` | `QuestionController@show`    | Full question details, translations, options                    |
| `PUT`    | `/api/dashboard/provider/questions/{question}` | `QuestionController@update`  | Update question, options, answer key                            |
| `DELETE` | `/api/dashboard/provider/questions/{question}` | `QuestionController@destroy` | Soft-delete question                                            |
| `PATCH`  | `/api/dashboard/provider/questions/reorder`    | `QuestionController@reorder` | Reorder questions in an exam/section                            |

### 3.3. Exam Attempts & Analytics API (`ExamAttemptController`)

| Method  | Endpoint                                                | Action                        | Purpose                                                    |
| :------ | :------------------------------------------------------ | :---------------------------- | :--------------------------------------------------------- |
| `GET`   | `/api/dashboard/provider/exam-attempts`                 | `ExamAttemptController@index` | Student attempts on provider exams with scores & pass/fail |
| `GET`   | `/api/dashboard/provider/exam-attempts/{attempt}`       | `ExamAttemptController@show`  | Attempt detail with answers submitted by student           |
| `PATCH` | `/api/dashboard/provider/exam-attempts/{attempt}/grade` | `ExamAttemptController@grade` | Manual grading for essay answers                           |

---

## 4. DTO Schemas & Request/Response Payloads

### 4.1. Exam List & Filter Payload (`GET /api/dashboard/provider/exams`)

**Query Parameters (`IndexExamRequest`)**:

- `search`: string
- `status`: `'draft'` | `'scheduled'` | `'published'`
- `statuses`: string[]
- `classification`: `'standalone'` | `'course'`
- `course_id`: integer
- `course_section_id`: integer
- `sort`: `'latest'` | `'oldest'` | `'title_asc'` | `'title_desc'`
- `page`: integer
- `per_page`: integer

**Response (`ApiResponse<{ exams: ExamResource[], status_counts: ExamStatusCounts, pagination: ApiPaginationMeta }>`):**

```json
{
  "status": 200,
  "message": "",
  "data": {
    "exams": [
      {
        "id": 12,
        "title": { "ar": "امتحان الفيزياء النهائي", "en": "Physics Final Exam" },
        "description": { "ar": "وصف الامتحان", "en": "Exam description" },
        "educational_stage_id": 1,
        "educational_stage": { "id": 1, "name": { "ar": "الثانوية العامة", "en": "High School" } },
        "subject_id": 2,
        "subject": { "id": 2, "name": { "ar": "الفيزياء", "en": "Physics" } },
        "instructor_id": 5,
        "instructor": { "id": 5, "full_name": "أ. محمد عبد المعبود" },
        "course_id": null,
        "course": null,
        "is_standalone": true,
        "classification": "final",
        "classification_label": "نهائي",
        "duration_minutes": 60,
        "ends_at": null,
        "passing_percentage": 60.0,
        "max_attempts": 1,
        "questions_limit": 20,
        "show_correct_answers_after_submission": true,
        "shuffle_questions": true,
        "shuffle_answer_options": false,
        "delivery_mode": "online",
        "delivery_mode_label": "أونلاين",
        "status": "published",
        "status_label": "منشور",
        "is_active": true,
        "questions_count": 20,
        "students_count": 45,
        "attempts_count": 48
      }
    ],
    "status_counts": {
      "all": 15,
      "published": 10,
      "draft": 4,
      "scheduled": 1,
      "draft_and_scheduled": 5
    },
    "pagination": {
      "current_page": 1,
      "last_page": 2,
      "per_page": 12,
      "total": 15
    }
  }
}
```

### 4.2. Store Exam Payload (`POST /api/dashboard/provider/exams`)

```json
{
  "title": { "ar": "امتحان نصف الفصل", "en": "Midterm Exam" },
  "description": { "ar": "تعليمات الامتحان", "en": "Instructions" },
  "educational_stage_id": 1,
  "subject_id": 2,
  "instructor_id": 5,
  "classification": "midterm",
  "duration_minutes": 45,
  "passing_percentage": 60,
  "max_attempts": 1,
  "questions_limit": 15,
  "show_correct_answers_after_submission": true,
  "shuffle_questions": true,
  "shuffle_answer_options": false,
  "delivery_mode": "online",
  "is_active": true
}
```

### 4.3. Store Question Payload (`POST /api/dashboard/provider/questions`)

```json
{
  "type": "multiple_choice",
  "title": { "ar": "قانون أوم", "en": "Ohm's Law" },
  "body": {
    "ar": "ما هي وحدة قياس المقاومة الكهربائية؟",
    "en": "What is the unit of electrical resistance?"
  },
  "difficulty": "medium",
  "classification": "theoretical",
  "educational_stage_id": 1,
  "subject_id": 2,
  "instructor_id": 5,
  "exam_id": 12,
  "exam_section_id": 3,
  "score": 2.5,
  "has_explanation": true,
  "explanation": {
    "ar": "الأوم هو وحدة قياس المقاومة الكهربية.",
    "en": "Ohm is the unit of electrical resistance."
  },
  "options": [
    { "text": { "ar": "فولت", "en": "Volt" }, "is_correct": false },
    { "text": { "ar": "أوم", "en": "Ohm" }, "is_correct": true },
    { "text": { "ar": "أمبير", "en": "Ampere" }, "is_correct": false },
    { "text": { "ar": "واط", "en": "Watt" }, "is_correct": false }
  ],
  "is_active": true
}
```

---

## 5. Frontend Component Inventory & Migration Mapping

### 5.1. File Structure & Target Replacements

| Frontend File Path                                                     | Current Data Source                                                   | Target Replacement & Integration Plan                                                                                                                        |
| :--------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/exam.ts`                                                    | Local custom types                                                    | Update to align with Backend DTOs (`BackendExam`, `BackendQuestion`, `BackendExamSection`, enums)                                                            |
| `src/lib/api/exams-service.ts`                                         | _[NEW]_                                                               | Axios service wrapping all `/api/dashboard/provider/exams/*` & section reordering                                                                            |
| `src/lib/api/questions-service.ts`                                     | _[NEW]_                                                               | Axios service wrapping `/api/dashboard/provider/questions/*` & options prefetching                                                                           |
| `src/hooks/use-exams.ts`                                               | _[NEW]_                                                               | TanStack Query hook (`useExams`, `useExam`, `useExamOptions`, `useCreateExam`, `useUpdateExam`, `useDeleteExam`)                                             |
| `src/hooks/use-questions.ts`                                           | _[NEW]_                                                               | TanStack Query hook (`useQuestions`, `useQuestion`, `useQuestionOptions`, mutations)                                                                         |
| `src/components/dashboard/exams/manage-exams-client.tsx`               | `getStoredExams` (`exams-storage.ts`)                                 | Connect to `useExams` with URL searchParams, status counts, pagination, delete dialog                                                                        |
| `src/components/dashboard/exams/exam-form-client.tsx`                  | `saveStoredExams` (`exams-storage.ts`)                                | Connect Step 1 (basic info/settings) & Step 2 (sections & questions creation/editing) to API                                                                 |
| `src/components/dashboard/exams/exam-details-client.tsx`               | `getStoredExams`                                                      | Fetch live details via `useExam(id)` with sections, questions, and stats                                                                                     |
| `src/components/dashboard/exams/stats/exam-stats-client.tsx`           | `mockExamStatsData.ts`                                                | Connect to backend `ExamAttemptController` index/metrics for real student attempt stats                                                                      |
| `src/components/dashboard/exams/complaints/exam-complaints-client.tsx` | `exam-complaints-storage.ts`, `mockExamComplaintsData.ts` _(DELETED)_ | Integrated with `useProviderExamComplaints` (`GET /api/dashboard/provider/exams/{exam}/complaints`) and `useDeleteExamComplaint` (`DELETE /.../{complaint}`) |
| `src/components/dashboard/questions/manage-questions-client.tsx`       | `getAllQuestions` (`questions-storage.ts`)                            | Connect to `useQuestions` with academic filters (grade, subject, difficulty, type)                                                                           |
| `src/components/dashboard/questions/new-question-client.tsx`           | `addStoredQuestion`                                                   | Connect to `useCreateQuestion` with options preloading                                                                                                       |
| `src/components/dashboard/questions/edit-question-client.tsx`          | `getQuestionById`, `updateStoredQuestion`                             | Connect to `useQuestion(id)` and `useUpdateQuestion`                                                                                                         |
| `src/components/dashboard/questions/question-form-content.tsx`         | Local form state                                                      | Support bilingual text (`ar` / `en`), MCQ options with single correct choice validation                                                                      |
| `src/components/dashboard/exams/import-from-exams-dialog.tsx`          | Local exams array                                                     | Fetch other exams via `useExams({ per_page: 50 })` and clone sections/questions into current exam                                                            |

---

## 6. Key Integration Edge Cases & Guidelines

1. **Step 1 & Step 2 Atomic Creation Workflow**:
   - In the frontend form (`exam-form-client.tsx`), the user enters basic settings in Step 1, then creates sections and questions in Step 2.
   - When creating a _new_ exam, Step 1 creates the exam entity via `POST /api/dashboard/provider/exams` (or saves as draft), returning the generated `exam.id`.
   - Step 2 can then attach sections (`POST /exams/{id}/sections`) and questions (`POST /questions` with `exam_id` & `exam_section_id`).
2. **Bilingual Astrotomic Translatable Fields**:
   - Every text input for `title`, `description`, `questionContent`, `explanation`, and MCQ options has an Arabic and English representation: `{ ar: string, en?: string }`.
   - If the user provides a single string in the UI, it defaults to `{ ar: text, en: text }` or `{ ar: text }` according to active locale.
3. **Question Type Validations**:
   - `multiple_choice`: Requires `options` (2 to 20 items), exactly 1 with `is_correct: true`.
   - `true_false`: Requires boolean `correct_answer`.
   - `essay`: Requires `model_answer`.
   - `has_explanation`: If true, `explanation` is required; if false, it is prohibited.
4. **Academic Data Cascades**:
   - If an exam is standalone, `educational_stage_id` and `subject_id` are required.
   - Calling `/api/dashboard/provider/exams/options?educational_stage_id={stageId}` returns filtered subjects matching the stage.
5. **No Breaking Changes to Curriculum Builders**:
   - `NewCourseClient` and `CourseFormStep2` allow section-level exams (`exam_id`). The exam options list must provide published or active provider exams.
6. **Instructor ID Resolution (`requires_instructor_selection`)**:
   - In Laravel backend (`ProviderInstructorService`), when the authenticated user is an individual teacher (`user_type = teacher`) or assistant, `instructor_id` is automatically determined by the backend service.
   - For individual teachers, submitting `instructor_id` is strictly prohibited by `StoreExamRequest` (`'instructor_id' => $requiresInstructorSelection ? ['required', ...] : ['prohibited']`).
   - The options endpoint (`GET /api/dashboard/provider/exams/options` and `GET /api/dashboard/provider/questions/options`) returns `requires_instructor_selection: boolean`.
   - In the frontend form (`exam-form-client.tsx`), `instructor_id` must only be sent in payloads (`buildExamPayload` and `handleSaveQuestion`) when `optionsData?.requires_instructor_selection` is true. When false, `instructor_id` is omitted from the request payload and the TeacherSelect input is disabled.
