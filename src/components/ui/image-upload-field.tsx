/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Upload, X, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageUploadFieldProps {
  id?: string;
  label?: React.ReactNode;
  labelIcon?: React.ReactNode;
  value?: string | null;
  onChange: (dataUrl: string, file?: File) => void;
  onClear?: () => void;
  variant?: "rectangle" | "avatar";
  aspectRatio?: "video" | "square" | "banner" | "auto";
  prompt?: React.ReactNode;
  hint?: React.ReactNode;
  changePrompt?: React.ReactNode;
  placeholderIcon?: React.ReactNode;
  previewAlt?: string;
  previewHeightClassName?: string;
  previewWidthClassName?: string;
  className?: string;
  dropzoneClassName?: string;
  disabled?: boolean;
  required?: boolean;
}

export function ImageUploadField({
  id,
  label,
  labelIcon,
  value,
  onChange,
  onClear,
  variant = "rectangle",
  aspectRatio = "auto",
  prompt,
  hint,
  changePrompt,
  placeholderIcon,
  previewAlt,
  previewHeightClassName,
  previewWidthClassName,
  className,
  dropzoneClassName,
  disabled = false,
  required = false,
}: ImageUploadFieldProps) {
  const t = useTranslations("common.imageUpload");
  const effectiveAlt = previewAlt || t("previewAlt");
  const inputId = React.useId();
  const actualId = id || inputId;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [value]);

  const isAvatar = variant === "avatar";

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={actualId}
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          {labelIcon}
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div
        className={cn(
          "relative border-2 border-dashed border-input hover:border-primary/50 transition-colors rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-muted/20 text-center group",
          disabled && "opacity-60 pointer-events-none",
          dropzoneClassName,
        )}
      >
        {value && !hasError ? (
          <div className="flex flex-col items-center gap-2 w-full">
            {isAvatar ? (
              <div
                className={cn(
                  "relative size-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-xs bg-muted",
                  previewWidthClassName,
                  previewHeightClassName,
                )}
              >
                <Image
                  src={value}
                  alt={effectiveAlt}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setHasError(true)}
                />
              </div>
            ) : (
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border shadow-xs bg-muted",
                  aspectRatio === "video" && "w-full max-w-sm aspect-video",
                  aspectRatio === "square" && "w-full max-w-xs aspect-square",
                  aspectRatio === "banner" && "w-full h-36",
                  aspectRatio === "auto" &&
                    (previewHeightClassName || previewWidthClassName
                      ? cn(
                          previewWidthClassName || "w-full max-w-xs",
                          previewHeightClassName || "h-36",
                        )
                      : "w-full max-w-xs h-32 sm:h-36"),
                )}
              >
                <Image
                  src={value}
                  alt={effectiveAlt}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setHasError(true)}
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5 pointer-events-none">
                <Upload className="size-3.5" />
                <span>{changePrompt || t("changeImage")}</span>
              </span>

              {onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClear();
                  }}
                  className="relative z-10 size-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title={t("removeImage")}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className={cn(
                "rounded-full flex items-center justify-center text-muted-foreground",
                isAvatar
                  ? "size-12 bg-muted text-muted-foreground/70"
                  : "p-3 bg-background border shadow-xs",
              )}
            >
              {placeholderIcon ? (
                placeholderIcon
              ) : isAvatar ? (
                <User className="size-6 text-muted-foreground/70" />
              ) : (
                <Upload className="size-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{prompt || t("clickOrDrag")}</p>
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
          </div>
        )}

        <input
          id={actualId}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={handleFileChange}
          className="absolute inset-0 size-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
