"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubjectsList } from "@/hooks/use-settings";
import { adaptBackendSubjectToSubjectItem } from "@/lib/adapters/settings-adapter";
import type { SubjectItem } from "@/types/settings";
import { BookOpen, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function SubjectsSection() {
  const t = useTranslations("settings.subjects");

  const { data: backendSubjects, isLoading } = useSubjectsList();
  const subjects: SubjectItem[] = (backendSubjects || []).map((s) =>
    adaptBackendSubjectToSubjectItem(s),
  );

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5 flex-1">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="rounded-lg border overflow-y-auto max-h-48">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="*:text-start">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.coursesCount")}</TableHead>
              <TableHead>{t("columns.teachersCount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">{t("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                  {t("noSubjects")}
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{subject.name}</TableCell>
                  <TableCell className="text-xs font-mono">{subject.coursesCount}</TableCell>
                  <TableCell className="text-xs font-mono">{subject.teachersCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
