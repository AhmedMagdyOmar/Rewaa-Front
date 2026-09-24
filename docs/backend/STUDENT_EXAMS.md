# Student Exams Architecture & Troubleshooting Guide

This document serves as a comprehensive reference for the Student Exam system (Taking, Submitting, Grading, Results Presentation, Complaints, and Tab Filtering) across the frontend (Next.js) and backend (Laravel).

---

## 1. Exam Taking & Auto-Submission Lifecycle

### 1.1 Countdown Timer & Auto-Submit Mechanism

- **File**: [`StudentExamTakingView.tsx`](file:///home/amr-mohamed27/rewaa/frontend/src/components/dashboard/student/StudentExamTakingView.tsx)
- **Time Calculation**:
  - The exam duration is calculated from `attempt.started_at` + `exam.duration_minutes * 60 * 1000`.
  - Ensure ISO timestamp parsing is safe across timezones: `new Date(attempt.started_at).getTime()`.
- **Auto-Submission Guards**:
  - Must use an execution ref (`hasAutoSubmittedRef = useRef(false)`) to prevent multiple concurrent submit requests when the timer hits `0`.
  - Submission payloads must always pass an array of `{ question_id, answer_text, selected_option_id, selected_option_ids }`. Empty answers should be omitted or cleanly formatted to prevent HTTP `422 Unprocessable Entity`.
  - Always handle rate limits gracefully and avoid infinite retry loops upon submission failures.

---

## 2. Grading, Scoring & Result Calculations

### 2.1 Attempt Statuses

An exam attempt exists in one of three primary lifecycle statuses:

1. `in_progress`: The student has begun taking the exam and has not yet submitted.
2. `pending_review`: The student submitted the exam, but the exam contains manual evaluation questions (e.g., Essay / المقالية) that require teacher review.
3. `graded`: All questions (objective and subjective) have been fully evaluated.

### 2.2 Objective vs Subjective Evaluation in `pending_review`

- **File**: [`ExamAttemptResource.php`](file:///home/amr-mohamed27/rewaa/backend/app/Http/Resources/Api/Website/Student/Exam/ExamAttemptResource.php)
- When an attempt is `pending_review`:
  - Objective questions (Single Choice / Multiple Choice / True-False) are automatically graded immediately upon submission (`is_correct = true / false`).
  - Essay questions remain unrated (`is_correct = null`, `score = 0`) until graded by the instructor.
  - Correct and incorrect summary counts (`correct_answers_count`, `wrong_answers_count`) must calculate accurately based on graded objective answers.
- **Frontend Filter Tabs** in [`StudentExamResultClient.tsx`](file:///home/amr-mohamed27/rewaa/frontend/src/components/dashboard/student/StudentExamResultClient.tsx):
  - Correct filter: `question.is_correct === true`
  - Wrong filter: `question.is_correct === false`
  - Pending review filter: `question.is_correct === null || question.type === 'essay'`

### 2.3 Model Answers Visibility Rule

- **Backend Field**: `$exam->hide_model_answers_after_submission` (boolean).
- If `hide_model_answers_after_submission === true`:
  - The backend must NOT expose `model_answer`, `explanation`, or options marked `is_correct` in [`ExamAttemptResource.php`](file:///home/amr-mohamed27/rewaa/backend/app/Http/Resources/Api/Website/Student/Exam/ExamAttemptResource.php).
  - The frontend checks `exam.hide_model_answers_after_submission` and suppresses model answer review blocks, model explanations, and correct answer badges.

---

## 3. Student Exams Filtering & Tab Architecture

### 3.1 Course-Linked Exams vs General Platform Exams

- **Course-Linked Exams**:
  - Route: `/student-dashboard/exams`
  - API: `GET /api/website/exams`
  - Scope: `ExamScopeEnum::COURSE`
  - Requires active enrollment in the associated course.
- **General Platform Exams**:
  - Route: `/student-dashboard/exams/general`
  - API: `GET /api/website/general-exams`
  - Scope: `ExamScopeEnum::GENERAL`
  - Accessible based on the student's `educational_stage_id`.

### 3.2 Tabs (`required` vs `completed`)

- **Backend Implementation** in [`StudentExamService.php`](file:///home/amr-mohamed27/rewaa/backend/app/Services/Student/StudentExamService.php):
  - Accepts `$filters['tab'] = 'required' | 'completed'`.
  - Completed constraint: `where('student_id', $student->id)->whereIn('status', ['pending_review', 'graded'])`.
  - Returns `tab_counts`:
    ```php
    'tab_counts' => [
        'required' => (clone $query)->whereDoesntHave('attempts', $completedConstraint)->count(),
        'completed' => (clone $query)->whereHas('attempts', $completedConstraint)->count(),
    ]
    ```
  - For `GENERAL` scope, `eligibleQuery($student, $scope, $includeHistory)` ensures completed general exams are returned under `tab=completed` even if the exam expiration `ends_at` has passed or attempts have ended.
- **Frontend Components**:
  - [`StudentExamsClient.tsx`](file:///home/amr-mohamed27/rewaa/frontend/src/components/dashboard/student/StudentExamsClient.tsx) (Course exams)
  - [`StudentGeneralExamsClient.tsx`](file:///home/amr-mohamed27/rewaa/frontend/src/components/dashboard/student/StudentGeneralExamsClient.tsx) (General exams)
  - Both components share identical URL synchronization (`?tab=required` vs `?tab=completed`), dynamic badge counts, sort options (including score sorts on completed tab), and card actions (`takeExam`, `retakeExam`, `viewResult`).

---

## 4. Student Complaints & Rate Limiting

- **Endpoint**: `POST /api/website/exams/{exam}/complaints`
- **Controller**: [`ExamComplaintController.php`](file:///home/amr-mohamed27/rewaa/backend/app/Http/Controllers/Api/Website/Student/Exam/ExamComplaintController.php)
- **Throttle Middleware**:
  - Route is protected by `throttle:5,1` (5 requests per minute).
  - Rapid successive submission failures or frontend polling can deplete the rate limit budget for the user IP / Sanctum token.
  - In development environments, clear the rate limit cache if HTTP 429 occurs unexpectedly:
    ```bash
    php artisan cache:clear
    ```

---

## 5. Internationalization & Localization Best Practices

- **Translation Namespaces**:
  - `studentDashboard.examsPage`: Course-linked exams listing and shared table columns/actions.
  - `studentDashboard.generalExamsPage`: General exams listing, available/completed badges, and empty states.
  - `studentDashboard.examResultPage`: Graded attempt results, questions breakdown, and score card.
  - `exams.status` and `exams.actions`: Shared backend status translations (`pendingReview`, `published`, `draft`, `resume`, `retry`).
- **Always verify keys in both locales**:
  - Arabic: [`frontend/messages/ar.json`](file:///home/amr-mohamed27/rewaa/frontend/messages/ar.json)
  - English: [`frontend/messages/en.json`](file:///home/amr-mohamed27/rewaa/frontend/messages/en.json)
- **Common Translation Key Mismatches to Avoid**:
  - Status "قيد المراجعة": Use `tExams("table.statusPendingReview")` or `t("status.pendingReview")` consistently.
  - Question types: Single Choice (`questions.type.single_choice`), Multiple Choice (`questions.type.multiple_choice`), Essay (`questions.type.essay`), True/False (`questions.type.true_false`).
