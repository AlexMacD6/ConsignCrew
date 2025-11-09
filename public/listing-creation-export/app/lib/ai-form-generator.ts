/**
 * AI Form Generator Service
 * Generates comprehensive form fields using OpenAI GPT-4o (o3) model
 * Focused on deep reasoning, market analysis, and comprehensive form generation
 */

export interface FormGenerationData {
  title: string;
  description: string;
  department: string;
  category: string;
  subCategory: string;
  condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
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
  facebookBrand?: string;
  facebookCategory?: string;
  facebookCondition?: string;
  facebookGtin?: string;
  detailedDescription: string;
  marketingCopy: string;
  technicalSpecs: string;
  conditionDetails: string;
  valueProposition: string;
  // Enhanced fields from GPT-4o deep reasoning analysis
  marketAnalysis?: string;
  competitiveAdvantage?: string;
  consumerInsights?: string;
}

export interface FormGenerationRequest {
  title: string;
  description: string;
  department: string;
  category: string;
  subCategory: string;
  condition: string;
  price: number;
  brand?: string;
  additionalInfo?: string;
  photos?: string[];
}

/**
 * Generate comprehensive form fields using AI
 * Uses GPT-4o (o3) model for deep reasoning and comprehensive analysis
 */
export async function generateFormFields(
  userInput: FormGenerationRequest
): Promise<FormGenerationData> {
  console.log("🚀 Starting AI Form Generation...");
  console.log("📝 User Input:", userInput);

  try {
    const response = await fetch('/api/ai/generate-form-fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInput),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || 'Failed to generate form fields');
    }

    const data = await response.json();
    console.log("✅ AI Response received:", data);
    console.log("📊 Generated Form Data:", data.formData);
    
    return data.formData;
  } catch (error) {
    console.error('❌ Error generating form fields:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate form fields');
  }
}

/**
 * Generate enhanced product description
 */
export async function generateEnhancedDescription(
  title: string,
  category: string,
  basicDescription: string
): Promise<string> {
  console.log("📝 Generating enhanced description...");
  console.log("📋 Input:", { title, category, basicDescription });

  try {
    const response = await fetch('/api/ai/enhance-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        category,
        basicDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Description Enhancement Error:", errorData);
      throw new Error(errorData.error || 'Failed to enhance description');
    }

    const data = await response.json();
    console.log("✅ Enhanced Description:", data.description);
    
    return data.description;
  } catch (error) {
    console.error('❌ Error enhancing description:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to enhance description');
  }
}

/**
 * Generate pricing analysis
 */
export async function generatePricingAnalysis(
  title: string,
  category: string,
  condition: string,
  currentPrice: number
): Promise<{
  estimatedRetailPrice: number;
  listPrice: number;
  priceReasoning: string;
}> {
  console.log("💰 Generating pricing analysis...");
  console.log("📋 Input:", { title, category, condition, currentPrice });

  try {
    const response = await fetch('/api/ai/analyze-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        category,
        condition,
        currentPrice,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Pricing Analysis Error:", errorData);
      throw new Error(errorData.error || 'Failed to analyze pricing');
    }

    const data = await response.json();
    console.log("✅ Pricing Analysis:", data.pricing);
    
    return data.pricing;
  } catch (error) {
    console.error('❌ Error analyzing pricing:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to analyze pricing');
  }
} 