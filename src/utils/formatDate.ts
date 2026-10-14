interface FormatDateOptions {
  locale?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  includeTime?: boolean;
}

/**
 * Formats a Date object or date-string/timestamp into a localized date/time string.
 * Uses Intl.DateTimeFormat to format the date based on the user's locale.
 * Ensures default locale is stable on server/client to prevent hydration mismatches.
 *
 * @param date - The date to format (Date object, timestamp, or ISO string).
 * @param options - Custom formatting configuration.
 * @returns The formatted date string.
 */
export function formatDate(date: Date | string | number, options: FormatDateOptions = {}): string {
  const {
    locale = "en-US", // Consistent default to avoid server-client mismatch
    dateStyle = "medium",
    includeTime = false,
    timeStyle = "short",
  } = options;

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      calendar: "gregory",
      dateStyle,
      ...(includeTime ? { timeStyle } : {}),
    };

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    // Simple fallback
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleDateString(locale);
    } catch {
      return String(date);
    }
  }
}
