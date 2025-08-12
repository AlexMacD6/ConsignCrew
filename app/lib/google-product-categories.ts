/**
 * Google Product Category Mapping System
 * 
 * This system maps TreasureHub's internal taxonomy to official Google Product Categories
 * to ensure proper Facebook Commerce Manager integration and ad performance.
 * 
 * Google Product Categories are hierarchical and follow the format:
 * "Primary > Secondary > Tertiary > Quaternary"
 * 
 * Source: https://developers.google.com/shopping-content/guides/product-categories
 */

export interface GoogleProductCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  level: number;
}

export interface CategoryMapping {
  department: string;
  category: string;
  subCategory?: string;
  googleProductCategory: string;
  confidence: 'high' | 'medium' | 'low';
}

// Comprehensive mapping from TreasureHub taxonomy to Google Product Categories
export const GOOGLE_PRODUCT_CATEGORY_MAPPINGS: CategoryMapping[] = [
  // Furniture & Home
  {
    department: 'Furniture',
    category: 'Bedroom',
    subCategory: 'Dressers',
    googleProductCategory: 'Home & Garden > Furniture > Bedroom Furniture > Dressers',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Bedroom',
    subCategory: 'Beds',
    googleProductCategory: 'Home & Garden > Furniture > Bedroom Furniture > Beds',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Bedroom',
    subCategory: 'Nightstands',
    googleProductCategory: 'Home & Garden > Furniture > Bedroom Furniture > Nightstands',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Bedroom',
    subCategory: 'Wardrobes',
    googleProductCategory: 'Home & Garden > Furniture > Bedroom Furniture > Wardrobes',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Living Room',
    subCategory: 'Sofas',
    googleProductCategory: 'Home & Garden > Furniture > Living Room Furniture > Sofas',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Living Room',
    subCategory: 'Coffee Tables',
    googleProductCategory: 'Home & Garden > Furniture > Living Room Furniture > Coffee Tables',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Living Room',
    subCategory: 'TV Stands',
    googleProductCategory: 'Home & Garden > Furniture > Living Room Furniture > TV Stands',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Dining Room',
    subCategory: 'Dining Tables',
    googleProductCategory: 'Home & Garden > Furniture > Dining Room Furniture > Dining Tables',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Dining Room',
    subCategory: 'Dining Chairs',
    googleProductCategory: 'Home & Garden > Furniture > Dining Room Furniture > Dining Chairs',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Office',
    subCategory: 'Desks',
    googleProductCategory: 'Home & Garden > Furniture > Office Furniture > Desks',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Office',
    subCategory: 'Office Chairs',
    googleProductCategory: 'Home & Garden > Furniture > Office Furniture > Office Chairs',
    confidence: 'high'
  },
  {
    department: 'Furniture',
    category: 'Outdoor',
    subCategory: 'Patio Furniture',
    googleProductCategory: 'Home & Garden > Furniture > Outdoor Furniture > Patio Furniture',
    confidence: 'high'
  },

  // Electronics
  {
    department: 'Electronics',
    category: 'Computers',
    subCategory: 'Laptops',
    googleProductCategory: 'Electronics > Computers > Laptops',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'Computers',
    subCategory: 'Desktops',
    googleProductCategory: 'Electronics > Computers > Desktop Computers',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'Computers',
    subCategory: 'Tablets',
    googleProductCategory: 'Electronics > Computers > Tablets',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'Phones',
    subCategory: 'Smartphones',
    googleProductCategory: 'Electronics > Mobile Phones > Smartphones',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'TVs',
    subCategory: 'Smart TVs',
    googleProductCategory: 'Electronics > TVs & Video > TVs > Smart TVs',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'TVs',
    subCategory: 'LED TVs',
    googleProductCategory: 'Electronics > TVs & Video > TVs > LED TVs',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'Audio',
    subCategory: 'Speakers',
    googleProductCategory: 'Electronics > Audio > Speakers',
    confidence: 'high'
  },
  {
    department: 'Electronics',
    category: 'Audio',
    subCategory: 'Headphones',
    googleProductCategory: 'Electronics > Audio > Headphones',
    confidence: 'high'
  },

  // Clothing & Apparel
  {
    department: 'Clothing',
    category: 'Men',
    subCategory: 'Shirts',
    googleProductCategory: 'Apparel & Accessories > Clothing > Men\'s Clothing > Shirts',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Men',
    subCategory: 'Pants',
    googleProductCategory: 'Apparel & Accessories > Clothing > Men\'s Clothing > Pants',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Men',
    subCategory: 'Shoes',
    googleProductCategory: 'Apparel & Accessories > Clothing > Men\'s Clothing > Shoes',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Women',
    subCategory: 'Dresses',
    googleProductCategory: 'Apparel & Accessories > Clothing > Women\'s Clothing > Dresses',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Women',
    subCategory: 'Tops',
    googleProductCategory: 'Apparel & Accessories > Clothing > Women\'s Clothing > Tops',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Women',
    subCategory: 'Bottoms',
    googleProductCategory: 'Apparel & Accessories > Clothing > Women\'s Clothing > Bottoms',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Kids',
    subCategory: 'Boys',
    googleProductCategory: 'Apparel & Accessories > Clothing > Kids\' Clothing > Boys\' Clothing',
    confidence: 'high'
  },
  {
    department: 'Clothing',
    category: 'Kids',
    subCategory: 'Girls',
    googleProductCategory: 'Apparel & Accessories > Clothing > Kids\' Clothing > Girls\' Clothing',
    confidence: 'high'
  },

  // Home & Garden
  {
    department: 'Home & Garden',
    category: 'Kitchen',
    subCategory: 'Appliances',
    googleProductCategory: 'Home & Garden > Kitchen & Dining > Kitchen Appliances',
    confidence: 'high'
  },
  {
    department: 'Home & Garden',
    category: 'Kitchen',
    subCategory: 'Cookware',
    googleProductCategory: 'Home & Garden > Kitchen & Dining > Cookware',
    confidence: 'high'
  },
  {
    department: 'Home & Garden',
    category: 'Kitchen',
    subCategory: 'Dishes',
    googleProductCategory: 'Home & Garden > Kitchen & Dining > Dishes & Serving > Dishes',
    confidence: 'high'
  },
  {
    department: 'Home & Garden',
    category: 'Decor',
    subCategory: 'Wall Art',
    googleProductCategory: 'Home & Garden > Home Decor > Wall Decor > Wall Art',
    confidence: 'high'
  },
  {
    department: 'Home & Garden',
    category: 'Decor',
    subCategory: 'Vases',
    googleProductCategory: 'Home & Garden > Home Decor > Vases',
    confidence: 'high'
  },
  {
    department: 'Home & Garden',
    category: 'Decor',
    subCategory: 'Candles',
    googleProductCategory: 'Home & Garden > Home Decor > Candles',
    confidence: 'high'
  },

  // Sports & Outdoors
  {
    department: 'Sports & Outdoors',
    category: 'Fitness',
    subCategory: 'Exercise Equipment',
    googleProductCategory: 'Sports & Outdoors > Exercise & Fitness > Exercise Equipment',
    confidence: 'high'
  },
  {
    department: 'Sports & Outdoors',
    category: 'Fitness',
    subCategory: 'Yoga',
    googleProductCategory: 'Sports & Outdoors > Exercise & Fitness > Yoga',
    confidence: 'high'
  },
  {
    department: 'Sports & Outdoors',
    category: 'Outdoor',
    subCategory: 'Camping',
    googleProductCategory: 'Sports & Outdoors > Outdoor Recreation > Camping',
    confidence: 'high'
  },
  {
    department: 'Sports & Outdoors',
    category: 'Outdoor',
    subCategory: 'Hiking',
    googleProductCategory: 'Sports & Outdoors > Outdoor Recreation > Hiking',
    confidence: 'high'
  },

  // Toys & Games
  {
    department: 'Toys & Games',
    category: 'Educational',
    subCategory: 'STEM',
    googleProductCategory: 'Toys & Games > Educational Toys > STEM Toys',
    confidence: 'high'
  },
  {
    department: 'Toys & Games',
    category: 'Educational',
    subCategory: 'Arts & Crafts',
    googleProductCategory: 'Toys & Games > Educational Toys > Arts & Crafts',
    confidence: 'high'
  },
  {
    department: 'Toys & Games',
    category: 'Games',
    subCategory: 'Board Games',
    googleProductCategory: 'Toys & Games > Games > Board Games',
    confidence: 'high'
  },
  {
    department: 'Toys & Games',
    category: 'Games',
    subCategory: 'Puzzles',
    googleProductCategory: 'Toys & Games > Games > Puzzles',
    confidence: 'high'
  },

  // Books & Media
  {
    department: 'Books & Media',
    category: 'Books',
    subCategory: 'Fiction',
    googleProductCategory: 'Media > Books > Fiction',
    confidence: 'high'
  },
  {
    department: 'Books & Media',
    category: 'Books',
    subCategory: 'Non-Fiction',
    googleProductCategory: 'Media > Books > Non-Fiction',
    confidence: 'high'
  },
  {
    department: 'Books & Media',
    category: 'Movies',
    subCategory: 'DVDs',
    googleProductCategory: 'Media > Movies > DVDs',
    confidence: 'high'
  },
  {
    department: 'Books & Media',
    category: 'Music',
    subCategory: 'Vinyl',
    googleProductCategory: 'Media > Music > Vinyl Records',
    confidence: 'high'
  },

  // Automotive
  {
    department: 'Automotive',
    category: 'Parts',
    subCategory: 'Engine',
    googleProductCategory: 'Vehicles & Parts > Automotive Parts > Engine Parts',
    confidence: 'high'
  },
  {
    department: 'Automotive',
    category: 'Parts',
    subCategory: 'Exterior',
    googleProductCategory: 'Vehicles & Parts > Automotive Parts > Exterior Parts',
    confidence: 'high'
  },
  {
    department: 'Automotive',
    category: 'Accessories',
    subCategory: 'Interior',
    googleProductCategory: 'Vehicles & Parts > Automotive Accessories > Interior Accessories',
    confidence: 'high'
  },

  // Jewelry & Watches
  {
    department: 'Jewelry & Watches',
    category: 'Jewelry',
    subCategory: 'Necklaces',
    googleProductCategory: 'Apparel & Accessories > Jewelry > Necklaces',
    confidence: 'high'
  },
  {
    department: 'Jewelry & Watches',
    category: 'Jewelry',
    subCategory: 'Rings',
    googleProductCategory: 'Apparel & Accessories > Jewelry > Rings',
    confidence: 'high'
  },
  {
    department: 'Jewelry & Watches',
    category: 'Watches',
    subCategory: 'Luxury',
    googleProductCategory: 'Apparel & Accessories > Watches > Luxury Watches',
    confidence: 'high'
  },
  {
    department: 'Jewelry & Watches',
    category: 'Watches',
    subCategory: 'Casual',
    googleProductCategory: 'Apparel & Accessories > Watches > Casual Watches',
    confidence: 'high'
  }
];

/**
 * Maps TreasureHub taxonomy to Google Product Category
 * @param department - TreasureHub department
 * @param category - TreasureHub category
 * @param subCategory - TreasureHub subcategory (optional)
 * @returns Google Product Category string or null if no match found
 */
export function mapToGoogleProductCategory(
  department: string,
  category: string,
  subCategory?: string
): { category: string; confidence: 'high' | 'medium' | 'low' } | null {
  // Try exact match first
  const exactMatch = GOOGLE_PRODUCT_CATEGORY_MAPPINGS.find(
    mapping =>
      mapping.department.toLowerCase() === department.toLowerCase() &&
      mapping.category.toLowerCase() === category.toLowerCase() &&
      (subCategory ? mapping.subCategory?.toLowerCase() === subCategory.toLowerCase() : !mapping.subCategory)
  );

  if (exactMatch) {
    return {
      category: exactMatch.googleProductCategory,
      confidence: exactMatch.confidence
    };
  }

  // Try partial match without subcategory
  const partialMatch = GOOGLE_PRODUCT_CATEGORY_MAPPINGS.find(
    mapping =>
      mapping.department.toLowerCase() === department.toLowerCase() &&
      mapping.category.toLowerCase() === category.toLowerCase()
  );

  if (partialMatch) {
    return {
      category: partialMatch.googleProductCategory,
      confidence: 'medium' // Lower confidence for partial match
    };
  }

  // Try department-only match
  const departmentMatch = GOOGLE_PRODUCT_CATEGORY_MAPPINGS.find(
    mapping => mapping.department.toLowerCase() === department.toLowerCase()
  );

  if (departmentMatch) {
    return {
      category: departmentMatch.googleProductCategory,
      confidence: 'low' // Lowest confidence for department-only match
    };
  }

  // No match found
  return null;
}

/**
 * Gets a list of available Google Product Categories for a given department
 * @param department - TreasureHub department
 * @returns Array of available categories
 */
export function getAvailableCategoriesForDepartment(department: string): CategoryMapping[] {
  return GOOGLE_PRODUCT_CATEGORY_MAPPINGS.filter(
    mapping => mapping.department.toLowerCase() === department.toLowerCase()
  );
}

/**
 * Validates if a Google Product Category string is properly formatted
 * @param category - Google Product Category string
 * @returns boolean indicating if the format is valid
 */
export function isValidGoogleProductCategory(category: string): boolean {
  // Google Product Categories should have at least 2 levels separated by " > "
  const levels = category.split(' > ');
  return levels.length >= 2 && levels.every(level => level.trim().length > 0);
}

/**
 * Gets the confidence level for a Google Product Category mapping
 * @param department - TreasureHub department
 * @param category - TreasureHub category
 * @param subCategory - TreasureHub subcategory (optional)
 * @returns confidence level or null if no mapping found
 */
export function getCategoryMappingConfidence(
  department: string,
  category: string,
  subCategory?: string
): 'high' | 'medium' | 'low' | null {
  const mapping = mapToGoogleProductCategory(department, category, subCategory);
  return mapping?.confidence || null;
}
