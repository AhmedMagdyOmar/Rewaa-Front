import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { GradeSelect, SubjectSelect, TeacherSelect } from "@/components/ui/academic-selects";

interface QuestionAcademicContextSectionProps {
  allowEditableAcademicProps?: boolean;
  selectedStageId: string;
  onStageChange: (val: string) => void;
  selectedSubjId: string;
  onSubjChange: (val: string) => void;
  selectedInstId: string;
  onInstChange: (val: string) => void;
  mappedStages: Array<{ id: number | string; name: string }>;
  mappedSubjects: Array<{ id: number | string; name: string }>;
  mappedInstructors: Array<{ id: number | string; full_name: string }>;
  isLoadingOptions: boolean;
  requiresInstructorSelection?: boolean;
  examGrade?: string;
  examSubject?: string;
  examTeacherName?: string;
  t: (key: string) => string;
  tNew: (key: string) => string;
}

export function QuestionAcademicContextSection({
  allowEditableAcademicProps = false,
  selectedStageId,
  onStageChange,
  selectedSubjId,
  onSubjChange,
  selectedInstId,
  onInstChange,
  mappedStages,
  mappedSubjects,
  mappedInstructors,
  isLoadingOptions,
  requiresInstructorSelection = true,
  examGrade,
  examSubject,
  examTeacherName,
  t,
  tNew,
}: QuestionAcademicContextSectionProps) {
  return (
    <FormSectionCard
      title={allowEditableAcademicProps ? tNew("academicGroupTitle") : t("autoFilledHeader")}
      icon={GraduationCap}
    >
      {allowEditableAcademicProps ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GradeSelect
            value={selectedStageId}
            onValueChange={onStageChange}
            label={tNew("selectGrade")}
            placeholder={tNew("selectGradePlaceholder")}
            grades={mappedStages}
            disabled={isLoadingOptions}
            required
          />
          <SubjectSelect
            value={selectedSubjId}
            onValueChange={onSubjChange}
            label={tNew("selectSubject")}
            placeholder={tNew("selectSubjectPlaceholder")}
            subjects={mappedSubjects}
            disabled={isLoadingOptions || !selectedStageId}
            required
          />
          <TeacherSelect
            value={selectedInstId}
            onValueChange={onInstChange}
            label={tNew("teacherName")}
            placeholder={tNew("teacherNamePlaceholder")}
            teachers={mappedInstructors}
            disabled={isLoadingOptions || requiresInstructorSelection === false}
            required={requiresInstructorSelection !== false}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground block">{t("grade")}</span>
            <Badge variant="secondary" className="font-semibold">
              {(() => {
                if (!examGrade) return t("notSet");
                const found = mappedStages?.find((s) => String(s.id) === String(examGrade));
                if (found) return found.name;
                return examGrade;
              })()}
            </Badge>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground block">{t("subject")}</span>
            <Badge variant="secondary" className="font-semibold">
              {(() => {
                if (!examSubject) return t("notSet");
                const found = mappedSubjects?.find((s) => String(s.id) === String(examSubject));
                if (found) return found.name;
                return examSubject;
              })()}
            </Badge>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground block">{t("teacher")}</span>
            <Badge variant="secondary" className="font-semibold">
              {(() => {
                if (!examTeacherName) return t("notSet");
                const found = mappedInstructors?.find(
                  (i) => String(i.id) === String(examTeacherName),
                );
                if (found) return found.full_name;
                return examTeacherName;
              })()}
            </Badge>
          </div>
        </div>
      )}
    </FormSectionCard>
  );
}
