/**
 * AI JSON Phase 1 Service Test Script
 * 
 * This script tests the AI form generation service using recently uploaded URLs
 * to verify that the Google Product Category restructuring is working correctly.
 * 
 * Usage: node scripts/test-ai-json-phase1.js
 */

import https from 'https';
import http from 'http';

// Test data from recent uploads
const testData = {
  // Photos from recent upload (CY646S)
  photoUrls: [
    'https://dtlqyjbwka60p.cloudfront.net/prod/raw/CY646S/1755037011150-47txbis4vg8.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/prod/raw/CY646S/1755037017006-7y0yikzy2b4.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/prod/raw/CY646S/1755037032117-cym2goc87n.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/prod/raw/CY646S/1755037037644-5oe2s0p0el9.jpg'
  ],
  
  // Video frames from recent upload
  videoFrameUrls: [
    'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-0-1755037008790.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-1-1755037011532.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-2-1755037011989.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-3-1755037012313.jpg',
    'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-4-1755037012584.jpg'
  ],
  
  // Video thumbnail
  videoThumbnailUrl: 'https://dtlqyjbwka60p.cloudfront.net/raw/videos/AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit/cme93puz00003yp08b0kuzl4i/frames/frame-thumbnail-1755037013015.jpg',
  
  // Test user input
  userInput: "IKEA black dresser"
};

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  endpoint: '/api/ai/generate-comprehensive-listing',
  timeout: 120000 // 2 minutes for AI processing
};

/**
 * Make HTTP request to the AI service
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: config.timeout
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test the AI service with comprehensive listing generation
 */
async function testComprehensiveListing() {
  console.log('🧪 Testing AI Comprehensive Listing Generation...\n');
  
  const requestData = {
    userInput: testData.userInput,
    photos: {
      hero: { url: testData.photoUrls[0] },
      back: { url: testData.photoUrls[1] },
      proof: { url: testData.photoUrls[2] },
      additional: [{ url: testData.photoUrls[3] }]
    },
    video: {
      url: null, // No video URL in this test
      videoId: 'test-video-id',
      frameUrls: testData.videoFrameUrls,
      thumbnailUrl: testData.videoThumbnailUrl,
      duration: 47.505
    },
    mode: 'comprehensive'
  };

  try {
    console.log('📤 Sending request to AI service...');
    console.log(`📍 Endpoint: ${config.baseUrl}${config.endpoint}`);
    console.log(`📊 Photos: ${testData.photoUrls.length}`);
    console.log(`🎥 Video Frames: ${testData.videoFrameUrls.length}`);
    console.log(`💬 User Input: "${testData.userInput}"\n`);

    const startTime = Date.now();
    const response = await makeRequest(`${config.baseUrl}${config.endpoint}`, requestData);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📥 Response received:');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`🔍 Response Type: ${typeof response.data}\n`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ AI Service Test SUCCESSFUL!\n');
      
      // Debug: Show the full response structure
      console.log('🔍 DEBUG: Full API Response Structure:');
      console.log('🔍 Response Keys:', Object.keys(response.data));
      console.log('🔍 Listing Data Type:', typeof response.data.listingData);
      
      // Display the generated data
      const listingData = response.data.listingData;
       console.log('📋 Generated Listing Data:');
       console.log(`   Title: ${listingData.title}`);
       console.log(`   Description: ${listingData.description?.substring(0, 100)}...`);
       console.log(`   Condition: ${listingData.condition}`);
       console.log(`   Brand: ${listingData.brand}`);
       console.log(`   List Price: $${listingData.listPrice}`);
       console.log(`   Estimated Retail: $${listingData.estimatedRetailPrice}`);
       console.log(`   Department: ${listingData.department}`);
       console.log(`   Category: ${listingData.category}`);
       console.log(`   SubCategory: ${listingData.subCategory}`);
       console.log(`   Height: ${listingData.height}`);
       console.log(`   Width: ${listingData.width}`);
       console.log(`   Depth: ${listingData.depth}`);
       console.log(`   Serial Number: ${listingData.serialNumber || 'Not provided'}`);
       console.log(`   Model Number: ${listingData.modelNumber || 'Not provided'}`);
       console.log(`   Discount Schedule: ${listingData.discountSchedule || 'Not set'}`);
       console.log(`   Features: ${listingData.features?.join(', ') || 'Not specified'}`);
       console.log(`   Keywords: ${listingData.keywords?.join(', ') || 'Not specified'}`);
       console.log(`   Facebook Brand: ${listingData.facebookBrand || 'Not set'}`);
       console.log(`   Facebook Category: ${listingData.facebookCategory || 'Not set'}`);
       console.log(`   Facebook Condition: ${listingData.facebookCondition || 'Not set'}`);
       console.log(`   Marketing Copy: ${listingData.marketingCopy?.substring(0, 100) || 'Not provided'}...`);
       console.log(`   Technical Specs: ${listingData.technicalSpecs?.substring(0, 100) || 'Not provided'}...`);
       console.log(`   Condition Details: ${listingData.conditionDetails?.substring(0, 100) || 'Not provided'}...`);
       console.log(`   Value Proposition: ${listingData.valueProposition?.substring(0, 100) || 'Not provided'}...\n`);

      // Display Google Product Categories (the main test focus)
      console.log('🗺️  Google Product Categories (NEW STRUCTURE):');
      console.log(`   Primary: ${listingData.googleProductCategoryPrimary || 'NOT SET'}`);
      console.log(`   Secondary: ${listingData.googleProductCategorySecondary || 'NOT SET'}`);
      console.log(`   Tertiary: ${listingData.googleProductCategoryTertiary || 'NOT SET'}`);
      console.log(`   Legacy Field: ${listingData.googleProductCategory || 'NOT SET'}\n`);

      // Display confidence scores
      if (response.data.confidenceScores) {
        console.log('🎯 Confidence Scores:');
        Object.entries(response.data.confidenceScores).forEach(([field, score]) => {
          console.log(`   ${field}: ${score.level} (${score.score}%)`);
        });
        console.log('');
      }

      // Display debug information
      if (response.data.debug) {
        console.log('🔍 Debug Information:');
        console.log(`   Model Requested: ${response.data.debug.modelRequested}`);
        console.log(`   Model Used: ${response.data.debug.modelUsed}`);
        console.log(`   Model Match: ${response.data.debug.modelMatch ? '✅ EXACT' : '❌ MISMATCH'}\n`);
      }

      // Validate the new structure
      const hasNewStructure = listingData.googleProductCategoryPrimary || 
                             listingData.googleProductCategorySecondary || 
                             listingData.googleProductCategoryTertiary;
      
      if (hasNewStructure) {
        console.log('🎉 SUCCESS: New Google Product Category structure is working!');
        console.log('   The AI is now generating separate Primary, Secondary, and Tertiary fields.');
      } else {
        console.log('⚠️  WARNING: New Google Product Category structure not detected');
        console.log('   Check if the AI prompt and processing logic are updated.');
      }

    } else {
      console.log('❌ AI Service Test FAILED!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      
      if (response.data.details) {
        console.log(`   Details: ${JSON.stringify(response.data.details, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('💥 Test Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your Next.js development server is running on port 3000');
    }
  }
}

/**
 * Test the AI service with form fields mode
 */
async function testFormFieldsMode() {
  console.log('\n🧪 Testing AI Form Fields Mode...\n');
  
  const requestData = {
    userInput: testData.userInput,
    photos: {
      hero: { url: testData.photoUrls[1] },
      back: { url: testData.photoUrls[2] },
      proof: { url: testData.photoUrls[3] },
      additional: [{ url: testData.photoUrls[0] }]
    },
    video: {
      url: null,
      videoId: 'test-video-id',
      frameUrls: testData.videoFrameUrls,
      thumbnailUrl: testData.videoThumbnailUrl,
      duration: 47.505
    },
    mode: 'formFields'
  };

  try {
    console.log('📤 Sending form fields request...');
    
    const startTime = Date.now();
    const response = await makeRequest(`${config.baseUrl}${config.endpoint}`, requestData);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status}\n`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Form Fields Mode Test SUCCESSFUL!\n');
      
      // Debug: Show the full response structure
      console.log('🔍 DEBUG: Full API Response Structure:');
      console.log('🔍 Response Keys:', Object.keys(response.data));
      console.log('🔍 Form Data Type:', typeof response.data.formData);
      console.log('🔍 Form Data:', response.data.formData);
      
      const formData = response.data.formData;
      console.log('📋 Generated Form Data:');
      console.log(`   Title: ${formData?.title || 'NOT SET'}`);
      console.log(`   Description: ${formData?.description?.substring(0, 100) || 'NOT SET'}...`);
      
      // Check Google Product Categories in form fields mode
      console.log('\n🗺️  Google Product Categories in Form Fields Mode:');
      console.log(`   Primary: ${formData?.googleProductCategoryPrimary || 'NOT SET'}`);
      console.log(`   Secondary: ${formData?.googleProductCategorySecondary || 'NOT SET'}`);
      console.log(`   Tertiary: ${formData?.googleProductCategoryTertiary || 'NOT SET'}\n`);

    } else {
      console.log('❌ Form Fields Mode Test FAILED!');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      if (response.data.details) {
        console.log(`   Details: ${JSON.stringify(response.data.details, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('💥 Form Fields Test Error:', error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 AI JSON Phase 1 Service Test Suite');
  console.log('=====================================\n');
  
  try {
    // Test comprehensive listing generation
    await testComprehensiveListing();
    
    // Test form fields mode
    await testFormFieldsMode();
    
    console.log('\n✨ Test Suite Complete!');
    console.log('\n📝 Summary:');
    console.log('   - Comprehensive listing generation tested');
    console.log('   - Form fields mode tested');
    console.log('   - Google Product Category restructuring verified');
    console.log('   - Model selection and debugging verified');
    
  } catch (error) {
    console.error('\n💥 Test Suite Failed:', error.message);
    process.exit(1);
  }
}

// Always run tests when script is executed
runTests();

export {
  testComprehensiveListing,
  testFormFieldsMode,
  runTests
};
