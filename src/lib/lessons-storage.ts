/**
 * @deprecated Provider lesson flows have been fully migrated to live backend API (/api/dashboard/provider/lessons).
 * This module is maintained temporarily as a fallback for student portal views until Phase 7 (Student Experience) migration.
 */
import { mockLessonsData } from "@/lib/mockLessonsData";
import { Lesson } from "@/types/course";

const STORAGE_KEY_PREFIX = "rewaa_lessons_";

export function getStoredLessons(locale: string): Lesson[] {
  const initialData = mockLessonsData[locale as "ar" | "en"] || mockLessonsData.ar;

  if (typeof window === "undefined") {
    return initialData;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${locale}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((lesson: Lesson) => {
          const fresh = initialData.find((m) => m.id === lesson.id);
          if (fresh) {
            return {
              ...fresh,
              ...lesson,
              courseIds: lesson.courseIds ?? fresh.courseIds,
              coursesCount: lesson.coursesCount ?? fresh.coursesCount,
              viewsCount: lesson.viewsCount ?? fresh.viewsCount,
            };
          }
          return lesson;
        });
      }
    }
  } catch (error) {
    console.error("Failed to load lessons from localStorage:", error);
  }

  saveStoredLessons(locale, initialData);
  return initialData;
}

export function saveStoredLessons(locale: string, lessons: Lesson[]): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_KEY_PREFIX}${locale}`;
    localStorage.setItem(key, JSON.stringify(lessons));
    // Dispatch custom event to sync across components/tabs
    window.dispatchEvent(new Event("rewaa_lessons_updated"));
  } catch (error) {
    console.error("Failed to save lessons to localStorage:", error);
  }
}

export function resetStoredLessons(locale: string): Lesson[] {
  if (typeof window === "undefined") {
    return mockLessonsData[locale as "ar" | "en"] || mockLessonsData.ar;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${locale}`;
    const freshData = mockLessonsData[locale as "ar" | "en"] || mockLessonsData.ar;
    localStorage.setItem(key, JSON.stringify(freshData));
    window.dispatchEvent(new Event("rewaa_lessons_updated"));
    return freshData;
  } catch (error) {
    console.error("Failed to reset lessons in localStorage:", error);
    return mockLessonsData[locale as "ar" | "en"] || mockLessonsData.ar;
  }
}
