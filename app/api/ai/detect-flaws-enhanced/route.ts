import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Product category-specific flaw types and examples
const categorySpecificFlaws = {
  "Electronics": {
    flawTypes: [
      "screen_crack", "water_damage", "battery_swelling", "charging_port_damage",
      "speaker_damage", "button_malfunction", "casing_crack", "missing_charger",
      "software_issues", "performance_degradation"
    ],
    normalWear: [
      "minor_scratches_on_casing", "light_wear_on_buttons", "normal_battery_degradation",
      "minor_dust_accumulation", "light_fingerprint_smudges"
    ]
  },
  "Furniture": {
    flawTypes: [
      "wood_damage", "fabric_stain", "structural_damage", "missing_hardware",
      "upholstery_tear", "finish_damage", "loose_joints", "water_damage",
      "pet_damage", "sun_fading"
    ],
    normalWear: [
      "light_scratching", "minor_fabric_pilling", "normal_aging_patina",
      "light_dust_accumulation", "minor_finish_wear"
    ]
  },
  "Clothing": {
    flawTypes: [
      "fabric_tear", "stain", "missing_button", "broken_zipper",
      "seam_damage", "color_fading", "pilling", "hole",
      "odor", "size_alteration"
    ],
    normalWear: [
      "light_pilling", "minor_fabric_pilling", "light_color_fading",
      "minor_seam_stretching", "light_odor"
    ]
  },
  "Books": {
    flawTypes: [
      "page_tear", "water_damage", "missing_pages", "binding_damage",
      "cover_damage", "writing_marks", "mold_damage", "spine_damage",
      "corner_damage", "dust_jacket_damage"
    ],
    normalWear: [
      "light_page_yellowing", "minor_cover_wear", "light_dust_accumulation",
      "minor_corner_bending", "light_spine_wear"
    ]
  }
};

// Severity assessment guidelines
const severityGuidelines = {
  minor: "Does not affect functionality, easily repairable, minimal impact on value",
  moderate: "Affects appearance or minor functionality, repairable with effort, moderate impact on value",
  major: "Significantly affects functionality or appearance, expensive to repair, major impact on value"
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoUrls, productCategory, estimatedValue, condition } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: 'Photo URLs are required' }, { status: 400 });
    }

    // Filter out URLs that OpenAI can't access
    const accessiblePhotoUrls = photoUrls.filter((url: string) => {
      return url && (
        url.startsWith('http://') || 
        url.startsWith('https://')
      ) && !url.includes('localhost') && !url.includes('127.0.0.1') && 
         !url.includes('blob:') && !url.includes('data:') &&
         // Allow CloudFront URLs, filter out only direct S3 URLs
         !(url.includes('s3.') && url.includes('amazonaws.com') && !url.includes('cloudfront.net'));
    });

    if (accessiblePhotoUrls.length === 0) {
      return NextResponse.json({ error: 'No accessible photo URLs provided' }, { status: 400 });
    }

    // Get category-specific flaw information
    const categoryInfo = categorySpecificFlaws[productCategory as keyof typeof categorySpecificFlaws] || {
      flawTypes: ["scratch", "stain", "damage", "wear", "missing_parts"],
      normalWear: ["light_wear", "minor_scratching", "normal_aging"]
    };

    const enhancedFlawDetectionPrompt = `You are an expert product condition analyst specializing in ${productCategory || 'general'} products. Your task is to analyze product photos and identify ONLY OBVIOUS and SIGNIFICANT flaws, damage, and imperfections that would clearly affect the product's condition or value.

PRODUCT CONTEXT:
- Category: ${productCategory || 'General'}
- Estimated Value: ${estimatedValue ? `$${estimatedValue}` : 'Unknown'}
- Listed Condition: ${condition || 'Unknown'}

PHOTOS TO ANALYZE (in order):
${accessiblePhotoUrls.map((url, index) => `Photo ${index + 1}: ${url}`).join('\n')}

CATEGORY-SPECIFIC FLAW TYPES TO LOOK FOR (ONLY OBVIOUS ONES):
${categoryInfo.flawTypes.map(type => `- ${type}`).join('\n')}

NORMAL WEAR PATTERNS (DO NOT FLAG AS FLAWS):
${categoryInfo.normalWear.map(wear => `- ${wear}`).join('\n')}

SEVERITY ASSESSMENT GUIDELINES:
- Minor: ${severityGuidelines.minor}
- Moderate: ${severityGuidelines.moderate}
- Major: ${severityGuidelines.major}

ANALYSIS INSTRUCTIONS:
1. ONLY report OBVIOUS and CLEAR flaws that significantly impact value or functionality
2. Ignore minor imperfections, normal wear, and subtle issues
3. Be very conservative - when in doubt, don't flag it as a flaw
4. Consider the product category and expected condition
5. Assess severity based on impact on functionality and value
6. Be precise about location and description
7. Provide confidence level for each assessment (only report if confidence > 99%)
8. CRITICAL: Associate each flaw with the EXACT photo where it appears using photoIndex (0-based) and photoUrl

Return your analysis as a JSON object with the following structure:
{
  "flaws": [
    {
      "photoIndex": 0,
      "photoUrl": "exact_url_of_photo_where_flaw_appears",
      "flaws": [
        {
          "type": "specific_flaw_type",
          "severity": "minor|moderate|major",
          "location": "specific_location_on_product",
          "description": "detailed_description_of_flaw",
          "confidence": 0.99,
          "impactOnValue": "low|medium|high",
          "repairability": "easy|moderate|difficult"
        }
      ]
    }
  ],
  "summary": "Overall condition assessment based on all photos",
  "confidence": 0.90,
  "recommendations": "Suggestions for improving product presentation or condition"
}

IMPORTANT: Each flaw must be associated with the specific photo where it appears. Use photoIndex to reference the photo number (0 = first photo, 1 = second photo, etc.) and photoUrl to include the exact URL of that photo. Only report flaws with 99% confidence or higher.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: enhancedFlawDetectionPrompt
        },
        {
          role: "user",
          content: `Please analyze these ${productCategory || 'product'} photos for flaws and imperfections: ${accessiblePhotoUrls.join(', ')}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1,
    });

    const analysis = response.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('No analysis received from OpenAI');
    }

    // Parse the JSON response
    let flawData;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        flawData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing enhanced flaw detection response:', parseError);
      console.error('Raw response:', analysis);
      throw new Error('Failed to parse flaw detection response');
    }

    // Validate and clean the flaw data
    const validatedFlawData = validateAndCleanFlawData(flawData, productCategory);

    return NextResponse.json({
      success: true,
      flawData: validatedFlawData,
      analysis,
      metadata: {
        productCategory,
        estimatedValue,
        condition,
        photosAnalyzed: accessiblePhotoUrls.length,
        analysisTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in enhanced flaw detection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect flaws', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

function validateAndCleanFlawData(flawData: any, productCategory: string) {
  console.log('Raw flaw data received:', JSON.stringify(flawData, null, 2));
  
  // Validate the structure
  if (!flawData.flaws || !Array.isArray(flawData.flaws)) {
    console.log('Invalid flaw data structure - no flaws array found');
    return { flaws: [], summary: "Invalid flaw data structure" };
  }

  // Clean and validate each flaw entry
  const cleanedFlaws = flawData.flaws.map((photoFlaw: any, index: number) => {
    console.log(`Processing photo flaw ${index}:`, JSON.stringify(photoFlaw, null, 2));
    
    if (!photoFlaw.flaws || !Array.isArray(photoFlaw.flaws)) {
      console.log(`Photo flaw ${index} has no valid flaws array`);
      return photoFlaw;
    }

    // Filter out low-confidence flaws and validate severity
    const validatedFlaws = photoFlaw.flaws
      .filter((flaw: any, flawIndex: number) => {
        console.log(`Checking flaw ${flawIndex} in photo ${index}:`, JSON.stringify(flaw, null, 2));
        
        // Remove flaws with low confidence - only keep very obvious flaws (99% confidence)
        if (flaw.confidence && flaw.confidence < 0.99) {
          console.log(`Flaw ${flawIndex} in photo ${index} rejected due to low confidence: ${flaw.confidence}`);
          return false;
        }
        
        // Validate severity
        if (!['minor', 'moderate', 'major'].includes(flaw.severity)) {
          flaw.severity = 'minor'; // Default to minor if invalid
          console.log(`Flaw ${flawIndex} in photo ${index} severity defaulted to minor`);
        }

        // Validate flaw type
        if (!flaw.type || flaw.type.trim() === '') {
          console.log(`Flaw ${flawIndex} in photo ${index} rejected due to missing type`);
          return false;
        }

        console.log(`Flaw ${flawIndex} in photo ${index} passed validation`);
        return true;
      })
      .map((flaw: any) => ({
        ...flaw,
        confidence: flaw.confidence || 0.5,
        impactOnValue: flaw.impactOnValue || 'low',
        repairability: flaw.repairability || 'moderate'
      }));

    console.log(`Photo ${index} has ${validatedFlaws.length} validated flaws`);

    // Only keep the highest confidence flaw per photo
    const highestConfidenceFlaw = validatedFlaws.length > 0 
      ? validatedFlaws.reduce((highest: any, current: any) => 
          (current.confidence || 0) > (highest.confidence || 0) ? current : highest
        )
      : null;

    if (highestConfidenceFlaw) {
      console.log(`Photo ${index} highest confidence flaw:`, JSON.stringify(highestConfidenceFlaw, null, 2));
    } else {
      console.log(`Photo ${index} has no flaws meeting confidence threshold`);
    }

    return {
      ...photoFlaw,
      flaws: highestConfidenceFlaw ? [highestConfidenceFlaw] : []
    };
  });

  const result = {
    ...flawData,
    flaws: cleanedFlaws,
    summary: flawData.summary || "Flaw analysis completed",
    confidence: flawData.confidence || 0.5,
    recommendations: flawData.recommendations || ""
  };

  console.log('Final cleaned flaw data:', JSON.stringify(result, null, 2));
  return result;
} 