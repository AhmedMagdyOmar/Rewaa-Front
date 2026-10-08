"use client";

import { BookOpen, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardCard } from "../overview/dashboard-card";
import { Course } from "@/types/course";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { CustomVideoPlayer } from "@/components/ui/custom-video-player";

interface CourseOverviewProps {
  course: Course;
}

export function CourseOverview({ course }: CourseOverviewProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <DashboardCard className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>{t("details.overview")}</span>
        </h2>
      </div>
      <MarkdownViewer content={course.description} isRtl={isRtl} />

      {/* Preview Video if available */}
      {course.previewVideoLink && (
        <div className="pt-4 border-t border-border/40 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Video className="size-4 text-primary" />
            <span>{t("details.previewVideo")}</span>
          </div>
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/90 flex items-center justify-center border border-border/40">
            <CustomVideoPlayer url={course.previewVideoLink} title={course.title} />
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
