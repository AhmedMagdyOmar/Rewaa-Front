/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  Check,
  Link as LinkIcon,
  MessageSquare,
  Pencil,
  PhoneCall,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneLink } from "@/components/ui/phone-link";
import { resetPlatformInfoGroup, savePlatformInfoCommunication } from "@/lib/settings-storage";
import type { PlatformCustomLink, PlatformInfoGroupCommunication } from "@/types/settings";
import { AddLinkDialog } from "./add-link-dialog";

interface CommunicationGroupProps {
  data: PlatformInfoGroupCommunication;
  onSaveCustom?: (data: PlatformInfoGroupCommunication) => Promise<void> | void;
}

export function CommunicationGroup({ data, onSaveCustom }: CommunicationGroupProps) {
  const t = useTranslations("settings.platformInfo.communication");
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<PlatformInfoGroupCommunication>(data);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    setFormState(data);
  }, [data]);

  const handleReset = () => {
    resetPlatformInfoGroup("communication");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (onSaveCustom) {
      await onSaveCustom(formState);
    } else {
      savePlatformInfoCommunication(formState);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormState(data);
    setIsEditing(false);
  };

  const handleAddCustomLink = (link: { label: string; url: string }) => {
    const newLink: PlatformCustomLink = {
      id: `link-${Date.now()}`,
      label: link.label,
      url: link.url,
    };
    const updatedCustom = [...formState.customLinks, newLink];
    const updatedState = { ...formState, customLinks: updatedCustom };
    setFormState(updatedState);
    if (!isEditing) {
      if (onSaveCustom) {
        onSaveCustom(updatedState);
      } else {
        savePlatformInfoCommunication(updatedState);
      }
    }
  };

  const handleRemoveCustomLink = (id: string) => {
    const updatedCustom = formState.customLinks.filter((l) => l.id !== id);
    const updatedState = { ...formState, customLinks: updatedCustom };
    setFormState(updatedState);
    if (!isEditing) {
      if (onSaveCustom) {
        onSaveCustom(updatedState);
      } else {
        savePlatformInfoCommunication(updatedState);
      }
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 md:p-6 shadow-xs space-y-5">
      {/* Group Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <PhoneCall className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button variant="default" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            <span>{t("addLink")}</span>
          </Button>

          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Pencil className="size-3.5" />
                <span>{t("edit")}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("reset")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave} className="gap-1.5">
                <Check className="size-3.5" />
                <span>{t("save")}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel} className="gap-1.5">
                <X className="size-3.5" />
                <span>{t("cancel")}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid: 2 items per row in both viewing and editing mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Support Phone */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <PhoneCall className="size-3.5 text-primary shrink-0" />
            <span>{t("fields.supportPhone")}</span>
          </Label>
          {isEditing ? (
            <Input
              dir="ltr"
              className="rtl:text-start font-mono"
              value={formState.supportPhone}
              onChange={(e) => setFormState({ ...formState, supportPhone: e.target.value })}
            />
          ) : (
            <div className="h-9 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center font-mono">
              {formState.supportPhone ? (
                <PhoneLink
                  phone={formState.supportPhone}
                  className="hover:text-primary dark:hover:text-primary"
                >
                  <span dir="ltr" className="rtl:text-start">
                    {formState.supportPhone}
                  </span>
                </PhoneLink>
              ) : (
                <span dir="ltr" className="rtl:text-start">
                  —
                </span>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp Phone */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <MessageSquare className="size-3.5 text-emerald-600 shrink-0" />
            <span>{t("fields.whatsappPhone")}</span>
          </Label>
          {isEditing ? (
            <Input
              dir="ltr"
              className="rtl:text-start font-mono"
              value={formState.whatsappPhone}
              onChange={(e) => setFormState({ ...formState, whatsappPhone: e.target.value })}
            />
          ) : (
            <div className="h-9 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center font-mono">
              {formState.whatsappPhone ? (
                <PhoneLink phone={formState.whatsappPhone} className="hover:text-emerald-600">
                  <span className="rtl:text-start" dir="ltr">
                    {formState.whatsappPhone}
                  </span>
                </PhoneLink>
              ) : (
                <span className="rtl:text-start" dir="ltr">
                  —
                </span>
              )}
            </div>
          )}
        </div>

        {/* Facebook Link */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Image
              src="/facebook.svg"
              alt="Facebook"
              width={14}
              height={14}
              className="size-3.5 shrink-0"
            />
            <span>{t("fields.facebookUrl")}</span>
          </Label>
          {isEditing ? (
            <Input
              dir="ltr"
              type="url"
              className="rtl:text-start"
              value={formState.facebookUrl}
              onChange={(e) => setFormState({ ...formState, facebookUrl: e.target.value })}
            />
          ) : (
            <div className="h-9 px-3 py-1.5 rounded-md text-sm font-medium flex items-center min-w-0">
              {formState.facebookUrl ? (
                <a
                  href={formState.facebookUrl}
                  target="_blank"
                  dir="ltr"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1.5 truncate rtl:text-start"
                >
                  <span className="truncate">{formState.facebookUrl}</span>
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          )}
        </div>

        {/* Instagram Link */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Image
              src="/instagram.svg"
              alt="Instagram"
              width={14}
              height={14}
              className="size-3.5 shrink-0"
            />
            <span>{t("fields.instagramUrl")}</span>
          </Label>
          {isEditing ? (
            <Input
              dir="ltr"
              type="url"
              className="rtl:text-start"
              value={formState.instagramUrl}
              onChange={(e) => setFormState({ ...formState, instagramUrl: e.target.value })}
            />
          ) : (
            <div className="h-9 px-3 py-1.5 rounded-md text-sm font-medium flex items-center min-w-0">
              {formState.instagramUrl ? (
                <a
                  href={formState.instagramUrl}
                  target="_blank"
                  dir="ltr"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1.5 truncate rtl:text-start"
                >
                  <span className="truncate">{formState.instagramUrl}</span>
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          )}
        </div>

        {/* TikTok Link */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Image
              src="/tiktok.svg"
              alt="TikTok"
              width={14}
              height={14}
              className="size-3.5 shrink-0"
            />
            <span>{t("fields.tiktokUrl")}</span>
          </Label>
          {isEditing ? (
            <Input
              dir="ltr"
              type="url"
              className="rtl:text-start"
              value={formState.tiktokUrl}
              onChange={(e) => setFormState({ ...formState, tiktokUrl: e.target.value })}
            />
          ) : (
            <div className="h-9 px-3 py-1.5 rounded-md text-sm font-medium flex items-center min-w-0">
              {formState.tiktokUrl ? (
                <a
                  href={formState.tiktokUrl}
                  target="_blank"
                  dir="ltr"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1.5 truncate rtl:text-start"
                >
                  <span className="truncate">{formState.tiktokUrl}</span>
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          )}
        </div>

        {/* Custom links */}
        {formState.customLinks.length > 0 && (
          <div className="md:col-span-2 space-y-3 border-t pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("customLinksTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formState.customLinks.map((link) => (
                <div key={link.id} className="space-y-1.5">
                  <Label className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5 truncate">
                      <LinkIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveCustomLink(link.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </Label>

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const updated = formState.customLinks.map((l) =>
                            l.id === link.id ? { ...l, label: e.target.value } : l,
                          );
                          setFormState({ ...formState, customLinks: updated });
                        }}
                        placeholder={t("addLinkDialog.labelPlaceholder")}
                      />
                      <Input
                        dir="ltr"
                        type="url"
                        className="rtl:text-start"
                        value={link.url}
                        onChange={(e) => {
                          const updated = formState.customLinks.map((l) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l,
                          );
                          setFormState({ ...formState, customLinks: updated });
                        }}
                        placeholder={t("addLinkDialog.urlPlaceholder")}
                      />
                    </div>
                  ) : (
                    <div className="h-9 px-3 py-1.5 rounded-md text-sm font-medium flex items-center min-w-0">
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          dir="ltr"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1.5 truncate rtl:text-start"
                        >
                          <span className="truncate">{link.url}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Link Dialog */}
      <AddLinkDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddCustomLink}
      />
    </div>
  );
}
