export function matchKnownGrade(grade: string, t: (key: string) => string): string {
  const knownGrades: Record<string, string[]> = {
    grade1: [t("grades.grade1"), "الأول الثانوي", "الأول ثانوي", "10", "grade10", "grade1"],
    grade2: [t("grades.grade2"), "الثاني الثانوي", "الثاني ثانوي", "11", "grade11", "grade2"],
    grade3: [t("grades.grade3"), "الثالث الثانوي", "الثالث ثانوي", "12", "grade12", "grade3"],
    university: [t("grades.university"), "جامع", "University", "university"],
  };

  const exGrade = (grade || "").toLowerCase();
  const matchedGradeKey = Object.keys(knownGrades).find((key) =>
    knownGrades[key].some((val) => val && exGrade.includes(val.toLowerCase())),
  );

  return matchedGradeKey || grade || "";
}

export function matchKnownSubject(subject: string, t: (key: string) => string): string {
  const knownSubjects: Record<string, string[]> = {
    mathematics: [t("subjects.mathematics"), "رياضيات", "math", "calculus"],
    physics: [t("subjects.physics"), "فيزياء", "physic"],
    chemistry: [t("subjects.chemistry"), "كيمياء", "chemist"],
    biology: [t("subjects.biology"), "أحياء", "احياء", "biolog"],
    english: [t("subjects.english"), "إنجليزية", "انجليزية", "english"],
    arabic: [t("subjects.arabic"), "عربية", "عربى", "arabic"],
  };

  const exSubj = (subject || "").toLowerCase();
  const matchedSubjKey = Object.keys(knownSubjects).find((key) =>
    knownSubjects[key].some((val) => val && exSubj.includes(val.toLowerCase())),
  );

  return matchedSubjKey || subject || "";
}
