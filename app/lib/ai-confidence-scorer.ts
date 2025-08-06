/**
 * AI Confidence Scorer for TreasureHub Listings
 * 
 * Determines confidence levels for AI-generated fields based on:
 * - Visual clarity in photos/video
 * - Data availability and completeness
 * - Field complexity and ambiguity
 * - Cross-reference consistency
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number; // 0-100
  reasoning: string;
  factors: string[];
}

export interface FieldConfidence {
  [fieldName: string]: ConfidenceScore;
}

export interface ConfidenceFactors {
  hasPhotos: boolean;
  hasVideo: boolean;
  hasVideoFrames: boolean;
  photoCount: number;
  videoFrameCount: number;
  userProvidedInfo: {
    title?: string;
    description?: string;
    brand?: string;
    condition?: string;
    price?: number;
    [key: string]: any;
  };
  visualClarity: {
    brandVisible: boolean;
    dimensionsVisible: boolean;
    serialNumberVisible: boolean;
    modelNumberVisible: boolean;
    conditionDetailsVisible: boolean;
  };
}

/**
 * Calculate confidence score for a specific field
 */
function calculateFieldConfidence(
  fieldName: string,
  factors: ConfidenceFactors,
  aiValue: any
): ConfidenceScore {
  const baseScore = 50; // Start with medium confidence
  let adjustments = 0;
  const reasoningFactors: string[] = [];

  switch (fieldName) {
    case 'title':
      adjustments += factors.hasPhotos ? 20 : -10;
      adjustments += factors.userProvidedInfo.title ? 15 : 0;
      adjustments += factors.photoCount >= 2 ? 10 : -5;
      adjustments += factors.hasVideo ? 5 : 0;
      
      if (factors.hasPhotos) reasoningFactors.push('Product visible in photos');
      if (factors.userProvidedInfo.title) reasoningFactors.push('User provided title');
      if (factors.photoCount >= 2) reasoningFactors.push('Multiple photo angles');
      if (factors.hasVideo) reasoningFactors.push('Video demonstration available');
      
      break;

    case 'description':
      adjustments += factors.hasPhotos ? 25 : -15;
      adjustments += factors.userProvidedInfo.description ? 20 : 0;
      adjustments += factors.photoCount >= 3 ? 15 : 0;
      adjustments += factors.hasVideo ? 10 : 0;
      adjustments += factors.hasVideoFrames ? 10 : 0;
      
      if (factors.hasPhotos) reasoningFactors.push('Detailed visual analysis possible');
      if (factors.userProvidedInfo.description) reasoningFactors.push('User provided description');
      if (factors.photoCount >= 3) reasoningFactors.push('Comprehensive photo coverage');
      if (factors.hasVideo) reasoningFactors.push('Video functionality analysis');
      if (factors.hasVideoFrames) reasoningFactors.push('Video frame analysis available');
      
      break;

    case 'brand':
      adjustments += factors.visualClarity.brandVisible ? 30 : -20;
      adjustments += factors.userProvidedInfo.brand ? 25 : 0;
      adjustments += factors.hasPhotos ? 10 : -10;
      adjustments += factors.photoCount >= 2 ? 5 : 0;
      
      if (factors.visualClarity.brandVisible) reasoningFactors.push('Brand clearly visible in photos');
      if (factors.userProvidedInfo.brand) reasoningFactors.push('User provided brand');
      if (factors.hasPhotos) reasoningFactors.push('Brand markings analyzed');
      if (factors.photoCount >= 2) reasoningFactors.push('Multiple angles for brand verification');
      
      break;

    case 'height':
    case 'width':
    case 'depth':
      adjustments += factors.visualClarity.dimensionsVisible ? 25 : -20;
      adjustments += factors.hasPhotos ? 15 : -10;
      adjustments += factors.photoCount >= 2 ? 10 : 0;
      adjustments += factors.hasVideo ? 5 : 0;
      
      if (factors.visualClarity.dimensionsVisible) reasoningFactors.push('Dimensions clearly visible');
      if (factors.hasPhotos) reasoningFactors.push('Size analysis from photos');
      if (factors.photoCount >= 2) reasoningFactors.push('Multiple angles for measurement');
      if (factors.hasVideo) reasoningFactors.push('Video provides scale reference');
      
      break;

    case 'serialNumber':
      adjustments += factors.visualClarity.serialNumberVisible ? 35 : -25;
      adjustments += factors.userProvidedInfo.serialNumber ? 30 : 0;
      adjustments += factors.hasPhotos ? 10 : -10;
      
      if (factors.visualClarity.serialNumberVisible) reasoningFactors.push('Serial number clearly visible');
      if (factors.userProvidedInfo.serialNumber) reasoningFactors.push('User provided serial number');
      if (factors.hasPhotos) reasoningFactors.push('Serial number photographed');
      
      break;

    case 'modelNumber':
      adjustments += factors.visualClarity.modelNumberVisible ? 35 : -25;
      adjustments += factors.userProvidedInfo.modelNumber ? 30 : 0;
      adjustments += factors.hasPhotos ? 10 : -10;
      
      if (factors.visualClarity.modelNumberVisible) reasoningFactors.push('Model number clearly visible');
      if (factors.userProvidedInfo.modelNumber) reasoningFactors.push('User provided model number');
      if (factors.hasPhotos) reasoningFactors.push('Model number photographed');
      
      break;

    case 'condition':
      adjustments += factors.visualClarity.conditionDetailsVisible ? 25 : -15;
      adjustments += factors.userProvidedInfo.condition ? 20 : 0;
      adjustments += factors.hasPhotos ? 15 : -10;
      adjustments += factors.photoCount >= 2 ? 10 : 0;
      adjustments += factors.hasVideo ? 10 : 0;
      
      if (factors.visualClarity.conditionDetailsVisible) reasoningFactors.push('Condition details clearly visible');
      if (factors.userProvidedInfo.condition) reasoningFactors.push('User provided condition');
      if (factors.hasPhotos) reasoningFactors.push('Condition analysis from photos');
      if (factors.photoCount >= 2) reasoningFactors.push('Multiple angles for condition assessment');
      if (factors.hasVideo) reasoningFactors.push('Video shows item in use');
      
      break;

    case 'estimatedRetailPrice':
    case 'listPrice':
      adjustments += factors.userProvidedInfo.price ? 20 : 0;
      adjustments += factors.hasPhotos ? 15 : -10;
      adjustments += factors.userProvidedInfo.brand ? 10 : 0;
      adjustments += factors.userProvidedInfo.condition ? 10 : 0;
      adjustments += factors.photoCount >= 2 ? 5 : 0;
      
      if (factors.userProvidedInfo.price) reasoningFactors.push('User provided price reference');
      if (factors.hasPhotos) reasoningFactors.push('Visual quality assessment');
      if (factors.userProvidedInfo.brand) reasoningFactors.push('Brand value consideration');
      if (factors.userProvidedInfo.condition) reasoningFactors.push('Condition-based pricing');
      if (factors.photoCount >= 2) reasoningFactors.push('Comprehensive visual analysis');
      
      break;

    case 'features':
      adjustments += factors.hasPhotos ? 20 : -10;
      adjustments += factors.hasVideo ? 15 : 0;
      adjustments += factors.hasVideoFrames ? 10 : 0;
      adjustments += factors.photoCount >= 3 ? 10 : 0;
      adjustments += factors.userProvidedInfo.description ? 5 : 0;
      
      if (factors.hasPhotos) reasoningFactors.push('Features visible in photos');
      if (factors.hasVideo) reasoningFactors.push('Functionality demonstrated in video');
      if (factors.hasVideoFrames) reasoningFactors.push('Video frame analysis');
      if (factors.photoCount >= 3) reasoningFactors.push('Multiple photo angles');
      if (factors.userProvidedInfo.description) reasoningFactors.push('User description analysis');
      
      break;

    case 'keywords':
      adjustments += factors.hasPhotos ? 15 : -5;
      adjustments += factors.userProvidedInfo.title ? 15 : 0;
      adjustments += factors.userProvidedInfo.description ? 10 : 0;
      adjustments += factors.userProvidedInfo.brand ? 10 : 0;
      adjustments += factors.photoCount >= 2 ? 5 : 0;
      
      if (factors.hasPhotos) reasoningFactors.push('Visual keyword extraction');
      if (factors.userProvidedInfo.title) reasoningFactors.push('Title-based keywords');
      if (factors.userProvidedInfo.description) reasoningFactors.push('Description analysis');
      if (factors.userProvidedInfo.brand) reasoningFactors.push('Brand-specific keywords');
      if (factors.photoCount >= 2) reasoningFactors.push('Multi-angle analysis');
      
      break;

    default:
      // Generic scoring for other fields
      adjustments += factors.hasPhotos ? 10 : -5;
      adjustments += factors.userProvidedInfo[fieldName] ? 15 : 0;
      adjustments += factors.photoCount >= 2 ? 5 : 0;
      
      if (factors.hasPhotos) reasoningFactors.push('Visual analysis available');
      if (factors.userProvidedInfo[fieldName]) reasoningFactors.push('User provided data');
      if (factors.photoCount >= 2) reasoningFactors.push('Multiple photo angles');
  }

  // Adjust for AI value quality
  if (aiValue === null || aiValue === undefined || aiValue === '') {
    adjustments -= 20;
    reasoningFactors.push('No AI value generated');
  } else if (typeof aiValue === 'string' && aiValue.toLowerCase().includes('unknown')) {
    adjustments -= 15;
    reasoningFactors.push('AI marked as unknown');
  }

  const finalScore = Math.max(0, Math.min(100, baseScore + adjustments));
  
  let level: ConfidenceLevel;
  if (finalScore >= 75) level = 'high';
  else if (finalScore >= 50) level = 'medium';
  else level = 'low';

  return {
    level,
    score: finalScore,
    reasoning: reasoningFactors.length > 0 ? reasoningFactors.join(', ') : 'Limited data available',
    factors: reasoningFactors
  };
}

/**
 * Calculate confidence scores for all AI-generated fields
 */
export function calculateAllFieldConfidence(
  aiData: any,
  factors: ConfidenceFactors
): FieldConfidence {
  const aiGeneratedFields = [
    'title',
    'description',
    'detailedDescription',
    'department',
    'category',
    'subCategory',
    'condition',
    'estimatedRetailPrice',
    'listPrice',
    'priceReasoning',
    'brand',
    'height',
    'width',
    'depth',
    'serialNumber',
    'modelNumber',
    'discountSchedule',
    'features',
    'keywords',
    'facebookBrand',
    'facebookCategory',
    'facebookCondition',
    'facebookGtin',
    'marketingCopy',
    'technicalSpecs',
    'conditionDetails',
    'valueProposition'
  ];

  const confidence: FieldConfidence = {};

  aiGeneratedFields.forEach(field => {
    confidence[field] = calculateFieldConfidence(field, factors, aiData[field]);
  });

  return confidence;
}

/**
 * Get confidence level color for UI display
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'text-green-600 bg-green-50 border-green-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get confidence level icon for UI display
 */
export function getConfidenceIcon(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return '✓';
    case 'medium': return '⚠';
    case 'low': return '?';
    default: return '•';
  }
}

/**
 * Get confidence level label for UI display
 */
export function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'High Confidence';
    case 'medium': return 'Medium Confidence';
    case 'low': return 'Low Confidence';
    default: return 'Unknown Confidence';
  }
} 