/**
 * AI Service for analyzing product photos and generating listing information
 * Uses OpenAI API to analyze images and generate comprehensive product listings
 */

// ============================================================================
// AI SERVICE PHASE 1 PROMPT - STRUCTURED RESALE LISTING GENERATION
// ============================================================================
// 
// This prompt is designed for TreasureHub's concierge resale platform to generate
// high-quality listings for both internal marketplace display and Facebook Shop distribution.
//
// Key Features:
// - Analyzes photos and video frames for visual identification
// - Uses consolidated Facebook-compatible field formats
// - Generates SEO-optimized content with precise pricing
// - Maintains data integrity with conservative brand identification
// - Supports video analysis for enhanced accuracy
//
// Last Updated: Field consolidation implementation
// ============================================================================

export const AI_SERVICE_PHASE_1_PROMPT = `You are a listing-generation agent for TreasureHub, a concierge resale platform that turns user-submitted items into high-quality listings for both internal marketplace display and Facebook Shop distribution.

You are given a set of user inputs (text fields, photo URLs, optional video) and your task is to generate a complete, marketplace-ready listing object that populates all structured fields in the TreasureHub form.

🛠️ Instructions:
Analyze the photos (and video frames if provided) to understand the item's visual identity, category, and likely brand.

Classify the item using TreasureHub's taxonomy: department → category → subCategory.

Produce core content fields:
- title: 50–80 characters, SEO-optimized, brand-forward (avoid excessive adjectives like "Modern Minimalist Design")
- description: 200–400 word marketing description - CRITICAL: If ANY damage, wear, scratches, dents, or imperfections are visible, explicitly describe them in detail
- features: short bullet list of key specs
- valueProposition, marketingCopy, and conditionDetails to support resale decision

Price the item:
- Use condition, category, and market to estimate estimatedRetailPrice
- Suggest listPrice and explain in priceReasoning
- Calculate reservePrice as 60% of listPrice
- Tag the best discountSchedule based on value, condition, and resale velocity

Populate technical specs:
- If known or visible, include modelNumber, serialNumber, gtin
- Dimensions (height, width, depth) must be exact inch values or null

Generate Facebook Marketplace values:
- Use Facebook's condition format (new, used, refurbished)
- Copy brand to facebookBrand
- Copy gtin to facebookGtin
- Use the same category for facebookCategory (unified taxonomy)

Optional: Analyze video:
- Extract 5 keyframes based on video duration % (0%, 10%, 25%, 50%, 90%)
- Use frames to enhance accuracy of brand, category, and condition
- Populate videoAnalysis summary if applicable

📦 Output format:
Return a single JSON object with the following fields populated (NO COMMENTS IN JSON):

{
  "title": "string",
  "description": "string", 
  "department": "string",
  "category": "string",
  "subCategory": "string",
  "condition": "new" | "used" | "refurbished",
  "brand": "string",
  "estimatedRetailPrice": number,
  "listPrice": number,
  "reservePrice": number,
  "priceReasoning": "string",
  "discountSchedule": "Turbo-30" | "Classic-60",
  "modelNumber": "string" | null,
  "serialNumber": "string" | null,
  "gtin": "string" | null,
  "height": number | null,
  "width": number | null,
  "depth": number | null,
  "features": ["string"],
  "keywords": ["string"],
  "technicalSpecs": "string",
  "marketingCopy": "string",
  "conditionDetails": "string",
  "valueProposition": "string",
  "facebookBrand": "string",
  "facebookCondition": "new" | "used" | "refurbished",
  "facebookGtin": "string" | null,
  "facebookCategory": "string",

  // Video analysis (optional)
  videoAnalysis: string | null
}

🧾 User inputs (always provided):
{
  title: string,
  description: string,
  department: string,
  category: string,
  subCategory: string,
  condition: "new" | "used" | "refurbished",
  listPrice: number,
  brand: string,
  gtin?: string,
  height?: number,
  width?: number,
  depth?: number,
  serialNumber?: string,
  modelNumber?: string,
  estimatedRetailPrice?: number,
  discountSchedule: "Turbo-30" | "Classic-60",
  zipCode: string,
  neighborhood: string,
  photos: string[],       // array of image URLs
  videoUrl?: string        // optional
}

🧠 Tone & behavior guidance:
Be precise, not generic.
Do not invent data. Use null when model/serial/gtin is not visible.
Use brand logic conservatively: if it's IKEA, state so confidently; if unsure, say "Likely brand: [X] based on design."
Favor clarity in title, confidence in valueProposition, and realism in priceReasoning.
Keep titles concise and avoid excessive descriptive adjectives.
CRITICAL: When counting items (drawers, shelves, etc.), count carefully and accurately. If uncertain, state the range (e.g., "5-6 drawers").
MANDATORY: Always describe visible damage, wear, or imperfections in the description, even if minor.

📋 FACEBOOK MARKETPLACE TAXONOMY (SINGLE SOURCE OF TRUTH):
Use ONLY Facebook Marketplace categories for all categorization:

DEPARTMENTS:
- Furniture
- Electronics  
- Home & Garden
- Clothing & Accessories
- Sporting Goods
- Toys & Games
- Books & Magazines
- Automotive
- Beauty & Health
- Jewelry & Watches
- Tools & Hardware
- Collectibles & Art
- Antiques

CATEGORIES (by Department):
Furniture: Living Room, Dining Room, Bedroom, Office, Storage, Outdoor, Kids
Electronics: Computers & Tablets, Mobile Phones, Audio Equipment, Cameras & Photo, TVs & Video, Smart Home, Gaming
Home & Garden: Home Décor, Lighting, Kitchen & Dining, Bathroom, Storage & Organization, Rugs & Textiles
Clothing & Accessories: Men's Clothing, Women's Clothing, Kids' Clothing, Jewelry & Watches, Bags & Purses, Shoes
Sporting Goods: Fitness Equipment, Team Sports, Outdoor Sports, Water Sports
Toys & Games: Board Games, Video Games, Educational, Action Figures

🎯 UNIFIED CATEGORIZATION:
- Use Facebook Marketplace taxonomy for ALL categorization
- No separate TreasureHub vs Facebook categories
- Single department → category → subCategory structure
- All fields use the same Facebook-compatible values

🎯 Facebook Marketplace Integration:
- Condition values must be: "new", "used", or "refurbished" (lowercase)
- Brand field is shared between platforms
- GTIN field is prioritized for Facebook matching
- Category uses unified Facebook Marketplace taxonomy

⚡ Discount Schedules:
- Turbo-30: Aggressive 30-day schedule for high-value items
- Classic-60: Standard 60-day schedule for most items

💰 Pricing Strategy:
- estimatedRetailPrice: Original retail value
- listPrice: Current market value for resale
- reservePrice: 60% of listPrice (minimum acceptable price)
- priceReasoning: Detailed market analysis and justification`;

// ============================================================================
// END AI SERVICE PHASE 1 PROMPT
// ============================================================================

/**
 * Utility function to map condition values to Facebook-compatible format
 * Handles both old format (GOOD, NEW, EXCELLENT, FAIR) and new format (new, used, refurbished)
 */
export function mapConditionToFacebook(condition: string): "new" | "used" | "refurbished" {
  const conditionLower = condition.toLowerCase();
  
  // Handle new Facebook-compatible format
  if (conditionLower === "new" || conditionLower === "used" || conditionLower === "refurbished") {
    return conditionLower as "new" | "used" | "refurbished";
  }
  
  // Handle old format mapping
  switch (condition.toUpperCase()) {
    case "NEW":
      return "new";
    case "EXCELLENT":
    case "GOOD":
    case "FAIR":
    case "POOR":
      return "used";
    default:
      return "used"; // Default fallback
  }
}

/**
 * Utility function to ensure Facebook Marketplace taxonomy compliance
 * Maps any non-Facebook categories to proper Facebook Marketplace categories
 */
export function ensureFacebookTaxonomy(
  department: string,
  category: string,
  subCategory: string
): {
  department: string;
  category: string;
  subCategory: string;
} {
  // Facebook Marketplace departments
  const facebookDepartments = [
    'Furniture', 'Electronics', 'Home & Garden', 'Clothing & Accessories',
    'Sporting Goods', 'Toys & Games', 'Books & Magazines', 'Automotive',
    'Beauty & Health', 'Jewelry & Watches', 'Tools & Hardware',
    'Collectibles & Art', 'Antiques'
  ];

  // Map common misclassifications to Facebook departments
  const departmentMapping: Record<string, string> = {
    'Sports & Outdoors': 'Sporting Goods', // Facebook uses "Sporting Goods"
    'Home & Garden': 'Home & Garden', // Keep as is
    'Furniture': 'Furniture', // Keep as is
    'Electronics': 'Electronics', // Keep as is
    'Clothing & Accessories': 'Clothing & Accessories', // Keep as is
  };

  // Ensure department is Facebook-compliant
  const mappedDepartment = departmentMapping[department] || 
    (facebookDepartments.includes(department) ? department : 'Home & Garden');

  // For furniture items, ensure they're in the Furniture department
  if (mappedDepartment === 'Home & Garden' && 
      (category.toLowerCase().includes('dresser') || 
       category.toLowerCase().includes('table') || 
       category.toLowerCase().includes('chair') || 
       category.toLowerCase().includes('bed') || 
       category.toLowerCase().includes('desk') ||
       category.toLowerCase().includes('cabinet') ||
       category.toLowerCase().includes('sofa') ||
       category.toLowerCase().includes('couch'))) {
    return {
      department: 'Furniture',
      category: category,
      subCategory: subCategory
    };
  }

  return {
    department: mappedDepartment,
    category: category,
    subCategory: subCategory
  };
}

// Legacy interfaces - removed in favor of comprehensive AI workflow

export interface StagedPhotoRequest {
  photoUrls: string[];
  productDescription?: string;
  department: string;
  category: string;
  comprehensiveData?: ComprehensiveListingData;
}

export interface StagedPhotoResponse {
  stagedPhotoUrl: string;
  analysis: string;
}

export interface ComprehensiveListingData {
  title: string;
  description: string;
  department: string;
  category: string;
  subCategory: string;
  condition: 'new' | 'used' | 'refurbished'; // Updated to Facebook-compatible format
  estimatedRetailPrice: number;
  listPrice: number;
  priceReasoning: string;
  brand: string;
  height?: string;
  width?: string;
  depth?: string;
  serialNumber?: string;
  modelNumber?: string;
  discountSchedule: string;
  features: string[];
  keywords: string[];
  // Facebook Shop Integration (Consolidated Fields)
  facebookBrand?: string;
  facebookCategory?: string;
  facebookCondition?: string;
  facebookGtin?: string;
  detailedDescription: string;
  marketingCopy: string;
  technicalSpecs: string;
  conditionDetails: string;
  valueProposition: string;
  videoAnalysis?: string; // Analysis from video frames
}

// Legacy function - removed in favor of comprehensive AI workflow

/**
 * Generate a comprehensive listing using OpenAI o3 model
 * Analyzes user input and generates detailed, accurate listing information
 * Uses the Phase 1 prompt for structured resale listing generation
 */
export async function generateComprehensiveListing(
  userInput: {
    title: string;
    description: string;
    department: string;
    category: string;
    subCategory: string;
    condition: string;
    price: number;
    brand?: string;
    photos: any;
    video?: {
      videoId: string;
      frameUrls: string[];
      thumbnailUrl: string;
      duration: number;
    };
    additionalInfo?: string;
  }
): Promise<{
  listingData: ComprehensiveListingData;
  confidenceScores: any;
  analysis: string;
}> {
  try {
    const response = await fetch('/api/ai/generate-comprehensive-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInput),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate comprehensive listing');
    }

    const data = await response.json();
    console.log("AI Service received data:", data);
    return {
      listingData: data.listingData,
      confidenceScores: data.confidenceScores,
      analysis: data.analysis
    };
  } catch (error) {
    console.error('Error generating comprehensive listing:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate comprehensive listing');
  }
}

/**
 * Generate a detailed product description based on photos and basic info
 */
export async function generateProductDescription(
  photoUrls: string[],
  title: string,
  category: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoUrls,
        title,
        category,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate description');
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error('Error generating description:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate description');
  }
}

/**
 * Estimate product pricing based on photos and market analysis
 */
export async function estimateProductPricing(
  photoUrls: string[],
  title: string,
  category: string,
  condition: string
): Promise<{
  estimatedRetailPrice: number;
  listPrice: number;
  priceReasoning: string;
}> {
  try {
    const response = await fetch('/api/ai/estimate-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoUrls,
        title,
        category,
        condition,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to estimate pricing');
    }

    const data = await response.json();
    return data.pricing;
  } catch (error) {
    console.error('Error estimating pricing:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to estimate pricing');
  }
}

/**
 * Detect flaws and imperfections in product photos
 */
export async function detectPhotoFlaws(photoUrls: string[]): Promise<{
  flawData: any;
  analysis: string;
}> {
  try {
    const response = await fetch('/api/ai/detect-flaws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrls }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to detect flaws');
    }

    const data = await response.json();
    return {
      flawData: data.flawData,
      analysis: data.analysis
    };
  } catch (error) {
    console.error('Error detecting photo flaws:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to detect photo flaws');
  }
}

/**
 * Generate a professional staged photo using AI with comprehensive listing data
 */
export async function generateStagedPhoto(request: StagedPhotoRequest): Promise<StagedPhotoResponse> {
  try {
    // If we have comprehensive data, use it to enhance the photo generation
    const enhancedRequest = {
      ...request,
      productDescription: request.comprehensiveData?.detailedDescription || request.productDescription,
      marketingCopy: request.comprehensiveData?.marketingCopy,
      technicalSpecs: request.comprehensiveData?.technicalSpecs,
      conditionDetails: request.comprehensiveData?.conditionDetails,
      valueProposition: request.comprehensiveData?.valueProposition,
    };

    const response = await fetch('/api/ai/generate-staged-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate staged photo');
    }

    const data = await response.json();
    return {
      stagedPhotoUrl: data.stagedPhotoUrl,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Error generating staged photo:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate staged photo');
  }
} 