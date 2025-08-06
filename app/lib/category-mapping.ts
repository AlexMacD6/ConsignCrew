/**
 * Category Mapping Utility
 * 
 * This utility provides comprehensive mapping between TreasureHub's internal
 * category system and Facebook Marketplace categories to ensure perfect
 * synchronization between the two platforms.
 */

// Facebook Marketplace Categories (official list)
export const FACEBOOK_CATEGORIES = [
  'Antiques',
  'Appliances',
  'Arts & Crafts',
  'Automotive',
  'Baby & Kids',
  'Beauty & Health',
  'Books & Magazines',
  'Clothing & Accessories',
  'Collectibles',
  'Electronics',
  'Entertainment',
  'Free Stuff',
  'Furniture',
  'Garden & Outdoor',
  'Health & Beauty',
  'Home & Garden',
  'Jewelry & Watches',
  'Music',
  'Office & Business',
  'Pet Supplies',
  'Sporting Goods',
  'Tools & Hardware',
  'Toys & Games',
  'Video Games & Consoles'
] as const;

export type FacebookCategory = typeof FACEBOOK_CATEGORIES[number];

// TreasureHub to Facebook Category Mapping
export const TREASUREHUB_TO_FACEBOOK_MAP: Record<string, FacebookCategory> = {
  // Direct mappings
  'Furniture': 'Furniture',
  'Electronics': 'Electronics',
  'Sports & Outdoors': 'Sporting Goods',
  'Tools & Hardware': 'Tools & Hardware',
  'Pet Supplies': 'Pet Supplies',
  'Toys & Games': 'Toys & Games',
  'Books & Media': 'Books & Magazines',
  'Automotive Parts & Accessories': 'Automotive',
  'Garden & Outdoor': 'Garden & Outdoor',
  'Office Supplies': 'Office & Business',
  
  // Mapped categories
  'Home & Living': 'Home & Garden',
  'Kitchen & Dining': 'Home & Garden',
  'Beauty & Personal Care': 'Beauty & Health',
  'Art & Collectibles': 'Collectibles',
  
  // Subcategory-based mappings
  'Fashion': 'Clothing & Accessories',
  'Jewelry': 'Jewelry & Watches',
  'Music': 'Music',
  'Video Games': 'Video Games & Consoles',
  'Appliances': 'Appliances',
  'Antiques': 'Antiques',
  'Arts & Crafts': 'Arts & Crafts',
  'Entertainment': 'Entertainment',
  'Baby & Kids': 'Baby & Kids',
  'Health': 'Health & Beauty',
} as const;

// Subcategory to Facebook Category Mapping (for more precise categorization)
export const SUBCATEGORY_TO_FACEBOOK_MAP: Record<string, FacebookCategory> = {
  // Electronics subcategories
  'Computers & Tablets': 'Electronics',
  'Mobile Phones & Accessories': 'Electronics',
  'Audio Equipment': 'Electronics',
  'Cameras & Photo': 'Electronics',
  'Gaming Consoles & Accessories': 'Video Games & Consoles',
  'Smart Home Devices': 'Electronics',
  
  // Furniture subcategories
  'Chairs': 'Furniture',
  'Tables': 'Furniture',
  'Storage & Shelving': 'Furniture',
  'Seating': 'Furniture',
  'Bedroom Furniture': 'Furniture',
  'Office Furniture': 'Office & Business',
  'Outdoor Furniture': 'Garden & Outdoor',
  
  // Home & Living subcategories
  'Home Décor': 'Home & Garden',
  'Lighting': 'Home & Garden',
  'Rugs & Textiles': 'Home & Garden',
  'Candles & Fragrance': 'Home & Garden',
  'Storage & Organization': 'Home & Garden',
  
  // Kitchen & Dining subcategories
  'Cookware': 'Home & Garden',
  'Dinnerware': 'Home & Garden',
  'Small Appliances': 'Appliances',
  'Kitchen Utensils': 'Home & Garden',
  
  // Sports & Outdoors subcategories
  'Camping & Hiking Gear': 'Sporting Goods',
  'Bicycles & Accessories': 'Sporting Goods',
  'Fitness Equipment': 'Sporting Goods',
  'Water Sports Gear': 'Sporting Goods',
  'Team Sports Equipment': 'Sporting Goods',
  
  // Tools & Hardware subcategories
  'Power Tools': 'Tools & Hardware',
  'Hand Tools': 'Tools & Hardware',
  'Tool Storage': 'Tools & Hardware',
  'Safety Equipment': 'Tools & Hardware',
  
  // Beauty & Personal Care subcategories
  'Skincare': 'Beauty & Health',
  'Haircare': 'Beauty & Health',
  'Fragrances': 'Beauty & Health',
  'Grooming Tools': 'Beauty & Health',
  
  // Office Supplies subcategories
  'Stationery & Paper': 'Office & Business',
  'Desk Accessories': 'Office & Business',
  'Office Electronics': 'Electronics',
  
  // Pet Supplies subcategories
  'Beds & Furniture': 'Pet Supplies',
  'Toys & Enrichment': 'Pet Supplies',
  'Grooming & Health': 'Pet Supplies',
  'Bowls & Feeders': 'Pet Supplies',
  
  // Garden & Outdoor subcategories
  'Gardening Tools': 'Garden & Outdoor',
  'Planters & Pots': 'Garden & Outdoor',
  'Outdoor Décor': 'Garden & Outdoor',
  'Grills & Outdoor Cooking': 'Garden & Outdoor',
  
  // Automotive subcategories
  'Interior Accessories': 'Automotive',
  'Exterior Accessories': 'Automotive',
  'Performance Parts': 'Automotive',
  'Car Care & Detailing': 'Automotive',
  
  // Art & Collectibles subcategories
  'Art Prints': 'Arts & Crafts',
  'Paintings': 'Arts & Crafts',
  'Sculptures': 'Arts & Crafts',
  'Vintage Collectibles': 'Collectibles',
  'Memorabilia': 'Collectibles',
  
  // Books & Media subcategories
  'Books': 'Books & Magazines',
  'Vinyl Records': 'Music',
  'CDs & DVDs': 'Entertainment',
  'Video Games': 'Video Games & Consoles',
  
  // Toys & Games subcategories
  'Board Games': 'Toys & Games',
  'Puzzles': 'Toys & Games',
  'Action Figures': 'Toys & Games',
  'Educational Toys': 'Toys & Games',
  'Dolls & Plush': 'Toys & Games',
} as const;

/**
 * Maps a TreasureHub category to the corresponding Facebook Marketplace category
 * @param department - The main department/category from TreasureHub
 * @param category - The subcategory from TreasureHub
 * @param subCategory - The specific subcategory (optional)
 * @returns The corresponding Facebook Marketplace category
 */
export function mapToFacebookCategory(
  department: string,
  category: string,
  subCategory?: string
): FacebookCategory {
  // First, try to map by subcategory for more precise categorization
  if (subCategory && SUBCATEGORY_TO_FACEBOOK_MAP[subCategory]) {
    return SUBCATEGORY_TO_FACEBOOK_MAP[subCategory];
  }
  
  // Then try to map by category
  if (SUBCATEGORY_TO_FACEBOOK_MAP[category]) {
    return SUBCATEGORY_TO_FACEBOOK_MAP[category];
  }
  
  // Finally, try to map by department
  if (TREASUREHUB_TO_FACEBOOK_MAP[department]) {
    return TREASUREHUB_TO_FACEBOOK_MAP[department];
  }
  
  // Fallback to "Other" if no mapping found
  return 'Home & Garden'; // Default fallback
}

/**
 * Gets all Facebook Marketplace categories
 * @returns Array of all Facebook categories
 */
export function getFacebookCategories(): FacebookCategory[] {
  return [...FACEBOOK_CATEGORIES];
}

/**
 * Gets TreasureHub categories that map to a specific Facebook category
 * @param facebookCategory - The Facebook category to find mappings for
 * @returns Array of TreasureHub categories that map to the Facebook category
 */
export function getTreasureHubCategoriesForFacebook(
  facebookCategory: FacebookCategory
): string[] {
  const mappings: string[] = [];
  
  // Check department mappings
  Object.entries(TREASUREHUB_TO_FACEBOOK_MAP).forEach(([treasureHub, facebook]) => {
    if (facebook === facebookCategory) {
      mappings.push(treasureHub);
    }
  });
  
  // Check subcategory mappings
  Object.entries(SUBCATEGORY_TO_FACEBOOK_MAP).forEach(([treasureHub, facebook]) => {
    if (facebook === facebookCategory) {
      mappings.push(treasureHub);
    }
  });
  
  return [...new Set(mappings)]; // Remove duplicates
}

/**
 * Validates if a category mapping exists
 * @param department - TreasureHub department
 * @param category - TreasureHub category
 * @param subCategory - TreasureHub subcategory (optional)
 * @returns True if a mapping exists, false otherwise
 */
export function hasCategoryMapping(
  department: string,
  category: string,
  subCategory?: string
): boolean {
  return !!(
    SUBCATEGORY_TO_FACEBOOK_MAP[subCategory || ''] ||
    SUBCATEGORY_TO_FACEBOOK_MAP[category] ||
    TREASUREHUB_TO_FACEBOOK_MAP[department]
  );
}

/**
 * Gets a human-readable description of the category mapping
 * @param department - TreasureHub department
 * @param category - TreasureHub category
 * @param subCategory - TreasureHub subcategory (optional)
 * @returns Description of the mapping
 */
export function getCategoryMappingDescription(
  department: string,
  category: string,
  subCategory?: string
): string {
  const facebookCategory = mapToFacebookCategory(department, category, subCategory);
  
  if (subCategory && SUBCATEGORY_TO_FACEBOOK_MAP[subCategory]) {
    return `${subCategory} → ${facebookCategory}`;
  }
  
  if (SUBCATEGORY_TO_FACEBOOK_MAP[category]) {
    return `${category} → ${facebookCategory}`;
  }
  
  if (TREASUREHUB_TO_FACEBOOK_MAP[department]) {
    return `${department} → ${facebookCategory}`;
  }
  
  return `${department} → ${facebookCategory} (default)`;
} 