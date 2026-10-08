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
