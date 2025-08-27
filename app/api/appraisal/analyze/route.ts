import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const appraisalId = formData.get("appraisalId") as string;

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // For development, return mock data
      console.log("OpenAI API key not configured, returning mock data");
      
      const mockAnalysis = {
        title: "Vintage Leather Briefcase",
        description: "A well-worn vintage leather briefcase with brass hardware and classic styling. Shows signs of use but maintains structural integrity.",
        brand: "Unknown",
        condition: "Used - Good",
        estimatedValue: {
          low: 75,
          high: 150
        },
        category: "Bags & Accessories",
        subCategory: "Business Bags",
        department: "Home",
        confidence: {
          title: "Medium",
          description: "High",
          condition: "High",
          value: "Medium"
        },
        marketData: {
          source: "Mock analysis for development",
          comparables: [
            {
              title: "Similar Vintage Briefcase",
              price: 95,
              condition: "Used - Good",
              source: "eBay"
            }
          ]
        }
      };

      return NextResponse.json({
        success: true,
        appraisalId,
        imageUrl: `data:${photo.type};base64,${Buffer.from(await photo.arrayBuffer()).toString("base64")}`,
        analysis: mockAnalysis,
        timestamp: new Date().toISOString(),
      });
    }

    if (!photo || !appraisalId) {
      return NextResponse.json(
        { error: "Photo and appraisal ID are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert image to base64 for OpenAI
    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = photo.type;
    
    // For now, we'll use a placeholder URL since we're not uploading to S3
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // Prepare the AI prompt (same schema as listing AI)
    const aiPrompt = `You are an expert appraiser analyzing this image. Provide a detailed analysis in the following JSON format:

    {
      "title": "Specific product name",
      "description": "Detailed description (2-3 sentences)",
      "brand": "Brand name if identifiable",
      "condition": "New|Used - Like New|Used - Good|Used - Fair",
      "estimatedValue": {
        "low": 100,
        "high": 200
      },
      "category": "Specific category",
      "subCategory": "Specific subcategory", 
      "department": "Furniture|Electronics|Clothing|Sports|Home|Books|Toys|Automotive",
      "confidence": {
        "title": "High|Medium|Low",
        "description": "High|Medium|Low",
        "condition": "High|Medium|Low",
        "value": "High|Medium|Low"
      },
      "marketData": {
        "source": "Recent sales data analysis",
        "comparables": [
          {
            "title": "Similar item title",
            "price": 150,
            "condition": "Used - Good",
            "source": "eBay|Mercari|Facebook"
          }
        ]
      }
    }

    Focus on:
    - Accurate identification and title
    - Realistic market value based on condition
    - Detailed condition assessment
    - Confidence levels for each field
    - Comparable sales data when possible

    Provide only the JSON response, no additional text.`;

    // Call OpenAI GPT-4o Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: aiPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const aiContent = response.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let analysisResult;
    try {
      // Clean the response in case it has markdown formatting
      const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("AI response parsing error:", parseError);
      console.error("AI response content:", aiContent);
      throw new Error("Invalid AI response format");
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      appraisalId,
      imageUrl,
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Appraisal analysis error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Analysis failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
