"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocalizedDateInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  error?: boolean;
}

export function LocalizedDateInput({
  id,
  name,
  value,
  onChange,
  className,
  required,
  disabled,
  min,
  max,
  placeholder,
  error,
}: LocalizedDateInputProps) {
  const locale = useLocale();

  const formattedDate = useMemo(() => {
    if (!value) return "";
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;

    const date = new Date(year, month - 1, day);
    const formatLocale = locale.startsWith("ar") ? "ar-EG-u-nu-latn" : "en-GB";

    return new Intl.DateTimeFormat(formatLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, [value, locale]);

  const defaultPlaceholder = locale.startsWith("ar") ? "يوم / شهر / سنة" : "DD/MM/YYYY";

  return (
    <div className={cn("relative", className)}>
      {/* Visible styled input */}
      <Input
        type="text"
        readOnly
        tabIndex={-1}
        value={formattedDate}
        placeholder={placeholder || defaultPlaceholder}
        disabled={disabled}
        className={cn(
          "pe-10 pointer-events-none",
          error && "border-destructive focus-visible:ring-destructive",
        )}
      />
      <Calendar className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

      {/* Invisible native date input that handles clicks & opens the picker */}
      <input
        id={id}
        name={name}
        type="date"
        lang={locale}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          if (!disabled) {
            e.currentTarget.showPicker?.();
          }
        }}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
}
