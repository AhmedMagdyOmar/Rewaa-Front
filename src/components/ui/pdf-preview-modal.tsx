"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  title?: string | null;
}

export function PdfPreviewModal({ isOpen, onClose, url, title }: PdfPreviewModalProps) {
  const locale = useLocale();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
    }
  }, [isOpen, url]);

  if (!url) return null;

  const displayTitle = title || (locale === "ar" ? "معاينة المستند" : "Document Preview");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "min-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col transition-all duration-200 border-border/80 shadow-2xl bg-card",
        )}
        showCloseButton={true}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 sm:px-6 border-b border-border/70 flex-row items-center justify-between gap-3 space-y-0 bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 me-8">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 shrink-0">
              <FileText className="size-4.5" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
              {displayTitle}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 me-6 sm:me-8">
            {/* Open in New Tab fallback */}
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title={locale === "ar" ? "فتح في نافذة جديدة" : "Open in new tab"}
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>

            {/* Direct Download */}
            <Button
              asChild
              type="button"
              variant="default"
              size="sm"
              className="gap-1.5 text-xs font-semibold h-8 px-3"
            >
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" />
                <span className="hidden xs:inline">{locale === "ar" ? "تحميل" : "Download"}</span>
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body / PDF Viewer */}
        <div className="relative flex-1 w-full h-full min-h-0 bg-muted/10">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-xs z-10 text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-xs font-medium">
                {locale === "ar" ? "جاري تحميل الملف..." : "Loading PDF..."}
              </p>
            </div>
          )}

          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={displayTitle}
            className="w-full h-full border-0 rounded-b-xl"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
