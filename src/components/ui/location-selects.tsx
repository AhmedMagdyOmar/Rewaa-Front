"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface LocationOption {
  id: number | string;
  name: string;
  countryId?: number | string;
}

interface LocationSelectProps {
  id?: string;
  label?: string;
  value?: string | number;
  onValueChange: (value: string) => void;
  options: LocationOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function LocationCombobox({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
  className,
  required = false,
}: LocationSelectProps) {
  const [open, setOpen] = React.useState(false);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("common");

  const selectedOption = React.useMemo(() => {
    if (value === undefined || value === null || value === "") return undefined;
    const strVal = String(value);
    return options.find((opt) => String(opt.id) === strVal || opt.name === strVal);
  }, [options, value]);

  const defaultPlaceholder = placeholder || t("search");
  const defaultSearchPlaceholder = searchPlaceholder || t("search");
  const defaultEmptyLabel = emptyLabel || t("noResults");

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className={disabled ? "text-muted-foreground/60" : ""}>
          {label}
          {required && <span className="text-destructive ms-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal bg-background h-10 px-3",
              !selectedOption && "text-muted-foreground",
              isRTL ? "text-right" : "text-left",
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <span className="line-clamp-1 flex-1">
              {selectedOption ? selectedOption.name : defaultPlaceholder}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50 ms-2" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-50 p-0"
          align="start"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Command dir={isRTL ? "rtl" : "ltr"}>
            <CommandInput placeholder={defaultSearchPlaceholder} />
            <CommandList>
              <CommandEmpty>{defaultEmptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected =
                    selectedOption?.id === opt.id ||
                    String(value) === String(opt.id) ||
                    String(value) === opt.name;

                  return (
                    <CommandItem
                      key={String(opt.id)}
                      value={`${opt.name} ___ ${opt.id}`}
                      onSelect={() => {
                        onValueChange(String(opt.id));
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-2 px-2.5 text-sm outline-none select-none",
                        isRTL ? "pl-8 pr-2.5 text-right" : "pr-8 pl-2.5 text-left",
                      )}
                    >
                      <span className="flex-1 line-clamp-1">{opt.name}</span>
                      <span
                        className={cn(
                          "pointer-events-none absolute flex size-4 items-center justify-center",
                          isRTL ? "left-2" : "right-2",
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            "size-4 text-primary",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CountrySelect({
  id = "country",
  label,
  value,
  onValueChange,
  countries,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
  className,
  required,
}: Omit<LocationSelectProps, "options"> & {
  countries: LocationOption[];
}) {
  return (
    <LocationCombobox
      id={id}
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={countries}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      disabled={disabled}
      className={className}
      required={required}
    />
  );
}

export function GovernorateSelect({
  id = "state",
  label,
  value,
  onValueChange,
  governorates,
  countryId,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
  className,
  required,
}: Omit<LocationSelectProps, "options"> & {
  governorates: LocationOption[];
  countryId?: number | string;
}) {
  const filteredGovernorates = React.useMemo(() => {
    if (!countryId) return governorates;
    const strCountryId = String(countryId);
    return governorates.filter((gov) => !gov.countryId || String(gov.countryId) === strCountryId);
  }, [governorates, countryId]);

  return (
    <LocationCombobox
      id={id}
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={filteredGovernorates}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      disabled={disabled || filteredGovernorates.length === 0}
      className={className}
      required={required}
    />
  );
}
