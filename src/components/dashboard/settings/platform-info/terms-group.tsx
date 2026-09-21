/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileText, Pencil, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import type { PlatformInfoGroupTerms } from "@/types/settings";
import { savePlatformInfoTerms, resetPlatformInfoGroup } from "@/lib/settings-storage";

interface TermsGroupProps {
  data: PlatformInfoGroupTerms;
  onSaveCustom?: (content: string) => Promise<void> | void;
}

export function TermsGroup({ data, onSaveCustom }: TermsGroupProps) {
  const t = useTranslations("settings.platformInfo.terms");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content);

  useEffect(() => {
    setContent(data.content);
  }, [data.content]);

  const handleReset = () => {
    resetPlatformInfoGroup("terms");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (onSaveCustom) {
      await onSaveCustom(content);
    } else {
      savePlatformInfoTerms(content);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(data.content);
    setIsEditing(false);
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
      {/* Group Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                <span>{t("edit")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("reset")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                <Check className="size-3.5" />
                <span>{t("save")}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
                <X className="size-3.5" />
                <span>{t("cancel")}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Body */}
      {isEditing ? (
        <div className="space-y-2">
          <FormMarkdownEditor
            value={content}
            onChange={setContent}
            placeholder={t("placeholder")}
          />
        </div>
      ) : (
        <div className="py-2 min-h-24">
          <MarkdownViewer content={content} isRtl={isRtl} />
        </div>
      )}
    </div>
  );
}
