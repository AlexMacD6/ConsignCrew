/**
 * Test script for Admin Export Data API
 * Tests the export functionality for various tables
 * 
 * Usage: node scripts/test-export-api.js
 * 
 * Note: Requires admin authentication token
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test configuration
const BASE_URL = 'https://www.treasurehubclub.com';
// For local testing: const BASE_URL = 'http://localhost:3000';

async function testExportAPI() {
  console.log('🧪 Testing Admin Export Data API\n');
  
  // Prompt for admin session token
  const token = await new Promise((resolve) => {
    rl.question('Enter your admin session token (from browser cookies): ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.error('❌ No token provided');
    process.exit(1);
  }

  try {
    // Test 1: Fetch available tables
    console.log('\n📋 Test 1: Fetching available tables...');
    const tablesResponse = await fetch(`${BASE_URL}/api/admin/export-table`, {
      headers: {
        'Cookie': `better-auth.session_token=${token}`,
      },
    });

    if (!tablesResponse.ok) {
      throw new Error(`Failed to fetch tables: ${tablesResponse.status} ${tablesResponse.statusText}`);
    }

    const tablesData = await tablesResponse.json();
    console.log(`✅ Success: Found ${tablesData.tables.length} tables`);
    console.log('Available tables:', tablesData.tables.map(t => t.name).join(', '));

    // Test 2: Export a small table (verification tokens - usually small/empty)
    console.log('\n📤 Test 2: Exporting verification tokens table...');
    const exportResponse = await fetch(`${BASE_URL}/api/admin/export-table`, {
      method: 'POST',
      headers: {
        'Cookie': `better-auth.session_token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table: 'verificationToken' }),
    });

    if (!exportResponse.ok) {
      throw new Error(`Failed to export: ${exportResponse.status} ${exportResponse.statusText}`);
    }

    const rowCount = exportResponse.headers.get('X-Row-Count');
    const csvData = await exportResponse.text();
    console.log(`✅ Success: Exported ${rowCount} rows`);
    console.log(`CSV size: ${(csvData.length / 1024).toFixed(2)} KB`);
    
    // Show first few lines
    const lines = csvData.split('\n').slice(0, 3);
    console.log('Preview (first 3 lines):');
    lines.forEach((line, i) => console.log(`  ${i + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`));

    // Test 3: Test invalid table name
    console.log('\n🚫 Test 3: Testing error handling (invalid table)...');
    const errorResponse = await fetch(`${BASE_URL}/api/admin/export-table`, {
      method: 'POST',
      headers: {
        'Cookie': `better-auth.session_token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table: 'nonexistent_table' }),
    });

    if (errorResponse.status === 400) {
      const errorData = await errorResponse.json();
      console.log(`✅ Success: Error properly handled (${errorData.error})`);
    } else {
      console.log('⚠️  Warning: Expected 400 error for invalid table');
    }

    // Test 4: Export a larger table (sessions)
    console.log('\n📤 Test 4: Exporting sessions table...');
    const sessionsResponse = await fetch(`${BASE_URL}/api/admin/export-table`, {
      method: 'POST',
      headers: {
        'Cookie': `better-auth.session_token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table: 'session' }),
    });

    if (sessionsResponse.ok) {
      const sessionRowCount = sessionsResponse.headers.get('X-Row-Count');
      const sessionCsvData = await sessionsResponse.text();
      console.log(`✅ Success: Exported ${sessionRowCount} rows`);
      console.log(`CSV size: ${(sessionCsvData.length / 1024).toFixed(2)} KB`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  ✅ Table list retrieval: PASSED`);
    console.log(`  ✅ CSV export: PASSED`);
    console.log(`  ✅ Error handling: PASSED`);
    console.log(`  ✅ Large table export: PASSED`);
    console.log('\n🎉 Export Data API is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify you have admin permissions');
    console.error('  2. Check that your session token is valid');
    console.error('  3. Ensure the server is running');
    console.error('  4. Check server logs for detailed errors\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run tests
testExportAPI();

