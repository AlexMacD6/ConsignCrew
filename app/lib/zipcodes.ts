/**
 * Approved ZIP codes for TreasureHub marketplace
 * Now fetches from database via API instead of hardcoded values
 */

// Keep the original hardcoded zip codes as fallback
const SELLER_ZIP_CODES_FALLBACK = {
  "77007": "The Heights (Washington Corridor)",
  "77008": "The Heights (Timbergrove / Greater Heights)",
  "77019": "River Oaks / Upper Kirby",
  "77027": "River Oaks District / Highland Village",
  "77056": "Galleria / Tanglewood",
  "77057": "Galleria / Briargrove",
  "77024": "Memorial / Memorial Villages",
  "77079": "Memorial West / Energy Corridor",
  "77005": "West University Place",
  "77401": "Bellaire",
  "77006": "Montrose / Museum District",
  "77003": "EaDo / Eastwood",
  "77018": "Garden Oaks / Oak Forest",
  "77004": "Midtown / Museum Park",
  "77002": "Downtown / Midtown",
  "77098": "Upper Kirby / Greenway Plaza",
} as const;

const BUYER_ZIP_CODES_FALLBACK = {
  // The Heights Core Area
  "77007": "The Heights (Washington Corridor)",
  "77008": "The Heights (Timbergrove / Greater Heights)",
  "77009": "Near Northside / Woodland Heights",
  "77018": "Garden Oaks / Oak Forest",
  "77022": "Northside",
  "77076": "Northline",
  "77092": "Lazybrook / Timbergrove",
  "77055": "Spring Branch East",

  // River Oaks / Upper Kirby Core Area
  "77019": "River Oaks / Upper Kirby",
  "77027": "Highland Village / River Oaks",
  "77098": "Upper Kirby / Greenway Plaza",
  "77006": "Montrose",
  "77046": "Greenway Plaza",
  "77081": "Gulfton / Bellaire Junction",
  "77056": "Galleria",
  "77063": "Briarmeadow / Woodlake",

  // Galleria / Tanglewood Core Area
  "77057": "Galleria / Briargrove",
  "77024": "Memorial Villages",
  "77042": "Westchase",
  "77036": "Sharpstown",

  // Memorial / Memorial Villages Core Area
  "77079": "Memorial West / Energy Corridor",
  "77043": "Spring Branch West",
  "77041": "Jersey Village / Carverdale",
  "77080": "Spring Branch Central",
  "77077": "Briar Forest",
  "77094": "Energy Corridor (far west)",

  // West University / Bellaire Core Area
  "77005": "West University Place",
  "77401": "Bellaire",
  "77025": "Braeswood / Southside",
  "77030": "Texas Medical Center",
  "77096": "Meyerland",
  "77035": "Westbury",
  "77045": "Central Southwest",

  // Montrose / Museum District / Midtown Core Area
  "77004": "Midtown / Museum Park",
  "77002": "Downtown / Midtown",
  "77023": "Eastwood",
  "77010": "Downtown core",

  // EaDo / Eastwood Core Area
  "77003": "EaDo / Eastwood",
  "77011": "Second Ward",
  "77020": "Fifth Ward",
  "77021": "OST / South Union",
  "77012": "Magnolia Park",
  "77017": "Pecan Park",

  // Garden Oaks / Oak Forest Core Area
  "77091": "Acres Homes",
  "77088": "Inwood Forest",
} as const;

// Cache for database zip codes
let zipCodeCache: {
  sellerZipCodes: Record<string, string>;
  buyerZipCodes: Record<string, string>;
} | null = null;

let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch zip codes from the database API
 */
async function fetchZipCodesFromAPI() {
  try {
    const response = await fetch('/api/admin/zipcodes');
    if (response.ok) {
      const data = await response.json();
      
      // Convert arrays to objects for backward compatibility
      const sellerZipCodes: Record<string, string> = {};
      const buyerZipCodes: Record<string, string> = {};
      
      data.sellerZipCodes.forEach((zip: any) => {
        sellerZipCodes[zip.code] = zip.area;
      });
      
      data.buyerZipCodes.forEach((zip: any) => {
        buyerZipCodes[zip.code] = zip.area;
      });
      
      return { sellerZipCodes, buyerZipCodes };
    }
  } catch (error) {
    console.warn('Failed to fetch zip codes from API, using fallback:', error);
  }
  
  return null;
}

/**
 * Get seller ZIP codes from database or fallback
 */
export async function getSellerZipCodesAsync(): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (zipCodeCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return zipCodeCache.sellerZipCodes;
  }
  
  // Try to fetch from API
  const apiData = await fetchZipCodesFromAPI();
  if (apiData) {
    zipCodeCache = apiData;
    cacheTimestamp = now;
    return apiData.sellerZipCodes;
  }
  
  // Fallback to hardcoded data
  return SELLER_ZIP_CODES_FALLBACK;
}

/**
 * Get buyer ZIP codes from database or fallback
 */
export async function getBuyerZipCodesAsync(): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (zipCodeCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return zipCodeCache.buyerZipCodes;
  }
  
  // Try to fetch from API
  const apiData = await fetchZipCodesFromAPI();
  if (apiData) {
    zipCodeCache = apiData;
    cacheTimestamp = now;
    return apiData.buyerZipCodes;
  }
  
  // Fallback to hardcoded data
  return BUYER_ZIP_CODES_FALLBACK;
}

/**
 * Get all approved ZIP codes from database or fallback
 */
export async function getApprovedZipCodesAsync(): Promise<Record<string, string>> {
  const [sellerZipCodes, buyerZipCodes] = await Promise.all([
    getSellerZipCodesAsync(),
    getBuyerZipCodesAsync()
  ]);
  
  return { ...sellerZipCodes, ...buyerZipCodes };
}

/**
 * Check if a ZIP code is approved for sellers
 */
export async function isApprovedSellerZipCodeAsync(zipCode: string): Promise<boolean> {
  const sellerZipCodes = await getSellerZipCodesAsync();
  return zipCode in sellerZipCodes;
}

/**
 * Check if a ZIP code is approved for buyers
 */
export async function isApprovedBuyerZipCodeAsync(zipCode: string): Promise<boolean> {
  const buyerZipCodes = await getBuyerZipCodesAsync();
  return zipCode in buyerZipCodes;
}

/**
 * Check if a ZIP code is approved (either seller or buyer)
 */
export async function isApprovedZipCodeAsync(zipCode: string): Promise<boolean> {
  const [isSeller, isBuyer] = await Promise.all([
    isApprovedSellerZipCodeAsync(zipCode),
    isApprovedBuyerZipCodeAsync(zipCode)
  ]);
  return isSeller || isBuyer;
}

/**
 * Get neighborhood name for a ZIP code
 */
export async function getNeighborhoodNameAsync(zipCode: string): Promise<string> {
  const [sellerZipCodes, buyerZipCodes] = await Promise.all([
    getSellerZipCodesAsync(),
    getBuyerZipCodesAsync()
  ]);
  
  return sellerZipCodes[zipCode] || buyerZipCodes[zipCode] || 'Unknown Area';
}

// Backward compatibility functions (synchronous, use fallback data)
export const SELLER_ZIP_CODES = SELLER_ZIP_CODES_FALLBACK;
export const BUYER_ZIP_CODES = BUYER_ZIP_CODES_FALLBACK;

/**
 * Get all seller ZIP codes as an array (synchronous, fallback)
 */
export function getSellerZipCodes(): string[] {
  return Object.keys(SELLER_ZIP_CODES_FALLBACK);
}

/**
 * Get all buyer ZIP codes as an array (synchronous, fallback)
 */
export function getBuyerZipCodes(): string[] {
  return Object.keys(BUYER_ZIP_CODES_FALLBACK);
}

/**
 * Get all approved ZIP codes as an array (synchronous, fallback)
 */
export function getApprovedZipCodes(): string[] {
  return [...getSellerZipCodes(), ...getBuyerZipCodes()];
}

/**
 * Check if a ZIP code is approved for sellers (synchronous, fallback)
 */
export function isApprovedSellerZipCode(zipCode: string): boolean {
  return zipCode in SELLER_ZIP_CODES_FALLBACK;
}

/**
 * Check if a ZIP code is approved for buyers (synchronous, fallback)
 */
export function isApprovedBuyerZipCode(zipCode: string): boolean {
  return zipCode in BUYER_ZIP_CODES_FALLBACK;
}

/**
 * Check if a ZIP code is approved (synchronous, fallback)
 */
export function isApprovedZipCode(zipCode: string): boolean {
  return isApprovedSellerZipCode(zipCode) || isApprovedBuyerZipCode(zipCode);
}

/**
 * Get neighborhood name for a ZIP code (synchronous, fallback)
 */
export function getNeighborhoodName(zipCode: string): string {
  return SELLER_ZIP_CODES_FALLBACK[zipCode] || BUYER_ZIP_CODES_FALLBACK[zipCode] || 'Unknown Area';
}

/**
 * Clear the zip code cache (useful for testing or when data changes)
 */
export function clearZipCodeCache() {
  zipCodeCache = null;
  cacheTimestamp = 0;
} 