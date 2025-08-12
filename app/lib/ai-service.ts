import OpenAI from 'openai';

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

// ============================================================================
// AI SERVICE PHASE 2 PROMPT - STAGED AI PHOTO GENERATION
// ============================================================================
// 
// This prompt generates photorealistic staged images for listings using DALL-E
// or GPT-4 Vision to create appealing, in-home settings for products.
//
// Key Features:
// - Creates high-resolution (1536x1536) photorealistic hero images
// - Places items in appropriate lifestyle contexts
// - Maintains product accuracy while enhancing visual appeal
// - Supports both photo and video frame analysis
//
// Last Updated: Phase 2 implementation
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

Generate Google Product Category:
- Use the official Google Product Category taxonomy for Facebook Commerce Manager
- Format: "Primary > Secondary > Tertiary > Quaternary" (e.g., "Home & Garden > Furniture > Bedroom Furniture > Dressers")
- This ensures proper Facebook catalog integration and ad performance
- Map from TreasureHub's department/category/subcategory to the closest Google Product Category

Analyze and populate product specifications:
- gender: Determine from category, description, or visual analysis ("male", "female", "unisex")
- color: Extract from visual analysis or description and CAPITALIZE (e.g., "Blue", "Black", "White", "Red")
- size: Extract from visual analysis, description, or category (e.g., "S", "M", "L", "XL", "Small", "Large")
- ageGroup: Determine target age ("adult", "kids", "infant") based on product type
- material: Extract from visual analysis or description and CAPITALIZE (e.g., "Cotton", "Leather", "Wood", "Metal", "Plastic")
- pattern: Extract from visual analysis or description and CAPITALIZE (e.g., "Solid", "Striped", "Floral", "Plaid")
- style: Extract from visual analysis or description and CAPITALIZE (e.g., "Casual", "Formal", "Vintage", "Modern")
- tags: Generate relevant tags for search and categorization (e.g., ["furniture", "bedroom", "storage", "wooden"])
- quantity: Default to 1 unless multiple items are visible
- salePrice: Set to null (no sale price initially)
- salePriceEffectiveDate: Set to null (no sale date initially)
- itemGroupId: Set to null (no variants initially)

🎯 eBay Browse API prep  
• Generate **ebayQuery** – the search term we'll send to eBay's *Browse API*.  
  – **Primary choice:** the GTIN/UPC if present (\`gtin\` field).  
  – **Fallback:** a short keyword string ≤ 80 chars built as  
    \`"<brand> <modelNumber or main descriptor> <core feature(s)>"\`  
    Example: \`"IKEA Malm 6-Drawer Dresser Black"\`  
• If gtin is null, ensure keywords include brand + distinguishing spec (size, color, capacity).

Optional: Analyze video:
- Extract 5 keyframes based on video duration % (0%, 10%, 25%, 50%, 90%)
- Use frames to enhance accuracy of brand, category, and condition
- Populate videoAnalysis summary if applicable

🎯 Confidence Scoring:
For each field, assess confidence level based on:
- **High**: Clear visual evidence, brand markings, or definitive information
- **Medium**: Reasonable inference from visual cues or category patterns
- **Low**: Limited visual information, requires assumption, or unclear details

Provide brief reasoning for each confidence level (e.g., "Clear brand logo visible", "Inferred from category", "Limited visual information")

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
  "googleProductCategory": "string", // Official Google Product Category for Facebook Commerce Manager
  "ebayQuery": "string",

  // Product Specifications (Facebook Shop Fields)
  "quantity": number,
  "salePrice": number | null,
  "salePriceEffectiveDate": "string" | null,
  "itemGroupId": "string" | null,
  "gender": "male" | "female" | "unisex" | null,
  "color": "string" | null,
  "size": "string" | null,
  "ageGroup": "adult" | "kids" | "infant" | null,
  "material": "string" | null,
  "pattern": "string" | null,
  "style": "string" | null,
  "tags": ["string"],

  // Treasure detection
  "isTreasure": boolean,
  "treasureReason": string | null,

  // Video analysis (optional)
  "videoAnalysis": string | null,

  // Confidence scores for all fields (high/medium/low)
  "confidenceScores": {
    "title": { "level": "high" | "medium" | "low", "reason": "string" },
    "description": { "level": "high" | "medium" | "low", "reason": "string" },
    "department": { "level": "high" | "medium" | "low", "reason": "string" },
    "category": { "level": "high" | "medium" | "low", "reason": "string" },
    "subCategory": { "level": "high" | "medium" | "low", "reason": "string" },
    "condition": { "level": "high" | "medium" | "low", "reason": "string" },
    "brand": { "level": "high" | "medium" | "low", "reason": "string" },
    "estimatedRetailPrice": { "level": "high" | "medium" | "low", "reason": "string" },
    "listPrice": { "level": "high" | "medium" | "low", "reason": "string" },
    "priceReasoning": { "level": "high" | "medium" | "low", "reason": "string" },
    "height": { "level": "high" | "medium" | "low", "reason": "string" },
    "width": { "level": "high" | "medium" | "low", "reason": "string" },
    "depth": { "level": "high" | "medium" | "low", "reason": "string" },
    "gender": { "level": "high" | "medium" | "low", "reason": "string" },
    "color": { "level": "high" | "medium" | "low", "reason": "string" },
    "size": { "level": "high" | "medium" | "low", "reason": "string" },
    "ageGroup": { "level": "high" | "medium" | "low", "reason": "string" },
    "material": { "level": "high" | "medium" | "low", "reason": "string" },
    "pattern": { "level": "high" | "medium" | "low", "reason": "string" },
    "style": { "level": "high" | "medium" | "low", "reason": "string" },
    "tags": { "level": "high" | "medium" | "low", "reason": "string" },
    "googleProductCategory": { "level": "high" | "medium" | "low", "reason": "string" }
  }
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
- Turbo-30: Aggressive 30-day schedule for users that want to sell items quickly
- Classic-60: Standard 60-day schedule for most items

💰 Pricing Strategy:
- estimatedRetailPrice: Original retail value
- listPrice: Current market value for resale
- reservePrice: 60% of listPrice (minimum acceptable price)
- priceReasoning: Detailed market analysis and justification

🏴‍☠️ Treasure Detection:
If the item appears vintage, discontinued, or one-of-a-kind and no reliable MSRP is found, set:
• "isTreasure": true
• "estimatedRetailPrice": null
• "discountSchedule": "None"
• "treasureReason": Brief explanation of why it's a treasure (e.g., "Vintage 1980s design", "Discontinued model", "One-of-a-kind piece")
• "priceReasoning": Include 2–3 recent sold-price comps (Etsy, eBay) if available

Treasure indicators:
- Item appears to be 20+ years old
- No modern equivalent or MSRP available
- Condition = "used" 
- Vintage, antique, or collector appeal
- Discontinued or rare model
- One-of-a-kind or handmade piece`;

// ============================================================================
// END AI SERVICE PHASE 1 PROMPT
// ============================================================================

export const AI_SERVICE_PHASE_2_PROMPT = `You are a **staging-image generation agent** for TreasureHub.

You receive:
• The *_listing object_* produced in Phase 1 (see JSON below).  
• Up to 8 original product photos.  
• Five key-frame stills extracted from any user-supplied video.

🎯 **Goal:** Produce ONE high-resolution (1024 × 1024) photorealistic hero image that shows the item in an appealing, in-home setting.  
The image will serve as the primary listing photo on TreasureHub and Facebook Shop.

─────────────────────────────────────────────────────────────────────
📦 INPUTS
─────────────────────────────────────────────────────────────────────
1. **listingJSON** – Phase 1 output (full field set).  
2. **photoURLs[]** – array of original image URLs (top-down, ¾-angle, detail).  
3. **videoFrames[]** – array of five JPEG key frames (0 %, 10 %, 25 %, 50 %, 90 %).  

─────────────────────────────────────────────────────────────────────
🛠️  TASKS
─────────────────────────────────────────────────────────────────────
1. **Identify the clearest "reference frame"**  
   • Choose the sharpest, most front-on source photo or key-frame that best shows the item's silhouette.  
   • Use it as visual conditioning so the staged render matches real color, proportions, and any visible imperfections.

2. **Generate a *single* DALL·E / GPT-Vision prompt** that will yield a photorealistic staged image.  
   The prompt must include:
   • Item name + brand from \`listingJSON.title\` / \`brand\`  if available
   • Accurate color / material cues (e.g., "matte black solid-pine dresser")  
   • Appropriate lifestyle context:  
     – Furniture → modern living room or bedroom  
     – Electronics → tidy home-office desk  
     – Small goods → neutral tabletop with soft daylight  
   • Camera & lighting hints: 3-quarter front angle, soft natural light, shallow depth of field.  
   • No other branded items, no humans, no pets.  
   • Remove busy backgrounds; use clean, on-brand aesthetic.  
   • Keep original item flaws subtle but honest (e.g., "small repaired chip on lower drawer remains visible").

3. **Return the result in JSON (no comments):**

\`\`\`json
{
  "referenceImageUrl": "<selected source URL>",
  "stagingPrompt": "<full text prompt you would feed to DALL·E or GPT-4o-Vision>",
  "desiredAspectRatio": "1:1",
  "targetResolution": "1024x1024",
  "postProcess": "none"
}
\`\`\`

─────────────────────────────────────────────────────────────────────
📏 STYLE & QUALITY GUIDELINES
─────────────────────────────────────────────────────────────────────
• Photo-real, magazine-quality; no cartoon or CGI vibe.  
• Neutral, naturally lit room; TreasureHub brand palette (warm whites, soft shadows).  
• The item is centered and occupies ~70 % of frame.  
• Background props must be generic (succulent, stack of books) and NOT distract.  
• Absolutely **no additional products for sale** shown.  
• Output should be ready for direct upload—no text overlays or watermarks.  

If brand or color is uncertain, default to what is clearly visible in the reference image and note "best-match" in the prompt.

MANDATORY: Output only the JSON object—no markdown, no commentary.

CRITICAL: Return ONLY valid JSON. Do not include any markdown formatting, code block wrappers, or explanatory text. The response must be parseable by JSON.parse().`;

// ============================================================================
// END AI SERVICE PHASE 2 PROMPT
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
  googleProductCategory?: string; // Official Google Product Category for Facebook Commerce Manager
  ebayQuery?: string;
  detailedDescription: string;
  marketingCopy: string;
  technicalSpecs: string;
  conditionDetails: string;
  valueProposition: string;
  videoAnalysis?: string; // Analysis from video frames
  
  // Product Specifications (Facebook Shop Fields)
  quantity?: number;
  salePrice?: number;
  salePriceEffectiveDate?: string;
  itemGroupId?: string;
  gender?: 'male' | 'female' | 'unisex';
  color?: string;
  size?: string;
  ageGroup?: 'newborn' | 'infant' | 'toddler' | 'kids' | 'adult';
  material?: string;
  pattern?: string;
  style?: string;
  tags?: string[];
  
  // Treasure detection
  isTreasure?: boolean;
  treasureReason?: string;
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
export async function generateStagedPhotoPhase2(request: {
  listingJSON: ComprehensiveListingData;
  photoURLs: string[];
  videoFrames?: string[];
}): Promise<{
  referenceImageUrl: string;
  stagingPrompt: string;
  desiredAspectRatio: string;
  targetResolution: string;
  postProcess: string;
}> {
  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Validate input data
    if (!request.listingJSON || !request.photoURLs || request.photoURLs.length === 0) {
      throw new Error("Invalid input: missing listing data or photo URLs");
    }

    // Prepare the input for Phase 2 - only send essential fields to avoid token limits
    const essentialListingData = {
      title: request.listingJSON.title,
      description: request.listingJSON.description,
      department: request.listingJSON.department,
      category: request.listingJSON.category,
      subCategory: request.listingJSON.subCategory,
      condition: request.listingJSON.condition,
      brand: request.listingJSON.brand,
      color: request.listingJSON.color,
      material: request.listingJSON.material,
      style: request.listingJSON.style,
      detailedDescription: request.listingJSON.detailedDescription
    };

    const inputData = {
      listingJSON: essentialListingData,
      photoURLs: request.photoURLs,
      videoFrames: request.videoFrames || []
    };

    console.log("🎨 Phase 2 - Input data:", {
      listingJSONKeys: Object.keys(request.listingJSON),
      photoURLsCount: request.photoURLs.length,
      videoFramesCount: request.videoFrames?.length || 0
    });

    console.log("🎨 Phase 2 - Making OpenAI API call...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: AI_SERVICE_PHASE_2_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(inputData)
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    console.log("🎨 Phase 2 - OpenAI API call completed, status:", response.choices?.[0]?.finish_reason);

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from AI service");
    }

    console.log("🎨 Phase 2 - Raw AI response:", result);

    // Parse the JSON response with enhanced error handling
    let parsedResult;
    try {
      // First, try to parse as-is
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      console.error("🎨 Phase 2 - Initial JSON parse error:", parseError);
      console.error("🎨 Phase 2 - Raw response that failed to parse:", result);
      
      // Try to extract JSON from markdown code blocks
      let cleanedResult = result;
      
      // Remove markdown code block wrappers
      if (result.includes('```json')) {
        cleanedResult = result.replace(/```json\s*/, '').replace(/\s*```/, '');
        console.log("🎨 Phase 2 - Extracted from markdown code block:", cleanedResult);
      } else if (result.includes('```')) {
        cleanedResult = result.replace(/```\s*/, '').replace(/\s*```/, '');
        console.log("🎨 Phase 2 - Extracted from code block:", cleanedResult);
      }
      
      // Try to find JSON object in the text
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResult = jsonMatch[0];
        console.log("🎨 Phase 2 - Extracted JSON object:", cleanedResult);
      }
      
      // Try parsing the cleaned result
      try {
        parsedResult = JSON.parse(cleanedResult);
        console.log("🎨 Phase 2 - Successfully parsed cleaned JSON");
      } catch (secondParseError) {
        console.error("🎨 Phase 2 - Second JSON parse error:", secondParseError);
        console.error("🎨 Phase 2 - Cleaned result that failed to parse:", cleanedResult);
        throw new Error("AI returned invalid JSON format");
      }
    }
    
    console.log("🎨 Phase 2 - Parsed result:", parsedResult);

    // Validate required fields
    if (!parsedResult.referenceImageUrl || !parsedResult.stagingPrompt) {
      console.error("🎨 Phase 2 - Missing required fields in parsed result:", parsedResult);
      
      // Provide fallback response instead of throwing error
      console.warn("🎨 Phase 2 - Using fallback response due to missing fields");
      return {
        referenceImageUrl: request.photoURLs[0] || "",
        stagingPrompt: `Professional product photo of ${request.listingJSON.title || 'item'} in a clean, modern setting with natural lighting, 3/4 angle view, high resolution, photorealistic`,
        desiredAspectRatio: "1:1",
        targetResolution: "1024x1024",
        postProcess: "none"
      };
    }
    
    return {
      referenceImageUrl: parsedResult.referenceImageUrl,
      stagingPrompt: parsedResult.stagingPrompt,
      desiredAspectRatio: parsedResult.desiredAspectRatio || "1:1",
      targetResolution: parsedResult.targetResolution || "1024x1024",
      postProcess: parsedResult.postProcess || "none"
    };

  } catch (error) {
    console.error("Error generating staged photo prompt:", error);
    
    // Provide more specific error information and fallback
    if (error instanceof Error) {
      if (error.message.includes("AI returned invalid JSON format")) {
        console.warn("🎨 Phase 2 - Using fallback due to invalid JSON format");
        // Return fallback response instead of throwing
        return {
          referenceImageUrl: request.photoURLs[0] || "",
          stagingPrompt: `Professional product photo of ${request.listingJSON.title || 'item'} in a clean, modern setting with natural lighting, 3/4 angle view, high resolution, photorealistic`,
          desiredAspectRatio: "1:1",
          targetResolution: "1024x1024",
          postProcess: "none"
        };
      } else if (error.message.includes("No response from AI service")) {
        throw new Error("AI service returned no response");
      }
    }
    
    // For other errors, provide fallback response
    console.warn("🎨 Phase 2 - Using fallback due to unexpected error");
    return {
      referenceImageUrl: request.photoURLs[0] || "",
      stagingPrompt: `Professional product photo of ${request.listingJSON.title || 'item'} in a clean, modern setting with natural lighting, 3/4 angle view, high resolution, photorealistic`,
      desiredAspectRatio: "1:1",
      targetResolution: "1024x1024",
      postProcess: "none"
    };
  }
}

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

    const response = await fetch('/api/ai/generate-staged-photo-pebblely', {
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