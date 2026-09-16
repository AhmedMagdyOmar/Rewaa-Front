"use client";

import { useTranslations } from "next-intl";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { FormRadioGroup } from "@/components/ui/form-radio-group";
import { Input } from "@/components/ui/input";
import { Clock, Layers, MapPin, Power } from "lucide-react";
import { CourseVenue } from "@/types/course";

interface AdvancedSettingsSectionProps {
  hasTimeLimit: boolean;
  onHasTimeLimitChange: (val: boolean) => void;
  timeLimitValue: number | "";
  onTimeLimitValueChange: (val: number | "") => void;
  isActive: boolean;
  onIsActiveChange: (val: boolean) => void;
  venue: CourseVenue;
  onVenueChange: (val: CourseVenue) => void;
}

export function AdvancedSettingsSection({
  hasTimeLimit,
  onHasTimeLimitChange,
  timeLimitValue,
  onTimeLimitValueChange,
  isActive,
  onIsActiveChange,
  venue,
  onVenueChange,
}: AdvancedSettingsSectionProps) {
  const t = useTranslations("courses.new");

  return (
    <FormSectionCard
      title={t("sections.advancedSettings.title")}
      description={t("sections.advancedSettings.description")}
      icon={Layers}
      contentClassName="space-y-5"
    >
      {/* hasTimeLimit Toggle */}
      <FormToggleSetting
        id="has-time-limit-toggle"
        title={t("fields.hasTimeLimit")}
        subtitle={t("fields.hasTimeLimitSubtitle")}
        icon={Clock}
        checked={hasTimeLimit}
        onCheckedChange={onHasTimeLimitChange}
      />

      {/* timeLimitValue (conditional) */}
      {hasTimeLimit && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 max-w-sm">
          <label htmlFor="time-limit-val" className="text-sm font-medium text-foreground">
            {t("fields.timeLimitValue")} <span className="text-destructive">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              id="time-limit-val"
              type="number"
              min="1"
              value={timeLimitValue}
              onChange={(e) => onTimeLimitValueChange(e.target.value ? Number(e.target.value) : "")}
              placeholder="90"
              required={hasTimeLimit}
            />
          </div>
        </div>
      )}

      {/* isActive Toggle */}
      <FormToggleSetting
        id="is-active-toggle"
        title={t("fields.isActive")}
        subtitle={t("fields.isActiveSubtitle")}
        icon={Power}
        checked={isActive}
        onCheckedChange={onIsActiveChange}
      />

      {/* Venue (Radio Group with 3 options) */}
      <FormRadioGroup
        name="venue-option"
        title={t("fields.venue")}
        subtitle={t("fields.venueSubtitle")}
        icon={MapPin}
        value={venue}
        onValueChange={(val) => onVenueChange(val as CourseVenue)}
        options={[
          {
            id: "online",
            label: t("venues.online.label"),
            desc: t("venues.online.desc"),
          },
          {
            id: "center",
            label: t("venues.center.label"),
            desc: t("venues.center.desc"),
          },
          {
            id: "all",
            label: t("venues.all.label"),
            desc: t("venues.all.desc"),
          },
        ]}
      />
    </FormSectionCard>
  );
}
