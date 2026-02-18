/**
 * Simple test script to verify the profile API endpoints
 * Run with: node test-profile-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testProfileEndpoints() {
  console.log('🧪 Testing Profile API Endpoints\n');

  try {
    // Test 1: Get all profiles (API endpoint)
    console.log('1. Testing GET /profiles/api');
    try {
      const response = await axios.get(`${BASE_URL}/profiles/api`);
      console.log('✅ Success:', response.data.success ? 'API working' : 'API returned error');
      
      if (response.data.success && response.data.data.length > 0) {
        const firstProfile = response.data.data[0];
        console.log(`   Found ${response.data.data.length} profile(s)`);
        console.log(`   First profile: ${firstProfile.accountInfo.name} (ID: ${firstProfile.profileId})`);
        
        // Test 2: Get specific profile
        console.log('\n2. Testing GET /profiles/api/:id');
        const profileResponse = await axios.get(`${BASE_URL}/profiles/api/${firstProfile.profileId}`);
        console.log('✅ Success:', profileResponse.data.success ? 'Profile details retrieved' : 'Failed to get profile');
      } else {
        console.log('   No profiles found or API error');
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Check if profile pages load (just check status)
    console.log('\n3. Testing GET /profiles (HTML page)');
    try {
      const response = await axios.get(`${BASE_URL}/profiles`);
      console.log('✅ Success: Profile page loads (status:', response.status, ')');
    } catch (error) {
      console.log('❌ Failed:', error.response?.status || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testProfileEndpoints().then(() => {
  console.log('\n🏁 Profile API tests completed');
}).catch(error => {
  console.error('💥 Test runner failed:', error.message);
});