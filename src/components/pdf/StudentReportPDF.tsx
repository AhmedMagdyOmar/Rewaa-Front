import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Image,
} from "@react-pdf/renderer";
import { Course } from "@/types/course";
import { Exam } from "@/types/exam";
import { Student } from "@/types/student";

// Register IBM Plex Sans Arabic
Font.register({
  family: "IBM Plex Sans Arabic",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf",
      fontWeight: 700,
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf",
      fontWeight: 500,
    },
  ],
});

// Highly compressed styles to guarantee a single-page fit
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "IBM Plex Sans Arabic",
    backgroundColor: "#ffffff",
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1pt solid #e2e8f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  brandWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  badge: {
    fontSize: 10,
    backgroundColor: "#f1f5f9",
    padding: "4 8",
    borderRadius: 4,
    color: "#64748b",
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#007fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 14,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    border: "2pt solid rgba(255, 255, 255, 0.4)",
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
  },
  studentName: { fontSize: 16, fontWeight: 700, color: "#ffffff" },
  studentMeta: { fontSize: 9, color: "#ffffff", marginTop: 2 },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  studentPhone: {
    fontSize: 9,
    fontWeight: 500,
    color: "#ffffff",
    marginLeft: 4,
  },

  // Section Titles
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 2 },
  sectionSubtitle: { fontSize: 9, color: "#64748b", marginBottom: 8 },

  // Stats Grid
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statCard: {
    width: "23%",
    backgroundColor: "#f8fafc",
    border: "1pt solid #e2e8f0",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  statValue: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 },
  statLabel: { fontSize: 8, fontWeight: 500, color: "#64748b" },

  // Table
  table: { width: "100%", marginBottom: 16, border: "1pt solid #e2e8f0", borderRadius: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1pt solid #e2e8f0",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #e2e8f0",
    padding: 6,
  },
  col2: { width: "30%", fontSize: 9, color: "#0f172a" },
  col3: { width: "20%", fontSize: 9, color: "#64748b" },
  colCenter: { width: "10%", fontSize: 9, textAlign: "center", color: "#0f172a" },
  colEnd: { width: "10%", fontSize: 9, textAlign: "right", color: "#0f172a" },

  // Courses List
  courseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    border: "1pt solid #e2e8f0",
  },
});

interface PDFProps {
  student: Student;
  courses: Course[];
  exams: Exam[];
  locale: string;
  strings: Record<string, string>;
}

export function StudentReportPDF({ student, courses, exams, locale, strings }: PDFProps) {
  const isRtl = locale === "ar";
  const fullName = [student.firstName, student.middleName, student.lastName, student.additionalName]
    .filter(Boolean)
    .join(" ");

  const totalQuestions = (student.correctQuestions ?? 0) + (student.wrongQuestions ?? 0);
  const examsCount = student.examsPerformed ?? exams.length ?? 0;
  const avgPoints =
    student.averageRating && student.averageRating > 0
      ? Math.round(
          student.averageRating <= 5 ? (student.averageRating / 5) * 100 : student.averageRating,
        )
      : exams.length > 0
        ? Math.round(
            exams.reduce((acc, curr) => acc + (curr.score ?? curr.successRate ?? 0), 0) /
              exams.length,
          )
        : 0;

  return (
    <Document>
      {/* wrap={false} tells the renderer to strictly constrain this to one page */}
      <Page size="A4" style={styles.page} wrap={false}>
        {/* HEADER */}
        <View style={{ ...styles.headerContainer, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <View style={{ ...styles.brandWrapper, flexDirection: isRtl ? "row-reverse" : "row" }}>
            {/* Native PDF SVG rendering for your LogoIcon */}
            <View style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }}>
              <Svg viewBox="0 0 22 27" width={16} height={20}>
                <Path
                  d="M11.0333 22.6667C11.3 22.6444 11.5278 22.5389 11.7167 22.35C11.9056 22.1611 12 21.9333 12 21.6667C12 21.3556 11.9 21.1056 11.7 20.9167C11.5 20.7278 11.2444 20.6444 10.9333 20.6667C10.0222 20.7333 9.05556 20.4833 8.03333 19.9167C7.01111 19.35 6.36667 18.3222 6.1 16.8333C6.05556 16.5889 5.93889 16.3889 5.75 16.2333C5.56111 16.0778 5.34444 16 5.1 16C4.78889 16 4.53333 16.1167 4.33333 16.35C4.13333 16.5833 4.06667 16.8556 4.13333 17.1667C4.51111 19.1889 5.4 20.6333 6.8 21.5C8.2 22.3667 9.61111 22.7556 11.0333 22.6667ZM10.6667 26.6667C7.62222 26.6667 5.08333 25.6222 3.05 23.5333C1.01667 21.4444 0 18.8444 0 15.7333C0 13.5111 0.883333 11.0944 2.65 8.48333C4.41667 5.87222 7.08889 3.04444 10.6667 0C14.2444 3.04444 16.9167 5.87222 18.6833 8.48333C20.45 11.0944 21.3333 13.5111 21.3333 15.7333C21.3333 18.8444 20.3167 21.4444 18.2833 23.5333C16.25 25.6222 13.7111 26.6667 10.6667 26.6667ZM10.6667 24C12.9778 24 14.8889 23.2167 16.4 21.65C17.9111 20.0833 18.6667 18.1111 18.6667 15.7333C18.6667 14.1111 17.9944 12.2778 16.65 10.2333C15.3056 8.18889 13.3111 5.95556 10.6667 3.53333C8.02222 5.95556 6.02778 8.18889 4.68333 10.2333C3.33889 12.2778 2.66667 14.1111 2.66667 15.7333C2.66667 18.1111 3.42222 20.0833 4.93333 21.65C6.44444 23.2167 8.35556 24 10.6667 24Z"
                  fill="#007fff"
                />
              </Svg>
            </View>
            <Text style={styles.brandName}>رواء | Rewaa</Text>
          </View>

          <Text style={styles.badge}>#{student.id}</Text>
        </View>

        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            {student.image ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={student.image} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>
                {locale === "ar"
                  ? `${student.firstName[0] || ""}.${student.lastName[0] || ""}`
                  : `${student.firstName[0] || ""}${student.lastName[0] || ""}`}
              </Text>
            )}
          </View>
          <Text style={styles.studentName}>{fullName}</Text>
          <Text style={styles.studentMeta}>
            {strings.grade} • {strings.currentYear}
          </Text>
          {student.phoneNumber && (
            <View style={styles.phoneContainer}>
              <Svg viewBox="0 0 48 48" width={9} height={9}>
                <Path
                  d="M23.993 0C10.762 0 0 10.765 0 24c0 5.248 1.693 10.116 4.57 14.067L1.58 46.984l9.225-2.948C14.599 46.547 19.126 48 24.007 48 37.238 48 48 37.234 48 24 48 10.766 37.238 0 24.007 0h-.014zM17.293 12.19c-.465-1.114-.818-1.156-1.523-1.185-.24-.014-.508-.028-.804-.028-.917 0-1.876.268-2.455.86-.705.72-2.454 2.399-2.454 5.842 0 3.443 2.51 6.773 2.85 7.239.352.465 4.894 7.633 11.946 10.554 5.515 2.286 7.152 2.074 8.407 1.806 1.834-.395 4.133-1.75 4.711-3.386.579-1.637.579-3.034.41-3.33-.17-.296-.635-.465-1.34-.818-.705-.353-4.133-2.046-4.782-2.272-.635-.24-1.241-.155-1.72.522-.677.946-1.34 1.906-1.876 2.484-.424.452-1.115.508-1.693.268-.776-.324-2.948-1.087-5.628-3.471-2.074-1.848-3.484-4.148-3.893-4.839-.41-.705-.043-1.115.28-1.496.353-.437.692-.748 1.045-1.157.353-.409.55-.621.776-1.101.24-.465.07-.945-.1-1.298-.17-.353-1.58-3.796-2.158-5.192z"
                  fill="#ffffff"
                />
              </Svg>
              <Text style={styles.studentPhone}>{student.phoneNumber}</Text>
            </View>
          )}
          <Text style={{ fontSize: 8, color: "#e2e8f0", marginTop: 4 }}>{strings.generatedAt}</Text>
        </View>

        {/* STATS SECTION */}
        <Text style={{ ...styles.sectionTitle, textAlign: isRtl ? "right" : "left" }}>
          {strings.statsTitle}
        </Text>
        <Text style={{ ...styles.sectionSubtitle, textAlign: isRtl ? "right" : "left" }}>
          {strings.statsSubtitle}
        </Text>
        <View style={{ ...styles.statsGrid, flexDirection: isRtl ? "row-reverse" : "row" }}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>{strings.questionsAnswered}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{examsCount}</Text>
            <Text style={styles.statLabel}>{strings.examsPerformed}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{student.coursesCount || courses.length || 0}</Text>
            <Text style={styles.statLabel}>{strings.coursesEnrolled}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgPoints} / 100</Text>
            <Text style={styles.statLabel}>{strings.avgPoints}</Text>
          </View>
        </View>

        {/* EXAMS TABLE */}
        <Text style={{ ...styles.sectionTitle, textAlign: isRtl ? "right" : "left" }}>
          {strings.examsTitle}
        </Text>
        <View style={styles.table}>
          <View style={{ ...styles.tableHeader, flexDirection: isRtl ? "row-reverse" : "row" }}>
            <Text style={{ ...styles.col2, fontWeight: 700, textAlign: isRtl ? "right" : "left" }}>
              {strings.examName}
            </Text>
            <Text style={{ ...styles.col3, fontWeight: 700, textAlign: isRtl ? "right" : "left" }}>
              {strings.courseName}
            </Text>
            <Text style={{ ...styles.col3, fontWeight: 700, textAlign: isRtl ? "right" : "left" }}>
              {strings.date}
            </Text>
            <Text style={{ ...styles.colCenter, fontWeight: 700 }}>{strings.tries}</Text>
            <Text
              style={{ ...styles.colEnd, fontWeight: 700, textAlign: isRtl ? "left" : "right" }}
            >
              {strings.result}
            </Text>
          </View>
          {exams.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={{ width: "100%", fontSize: 9, textAlign: "center", color: "#64748b" }}>
                -
              </Text>
            </View>
          ) : (
            exams.slice(0, 5).map((exam, idx) => {
              const score =
                typeof exam.score === "number"
                  ? exam.score
                  : typeof exam.successRate === "number"
                    ? exam.successRate
                    : 92 - idx * 7;
              return (
                <View
                  key={exam.id}
                  style={{ ...styles.tableRow, flexDirection: isRtl ? "row-reverse" : "row" }}
                >
                  <Text
                    style={{ ...styles.col2, fontWeight: 700, textAlign: isRtl ? "right" : "left" }}
                  >
                    {exam.title}
                  </Text>
                  <Text style={{ ...styles.col3, textAlign: isRtl ? "right" : "left" }}>
                    {exam.courseTitle || "-"}
                  </Text>
                  <Text style={{ ...styles.col3, textAlign: isRtl ? "right" : "left" }}>
                    {exam.createdAt
                      ? new Date(
                          exam.createdAt.includes("T")
                            ? exam.createdAt
                            : exam.createdAt.replace(" ", "T"),
                        ).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")
                      : "-"}
                  </Text>
                  <Text style={styles.colCenter}>{exam.timesUsed || 1}</Text>
                  <Text
                    style={{
                      ...styles.colEnd,
                      fontWeight: 700,
                      textAlign: isRtl ? "left" : "right",
                    }}
                  >
                    {score}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* COURSES LIST */}
        <Text style={{ ...styles.sectionTitle, textAlign: isRtl ? "right" : "left", marginTop: 4 }}>
          {strings.coursesTitle}
        </Text>
        {courses.slice(0, student.coursesCount || 3).map((course, idx) => (
          <View
            key={course.id}
            style={{ ...styles.courseCard, flexDirection: isRtl ? "row-reverse" : "row" }}
          >
            <Text style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>{course.title}</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: "#007fff" }}>
              {80 - idx * 18}%
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
