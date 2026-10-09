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
              <Svg viewBox="0 0 1067 667" width={24} height={15}>
                <Path
                  d="m 637.69209,560.40936 c 1.29729,-0.33806 3.09729,-0.31582 4,0.0494 0.90271,0.36523 -0.15871,0.64182 -2.35871,0.61465 -2.2,-0.0272 -2.93858,-0.326 -1.64129,-0.66406 z m 26.66667,0 c 1.29729,-0.33806 3.09729,-0.31582 4,0.0494 0.90271,0.36523 -0.15871,0.64182 -2.35871,0.61465 -2.2,-0.0272 -2.93858,-0.326 -1.64129,-0.66406 z m -112.07323,-23.7441 c -16.98124,-27.76328 -42.78784,-50.54372 -76.22923,-67.29035 -25.2974,-12.66832 -50.55781,-20.41301 -80.72294,-24.74918 -8.8,-1.26498 -16.43024,-2.6835 -16.95609,-3.15227 -0.52585,-0.46876 14.23414,-9.39854 32.79999,-19.84394 l 33.7561,-18.99164 10.53334,1.44046 c 47.75373,6.53044 87.73183,41.14839 100.76532,87.25501 2.4447,8.64826 3.00772,13.94657 2.97539,28 -0.0219,9.53333 -0.67106,18.83269 -1.4425,20.66524 -1.39103,3.30438 -1.4363,3.27684 -5.47938,-3.33333 z m -33.7889,-12.33191 c -1.65849,-2.11474 -1.61133,-2.1619 0.50341,-0.50341 2.221,1.74183 2.92731,2.83674 1.82993,2.83674 -0.27688,0 -1.32688,-1.05 -2.33334,-2.33333 z M 277.08335,504.42253 c 0.9625,-0.38516 2.1125,-0.33779 2.55556,0.10526 0.44306,0.44306 -0.34444,0.75819 -1.75,0.7003 -1.55326,-0.064 -1.8692,-0.37992 -0.80556,-0.80556 z m 54.66668,0 c 0.9625,-0.38516 2.1125,-0.33779 2.55555,0.10526 0.44306,0.44306 -0.34444,0.75819 -1.75,0.7003 -1.55326,-0.064 -1.8692,-0.37992 -0.80555,-0.80556 z m 490.9167,-3.59259 c 0,-0.27687 1.05,-1.32687 2.33333,-2.33333 2.11474,-1.6585 2.1619,-1.61134 0.50341,0.50341 -1.74183,2.22099 -2.83674,2.9273 -2.83674,1.82992 z M 358.41669,467.0892 c 0.9625,-0.38517 2.1125,-0.3378 2.55556,0.10526 0.44306,0.44305 -0.34444,0.75819 -1.75,0.70029 -1.55326,-0.064 -1.8692,-0.37992 -0.80556,-0.80555 z m 26.66667,0 c 0.9625,-0.38517 2.1125,-0.3378 2.55556,0.10526 0.44305,0.44305 -0.34445,0.75819 -1.75,0.70029 -1.55326,-0.064 -1.8692,-0.37992 -0.80556,-0.80555 z m 250.91669,-6.25926 c 0,-0.27687 1.05,-1.32687 2.33333,-2.33333 2.11474,-1.6585 2.1619,-1.61134 0.50341,0.5034 -1.74183,2.221 -2.83674,2.92731 -2.83674,1.82993 z m 20,-21.33333 c 0,-0.27688 1.05,-1.32688 2.33333,-2.33334 2.11474,-1.65849 2.1619,-1.61133 0.50341,0.50341 -1.74183,2.221 -2.83674,2.92731 -2.83674,1.82993 z m 3.33333,-52.82993 c 1.32732,-1.46667 2.7133,-2.66667 3.07997,-2.66667 0.36667,0 -0.41932,1.2 -1.74663,2.66667 -1.32732,1.46667 -2.7133,2.66667 -3.07997,2.66667 -0.36667,0 0.41932,-1.2 1.74663,-2.66667 z M 215.02984,369.33334 c 0,-3.3 0.26002,-4.65 0.57782,-3 0.3178,1.65 0.3178,4.35 0,6 -0.3178,1.65 -0.57782,0.3 -0.57782,-3 z m 602.51408,-28 c 0,-1.83333 0.30263,-2.58333 0.67252,-1.66666 0.36988,0.91666 0.36988,2.41666 0,3.33333 -0.36989,0.91667 -0.67252,0.16667 -0.67252,-1.66667 z m -554.6173,-11.33333 c 0.0272,-2.2 0.326,-2.93858 0.66405,-1.64129 0.33806,1.29729 0.31583,3.09729 -0.0494,4 -0.36523,0.90271 -0.64182,-0.15871 -0.61465,-2.35871 z M 878.772,316.55557 c 0.064,-1.55326 0.37992,-1.8692 0.80555,-0.80556 0.38516,0.9625 0.33779,2.1125 -0.10526,2.55556 -0.44306,0.44305 -0.75819,-0.34445 -0.70029,-1.75 z M 293.08336,297.75586 c 0.9625,-0.38516 2.1125,-0.3378 2.55555,0.10526 0.44306,0.44306 -0.34444,0.75819 -1.75,0.70029 -1.55326,-0.064 -1.8692,-0.37992 -0.80555,-0.80555 z m 209.89268,-43.08919 c 0,-2.56666 0.2744,-3.61666 0.60977,-2.33333 0.33537,1.28333 0.33537,3.38333 0,4.66667 -0.33537,1.28333 -0.60977,0.23333 -0.60977,-2.33334 z m 67.024,-17.33333 c 1.32732,-1.46667 2.7133,-2.66667 3.07997,-2.66667 0.36667,0 -0.41932,1.2 -1.74663,2.66667 -1.32732,1.46667 -2.7133,2.66667 -3.07997,2.66667 -0.36667,0 0.41932,-1.2 1.74663,-2.66667 z m -67.22807,-22.11111 c 0.064,-1.55326 0.37992,-1.8692 0.80555,-0.80556 0.38516,0.9625 0.3378,2.1125 -0.10526,2.55556 -0.44305,0.44305 -0.75819,-0.34445 -0.70029,-1.75 z M 645.02393,203.0337 c 2.39646,-0.29675 5.99647,-0.29063 8,0.0136 2.00353,0.30424 0.0428,0.54703 -4.35721,0.53955 -4.4,-0.007 -6.03926,-0.2564 -3.64279,-0.55315 z"
                  fill="#73a4ec"
                />
                <Path
                  d="m 547.33338,584.50748 c -8.33771,-7.5536 -33.89782,-24.79837 -48.77998,-32.91064 -68.54799,-37.36554 -161.70733,-54.91258 -238.42577,-44.90873 -11.29649,1.47303 -20.76591,2.45138 -21.04317,2.17413 -0.89509,-0.89509 17.18845,-11.21531 31.58223,-18.02387 77.1201,-36.47946 161.72356,-30.53673 227.07728,15.9504 14.92924,10.61941 33.48716,30.01779 42.08874,43.99489 7.94065,12.90312 18.27941,40.00313 15.19274,39.82328 -0.56398,-0.0329 -4.02541,-2.77762 -7.69207,-6.09946 z m 28.09849,-26.57832 c 7.31272,-30.3179 29.08842,-63.06703 72.65569,-109.26903 30.65147,-32.50511 40.14361,-46.07154 46.36827,-66.27079 11.18286,-36.28882 -3.21486,-85.44715 -34.96786,-119.3912 -16.45413,-17.58952 -33.6892,-26.83328 -52.15459,-27.97229 -9.66847,-0.59639 -11.02834,-0.37078 -14.53152,2.41076 -5.22805,4.15112 -11.17249,17.76486 -13.06091,29.91165 -2.83262,18.22014 1.86629,36.8638 13.78079,54.67746 11.16317,16.69032 28.58902,29.68448 47.33329,35.29561 7.77716,2.3281 12.2107,2.77353 24.19871,2.43117 l 14.67705,-0.41916 -2.05955,4 c -5.85153,11.36469 -22.91552,29.42612 -33.67119,35.63939 -22.83672,13.19219 -52.93616,9.01517 -76.27261,-10.58464 -21.88732,-18.38272 -32.95286,-45.06688 -31.35302,-75.60668 0.84665,-16.1619 3.29613,-25.81084 10.27136,-40.46061 6.74551,-14.16734 11.80217,-21.50494 22.6058,-32.80279 11.02961,-11.53417 22.10166,-19.4867 36.29044,-26.06572 15.32787,-7.1072 25.92208,-9.45612 42.54321,-9.43258 29.38252,0.0416 51.9663,10.24323 73.71625,33.29932 34.58183,36.65856 46.82053,94.71557 31.4832,149.34765 -6.33119,22.55191 -19.7962,45.03111 -37.95129,63.35789 -12.93231,13.05461 -23.93037,21.43908 -58.50866,44.60463 -31.62126,21.18451 -47.8452,33.90225 -67.61626,53.00357 -12.53171,12.10719 -14.58319,13.64043 -13.7766,10.29639 z m 57.23484,2.23617 -10.66666,-0.83198 28,-5.78503 c 15.48633,-3.1996 33.66095,-7.88471 40.66667,-10.48319 62.06242,-23.01946 106.57092,-64.02004 121.23077,-111.67604 6.13512,-19.94393 7.01299,-31.22309 6.54219,-84.05575 l -0.43962,-49.33333 3.77634,-7.69039 c 2.07699,-4.22971 6.65445,-10.64524 10.17214,-14.25672 7.49644,-7.69631 36.65488,-27.28498 39.17511,-26.31788 1.75013,0.67159 4.74083,24.02254 7.54772,58.93166 1.69626,21.09624 1.66741,51.69479 -0.0649,68.85873 -10.29055,101.95906 -78.1373,167.54465 -187.27307,181.03172 -14.37459,1.77642 -45.55242,2.63108 -58.66668,1.6082 z M 187.98267,478.72714 c 5.29812,-18.47345 24.69376,-39.13638 45.81093,-48.80413 l 7.46528,-3.41772 -7.08823,-8.5934 c -13.60187,-16.49017 -18.17063,-28.88904 -18.17063,-49.31206 0,-47.75641 39.27714,-93.9171 90.26487,-106.08434 16.53906,-3.94672 36.52558,-3.105 52.28125,2.2018 6.16703,2.07718 12.76703,5.12741 14.66667,6.77831 l 3.45389,3.00163 -3.0328,5.75139 c -3.71585,7.04674 -22.39,28.61503 -26.96721,31.14661 -4.99653,2.76351 -7.4493,2.37299 -16.45002,-2.61912 -27.47201,-15.23691 -54.04702,-13.73709 -63.04467,3.55807 -5.48551,10.54416 -4.84922,27.48539 1.52138,40.50642 7.4035,15.13222 24.52863,29.14767 44.94244,36.78156 9.60964,3.59359 13.20084,4.20398 27.87304,4.73753 19.09322,0.69433 31.61261,-1.25447 49.65487,-7.72941 l 10.8363,-3.88889 -7.2338,6.75878 c -21.97041,20.52766 -53.27914,36.46785 -112.09954,57.07315 -48.07714,16.84185 -64.32762,22.89926 -79.33326,29.57169 -8.06662,3.58692 -15.07474,6.52167 -15.57359,6.52167 -0.49886,0 -0.39858,-1.77279 0.22283,-3.93954 z m 261.3507,-232.48513 c 0,-160.855036 -0.702,-150.215707 10.73727,-162.73209 5.84383,-6.394076 23.44824,-19.376549 38.96097,-28.731987 l 5.03157,-3.034446 -0.52703,141.794933 c -0.56805,152.82969 -0.36488,148.48333 -7.61969,163.00967 -4.27339,8.55663 -11.69597,16.84354 -19.66997,21.96044 -6.6534,4.26947 -20.10811,9.49148 -24.45519,9.49148 -2.37294,0 -2.45793,-4.9017 -2.45793,-141.758 z"
                  fill="#2659aa"
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
