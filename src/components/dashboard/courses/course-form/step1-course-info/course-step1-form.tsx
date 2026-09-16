"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MainInfoSection } from "./main-info-section";
import { CategoryInfoSection } from "./category-info-section";
import { PriceInfoSection } from "./price-info-section";
import { AdvancedSettingsSection } from "./advanced-settings-section";
import { useCourseForm } from "../hooks/use-course-form";

interface CourseStep1FormProps {
  form: ReturnType<typeof useCourseForm>;
  initialCourseId?: string;
}

export function CourseStep1Form({ form, initialCourseId }: CourseStep1FormProps) {
  const t = useTranslations("courses.new");

  return (
    <form onSubmit={(e) => form.handleSubmit(e, false)} className="space-y-8">
      {/* 1. MAIN INFORMATION */}
      <MainInfoSection
        title={form.title}
        onTitleChange={form.setTitle}
        description={form.description}
        onDescriptionChange={form.setDescription}
        previewVideoLink={form.previewVideoLink}
        onPreviewVideoLinkChange={form.setPreviewVideoLink}
        coverImage={form.coverImage}
        onCoverImageChange={(dataUrl, file) => {
          form.setCoverImage(dataUrl);
          if (file) {
            form.setCoverImageFile(file);
            form.setRemoveCoverImage(false);
          }
        }}
        onCoverImageClear={() => {
          form.setCoverImage("");
          form.setCoverImageFile(null);
          form.setRemoveCoverImage(true);
        }}
      />

      {/* 2. CATEGORY INFORMATION */}
      <CategoryInfoSection
        grade={form.grade}
        onGradeChange={form.setGrade}
        subject={form.subject}
        onSubjectChange={form.setSubject}
        teacherName={form.teacherName}
        onTeacherNameChange={form.setTeacherName}
        period={form.period}
        onPeriodChange={form.setPeriod}
        courseOptions={form.courseOptions}
      />

      {/* 3. PRICE INFORMATION */}
      <PriceInfoSection
        isFree={form.isFree}
        onIsFreeChange={form.setIsFree}
        coursePrice={form.coursePrice}
        onCoursePriceChange={form.setCoursePrice}
        currency={form.currency}
        onCurrencyChange={form.setCurrency}
        hasOffer={form.hasOffer}
        onHasOfferChange={form.setHasOffer}
        offerPercentage={form.offerPercentage}
        onOfferPercentageChange={form.setOfferPercentage}
        offerStartDate={form.offerStartDate}
        onOfferStartDateChange={form.setOfferStartDate}
        offerEndDate={form.offerEndDate}
        onOfferEndDateChange={form.setOfferEndDate}
        courseOptions={form.courseOptions}
      />

      {/* 4. ADVANCED SETTINGS */}
      <AdvancedSettingsSection
        hasTimeLimit={form.hasTimeLimit}
        onHasTimeLimitChange={form.setHasTimeLimit}
        timeLimitValue={form.timeLimitValue}
        onTimeLimitValueChange={form.setTimeLimitValue}
        isActive={form.isActive}
        onIsActiveChange={form.setIsActive}
        venue={form.venue}
        onVenueChange={form.setVenue}
      />

      {/* CTA Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={form.isSubmitting || form.isSavingDraft}>
          {form.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : initialCourseId ? (
            t("actions.saveAndPublish")
          ) : (
            t("actions.createCourse")
          )}
        </Button>
      </div>
    </form>
  );
}
