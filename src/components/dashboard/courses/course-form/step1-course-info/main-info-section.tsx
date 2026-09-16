"use client";

import { useTranslations } from "next-intl";
import { FormSectionCard } from "@/components/ui/form-section-card";
import { Input } from "@/components/ui/input";
import { FormMarkdownEditor } from "@/components/ui/form-markdown-editor";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { BookOpen, Image as ImageIcon, Video } from "lucide-react";

interface MainInfoSectionProps {
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  previewVideoLink: string;
  onPreviewVideoLinkChange: (val: string) => void;
  coverImage: string | null;
  onCoverImageChange: (dataUrl: string | null, file: File | null) => void;
  onCoverImageClear: () => void;
}

export function MainInfoSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  previewVideoLink,
  onPreviewVideoLinkChange,
  coverImage,
  onCoverImageChange,
  onCoverImageClear,
}: MainInfoSectionProps) {
  const t = useTranslations("courses.new");

  return (
    <FormSectionCard
      title={t("sections.mainInfo.title")}
      description={t("sections.mainInfo.description")}
      icon={BookOpen}
      contentClassName="space-y-8"
    >
      {/* Title */}
      <div className="flex flex-col gap-2">
        <label htmlFor="course-title" className="text-sm font-medium text-foreground">
          {t("fields.title")} <span className="text-destructive">*</span>
        </label>
        <Input
          id="course-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("fields.titlePlaceholder")}
          required
        />
      </div>

      {/* Description (Markdown) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="course-description" className="text-sm font-medium text-foreground">
          {t("fields.description")} <span className="text-destructive">*</span>
        </label>
        <FormMarkdownEditor
          value={description}
          onChange={onDescriptionChange}
          placeholder={t("fields.descriptionPlaceholder")}
        />
      </div>

      {/* Preview Video Link */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="course-preview-video"
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          <Video className="size-4 text-muted-foreground" />
          {t("fields.previewVideoLink")}
        </label>
        <Input
          id="course-preview-video"
          type="url"
          value={previewVideoLink}
          onChange={(e) => onPreviewVideoLinkChange(e.target.value)}
          placeholder={t("fields.previewVideoLinkPlaceholder")}
        />
      </div>

      {/* Cover Image Upload Area */}
      <ImageUploadField
        id="course-cover-image"
        label={t("fields.coverImage")}
        labelIcon={<ImageIcon className="size-4 text-muted-foreground" />}
        value={coverImage}
        onChange={(dataUrl, file) => onCoverImageChange(dataUrl, file || null)}
        onClear={onCoverImageClear}
        aspectRatio="video"
        prompt={t("fields.coverImageDrag")}
        hint={t("fields.coverImageNote")}
        changePrompt={t("fields.coverImageDrag")}
        previewAlt="Course cover"
      />
    </FormSectionCard>
  );
}
