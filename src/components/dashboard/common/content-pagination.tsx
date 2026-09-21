"use client";

import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ContentPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  itemsPerPage: number;
  showingText: string;
  className?: string;
  onPageChange: (page: number) => void;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If on first 3 pages: show 1, 2, 3 ... totalPages
  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis-end", totalPages];
  }

  // If on last 3 pages: show 1 ... totalPages-2, totalPages-1, totalPages
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-start", totalPages - 2, totalPages - 1, totalPages];
  }

  // In the middle: show 1 ... currentPage ... totalPages
  return [1, "ellipsis-start", currentPage, "ellipsis-end", totalPages];
}

export function ContentPagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex: _startIndex,
  itemsPerPage: _itemsPerPage,
  showingText,
  className = "",
  onPageChange,
}: ContentPaginationProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (totalItems === 0) return null;

  const pageItems = getPageNumbers(currentPage, totalPages);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      <div className="text-xs text-muted-foreground font-medium">{showingText}</div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 gap-1 text-xs"
          aria-label={isAr ? "الصفحة السابقة" : "Previous page"}
        >
          {isAr ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className="flex items-center gap-1 px-1">
          {pageItems.map((item, index) => {
            if (typeof item === "string") {
              return (
                <span
                  key={`${item}-${index}`}
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground select-none"
                >
                  <MoreHorizontal className="size-4" />
                </span>
              );
            }

            return (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === item
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 gap-1 text-xs"
          aria-label={isAr ? "الصفحة التالية" : "Next page"}
        >
          {isAr ? (
            <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
