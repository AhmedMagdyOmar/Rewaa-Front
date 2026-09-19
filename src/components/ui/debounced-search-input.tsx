"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedSearch } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface DebouncedSearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
  delay?: number;
  containerClassName?: string;
  showClearButton?: boolean;
}

export function DebouncedSearchInput({
  value,
  onValueChange,
  delay = 400,
  containerClassName,
  className,
  placeholder = "Search...",
  showClearButton = true,
  disabled,
  ...props
}: DebouncedSearchInputProps) {
  const {
    value: localValue,
    onChange,
    onClear,
  } = useDebouncedSearch({
    value,
    onChange: onValueChange,
    delay,
  });

  return (
    <div className={cn("relative flex-1 min-w-55", containerClassName)}>
      <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={localValue}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "ps-9",
          showClearButton && localValue ? "pe-8" : "",
          "bg-background",
          className,
        )}
        {...props}
      />
      {showClearButton && localValue && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-e-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          tabIndex={-1}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
