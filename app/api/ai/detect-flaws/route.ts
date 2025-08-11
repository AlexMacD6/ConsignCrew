import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoUrls } = body;

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

    const flawDetectionPrompt = `You are an expert product condition analyst specializing in identifying flaws, damage, and imperfections in product photos.

Your task is to analyze each photo and identify any visible flaws, damage, or imperfections that would affect the product's condition or value.

For each photo, identify:
1. Type of flaw (crack, scratch, stain, dent, tear, wear, discoloration, missing parts, etc.)
2. Severity (minor, moderate, major)
3. Location on the product (if applicable)
4. Description of the flaw

Common flaw types to look for:
- Cracks (in wood, plastic, glass, ceramic)
- Scratches (surface damage)
- Stains (discoloration, water damage, ink, etc.)
- Dents (impact damage)
- Tears (in fabric, leather, paper)
- Wear (fading, fraying, thinning)
- Missing parts (broken pieces, lost components)
- Discoloration (fading, yellowing, oxidation)
- Structural damage (bent, warped, broken)
- Surface damage (chips, gouges, burns)

Return your analysis as a JSON object with the following structure:
{
  "flaws": [
    {
      "photoIndex": 0,
      "photoUrl": "url_of_photo",
      "flaws": [
        {
          "type": "scratch",
          "severity": "minor",
          "location": "front surface",
          "description": "Small scratch on the front surface, barely visible"
        }
      ]
    }
  ],
  "summary": "Overall condition assessment based on all photos"
}

Be very conservative and accurate. Only report flaws that are OBVIOUSLY visible and would clearly affect the product's value or functionality. When in doubt, do not flag it as a flaw. Only report flaws with 99% confidence or higher.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: flawDetectionPrompt
        },
        {
          role: "user",
          content: `Please analyze these product photos for flaws and imperfections: ${accessiblePhotoUrls.join(', ')}`
        }
      ],
      max_tokens: 2000,
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
      console.error('Error parsing flaw detection response:', parseError);
      console.error('Raw response:', analysis);
      throw new Error('Failed to parse flaw detection response');
    }

    return NextResponse.json({
      success: true,
      flawData,
      analysis
    });

  } catch (error) {
    console.error('Error in flaw detection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect flaws', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
} 