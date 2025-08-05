/**
 * Product Specifications Constants
 * Based on Meta's Commerce Catalog rules for Facebook Shop integration
 */

// Fixed sets for dropdown fields
export const GENDER_OPTIONS = ['male', 'female', 'unisex'] as const;
export const AGE_GROUP_OPTIONS = ['newborn', 'infant', 'toddler', 'kids', 'adult'] as const;

// Suggested options for hybrid dropdown + free-type fields
export const COLOR_SUGGESTIONS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink',
  'Orange', 'Brown', 'Gray', 'Navy', 'Beige', 'Cream', 'Gold', 'Silver',
  'Bronze', 'Copper', 'Maroon', 'Burgundy', 'Teal', 'Turquoise', 'Lime',
  'Olive', 'Tan', 'Khaki', 'Coral', 'Lavender', 'Indigo', 'Violet'
];

export const MATERIAL_SUGGESTIONS = [
  'Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Suede', 'Denim',
  'Linen', 'Canvas', 'Nylon', 'Spandex', 'Rayon', 'Acrylic', 'Cashmere',
  'Wood', 'Metal', 'Plastic', 'Glass', 'Ceramic', 'Stone', 'Marble',
  'Granite', 'Bamboo', 'Rattan', 'Wicker', 'Fabric', 'Vinyl', 'Mesh'
];

export const PATTERN_SUGGESTIONS = [
  'Solid', 'Striped', 'Polka Dot', 'Floral', 'Geometric', 'Abstract',
  'Plaid', 'Checkered', 'Chevron', 'Herringbone', 'Houndstooth', 'Paisley',
  'Animal Print', 'Camouflage', 'Tie Dye', 'Ombre', 'Gradient', 'Tartan',
  'Gingham', 'Damask', 'Jacquard', 'Embossed', 'Textured', 'Plain'
];

export const STYLE_SUGGESTIONS = [
  'Modern', 'Vintage', 'Classic', 'Casual', 'Formal', 'Bohemian',
  'Minimalist', 'Industrial', 'Rustic', 'Contemporary', 'Traditional',
  'Art Deco', 'Mid-Century', 'Scandinavian', 'Mediterranean', 'Asian',
  'African', 'European', 'American', 'Urban', 'Country', 'Coastal',
  'Mountain', 'Desert', 'Tropical', 'Gothic', 'Romantic', 'Sporty',
  'Elegant', 'Sophisticated', 'Playful', 'Serious', 'Bold', 'Subtle'
];

// Validation functions
export function validateGender(gender: string): boolean {
  return GENDER_OPTIONS.includes(gender as any);
}

export function validateAgeGroup(ageGroup: string): boolean {
  return AGE_GROUP_OPTIONS.includes(ageGroup as any);
}

export function validateItemGroupId(itemGroupId: string): boolean {
  return itemGroupId.length <= 50;
}

// Data processing functions
export function processProductSpecValue(value: string): string {
  if (!value) return '';
  return value.toLowerCase().trim();
}

export function processProductSpecs(data: {
  gender?: string;
  ageGroup?: string;
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  style?: string;
  itemGroupId?: string;
}): {
  gender?: string;
  ageGroup?: string;
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  style?: string;
  itemGroupId?: string;
} {
  return {
    gender: data.gender ? processProductSpecValue(data.gender) : undefined,
    ageGroup: data.ageGroup ? processProductSpecValue(data.ageGroup) : undefined,
    color: data.color ? processProductSpecValue(data.color) : undefined,
    size: data.size ? processProductSpecValue(data.size) : undefined,
    material: data.material ? processProductSpecValue(data.material) : undefined,
    pattern: data.pattern ? processProductSpecValue(data.pattern) : undefined,
    style: data.style ? processProductSpecValue(data.style) : undefined,
    itemGroupId: data.itemGroupId ? data.itemGroupId.trim() : undefined,
  };
}

// Type definitions
export type Gender = typeof GENDER_OPTIONS[number];
export type AgeGroup = typeof AGE_GROUP_OPTIONS[number]; 