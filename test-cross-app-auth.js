/**
 * Test Script for Cross-App Authentication
 * 
 * Run this script to test the external registration and login endpoints
 * Usage: node test-cross-app-auth.js
 */

const API_URL = process.env.TREASUREHUB_API_URL || 'http://localhost:3000';
const API_KEY = process.env.EXTERNAL_APP_API_KEY || 'your_test_api_key';

// Test user data
const testUser = {
  email: `test-${Date.now()}@example.com`, // Unique email for testing
  password: 'TestPassword123!',
  name: 'Test User',
  mobilePhone: '+1234567890',
  userType: 'seller',
  appSource: 'selling-to-sold'
};

console.log('🧪 Cross-App Authentication Test\n');
console.log('API URL:', API_URL);
console.log('Test User Email:', testUser.email);
console.log('-----------------------------------\n');

/**
 * Test 1: Register a new user
 */
async function testRegistration() {
  console.log('📝 Test 1: User Registration');
  console.log('Sending registration request...\n');

  try {
    const response = await fetch(`${API_URL}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Name:', data.user.name);
      console.log('Email Verified:', data.user.emailVerified);
      console.log('Verification Email Sent:', data.verificationEmailSent);
      console.log('\n');
      return true;
    } else {
      console.log('❌ Registration failed:');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    console.log('\n');
    return false;
  }
}

/**
 * Test 2: Try to register duplicate user (should fail)
 */
async function testDuplicateRegistration() {
  console.log('📝 Test 2: Duplicate Registration (should fail)');
  console.log('Attempting to register same email again...\n');

  try {
    const response = await fetch(`${API_URL}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.status === 409) {
      console.log('✅ Correctly rejected duplicate registration');
      console.log('Error message:', data.error);
      console.log('\n');
      return true;
    } else {
      console.log('❌ Should have rejected duplicate registration');
      console.log('Status:', response.status);
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    console.log('\n');
    return false;
  }
}

/**
 * Test 3: Test login with correct credentials
 */
async function testLogin() {
  console.log('📝 Test 3: Login Verification');
  console.log('Attempting to verify login credentials...\n');

  try {
    const response = await fetch(`${API_URL}/api/external/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await response.json();

    // Note: Login might fail if email is not verified
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('\n');
      return true;
    } else if (response.status === 403) {
      console.log('⚠️ Login blocked - Email not verified (expected)');
      console.log('Error:', data.error);
      console.log('Requires Verification:', data.requiresVerification);
      console.log('\n');
      return true; // This is expected behavior
    } else {
      console.log('❌ Unexpected login response:');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Login test error:', error.message);
    console.log('\n');
    return false;
  }
}

/**
 * Test 4: Test with invalid API key (should fail)
 */
async function testInvalidApiKey() {
  console.log('📝 Test 4: Invalid API Key (should fail)');
  console.log('Attempting registration with wrong API key...\n');

  try {
    const response = await fetch(`${API_URL}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid_key_12345',
      },
      body: JSON.stringify({
        email: 'another@example.com',
        password: 'password123',
        name: 'Test'
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid API key');
      console.log('Error message:', data.error);
      console.log('\n');
      return true;
    } else {
      console.log('❌ Should have rejected invalid API key');
      console.log('Status:', response.status);
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    console.log('\n');
    return false;
  }
}

/**
 * Test 5: Test with missing required fields (should fail)
 */
async function testMissingFields() {
  console.log('📝 Test 5: Missing Required Fields (should fail)');
  console.log('Attempting registration without password...\n');

  try {
    const response = await fetch(`${API_URL}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        email: 'incomplete@example.com',
        name: 'Test User',
        // Missing password
      }),
    });

    const data = await response.json();

    if (response.status === 400) {
      console.log('✅ Correctly rejected incomplete data');
      console.log('Error message:', data.error);
      console.log('\n');
      return true;
    } else {
      console.log('❌ Should have rejected incomplete data');
      console.log('Status:', response.status);
      console.log('\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    console.log('\n');
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting tests...\n');
  console.log('===================================\n');

  const results = {
    registration: await testRegistration(),
    duplicateCheck: await testDuplicateRegistration(),
    login: await testLogin(),
    invalidApiKey: await testInvalidApiKey(),
    missingFields: await testMissingFields(),
  };

  console.log('===================================');
  console.log('\n📊 Test Results Summary:\n');
  console.log('✅ User Registration:', results.registration ? 'PASS' : 'FAIL');
  console.log('✅ Duplicate Check:', results.duplicateCheck ? 'PASS' : 'FAIL');
  console.log('✅ Login Verification:', results.login ? 'PASS' : 'FAIL');
  console.log('✅ API Key Validation:', results.invalidApiKey ? 'PASS' : 'FAIL');
  console.log('✅ Field Validation:', results.missingFields ? 'PASS' : 'FAIL');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  console.log('\n-----------------------------------');
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  console.log('===================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Cross-app authentication is working correctly.\n');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.\n');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

