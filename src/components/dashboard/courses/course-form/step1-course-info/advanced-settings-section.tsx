"use client";

import { FormSectionCard } from "@/components/ui/form-section-card";
import { FormToggleSetting } from "@/components/ui/form-toggle-setting";
import { Input } from "@/components/ui/input";
import { Clock, Layers, Power } from "lucide-react";
import { useTranslations } from "next-intl";

interface AdvancedSettingsSectionProps {
  hasTimeLimit: boolean;
  onHasTimeLimitChange: (val: boolean) => void;
  timeLimitValue: number | "";
  onTimeLimitValueChange: (val: number | "") => void;
  isActive: boolean;
  onIsActiveChange: (val: boolean) => void;
}

export function AdvancedSettingsSection({
  hasTimeLimit,
  onHasTimeLimitChange,
  timeLimitValue,
  onTimeLimitValueChange,
  isActive,
  onIsActiveChange,
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
    </FormSectionCard>
  );
}
