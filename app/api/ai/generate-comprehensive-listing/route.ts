import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { calculateAllFieldConfidence, ConfidenceFactors } from '@/lib/ai-confidence-scorer';
import { AI_SERVICE_PHASE_1_PROMPT, mapConditionToFacebook, ensureFacebookTaxonomy, detectPhotoFlaws, generateStagedPhotoPhase2 } from '@/lib/ai-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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

RESPONSE FORMAT: Return the same JSON structure as the comprehensive mode but focus on quick, accurate field population for immediate user feedback.`;

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

TASK: Generate a comprehensive listing with the following sections:

1. ENHANCED TITLE (50-80 characters): Create a compelling, SEO-optimized title
2. DETAILED DESCRIPTION (200-400 words): Professional, detailed description highlighting features, benefits, and value. If video frames were analyzed, mention specific observations from the video.
3. CONDITION ASSESSMENT: Detailed condition analysis with specific details
4. PRICING ANALYSIS: Market research and pricing justification
5. FEATURES LIST: Key features and specifications
6. KEYWORDS: SEO-optimized keywords for search
7. FACEBOOK SHOP OPTIMIZATION: Facebook-specific brand, category, and condition
8. MARKETING COPY: Compelling marketing language
9. TECHNICAL SPECS: Detailed technical specifications
10. VALUE PROPOSITION: Why this item is valuable

Focus on accuracy, detail, and maximizing the item's perceived value while maintaining honesty about condition and features.`;

    // Use GPT-5 for all analysis (upgraded from gpt-4o/gpt-4o-mini)
    const modelToUse = "gpt-5";
    
    // If no accessible images/video/frames, modify the prompt to be text-only focused
    const finalPrompt = accessiblePhotoUrls.length === 0 && !accessibleVideoUrl && accessibleVideoFrameUrls.length === 0
      ? prompt.replace('Analyze the visual content (photos, video, and video frames) along with the user\'s information', 
                      'Based on the user\'s information and your expertise')
      : prompt;

    // Prepare content array with text and visual content
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
    
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: isFormFieldsMode 
            ? "You are an expert product listing specialist with deep knowledge of e-commerce, pricing strategies, market analysis, consumer psychology, competitive positioning, and conversion optimization. Generate quick, accurate form fields with detailed analysis and justification for each decision."
            : "You are an expert product listing specialist with deep knowledge of e-commerce, pricing, and marketing. You can analyze visual content including photos and videos to generate accurate, detailed, and compelling product listings."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: isFormFieldsMode ? 0.5 : 0.7, // Lower temperature for form fields for more consistent results
      max_tokens: isFormFieldsMode ? 1500 : 2000, // Fewer tokens needed for form fields
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let listingData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Remove comments from JSON before parsing
        let jsonString = jsonMatch[0];
        
        // Remove single-line comments (// ...)
        jsonString = jsonString.replace(/\/\/.*$/gm, '');
        
        // Remove multi-line comments (/* ... */)
        jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Clean up any trailing commas before closing braces/brackets
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        
        listingData = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', responseText);
      console.error('Parse error details:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Ensure Facebook Marketplace taxonomy compliance
    const facebookCategories = ensureFacebookTaxonomy(
      listingData.department || department,
      listingData.category || category,
      listingData.subCategory || subCategory
    );

    // Validate and clean the data
    const validatedData = {
      title: listingData.title || title,
      description: listingData.description || description,
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
      facebookBrand: listingData.facebookBrand || listingData.brand || brand,
      facebookCategory: listingData.facebookCategory || facebookCategories.category, // Use Facebook category
      facebookCondition: listingData.facebookCondition || mapConditionToFacebook(condition),
      facebookGtin: listingData.facebookGtin || null,
      ebayQuery: listingData.ebayQuery || listingData.gtin || `${listingData.brand || brand} ${listingData.modelNumber || ''} ${listingData.features?.[0] || ''}`.trim(),
      detailedDescription: listingData.detailedDescription || listingData.description || description,
      marketingCopy: listingData.marketingCopy || listingData.description || description,
      technicalSpecs: listingData.technicalSpecs || 'Technical specifications not available',
      conditionDetails: listingData.conditionDetails || `Item is in ${condition.toLowerCase()} condition`,
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
              // productType field removed - not in database schema
      tags: Array.isArray(listingData.tags) ? listingData.tags : [],
    };

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
        brandVisible: false, // This would need to be determined by AI analysis
        dimensionsVisible: false, // This would need to be determined by AI analysis
        serialNumberVisible: false, // This would need to be determined by AI analysis
        modelNumberVisible: false, // This would need to be determined by AI analysis
        conditionDetailsVisible: false, // This would need to be determined by AI analysis
      }
    };

    const confidenceScores = calculateAllFieldConfidence(validatedData, confidenceFactors);

    // Only run additional services for comprehensive mode, not form fields mode
    let flawData = null;
    let stagedPhotoData = null;
    
    if (!isFormFieldsMode && accessiblePhotoUrls.length > 0) {
      // Phase 2: Generate staged photo prompt (comprehensive mode only)
      try {
        console.log('🎨 Starting Phase 2: Staged photo generation');
        const stagedPhotoResult = await generateStagedPhotoPhase2({
          listingJSON: validatedData,
          photoURLs: accessiblePhotoUrls,
          videoFrames: accessibleVideoFrameUrls
        });
        stagedPhotoData = stagedPhotoResult;
        console.log('✅ Phase 2 completed: Staged photo prompt generated');
      } catch (stagedPhotoError) {
        console.error('❌ Phase 2 failed:', stagedPhotoError);
        // Don't fail the entire request if staged photo generation fails
        stagedPhotoData = { 
          referenceImageUrl: accessiblePhotoUrls[0],
          stagingPrompt: "Professional product photo with clean background",
          desiredAspectRatio: "1:1",
          targetResolution: "1024x1024",
          postProcess: "none"
        };
      }
    }

    // Return different response based on mode
    if (isFormFieldsMode) {
      return NextResponse.json({
        success: true,
        formData: validatedData, // Use formData key for compatibility with form fields mode
        analysis: responseText,
      });
    } else {
      return NextResponse.json({
        success: true,
        listingData: validatedData,
        confidenceScores,
        analysis: responseText,
        flawData,
        stagedPhotoData,
      });
    }

  } catch (error) {
    console.error('Error generating comprehensive listing:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate comprehensive listing'
    }, { status: 500 });
  }
} 