import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormToggleSettingProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ElementType | React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FormToggleSetting({
  id,
  title,
  subtitle,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  children,
}: FormToggleSettingProps) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (typeof Icon === "function" || (typeof Icon === "object" && "render" in (Icon as object))) {
      const Component = Icon as React.ElementType;
      return <Component className="size-4 shrink-0" />;
    }
    return Icon;
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 transition-colors overflow-hidden p-3.5",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-md bg-background border shadow-2xs text-muted-foreground">
              {renderIcon()}
            </div>
          )}
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground block">{title}</span>
            {subtitle && <span className="text-xs text-muted-foreground block">{subtitle}</span>}
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-input peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      {children && (
        <div className="px-3.5 pb-3.5 pt-1 mt-4 border-t border-border/50 bg-background/50 animate-in fade-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  );
}
