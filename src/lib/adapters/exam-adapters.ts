import {
  BackendExam,
  BackendExamAttempt,
  BackendExamComplaint,
  BackendExamSection,
  BackendQuestion,
  QuestionClassificationBackend,
} from "@/types/api-contracts";
import { ExamComplaint } from "@/types/complaint";
import {
  Exam,
  ExamCategory,
  ExamSection,
  ExamType,
  ExamVenue,
  MCQOption,
  Question,
  QuestionDifficulty,
  QuestionKind,
  QuestionType,
} from "@/types/exam";
import {
  ExamDifficultyStatItem,
  ExamStatsData,
  ScoreDistributionBand,
  StudentExamResult,
} from "@/types/exam-stats";

/**
 * Map frontend classification to backend classification enum
 */
export function mapFrontendCategoryToBackend(cat: ExamCategory | string): string {
  switch (cat) {
    case "final":
      return "final";
    case "midterm":
      return "midterm";
    case "test":
      return "test";
    case "yearWork":
      return "coursework";
    case "comprehensive":
      return "comprehensive";
    case "unit":
      return "unit";
    case "quiz":
      return "quiz";
    case "placement":
      return "placement";
    default:
      return "test";
  }
}

/**
 * Map frontend question kind to backend QuestionClassificationBackend
 */
export function mapFrontendKindToBackend(
  kind: QuestionKind | string,
): QuestionClassificationBackend {
  switch (kind) {
    case "practical":
      return "practical_applied";
    case "application-based":
      return "applied";
    case "analytical":
      return "analytical";
    case "oral":
      return "oral";
    case "skill-based":
      return "skill_based";
    case "theoretical":
    default:
      return "theoretical";
  }
}

/**
 * Map backend QuestionClassificationBackend to frontend QuestionKind
 */
export function mapBackendKindToFrontend(backendClassification: string): QuestionKind {
  switch (backendClassification) {
    case "practical_applied":
      return "practical";
    case "applied":
      return "application-based";
    case "analytical":
      return "analytical";
    case "oral":
      return "oral";
    case "skill_based":
      return "skill-based";
    case "theoretical":
    default:
      return "theoretical";
  }
}

/**
 * Map backend classification to frontend ExamCategory
 */
export function mapBackendCategoryToFrontend(backendClassification: string): ExamCategory {
  switch (backendClassification) {
    case "final":
      return "final";
    case "midterm":
      return "midterm";
    case "test":
      return "test";
    case "coursework":
      return "yearWork";
    case "comprehensive":
      return "comprehensive";
    case "unit":
      return "unit";
    case "quiz":
      return "quiz";
    case "placement":
      return "placement";
    default:
      return "test";
  }
}

/**
 * Map backend Question to frontend Question interface
 */
export function mapBackendQuestionToFrontend(bq: BackendQuestion, locale: string = "ar"): Question {
  const isEn = locale === "en";
  const questionName = isEn ? bq.title.en || bq.title.ar : bq.title.ar || bq.title.en || "";
  const questionContent = bq.body
    ? isEn
      ? bq.body.en || bq.body.ar
      : bq.body.ar || bq.body.en || ""
    : questionName;

  let modelAnswer = "";
  if (bq.type === "true_false") {
    modelAnswer = bq.correct_answer ? "true" : "false";
  } else if (bq.type === "multiple_choice") {
    const correctOpt = bq.options?.find((o) => o.is_correct);
    modelAnswer = correctOpt
      ? String(correctOpt.id)
      : bq.options?.[0]?.id
        ? String(bq.options[0].id)
        : "";
  } else {
    modelAnswer = bq.model_answer
      ? isEn
        ? bq.model_answer.en || bq.model_answer.ar
        : bq.model_answer.ar || bq.model_answer.en || ""
      : "";
  }

  const options: MCQOption[] | undefined = bq.options?.map((opt) => ({
    id: String(opt.id),
    text: isEn ? opt.text.en || opt.text.ar : opt.text.ar || opt.text.en || "",
  }));

  const frontendType: QuestionType =
    bq.type === "multiple_choice" ? "mcq" : bq.type === "true_false" ? "true/false" : "text";

  const questionKind: QuestionKind = mapBackendKindToFrontend(bq.classification);

  const difficulty: QuestionDifficulty =
    bq.difficulty === "hard" ? "hard" : bq.difficulty === "medium" ? "medium" : "easy";

  const answerExplanation = bq.explanation
    ? isEn
      ? bq.explanation.en || bq.explanation.ar
      : bq.explanation.ar || bq.explanation.en || ""
    : "";

  return {
    id: String(bq.id),
    questionName,
    questionContent,
    modelAnswer,
    type: frontendType,
    options,
    grade: Number(bq.score) || 1,
    required: true,
    questionType: questionKind,
    difficulty,
    hasAnswerExplanation: Boolean(bq.has_explanation),
    answerExplanation,
  };
}

/**
 * Map backend ExamSection to frontend ExamSection
 */
export function mapBackendSectionToFrontend(
  bs: BackendExamSection,
  locale: string = "ar",
): ExamSection {
  const isEn = locale === "en";
  const title = isEn ? bs.title.en || bs.title.ar : bs.title.ar || bs.title.en || "";
  const subtitle = bs.instructions
    ? isEn
      ? bs.instructions.en || bs.instructions.ar
      : bs.instructions.ar || bs.instructions.en || ""
    : undefined;

  const questions = (bs.questions || []).map((q) => mapBackendQuestionToFrontend(q, locale));

  return {
    id: String(bs.id),
    title,
    subtitle,
    questions,
  };
}

/**
 * Map BackendExam to frontend Exam interface
 */
export function mapBackendExamToFrontend(be: BackendExam, locale: string = "ar"): Exam {
  const isEn = locale === "en";
  const title = isEn ? be.title.en || be.title.ar : be.title.ar || be.title.en || "";
  const description = be.description
    ? isEn
      ? be.description.en || be.description.ar
      : be.description.ar || be.description.en || ""
    : undefined;

  const subject = be.subject
    ? isEn
      ? be.subject.name.en || be.subject.name.ar
      : be.subject.name.ar || be.subject.name.en
    : "";
  const grade = be.educational_stage
    ? isEn
      ? be.educational_stage.name.en || be.educational_stage.name.ar
      : be.educational_stage.name.ar || be.educational_stage.name.en
    : "";
  const teacherName = be.instructor?.full_name || "";

  const category = mapBackendCategoryToFrontend(be.classification);
  const examType: ExamType = be.is_standalone ? "independent" : "course-dependent";
  const venue: ExamVenue =
    be.delivery_mode === "in_person"
      ? "onsite"
      : be.delivery_mode === "hybrid"
        ? "hybrid"
        : "online";

  let examSections: ExamSection[] = [];
  if (be.sections && be.sections.length > 0) {
    examSections = be.sections.map((s) => mapBackendSectionToFrontend(s, locale));
  } else if (be.questions && be.questions.length > 0) {
    // If backend returns questions without sections, wrap them in a default section
    examSections = [
      {
        id: "default-sec",
        title: locale === "ar" ? "القسم الافتراضي" : "Default Section",
        questions: be.questions.map((q) => mapBackendQuestionToFrontend(q, locale)),
      },
    ];
  }

  const numberOfQuestions =
    be.questions_count ?? examSections.reduce((acc, sec) => acc + sec.questions.length, 0);

  return {
    id: String(be.id),
    title,
    description,
    subject,
    grade,
    teacherName,
    category,
    examType,
    venue,
    courseId: be.course_id ? String(be.course_id) : undefined,
    courseTitle: be.course
      ? isEn
        ? be.course.title.en || be.course.title.ar
        : be.course.title.ar || be.course.title.en
      : undefined,
    sectionId: be.course_section_id ? String(be.course_section_id) : undefined,
    lessonId: be.lesson_id ? String(be.lesson_id) : undefined,
    coursesCount: be.course_id ? 1 : 0,

    triesAllowed: be.max_attempts || 1,
    durationMinutes: be.duration_minutes || 30,
    passingPercentage: Number(be.passing_percentage) || 60,
    showModelAnswers: be.show_correct_answers_after_submission ?? true,
    randomizeQuestionsOrder: be.shuffle_questions ?? true,
    randomizeMCQChoices: be.shuffle_answer_options ?? false,

    examSections,
    numberOfQuestions,
    numberOfStudents: be.students_count || 0,
    successRate: be.success_rate || 0,
    timesUsed: be.attempts_count || 0,

    createdAt: be.created_at || new Date().toISOString(),
  };
}

/**
 * Calculate live exam statistics and student results from backend exam & attempts
 */
export function mapBackendExamAttemptsToStats(
  exam: Exam,
  attempts: BackendExamAttempt[],
  locale: "ar" | "en" = "ar",
): ExamStatsData {
  const isAr = locale === "ar";
  const passThreshold = exam.passingPercentage || 60;

  // Question counts by difficulty from exam sections
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  if (exam.examSections && exam.examSections.length > 0) {
    exam.examSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        if (q.difficulty === "easy") easyCount++;
        else if (q.difficulty === "medium") mediumCount++;
        else if (q.difficulty === "hard") hardCount++;
      });
    });
  }

  // Calculate difficulty success rates from attempt questions
  let easyCorrect = 0;
  let easyTotal = 0;
  let medCorrect = 0;
  let medTotal = 0;
  let hardCorrect = 0;
  let hardTotal = 0;

  // Transform attempts into StudentExamResult
  const studentResults: StudentExamResult[] = attempts.map((attempt) => {
    const student = attempt.student;
    const fullName =
      student?.full_name || (isAr ? `طالب #${attempt.id}` : `Student #${attempt.id}`);
    const phoneNumber = student?.phone
      ? student.phone_code
        ? `${student.phone_code} ${student.phone}`
        : student.phone
      : "-";

    const score = attempt.score !== null && attempt.score !== undefined ? Number(attempt.score) : 0;
    const totalScore = attempt.max_score ? Number(attempt.max_score) : 0;
    const percentage =
      attempt.percentage !== null && attempt.percentage !== undefined
        ? Math.round(Number(attempt.percentage))
        : totalScore > 0
          ? Math.round((score / totalScore) * 100)
          : 0;

    const passed =
      typeof attempt.is_passed === "boolean" ? attempt.is_passed : percentage >= passThreshold;

    // Accumulate question difficulty stats
    if (attempt.questions && Array.isArray(attempt.questions)) {
      attempt.questions.forEach((q) => {
        const isCorrect =
          q.is_correct === true ||
          (q.awarded_score !== null &&
            q.awarded_score !== undefined &&
            Number(q.awarded_score) >= Number(q.score));
        if (q.difficulty === "easy") {
          easyTotal++;
          if (isCorrect) easyCorrect++;
        } else if (q.difficulty === "medium") {
          medTotal++;
          if (isCorrect) medCorrect++;
        } else if (q.difficulty === "hard") {
          hardTotal++;
          if (isCorrect) hardCorrect++;
        }
      });
    }

    const gpaFormatted = `${((percentage / 100) * 4.0).toFixed(2)} / 4.0`;

    return {
      id: String(attempt.id),
      studentId: String(student?.id || attempt.id),
      fullName,
      image: student?.avatar || undefined,
      phoneNumber,
      gpa: gpaFormatted,
      triesCount: attempt.attempt_number || 1,
      score,
      totalScore,
      percentage,
      passed,
      submittedAt: attempt.submitted_at || attempt.started_at || new Date().toISOString(),
    };
  });

  const totalAttempts = studentResults.length;
  const uniqueStudents = new Set(attempts.map((a) => a.student?.id || a.id)).size;
  const totalStudents = totalAttempts > 0 ? uniqueStudents : exam.numberOfStudents || 0;

  // Completed / graded attempts with valid percentage
  const validResults = studentResults.filter((r) => r.totalScore > 0 || r.score > 0);
  const resultsForStats = validResults.length > 0 ? validResults : studentResults;

  const passedStudentsCount = studentResults.filter((r) => r.passed).length;
  const passRate =
    studentResults.length > 0
      ? Math.round((passedStudentsCount / studentResults.length) * 100)
      : exam.successRate || 0;

  const averagePercentage =
    resultsForStats.length > 0
      ? Math.round(
          resultsForStats.reduce((sum, r) => sum + r.percentage, 0) / resultsForStats.length,
        )
      : 0;

  const percentages = resultsForStats.map((r) => r.percentage);
  const highestPercentage = percentages.length > 0 ? Math.max(...percentages) : 0;
  const highestScorersCount = studentResults.filter(
    (r) => r.percentage === highestPercentage && r.percentage > 0,
  ).length;

  const lowestPercentage = percentages.length > 0 ? Math.min(...percentages) : 0;
  const lowestScorersCount = studentResults.filter(
    (r) => r.percentage === lowestPercentage && percentages.length > 0,
  ).length;

  // Score distribution bands
  const bandBelowLabel = isAr ? `أقل من ${passThreshold}%` : `< ${passThreshold}%`;
  let bandBelowCount = 0;
  let band60_70Count = 0;
  let band70_80Count = 0;
  let band80_90Count = 0;
  let band90_100Count = 0;

  studentResults.forEach((res) => {
    if (res.percentage >= 90) band90_100Count++;
    else if (res.percentage >= 80) band80_90Count++;
    else if (res.percentage >= 70) band70_80Count++;
    else if (res.percentage >= passThreshold) band60_70Count++;
    else bandBelowCount++;
  });

  const scoreDistribution: ScoreDistributionBand[] = [
    {
      range: "90-100%",
      count: band90_100Count,
      isPassing: 90 >= passThreshold,
    },
    {
      range: "80-90%",
      count: band80_90Count,
      isPassing: 80 >= passThreshold,
    },
    {
      range: "70-80%",
      count: band70_80Count,
      isPassing: 70 >= passThreshold,
    },
    {
      range: `${passThreshold}-70%`,
      count: band60_70Count,
      isPassing: true,
    },
    {
      range: bandBelowLabel,
      count: bandBelowCount,
      isPassing: false,
    },
  ];

  const difficultyStats: ExamDifficultyStatItem[] = [
    {
      difficulty: "easy",
      questionCount: easyCount,
      successRate: easyTotal > 0 ? Math.round((easyCorrect / easyTotal) * 100) : 0,
    },
    {
      difficulty: "medium",
      questionCount: mediumCount,
      successRate: medTotal > 0 ? Math.round((medCorrect / medTotal) * 100) : 0,
    },
    {
      difficulty: "hard",
      questionCount: hardCount,
      successRate: hardTotal > 0 ? Math.round((hardCorrect / hardTotal) * 100) : 0,
    },
  ];

  return {
    examId: exam.id,
    totalStudents,
    studentsDeltaPercentage: 0,
    averagePercentage,
    avgDeltaPercentage: 0,
    passRate,
    passedStudentsCount,
    highestPercentage,
    highestScorersCount,
    lowestPercentage,
    lowestScorersCount,
    lastUpdatedAt: new Date().toISOString(),
    scoreDistribution,
    difficultyStats,
    studentResults,
  };
}

/**
 * Maps a BackendExamComplaint to the frontend ExamComplaint model
 */
export function mapBackendComplaintToFrontend(
  complaint: BackendExamComplaint,
  fallbackStudentName: string = "طالب",
): ExamComplaint {
  const student = complaint.student;
  let phoneNumber = "";
  if (student?.phone) {
    phoneNumber = student.phone_code ? `${student.phone_code}${student.phone}` : student.phone;
  }

  return {
    id: String(complaint.id),
    examId: String(complaint.exam_id),
    studentId: student?.id ? String(student.id) : undefined,
    studentName: student?.full_name || fallbackStudentName,
    studentImage: student?.avatar_url || undefined,
    phoneNumber,
    complaintTitle: complaint.body,
    complaintDescription: complaint.body,
    dateOfComplaint: complaint.created_at || new Date().toISOString(),
  };
}
