/**
 * Utility functions for standardizing condition display across the application
 * This ensures consistent formatting and uses the Facebook condition field
 */

/**
 * Get the standardized condition display value
 * @param listing - The listing object
 * @returns The properly formatted condition string
 */
export function getStandardizedCondition(listing: any): string {
  // Prefer facebookCondition over the old condition field
  const condition = listing.facebookCondition || listing.condition;
  
  if (!condition) {
    return "Unknown";
  }
  
  // Standardize capitalization: first letter uppercase, rest lowercase
  return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
}

/**
 * Get the condition color class for styling
 * @param condition - The condition string
 * @returns CSS class for condition styling
 */
export function getConditionColor(condition: string): string {
  const normalizedCondition = condition.toLowerCase();
  
  switch (normalizedCondition) {
    case "new":
      return "bg-green-100 text-green-800";
    case "used":
      return "bg-blue-100 text-blue-800";
    case "refurbished":
      return "bg-purple-100 text-purple-800";
    case "like new":
      return "bg-emerald-100 text-emerald-800";
    case "good":
      return "bg-yellow-100 text-yellow-800";
    case "fair":
      return "bg-orange-100 text-orange-800";
    case "poor":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Check if a condition is considered "new" for retail price display
 * @param condition - The condition string
 * @returns True if the condition is considered new
 */
export function isNewCondition(condition: string): boolean {
  const normalizedCondition = condition.toLowerCase();
  return normalizedCondition === "new" || normalizedCondition === "like new";
}
