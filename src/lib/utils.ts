import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge.
 * This ensures that Tailwind CSS classes are properly merged without conflicts.
 *
 * @param inputs - A list of class values to merge.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tremor focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-blue-500 dark:outline-blue-500",
];

// Arabic Abjad sequence for question multiple choice options
export const ARABIC_ABJAD_LETTERS = [
  "أ",
  "ب",
  "ج",
  "د",
  "هـ",
  "و",
  "ز",
  "ح",
  "ط",
  "ي",
  "ك",
  "ل",
  "م",
  "ن",
  "س",
  "ع",
  "ف",
  "ص",
  "ق",
  "ر",
  "ش",
  "ت",
  "ث",
  "خ",
  "ذ",
  "ض",
  "ظ",
  "غ",
];

/**
 * Returns the option letter corresponding to the index based on locale.
 * Uses Arabic Abjad (أ, ب, ج, د...) when locale is "ar", otherwise English alphabet (A, B, C, D...).
 */
export function getOptionLetter(index: number, locale: string = "ar"): string {
  if (locale === "ar") {
    return ARABIC_ABJAD_LETTERS[index] ?? String(index + 1);
  }
  return String.fromCharCode(65 + index); // A, B, C, D...
}

/**
 * Formats Egyptian phone numbers to the local standard format (01xxxxxxxxx).
 * Handles inputs with international prefix (+20, 0020, 20) or missing leading 0.
 */
export function formatEgyptianPhone(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Matches +201xxxxxxxxx, 00201xxxxxxxxx, 201xxxxxxxxx
  if (/^(\+20|0020|20)(1[0125]\d{8})$/.test(cleaned)) {
    return cleaned.replace(/^(\+20|0020|20)/, "0");
  }

  // If provided without leading 0 (e.g. 10xxxxxxxx -> 010xxxxxxxx)
  if (/^1[0125]\d{8}$/.test(cleaned)) {
    return `0${cleaned}`;
  }

  return cleaned;
}

/**
 * Formats hours with proper Arabic / English pluralization/grammar.
 */
function formatHoursOnly(hrs: number, locale: string): string {
  if (locale !== "ar") {
    return hrs === 1 ? "1 hr" : `${hrs} hrs`;
  }
  if (hrs === 1) return "ساعة";
  if (hrs === 2) return "ساعتان";
  if (hrs >= 3 && hrs <= 10) return `${hrs} ساعات`;
  return `${hrs} ساعة`;
}

/**
 * Formats minutes with proper Arabic / English pluralization/grammar.
 */
function formatMinutesOnly(mins: number, locale: string): string {
  if (locale !== "ar") {
    return mins === 1 ? "1 min" : `${mins} mins`;
  }
  if (mins === 1) return "دقيقة";
  if (mins === 2) return "دقيقتان";
  if (mins >= 3 && mins <= 10) return `${mins} دقائق`;
  return `${mins} دقيقة`;
}

/**
 * Formats duration in minutes into a clean hours & minutes string (no decimals).
 * Example:
 *  - 45 -> "45 دقيقة" / "45 mins"
 *  - 60 -> "ساعة" / "1 hr"
 *  - 90 -> "ساعة و 30 دقيقة" / "1 hr 30 mins"
 *  - 135 -> "ساعتان و 15 دقيقة" / "2 hrs 15 mins"
 */
export function formatDuration(minutes?: number | null, locale: string = "ar"): string {
  return formatDurationDetail(minutes, locale);
}

/**
 * Formats duration in minutes into detailed hours and minutes (e.g., "ساعتان و 15 دقيقة" / "2 hrs 15 mins").
 */
export function formatDurationDetail(minutes?: number | null, locale: string = "ar"): string {
  if (!minutes || minutes <= 0) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs > 0 && mins > 0) {
    const hoursStr = formatHoursOnly(hrs, locale);
    const minsStr = formatMinutesOnly(mins, locale);
    return locale === "ar" ? `${hoursStr} و ${minsStr}` : `${hoursStr} ${minsStr}`;
  }
  if (hrs > 0) {
    return formatHoursOnly(hrs, locale);
  }
  return formatMinutesOnly(mins, locale);
}
