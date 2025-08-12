import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mapConditionToFacebook } from '@/lib/ai-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log("🚀 Form Fields API: Request received");
  
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
      additionalInfo,
      photos, // Add photos for visual analysis
    } = body;

    console.log("📝 Form Fields API: Input data:", {
      title,
      description,
      department,
      category,
      subCategory,
      condition,
      price,
      brand,
      additionalInfo,
      photos: photos ? `${photos.length} photos provided` : "No photos",
    });

    // Debug photo URLs
    if (photos && Array.isArray(photos) && photos.length > 0) {
      console.log("📸 Photo URLs received:", photos);
    }

    // Filter URLs to only include accessible ones (CloudFront, not S3)
    const accessiblePhotos = photos && Array.isArray(photos) ? photos.filter(url => {
      return url && typeof url === 'string' && (
        url.startsWith('http://') || 
        url.startsWith('https://')
      ) && !url.includes('localhost') && !url.includes('127.0.0.1') && 
         !url.includes('blob:') && !url.includes('data:') &&
         // Allow CloudFront URLs but filter out direct S3 URLs
         !(url.includes('s3.') && url.includes('amazonaws.com') && !url.includes('cloudfront.net'));
    }) : [];

    console.log("🔍 Accessible photos:", accessiblePhotos.length, "out of", photos?.length || 0);

    // Create a comprehensive prompt for deep reasoning and analysis
    const prompt = `You are an expert product listing specialist for TreasureHub, a premium consignment marketplace with deep knowledge of e-commerce, pricing strategies, market analysis, consumer psychology, and competitive positioning.

TASK: Perform deep analysis and generate comprehensive form fields with detailed reasoning and market insights. ${accessiblePhotos.length > 0 ? `Analyze the provided ${accessiblePhotos.length} photos to identify the actual product, its condition, features, and visual characteristics.` : ""}

USER INPUT:
- Title: ${title}
- Description: ${description}
- Department: ${department}
- Category: ${category}
- Sub-Category: ${subCategory}
- Condition: ${condition}
- Price: $${price}
- Brand: ${brand || 'Unknown'}
- Additional Info: ${additionalInfo || 'None provided'}
${accessiblePhotos.length > 0 ? `- Photos: ${accessiblePhotos.length} photos provided for visual analysis` : ""}

DEEP ANALYSIS INSTRUCTIONS:
1. ${accessiblePhotos.length > 0 ? "Carefully analyze the provided photos to identify the actual product type, style, color, materials, condition, and any visible damage or wear. Use this visual information to generate accurate descriptions and assessments." : ""}
3. Analyze market positioning and competitive landscape for this product category
4. Consider consumer psychology and buying motivations specific to this item type
5. Evaluate pricing strategy with detailed market research and competitive analysis
6. Assess brand positioning and value proposition in the current market
7. Generate comprehensive feature analysis with market relevance
8. Provide detailed reasoning for each recommendation and decision
9. Consider seasonal trends, market demand, and buyer behavior patterns
10. Analyze the item's unique selling propositions and competitive advantages

${accessiblePhotos.length > 0 ? `VISUAL ANALYSIS REQUIREMENTS:
- Identify the exact product type and style from the photos
- Assess the actual condition based on visible wear, damage, or imperfections
- Note specific colors, materials, and design elements
- Identify any unique features or characteristics visible in the photos
- Provide accurate dimensions if visible or estimable from the photos
- Mention any damage, stains, or condition issues that would affect value` : ""}

RESPONSE FORMAT: Return a JSON object with enhanced reasoning and analysis:
{
  "title": "Enhanced, SEO-optimized title with market positioning reasoning",
  "description": "Professional, detailed description with consumer psychology insights",
  "department": "Department with market analysis reasoning",
  "category": "Category with competitive landscape analysis", 
  "subCategory": "Sub-category with market fit and demand reasoning",
  "condition": "NEW|EXCELLENT|GOOD|FAIR|POOR with detailed condition assessment",
  "estimatedRetailPrice": 0,
  "listPrice": 0,
  "priceReasoning": "Comprehensive pricing analysis with market research, competitive analysis, and demand factors",
  "brand": "Brand analysis with market positioning and recognition factors",
  "height": "Height with practical reasoning and buyer considerations",
  "width": "Width with practical reasoning and buyer considerations", 
  "depth": "Depth with practical reasoning and buyer considerations",
  "serialNumber": "Serial number analysis with authenticity and value implications",
  "modelNumber": "Model number analysis with market research and demand factors",
  "discountSchedule": "Turbo-30|Classic-60|Standard-90 with market timing and demand reasoning",
  "features": ["Feature with market relevance and buyer appeal reasoning"],
  "keywords": ["Keyword with SEO strategy and search behavior analysis"],
  "facebookBrand": "Facebook-optimized brand with social commerce strategy",
  "facebookCategory": "Facebook category with platform-specific optimization",
  "facebookCondition": "new|used|refurbished with platform-specific reasoning",
  "facebookGtin": "GTIN analysis with marketplace optimization benefits",
  "detailedDescription": "Comprehensive description with market positioning and competitive analysis",
  "marketingCopy": "Compelling marketing language with psychological appeal and conversion optimization",
  "technicalSpecs": "Technical specifications with market relevance and buyer education",
  "conditionDetails": "Detailed condition assessment with transparency and trust-building",
  "valueProposition": "Value proposition with competitive advantage analysis and market positioning",
  "marketAnalysis": "Detailed market analysis including demand trends, competition, and positioning opportunities",
  "competitiveAdvantage": "Analysis of unique selling propositions and competitive differentiators",
  "consumerInsights": "Consumer psychology analysis and buying motivation factors"
}

Provide deep reasoning for each field to maximize value, appeal, and competitive positioning while maintaining honesty and transparency.`;

    console.log("🤖 Form Fields API: Sending request to OpenAI o3 (GPT-4o) for deep reasoning");

    // Prepare content array for multimodal analysis
    const content: any[] = [
      { type: "text", text: prompt }
    ];

    // Add photos for visual analysis
    if (accessiblePhotos.length > 0) {
      console.log(`📸 Adding ${accessiblePhotos.length} accessible photos for visual analysis`);
      accessiblePhotos.forEach((photoUrl, index) => {
        if (photoUrl && typeof photoUrl === 'string') {
          content.push({
            type: "image_url",
            image_url: {
              url: photoUrl
            }
          });
        }
      });
    }



    const completion = await openai.chat.completions.create({
      model: "gpt-5", // Upgraded from gpt-4o for better performance
      messages: [
        {
          role: "system",
          content: "You are an expert product listing specialist with deep knowledge of e-commerce, pricing strategies, market analysis, consumer psychology, competitive positioning, and conversion optimization. Generate comprehensive, well-reasoned form fields with detailed analysis and justification for each decision."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.7, // Higher temperature for more creative reasoning and analysis
      max_completion_tokens: 2000, // Consistent token limit for better quality
    });

    console.log("✅ Form Fields API: OpenAI response received");

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      console.error("❌ Form Fields API: No response from OpenAI");
      throw new Error('No response from OpenAI');
    }

    console.log("📄 Form Fields API: Raw OpenAI response:", responseText);

    // Parse the JSON response
    let formData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formData = JSON.parse(jsonMatch[0]);
        console.log("✅ Form Fields API: JSON parsed successfully");
      } else {
        console.error("❌ Form Fields API: No JSON found in response");
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Form Fields API: Error parsing OpenAI response:', responseText);
      throw new Error('Failed to parse AI response');
    }

    // Validate and clean the data with enhanced fields
    const validatedData = {
      title: formData.title || title,
      description: formData.description || description,
      department: formData.department || department,
      category: formData.category || category,
      subCategory: formData.subCategory || subCategory,
      condition: formData.condition || condition,
      estimatedRetailPrice: parseFloat(formData.estimatedRetailPrice) || price * 1.5,
      listPrice: parseFloat(formData.listPrice) || price,
      priceReasoning: formData.priceReasoning || 'Comprehensive pricing analysis with market research and competitive factors',
      brand: formData.brand || brand || 'Unknown',
      height: formData.height || null,
      width: formData.width || null,
      depth: formData.depth || null,
      serialNumber: formData.serialNumber || null,
      modelNumber: formData.modelNumber || null,
      discountSchedule: formData.discountSchedule || 'Classic-60',
      features: Array.isArray(formData.features) ? formData.features : [],
      keywords: Array.isArray(formData.keywords) ? formData.keywords : [],
      facebookBrand: formData.facebookBrand || formData.brand || brand,
      facebookCategory: formData.facebookCategory || category,
      facebookCondition: formData.facebookCondition || mapConditionToFacebook(condition),
      facebookGtin: formData.facebookGtin || null,
      detailedDescription: formData.detailedDescription || formData.description || description,
      marketingCopy: formData.marketingCopy || formData.description || description,
      technicalSpecs: formData.technicalSpecs || 'Technical specifications not available',
      conditionDetails: formData.conditionDetails || `Item is in ${condition.toLowerCase()} condition`,
      valueProposition: formData.valueProposition || 'Great value for this quality item',
      // Enhanced fields from deep reasoning analysis
      marketAnalysis: formData.marketAnalysis || 'Market analysis not available',
      competitiveAdvantage: formData.competitiveAdvantage || 'Competitive advantage analysis not available',
      consumerInsights: formData.consumerInsights || 'Consumer insights not available',
    };

    console.log("📊 Form Fields API: Validated data:", validatedData);

    return NextResponse.json({
      success: true,
      formData: validatedData,
      analysis: responseText,
    });

  } catch (error) {
    console.error('❌ Form Fields API: Error generating form fields:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate form fields'
    }, { status: 500 });
  }
} 