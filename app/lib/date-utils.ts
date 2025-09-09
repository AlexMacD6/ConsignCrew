/**
 * Date utility functions for TreasureHub
 */

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, etc.)
 */
export const getOrdinalSuffix = (day: number): string => {
  // Special case for 11th, 12th, 13th
  if (day >= 11 && day <= 13) {
    return "th";
  }
  
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

/**
 * Format date with ordinal suffixes (e.g., "August 28th, 2025")
 */
export const formatDateWithOrdinal = (
  dateString: string | Date | null | undefined,
  options?: {
    includeTime?: boolean;
    timeFormat?: "12" | "24";
  }
): string => {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    const ordinalSuffix = getOrdinalSuffix(day);

    let formattedDate = `${month} ${day}${ordinalSuffix}, ${year}`;

    // Add time if requested
    if (options?.includeTime) {
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: options.timeFormat !== "24"
      };
      const timeString = date.toLocaleTimeString("en-US", timeOptions);
      formattedDate += ` at ${timeString}`;
    }

    return formattedDate;
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Legacy function name for backward compatibility
 */
export const formatDate = formatDateWithOrdinal;

/**
 * Format date with time (for listings page compatibility)
 */
export const formatDateWithTime = (dateString: string | Date | null | undefined): string => {
  return formatDateWithOrdinal(dateString, { includeTime: true });
};
