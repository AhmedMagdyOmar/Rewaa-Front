/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

import { useTranslations } from "next-intl";
import { AlertTriangle, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { AnnouncementItem } from "@/types/settings";

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcementToEdit: AnnouncementItem | null;
  activeAnnouncementsCount: number;
  oldestActiveTitle?: string;
  onSave: (data: {
    id?: string;
    title: string;
    description: string;
    coverImage?: string;
    coverImageFile?: File;
    url?: string;
    active?: boolean;
  }) => void;
}

export function AnnouncementDialog({
  open,
  onOpenChange,
  announcementToEdit,
  activeAnnouncementsCount,
  oldestActiveTitle,
  onSave,
}: AnnouncementDialogProps) {
  const t = useTranslations("settings.announcements.dialog");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const isEditing = !!announcementToEdit;

  // Calculate if saving this (as active) will trigger automatic deactivation of an older announcement
  const targetWillBeActive = isEditing ? announcementToEdit.active : true;
  const isActivatingOther = isEditing && !announcementToEdit.active;
  const willDeactivateOldest =
    (!isEditing || isActivatingOther) && activeAnnouncementsCount >= 3 && targetWillBeActive;

  useEffect(() => {
    if (open) {
      setTitle(announcementToEdit?.title || "");
      setDescription(announcementToEdit?.description || "");
      setCoverImage(announcementToEdit?.coverImage || "");
      setCoverImageFile(null);
      setUrl(announcementToEdit?.url || "");
      setError("");
    }
  }, [open, announcementToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }

    if (!description.trim()) {
      setError(t("descriptionRequired"));
      return;
    }

    onSave({
      id: announcementToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage.trim() || undefined,
      coverImageFile: coverImageFile || undefined,
      url: url.trim() || undefined,
      active: targetWillBeActive,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("titleEdit") : t("titleAdd")}</DialogTitle>
          <DialogDescription>{t("descriptionHint")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Deactivation Warning Alert */}
          {willDeactivateOldest && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">{t("maxActiveWarningTitle")}</span>
                <span>
                  {t("maxActiveWarningDesc", {
                    name: oldestActiveTitle || "",
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Cover Image Upload Area */}
          <ImageUploadField
            id="announcement-cover-image"
            label={t("coverImageLabel")}
            value={coverImage}
            onChange={(dataUrl, file) => {
              setCoverImage(dataUrl);
              setCoverImageFile(file || null);
            }}
            onClear={() => {
              setCoverImage("");
              setCoverImageFile(null);
            }}
            aspectRatio="banner"
            prompt={t("uploadCoverPrompt")}
            hint={t("uploadCoverFormats")}
            changePrompt={t("changeCoverImage")}
            previewAlt="Cover preview"
          />

          {/* Announcement Title */}
          <div className="space-y-2">
            <Label htmlFor="announcement-title">{t("titleLabel")} *</Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder={t("titlePlaceholder")}
            />
          </div>

          {/* Announcement Description */}
          <div className="space-y-2">
            <Label>{t("descriptionLabel")} *</Label>
            <FormMarkdownEditor
              value={description}
              onChange={(val) => {
                setDescription(val);
                if (error) setError("");
              }}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          {/* Optional URL */}
          <div className="space-y-2">
            <Label htmlFor="announcement-url" className="flex items-center justify-between">
              <span>{t("urlLabel")}</span>
              <span className="text-xs text-muted-foreground font-normal">{t("optional")}</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="announcement-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="ps-9 font-mono text-xs"
                dir="ltr"
              />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
