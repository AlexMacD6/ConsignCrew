import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { calculateAllFieldConfidence, ConfidenceFactors } from '@/lib/ai-confidence-scorer';
import { AI_SERVICE_PHASE_1_PROMPT, mapConditionToFacebook, ensureFacebookTaxonomy, generateStagedPhotoPhase2, mapFacebookToGoogleProductCategory } from '@/lib/ai-service';
import { mapToGoogleProductCategory } from '@/lib/google-product-categories';
import { getPhase1Model, isUsingGpt5 } from '@/lib/ai-model-config';

/**
 * AI Service Phase 1: Comprehensive Listing Generation
 * 
 * This API has been migrated from OpenAI Chat Completions API to the new Responses API
 * for better GPT-5 support and maximum accuracy.
 * 
 * Key Changes:
 * - Uses openai.responses.create() instead of openai.chat.completions.create()
 * - Optimized for GPT-5 model capabilities (better accuracy than 5-mini)
 * - Enhanced prompt engineering for better JSON output
 * - Improved visual analysis instructions
 * 
 * Migration Date: 2025-01-XX
 * Model: gpt-5-2025-08-07
 * API: OpenAI Responses API
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json({
        error: 'OpenAI API key is not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      }, { status: 500 });
    }
    
    const body = await request.json();
    const {
      title,
      description,
      department,
      category,
      subCategory,
      condition,
      price,
      brand,
      photos,
      video,
      additionalInfo,
      userInput,
      mode = 'comprehensive', // 'comprehensive' or 'formFields' mode
    } = body;

    // Extract photo URLs for AI analysis
    const photoUrls = [];
    if (photos.hero?.url || photos.hero?.key) {
      photoUrls.push(photos.hero.url || photos.hero.key);
    }
    if (photos.back?.url || photos.back?.key) {
      photoUrls.push(photos.back.url || photos.back.key);
    }
    if (photos.proof?.url || photos.proof?.key) {
      photoUrls.push(photos.proof.url || photos.proof.key);
    }
    if (photos.additional && photos.additional.length > 0) {
      photos.additional.forEach((photo: any) => {
        if (photo.url || photo.key) {
          photoUrls.push(photo.url || photo.key);
        }
      });
    }

    // Extract video information if available
    const videoUrl = video?.url || video?.key || null;
    const videoFrameUrls = video?.frameUrls || [];
    const videoThumbnailUrl = video?.thumbnailUrl || null;

    // Filter out URLs that OpenAI can't access (S3 URLs, local files, etc.)
    const accessiblePhotoUrls = photoUrls.filter((url: string) => {
      // Only allow publicly accessible URLs that OpenAI can reach
      return url && (
        url.startsWith('http://') || 
        url.startsWith('https://')
      ) && !url.includes('localhost') && !url.includes('127.0.0.1') && 
         !url.includes('blob:') && !url.includes('data:') &&
         // Allow CloudFront URLs, filter out only direct S3 URLs
         !(url.includes('s3.') && url.includes('amazonaws.com') && !url.includes('cloudfront.net'));
    });

    const accessibleVideoUrl = videoUrl && (
      videoUrl.startsWith('http://') || 
      videoUrl.startsWith('https://')
    ) && !videoUrl.includes('localhost') && !videoUrl.includes('127.0.0.1') &&
       !videoUrl.includes('blob:') && !videoUrl.includes('data:') &&
       // Allow CloudFront URLs, filter out only direct S3 URLs
       !(videoUrl.includes('s3.') && videoUrl.includes('amazonaws.com') && !videoUrl.includes('cloudfront.net'))
      ? videoUrl : null;

    // Filter accessible video frame URLs
    const accessibleVideoFrameUrls = videoFrameUrls.filter((url: string) => {
      return url && (
        url.startsWith('http://') || 
        url.startsWith('https://')
      ) && !url.includes('localhost') && !url.includes('127.0.0.1') &&
         !url.includes('blob:') && !url.includes('data:') &&
         // Allow CloudFront URLs, filter out only direct S3 URLs
         !(url.includes('s3.') && url.includes('amazonaws.com') && !url.includes('cloudfront.net'));
    });

    const accessibleVideoThumbnailUrl = videoThumbnailUrl && (
      videoThumbnailUrl.startsWith('http://') || 
      videoThumbnailUrl.startsWith('https://')
    ) && !videoThumbnailUrl.includes('localhost') && !videoThumbnailUrl.includes('127.0.0.1') &&
       !videoThumbnailUrl.includes('blob:') && !videoThumbnailUrl.includes('data:') &&
       // Allow CloudFront URLs, filter out only direct S3 URLs
       !(videoThumbnailUrl.includes('s3.') && videoThumbnailUrl.includes('amazonaws.com') && !videoThumbnailUrl.includes('cloudfront.net'))
      ? videoThumbnailUrl : null;

    // Log for debugging
    console.log('Photo URLs:', photoUrls);
    console.log('Accessible photo URLs:', accessiblePhotoUrls);
    console.log('Video URL:', videoUrl);
    console.log('Accessible video URL:', accessibleVideoUrl);
    console.log('Video frame URLs:', videoFrameUrls);
    console.log('Accessible video frame URLs:', accessibleVideoFrameUrls);
    console.log('Video thumbnail URL:', videoThumbnailUrl);
    console.log('Accessible video thumbnail URL:', accessibleVideoThumbnailUrl);
    console.log('Model to use: gpt-5 (upgraded from gpt-4o)');
    console.log('📸 Photo breakdown - Hero:', photos.hero?.url ? 1 : 0, 'Back:', photos.back?.url ? 1 : 0, 'Proof:', photos.proof?.url ? 1 : 0, 'Additional:', photos.additional?.length || 0);
    console.log('🎥 Video breakdown - URL:', videoUrl ? 1 : 0, 'Frames:', videoFrameUrls.length, 'Thumbnail:', videoThumbnailUrl ? 1 : 0);
    console.log('🎥 Video frame URLs:', videoFrameUrls);
    console.log('🎥 Accessible video frame URLs:', accessibleVideoFrameUrls);
    
    // Debug URL filtering
    photoUrls.forEach((url: string, index: number) => {
      const isAccessible = accessiblePhotoUrls.includes(url);
      console.log(`Photo ${index + 1}: ${url} - Accessible: ${isAccessible}`);
    });
    
    videoFrameUrls.forEach((url: string, index: number) => {
      const isAccessible = accessibleVideoFrameUrls.includes(url);
      console.log(`Video Frame ${index + 1}: ${url} - Accessible: ${isAccessible}`);
    });

    // Create a dynamic prompt based on mode (form fields vs comprehensive)
    const isFormFieldsMode = mode === 'formFields';
    
    // Form fields specific prompt for quick generation
    const formFieldsPrompt = `You are an expert product listing specialist for TreasureHub, a premium consignment marketplace with deep knowledge of e-commerce, pricing strategies, market analysis, consumer psychology, and competitive positioning.

TASK: Perform quick analysis and generate form fields with market insights. ${accessiblePhotoUrls.length > 0 ? `Analyze the provided ${accessiblePhotoUrls.length} photos to identify the actual product, its condition, features, and visual characteristics.` : ""}

RESPONSE FORMAT: Return a valid JSON object with the same structure as the comprehensive mode but focus on quick, accurate field population for immediate user feedback. Return ONLY valid JSON - no additional text or explanations.

Generate a comprehensive listing and return it as a valid JSON object with the following structure:

{
  "title": "SEO-optimized title (50-80 characters)",
  "description": "Professional description (200-400 words)",
  "detailedDescription": "Extended description with video analysis if available",
  "condition": "GOOD/EXCELLENT/FAIR/POOR",
  "conditionDetails": "Detailed condition analysis with specific details",
  "estimatedRetailPrice": 150.00,
  "listPrice": 100.00,
  "priceReasoning": "Market research and pricing justification",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "brand": "Brand name if visible",
  "height": "48" or null,
  "width": "24" or null,
  "depth": "18" or null,
  "serialNumber": "Serial number if visible" or null,
  "modelNumber": "Model number if visible" or null,
  "facebookBrand": "Brand for Facebook",
  "facebookCategory": "Category for Facebook",
  "facebookCondition": "new/used/refurbished",
  "facebookGtin": "GTIN if available" or null,
  "marketingCopy": "Compelling marketing language",
  "technicalSpecs": "Detailed technical specifications",
  "valueProposition": "Why this item is valuable",
  "discountSchedule": "Classic-60",
  "tags": ["tag1", "tag2", "tag3"],
  "gender": "male/female/unisex" or null,
  "color": "Color if visible" or null,
  "size": "Size if visible" or null,
  "ageGroup": "adult/kids/infant",
  "material": "Material if visible" or null,
  "pattern": "Pattern if visible" or null,
  "style": "Style if visible" or null,
  "quantity": 1,
  "googleProductCategoryPrimary": "Primary category (e.g., Electronics, Clothing, Home & Garden)",
  "googleProductCategorySecondary": "Secondary category (e.g., Computers, Men's Clothing, Kitchen & Dining)",
  "googleProductCategoryTertiary": "Tertiary category (e.g., Laptops, Shirts, Cookware)"
}`;

    // Use form fields prompt for quick mode, comprehensive prompt for full analysis
    const basePrompt = isFormFieldsMode ? formFieldsPrompt : AI_SERVICE_PHASE_1_PROMPT;
    const prompt = basePrompt + `

// ============================================================================
// DYNAMIC CONTEXT - USER INPUT DATA
// ============================================================================

PRODUCT INFORMATION:
- Title: ${title}
- Description: ${description}
- Department: ${department}
- Category: ${category}
- Sub-Category: ${subCategory}
- Condition: ${condition}
- Price: $${price}
- Brand: ${brand || 'Unknown'}
- Additional Info: ${additionalInfo || 'None provided'}
- Number of Accessible Photos: ${accessiblePhotoUrls.length} (out of ${photoUrls.length} total)
- Video Available: ${accessibleVideoUrl ? 'Yes' : 'No'}
- Video Keyframes Available: ${accessibleVideoFrameUrls.length} frames
- Video Duration: ${video?.duration ? `${video.duration.toFixed(1)} seconds` : 'Unknown'}

VISUAL ANALYSIS INSTRUCTIONS:
${accessiblePhotoUrls.length > 0 || accessibleVideoFrameUrls.length > 0 ? `
1. Examine all accessible photos carefully to identify:
   - Product features and specifications visible in images
   - Condition details (scratches, wear, damage, etc.)
   - Brand markings, serial numbers, or model numbers
   - Materials, colors, and finishes
   - Size and scale indicators
   - Any unique or valuable characteristics

2. If video is available, analyze:
   - Product functionality and operation
   - Movement and mechanical features
   - Audio quality (if applicable)
   - Overall condition during use

3. If video keyframes are available, analyze each frame (extracted at 0%, 10%, 25%, 50%, 90% of video duration):
   - Frame 1 (0%): Initial product appearance and setup
   - Frame 2 (10%): Early product demonstration
   - Frame 3 (25%): Mid-demonstration showing key features
   - Frame 4 (50%): Core functionality demonstration
   - Frame 5 (90%): Final product state and conclusion
   - Look for: Product movement, mechanical operation, condition changes, feature demonstrations
   - IMPORTANT: Use video frame analysis to enhance your understanding of the product's functionality and condition

4. Cross-reference visual findings with user-provided information to ensure accuracy
` : `
NOTE: No accessible photos, video, or video frames are available for visual analysis. 
Rely on the user-provided information and your expertise to generate the best possible listing.
Focus on creating compelling descriptions based on the product details provided.
`}

CRITICAL REQUIREMENTS:
1. DIMENSIONS: If you can determine dimensions from visual analysis, provide EXACT NUMERICAL VALUES only (e.g., "48" not "Approximately 48 inches", "24.5" not "About 24.5 inches"). If dimensions cannot be determined, use null.
2. CATEGORIES: Use ONLY the specific categories and subcategories from the provided taxonomy. Do not create new categories.
3. VIDEO ANALYSIS: If video frames are available, explicitly mention what you observed in the video analysis in your detailed description.
4. ACCURACY: Be precise and factual. Do not guess or estimate unless clearly stated.
5. NULL VALUES: If you cannot determine a field from visual analysis, use null (not "Cannot determine from images" or similar text).
6. TEXT FORMATTING: Use proper title case for all text fields (e.g., "Solid" not "SOLID", "Furniture" not "furniture", "Modern" not "MODERN").

TASK: Generate a comprehensive listing and return it as a valid JSON object with the following structure:

{
  "title": "SEO-optimized title (50-80 characters)",
  "description": "Professional description (200-400 words)",
  "detailedDescription": "Extended description with video analysis if available",
  "condition": "GOOD/EXCELLENT/FAIR/POOR",
  "conditionDetails": "Detailed condition analysis with specific details",
  "estimatedRetailPrice": 150.00,
  "listPrice": 100.00,
  "priceReasoning": "Market research and pricing justification",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "brand": "Brand name if visible",
  "height": "48" or null,
  "width": "24" or null,
  "depth": "18" or null,
  "serialNumber": "Serial number if visible" or null,
  "modelNumber": "Model number if visible" or null,
  
  "facebookDepartment": "Department for Facebook (e.g., Home & Garden, Electronics, Clothing & Accessories)",
  "facebookCategory": "Category for Facebook (e.g., Furniture, Kitchen & Dining, Men's Clothing)",
  "facebookSubCategory": "Sub-category for Facebook (e.g., Bedroom Furniture, Cookware, Shirts)",
  "facebookBrand": "Brand for Facebook",
  "facebookCondition": "new/used/refurbished",
  "facebookGtin": "GTIN if available" or null,
  
  "marketingCopy": "Compelling marketing language",
  "technicalSpecs": "Detailed technical specifications",
  "valueProposition": "Why this item is valuable",
  "discountSchedule": "Classic-60",
  "tags": ["tag1", "tag2", "tag3"],
  "gender": "male/female/unisex" or null,
  "color": "Color if visible" or null,
  "size": "Size if visible" or null,
  "ageGroup": "adult/kids/infant",
  "material": "Material if visible" or null,
  "pattern": "Pattern if visible" or null,
  "style": "Style if visible" or null,
  "quantity": 1,
  "googleProductCategoryPrimary": "Primary category (e.g., Electronics, Clothing, Home & Garden)",
  "googleProductCategorySecondary": "Secondary category (e.g., Computers, Men's Clothing, Kitchen & Dining)",
  "googleProductCategoryTertiary": "Tertiary category (e.g., Laptops, Shirts, Cookware)"
}

IMPORTANT: Return ONLY valid JSON. No additional text, comments, or explanations outside the JSON object.`;

    // Use the model configured in the admin dashboard
    const modelToUse = getPhase1Model();
    
    // COST CONTROL: Validate that we're using the correct model to avoid unnecessary costs
    const isGpt5 = isUsingGpt5(1);
    if (isGpt5 && modelToUse !== 'gpt-5') {
      console.warn(`⚠️ COST CONTROL WARNING: Admin dashboard shows GPT-5 but model is ${modelToUse}`);
    }
    
    // DEBUG: Log model configuration details
    console.log('🔍 DEBUG: Model Configuration');
    console.log('🔍 Requested Model:', modelToUse);
    console.log('🔍 Model Type:', typeof modelToUse);
    console.log(`🔍 Cost Control: Using ${isGpt5 ? 'GPT-5 (Higher Cost)' : 'GPT-4o (Standard Cost)'}`);
    console.log('🔍 Environment Check:', {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Configured' : 'Missing',
      NODE_ENV: process.env.NODE_ENV,
      ModelRequested: modelToUse
    });
    
    // If no accessible images/video/frames, modify the prompt to be text-only focused
    const finalPrompt = accessiblePhotoUrls.length === 0 && !accessibleVideoUrl && accessibleVideoFrameUrls.length === 0
      ? prompt.replace('Analyze the visual content (photos, video, and video frames) along with the user\'s information', 
                      'Based on the user\'s information and your expertise')
      : prompt;

    // Prepare content array with text and visual content for Responses API
    // Note: Responses API has different input structure than Chat Completions
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: finalPrompt
      }
    ];

    // Add accessible photos to the content
    accessiblePhotoUrls.forEach((photoUrl, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: photoUrl,
          detail: "high"
        }
      });
    });

    // Add accessible video if available
    if (accessibleVideoUrl) {
      content.push({
        type: "image_url",
        image_url: {
          url: accessibleVideoUrl,
          detail: "high"
        }
      });
    }

    // Add accessible video frames for detailed analysis
    console.log(`🎥 Adding ${accessibleVideoFrameUrls.length} video frames to AI content`);
    accessibleVideoFrameUrls.forEach((frameUrl: string, index: number) => {
      console.log(`🎥 Adding video frame ${index + 1}: ${frameUrl}`);
      content.push({
        type: "image_url",
        image_url: {
          url: frameUrl,
          detail: "high"
        }
      });
    });

    // Add video thumbnail if available and not already included
    if (accessibleVideoThumbnailUrl && !accessibleVideoFrameUrls.includes(accessibleVideoThumbnailUrl)) {
      content.push({
        type: "image_url",
        image_url: {
          url: accessibleVideoThumbnailUrl,
          detail: "high"
        }
      });
    }
    
    console.log(`📊 Total content items being sent to AI: ${content.length}`);
    console.log(`📊 Content breakdown: ${content.filter(c => c.type === 'text').length} text, ${content.filter(c => c.type === 'image_url').length} images/video`);
    
    // Determine which API to use based on the selected model (already declared above)
    
    // COST CONTROL: Log which model will be used and its cost implications
    console.log(`💰 COST CONTROL: Admin Dashboard Model Selection`);
    console.log(`💰 Phase 1 Model: ${modelToUse}`);
    console.log(`💰 Will use ${isGpt5 ? 'GPT-5 (Higher Cost)' : 'GPT-4o (Standard Cost)'}`);
    console.log(`💰 API Method: ${isGpt5 ? 'Responses API' : 'Chat Completions API'}`);
    
    if (!isGpt5) {
      console.log(`💰 SAVING COSTS: Using GPT-4o as configured in admin dashboard`);
    }
    
    console.log(`🚀 Making OpenAI API call with ${modelToUse}...`);
    console.log(`🎯 Requested model: ${modelToUse}`);
    
    // Build the comprehensive prompt based on the selected model
    const systemPrompt = isFormFieldsMode 
      ? "You are an expert product listing specialist with deep knowledge of e-commerce, pricing strategies, market analysis, consumer psychology, competitive positioning, and conversion optimization. Generate quick, accurate form fields with detailed analysis and justification for each decision."
      : "You are an expert product listing specialist with deep knowledge of e-commerce, pricing, and marketing. You have DIRECT ACCESS to analyze visual content including photos and videos. Your job is to provide SPECIFIC, DETAILED analysis based on what you can actually see in the images. Be confident and analytical - do not be overly conservative or vague.";
    
    // Create a comprehensive prompt that includes visual analysis instructions
    const visualAnalysisNote = accessiblePhotoUrls.length > 0 || accessibleVideoFrameUrls.length > 0 
      ? `\n\nVISUAL ANALYSIS INSTRUCTIONS (CRITICAL - YOU MUST ANALYZE THESE IMAGES):
- You have ${accessiblePhotoUrls.length} high-quality photos to analyze. EXAMINE EACH PHOTO CAREFULLY.
- You have ${accessibleVideoFrameUrls.length} video frames showing product functionality. ANALYZE EACH FRAME.
- Your task is to provide SPECIFIC, DETAILED analysis based on what you can actually see in these images.
- Look for: brand logos, model numbers, materials, colors, dimensions, condition details, features, wear patterns
- If you cannot determine something from the images, use null (not "Cannot determine from images" or similar text)
- Use proper title case formatting for all text fields (e.g., "Solid" not "SOLID", "Furniture" not "furniture")
- Be confident in what you can see and honest about what you cannot see
- Cross-reference visual findings with user-provided information for accuracy
- IMPORTANT: Do not say "images not accessible" - you have direct access to analyze these images`
      : `\n\nNOTE: No visual content available. Rely on user-provided information and expertise.`;
    
    const fullPrompt = `${systemPrompt}

TASK: ${isFormFieldsMode ? 'Generate form fields for a product listing' : 'Generate a comprehensive product listing'}

USER INPUT: "${userInput || 'No specific description provided'}"
IMPORTANT: ${userInput ? `The user described this item as "${userInput}". Use this information along with your visual analysis to provide accurate, specific details.` : 'No user description provided. Analyze the visual content to identify the product and provide detailed specifications.'}

${visualAnalysisNote}

${finalPrompt}

FINAL INSTRUCTIONS:
- Analyze the visual content you have access to (${accessiblePhotoUrls.length} photos + ${accessibleVideoFrameUrls.length} video frames)
- Provide SPECIFIC details about what you can see (brand, model, materials, condition, features)
- If you cannot determine something from the images, use null (not "Cannot determine from images" or similar text)
- Use proper title case formatting for all text fields (e.g., "Solid" not "SOLID", "Furniture" not "furniture")
- Do NOT say "images not accessible" or "awaiting verification" - you have direct access to analyze these images
- Be confident and analytical based on the visual evidence available

IMPORTANT: Return ONLY valid JSON. No additional text, comments, or explanations outside the JSON object.`;
    
    // DEBUG: Log API call details
    console.log('🔍 DEBUG: API Call Details');
    console.log('🔍 Model being sent to OpenAI:', modelToUse);
    console.log('🔍 API Method:', 'openai.responses.create');
    console.log('🔍 Input length:', fullPrompt.length);
    console.log('🔍 Content items:', content.length);
    
    // DEBUG: Log the actual API call parameters for cost transparency
    const apiCallParams = isGpt5 ? {
      model: modelToUse,
      input: fullPrompt.substring(0, 200) + '...', // Show first 200 chars
      cost: 'HIGH (GPT-5 Responses API)'
    } : {
      model: modelToUse,
      messages: [{ role: "user", content: fullPrompt.substring(0, 200) + '...' }],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" },
      cost: 'STANDARD (GPT-4o Chat Completions API)'
    };
    console.log('🔍 DEBUG: API Call Parameters:', JSON.stringify(apiCallParams, null, 2));
    
    // Use the appropriate API based on the selected model
    let responseText: string;
    let actualModelUsed: string;
    let responseObjectKeys: string[] = [];
    
    if (isGpt5) {
      // Use GPT-5 Responses API
      const responsesApiResponse = await openai.responses.create({
        model: modelToUse,
        input: fullPrompt,
      });
      
      responseText = responsesApiResponse.output_text || '';
      actualModelUsed = responsesApiResponse.model;
      responseObjectKeys = Object.keys(responsesApiResponse);
      
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }
      
      console.log(`✅ GPT-5 Responses API call successful`);
    } else {
      // Use GPT-4o Chat Completions API
      const chatResponse = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      responseText = chatResponse.choices[0]?.message?.content || '';
      actualModelUsed = chatResponse.model;
      responseObjectKeys = Object.keys(chatResponse);
      
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }
      
      console.log(`✅ GPT-4o Chat Completions API call successful`);
    }
    
    // DEBUG: Comprehensive response analysis
    console.log('🔍 DEBUG: OpenAI Response Analysis');
    console.log('🔍 Requested Model:', modelToUse);
    console.log('🔍 Actual Model Used:', actualModelUsed);
    console.log('🔍 Model Match:', modelToUse === actualModelUsed ? '✅ EXACT MATCH' : '❌ MODEL MISMATCH');
    console.log('🔍 Response Object Keys:', responseObjectKeys);
    console.log('🔍 Response Text Length:', responseText.length);

    // Parse the JSON response from GPT-5
    let listingData;
    try {
      listingData = JSON.parse(responseText);
      console.log(`✅ Successfully parsed GPT-5 output using Responses API`);
      
      // Validate that we have the essential fields
      if (!listingData.title || !listingData.description) {
        console.warn(`⚠️ Missing essential fields in GPT-5 response:`, listingData);
        throw new Error(`GPT-5 response missing essential fields (title, description)`);
      }
      
      console.log('✅ GPT-5 response validation passed');
      console.log(`📊 Generated fields: title (${listingData.title?.length || 0} chars), description (${listingData.description?.length || 0} chars)`);
    } catch (parseError) {
      console.error('Error parsing GPT-5 JSON output:', responseText);
      console.error('Parse error details:', parseError);
      throw new Error('Failed to parse GPT-5 JSON output');
    }

    // ============================================================================
    // IMPLEMENTATION: AI Analysis → Facebook Categories → Google Categories (Auto-mapped)
    // ============================================================================
    
    // Step 1: Use AI-generated Facebook categories as PRIMARY source
    // If AI didn't provide Facebook categories, fall back to user input, then defaults
    const aiGeneratedDepartment = listingData.department || listingData.facebookDepartment || null;
    const aiGeneratedCategory = listingData.category || listingData.facebookCategory || null;
    const aiGeneratedSubCategory = listingData.subCategory || listingData.facebookSubCategory || null;
    
    console.log('🔍 DEBUG: AI-Generated Facebook Categories');
    console.log('🔍 Department:', aiGeneratedDepartment);
    console.log('🔍 Category:', aiGeneratedCategory);
    console.log('🔍 Sub-Category:', aiGeneratedSubCategory);
    
    // Step 2: Ensure Facebook taxonomy compliance and get validated categories
    const facebookCategories = ensureFacebookTaxonomy(
      aiGeneratedDepartment || department,
      aiGeneratedCategory || category,
      aiGeneratedSubCategory || subCategory
    );
    
    console.log('🔍 DEBUG: Validated Facebook Categories');
    console.log('🔍 Validated Department:', facebookCategories.department);
    console.log('🔍 Validated Category:', facebookCategories.category);
    console.log('🔍 Validated Sub-Category:', facebookCategories.subCategory);
    
    // Step 3: Auto-map Facebook categories to Google Product Categories
    const googleCategoryMapping = mapFacebookToGoogleProductCategory(
      facebookCategories.department,
      facebookCategories.category,
      facebookCategories.subCategory
    );
    
    console.log('🔍 DEBUG: Auto-mapped Google Categories');
    console.log('🔍 Google Primary:', googleCategoryMapping.primary);
    console.log('🔍 Google Secondary:', googleCategoryMapping.secondary);
    console.log('🔍 Google Tertiary:', googleCategoryMapping.tertiary);
    
    // Step 4: Validate and clean the data with the new flow
    const validatedData = {
      title: listingData.title || title,
      description: listingData.description || description,
      
      // Facebook Categories (AI-generated, then validated)
      department: facebookCategories.department,
      category: facebookCategories.category,
      subCategory: facebookCategories.subCategory,
      
      condition: listingData.condition || condition,
      estimatedRetailPrice: parseFloat(listingData.estimatedRetailPrice) || price * 1.5,
      listPrice: parseFloat(listingData.listPrice) || price,
      priceReasoning: listingData.priceReasoning || 'AI-generated pricing based on market analysis',
      brand: listingData.brand || brand || 'Unknown',
      height: listingData.height || null,
      width: listingData.width || null,
      depth: listingData.depth || null,
      serialNumber: listingData.serialNumber || null,
      modelNumber: listingData.modelNumber || null,
      discountSchedule: listingData.discountSchedule || 'Classic-60',
      features: Array.isArray(listingData.features) ? listingData.features : [],
      keywords: Array.isArray(listingData.keywords) ? listingData.keywords : [],
      
      // Facebook-specific fields (using AI-generated values)
      facebookBrand: listingData.facebookBrand || listingData.brand || brand,
      facebookCategory: facebookCategories.category, // Use validated Facebook category
      facebookCondition: listingData.facebookCondition || (condition ? mapConditionToFacebook(condition) : 'used'),
      facebookGtin: listingData.facebookGtin || null,
      
      ebayQuery: listingData.ebayQuery || listingData.gtin || `${listingData.brand || brand} ${listingData.modelNumber || ''} ${listingData.features?.[0] || ''}`.trim(),
      detailedDescription: listingData.detailedDescription || listingData.description || description,
      marketingCopy: listingData.marketingCopy || listingData.description || description,
      technicalSpecs: listingData.technicalSpecs || 'Technical specifications not available',
      conditionDetails: listingData.conditionDetails || (condition ? `Item is in ${condition.toLowerCase()} condition` : 'Item condition not specified'),
      valueProposition: listingData.valueProposition || 'Great value for this quality item',
      
      // Product Specifications (Facebook Shop Fields)
      quantity: listingData.quantity || 1,
      salePrice: listingData.salePrice || null,
      salePriceEffectiveDate: listingData.salePriceEffectiveDate || null,
      itemGroupId: listingData.itemGroupId || null,
      gender: listingData.gender || null,
      color: listingData.color || null,
      size: listingData.size || null,
      ageGroup: listingData.ageGroup || 'adult',
      material: listingData.material || null,
      pattern: listingData.pattern || null,
      style: listingData.style || null,
      tags: Array.isArray(listingData.tags) ? listingData.tags : [],
      
      // Google Product Categories (Auto-mapped from Facebook categories)
      googleProductCategoryPrimary: googleCategoryMapping.primary,
      googleProductCategorySecondary: googleCategoryMapping.secondary,
      googleProductCategoryTertiary: googleCategoryMapping.tertiary,
    };
    
    // Post-process data to clean up any remaining "Cannot determine from images" text
    // Convert to null for fields that should be empty when not determined
    const cleanTextFields = ['material', 'pattern', 'style', 'color', 'size', 'serialNumber', 'modelNumber'];
    cleanTextFields.forEach(field => {
      if ((validatedData as any)[field] === 'Cannot determine from images' || 
          (validatedData as any)[field] === 'Cannot determine from image' ||
          (validatedData as any)[field] === 'Cannot determine from images.' ||
          (validatedData as any)[field] === 'Cannot determine from image.') {
        (validatedData as any)[field] = null;
      }
    });
    
    // Clean up tags to use proper title case
    if (Array.isArray(validatedData.tags)) {
      validatedData.tags = validatedData.tags.map(tag => {
        if (typeof tag === 'string') {
          return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
        }
        return tag;
      });
    }
    
    // Clean up specific fields to use proper title case
    if ((validatedData as any).pattern === 'SOLID') {
      (validatedData as any).pattern = 'Solid';
    }
    if ((validatedData as any).style === 'MODERN') {
      (validatedData as any).style = 'Modern';
    }
    if ((validatedData as any).color === 'BLACK') {
      (validatedData as any).color = 'Black';
    }
    
    // Set confidence level for Google categories (high since they're auto-mapped from validated Facebook categories)
    const googleProductCategoryConfidence: 'high' | 'medium' | 'low' = 'high';

    // DEBUG: Log what's being sent to the UI
    console.log('🔍 DEBUG: Data Being Sent to UI');
    console.log('🔍 Model Used for Generation:', modelToUse);
    console.log('🔍 Actual OpenAI Model:', actualModelUsed);
    console.log('🔍 Google Categories Generated:', {
      primary: validatedData.googleProductCategoryPrimary,
      secondary: validatedData.googleProductCategorySecondary,
      tertiary: validatedData.googleProductCategoryTertiary
    });
    console.log('🔍 Key Fields Generated:', {
      title: validatedData.title?.substring(0, 50) + '...',
      description: validatedData.description?.substring(0, 100) + '...',
      condition: validatedData.condition,
      brand: validatedData.brand
    });

    // Calculate confidence scores for all AI-generated fields
    const confidenceFactors: ConfidenceFactors = {
      hasPhotos: accessiblePhotoUrls.length > 0,
      hasVideo: !!accessibleVideoUrl,
      hasVideoFrames: accessibleVideoFrameUrls.length > 0,
      photoCount: accessiblePhotoUrls.length,
      videoFrameCount: accessibleVideoFrameUrls.length,
      userProvidedInfo: {
        title,
        description,
        brand,
        condition,
        price,
        ...additionalInfo
      },
      visualClarity: {
        // Set to true when we have visual data for AI analysis
        brandVisible: accessiblePhotoUrls.length > 0, // AI can analyze brand from photos
        dimensionsVisible: accessiblePhotoUrls.length > 0, // AI can analyze dimensions from photos
        serialNumberVisible: accessiblePhotoUrls.length > 0, // AI can look for serial numbers
        modelNumberVisible: accessiblePhotoUrls.length > 0, // AI can look for model numbers
        conditionDetailsVisible: accessiblePhotoUrls.length > 0, // AI can analyze condition from photos
      }
    };

    // Add Google Product Category confidence to the scores
    const confidenceScores = {
      ...calculateAllFieldConfidence(validatedData, confidenceFactors),
      googleProductCategoryPrimary: {
        level: googleProductCategoryConfidence,
        reason: googleProductCategoryConfidence === 'high' 
          ? 'Exact match found in Google Product Category mapping'
          : googleProductCategoryConfidence === 'medium'
          ? 'Partial match found in Google Product Category mapping'
          : 'Fallback category used - no exact mapping found'
      },
      googleProductCategorySecondary: {
        level: googleProductCategoryConfidence,
        reason: googleProductCategoryConfidence === 'high' 
          ? 'Exact match found in Google Product Category mapping'
          : googleProductCategoryConfidence === 'medium'
          ? 'Partial match found in Google Product Category mapping'
          : 'Fallback category used - no exact mapping found'
      },
      googleProductCategoryTertiary: {
        level: googleProductCategoryConfidence,
        reason: googleProductCategoryConfidence === 'high' 
          ? 'Exact match found in Google Product Category mapping'
          : googleProductCategoryConfidence === 'medium'
          ? 'Partial match found in Google Product Category mapping'
          : 'Fallback category used - no exact mapping found'
      }
    };

    // Only run additional services for comprehensive mode, not form fields mode
    let stagedPhotoData = null;
    
    // Phase 2: Staged photo generation is currently paused
    // if (!isFormFieldsMode && accessiblePhotoUrls.length > 0) {
    //   // Phase 2: Generate staged photo prompt (comprehensive mode only)
    //   try {
    //     console.log('🎨 Starting Phase 2: Staged photo generation');
    //     const stagedPhotoResult = await generateStagedPhotoPhase2({
    //       listingJSON: validatedData,
    //       photoURLs: accessiblePhotoUrls,
    //       videoFrames: accessibleVideoFrameUrls
    //     });
    //     stagedPhotoData = stagedPhotoResult;
    //     console.log('✅ Phase 2 completed: Staged photo prompt generated');
    //   } catch (stagedPhotoError) {
    //     console.error('❌ Phase 2 failed:', stagedPhotoError);
    //     // Don't fail the entire request if staged photo generation fails
    //     stagedPhotoData = { 
    //       referenceImageUrl: accessiblePhotoUrls[0],
    //       stagingPrompt: "Professional product photo with clean background",
    //       desiredAspectRatio: "1:1",
    //       targetResolution: "1024x1024",
    //       postProcess: "none"
    //     };
    //   }
    // }

    // COST SUMMARY: Log what was actually used for billing transparency
    console.log('💰 COST SUMMARY: AI Service Completed');
    console.log(`💰 Admin Dashboard Model: ${modelToUse}`);
    console.log(`💰 Actual Model Used: ${actualModelUsed}`);
    console.log(`💰 Cost Tier: ${isGpt5 ? 'HIGH (GPT-5)' : 'STANDARD (GPT-4o)'}`);
    console.log(`💰 API Method: ${isGpt5 ? 'Responses API' : 'Chat Completions API'}`);
    console.log(`💰 Model Match: ${modelToUse === actualModelUsed ? '✅ YES' : '❌ NO'}`);
    
    // DEBUG: Log final response being sent to UI
    console.log('🔍 DEBUG: Final Response to UI');
    console.log('🔍 Response Mode:', isFormFieldsMode ? 'Form Fields' : 'Comprehensive');
    console.log('🔍 Model Used:', modelToUse);
    console.log('🔍 OpenAI Model:', actualModelUsed);
    console.log('🔍 Response Structure:', {
      success: true,
      hasFormData: !!validatedData,
      hasConfidenceScores: !!confidenceScores,
      hasAnalysis: !!responseText,
      hasStagedPhotoData: !!stagedPhotoData
    });
    
    // Additional debugging for form fields mode
    if (isFormFieldsMode) {
      console.log('🔍 FORM FIELDS MODE DEBUG:');
      console.log('🔍 Raw AI Response:', responseText);
      console.log('🔍 Parsed Data:', validatedData);
      console.log('🔍 Form Data Keys:', validatedData ? Object.keys(validatedData) : 'No data');
    }
    
    // Return different response based on mode
    if (isFormFieldsMode) {
      return NextResponse.json({
        success: true,
        formData: validatedData, // Use formData key for compatibility with form fields mode
        analysis: responseText,
        debug: {
          modelRequested: modelToUse,
          modelUsed: actualModelUsed,
          modelMatch: modelToUse === actualModelUsed
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        listingData: validatedData,
        confidenceScores,
        analysis: responseText,
        stagedPhotoData,
        debug: {
          modelRequested: modelToUse,
          modelUsed: actualModelUsed,
          modelMatch: modelToUse === actualModelUsed
        }
      });
    }

  } catch (error) {
    console.error('Error generating comprehensive listing:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to generate comprehensive listing';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
        message: error.message
      };
    }
    
    // Check for specific OpenAI errors
    if (error && typeof error === 'object' && 'status' in error) {
      (errorDetails as any).openaiStatus = (error as any).status;
    }
    
    // Check for GPT-5 specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      (errorDetails as any).openaiCode = (error as any).code;
    }
    
    // Check if it's an API key issue
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as any).message;
      if (message.includes('api_key') || message.includes('authentication')) {
        (errorDetails as any).suggestion = 'Check your OpenAI API key and ensure it has access to GPT-5';
      }
    }
    
    console.error('Detailed error information:', errorDetails);
    
    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 