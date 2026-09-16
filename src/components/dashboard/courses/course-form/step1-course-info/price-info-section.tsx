"use client";

import { useTranslations } from "next-intl";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";
import { BackendCourseOptions } from "@/types/api-contracts";

interface PriceInfoSectionProps {
  isFree: boolean;
  onIsFreeChange: (val: boolean) => void;
  coursePrice: number | "";
  onCoursePriceChange: (val: number | "") => void;
  currency: string;
  onCurrencyChange: (val: string) => void;
  hasOffer: boolean;
  onHasOfferChange: (val: boolean) => void;
  offerPercentage: number | "";
  onOfferPercentageChange: (val: number | "") => void;
  offerStartDate: string;
  onOfferStartDateChange: (val: string) => void;
  offerEndDate: string;
  onOfferEndDateChange: (val: string) => void;
  courseOptions?: BackendCourseOptions;
}

export function PriceInfoSection({
  isFree,
  onIsFreeChange,
  coursePrice,
  onCoursePriceChange,
  currency,
  onCurrencyChange,
  hasOffer,
  onHasOfferChange,
  offerPercentage,
  onOfferPercentageChange,
  offerStartDate,
  onOfferStartDateChange,
  offerEndDate,
  onOfferEndDateChange,
  courseOptions,
}: PriceInfoSectionProps) {
  const t = useTranslations("courses.new");

  return (
    <FormSectionCard
      title={t("sections.priceInfo.title")}
      description={t("sections.priceInfo.description")}
      icon={Coins}
      contentClassName="space-y-5"
    >
      {/* isFree Toggle */}
      <FormToggleSetting
        id="is-free-toggle"
        title={t("fields.isFree")}
        subtitle={t("fields.isFreeSubtitle")}
        checked={isFree}
        onCheckedChange={onIsFreeChange}
      />

      {!isFree && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
          {/* Course Price */}
          <div className="flex flex-col gap-2">
            <label htmlFor="course-price" className="text-sm font-medium text-foreground">
              {t("fields.coursePrice")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              value={coursePrice}
              onChange={(e) => onCoursePriceChange(e.target.value ? Number(e.target.value) : "")}
              placeholder="299.00"
              required={!isFree}
            />
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t("fields.currency")}</label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-full h-12! py-3!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(courseOptions?.currency_code && courseOptions.currency_code.length > 0
                  ? courseOptions.currency_code
                  : ["EGP"]
                ).map((code) => (
                  <SelectItem key={code} value={code}>
                    {t.has(`currencies.${code}`) ? t(`currencies.${code}`) : code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* hasOffer Toggle */}
      <FormToggleSetting
        id="has-offer-toggle"
        title={t("fields.hasOffer")}
        subtitle={t("fields.hasOfferSubtitle")}
        checked={hasOffer}
        onCheckedChange={onHasOfferChange}
      />

      {/* Offer details (conditional) */}
      {hasOffer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-col gap-2">
            <label htmlFor="offer-percentage" className="text-sm font-medium text-foreground">
              {t("fields.offerPercentage")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="offer-percentage"
              type="number"
              min="1"
              max="100"
              value={offerPercentage}
              onChange={(e) =>
                onOfferPercentageChange(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="20"
              required={hasOffer}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="offer-start-date" className="text-sm font-medium text-foreground">
              {t("fields.offerStartDate")}
            </label>
            <Input
              id="offer-start-date"
              type="date"
              value={offerStartDate}
              onChange={(e) => onOfferStartDateChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="offer-end-date" className="text-sm font-medium text-foreground">
              {t("fields.offerEndDate")}
            </label>
            <Input
              id="offer-end-date"
              type="date"
              value={offerEndDate}
              onChange={(e) => onOfferEndDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </FormSectionCard>
  );
}
