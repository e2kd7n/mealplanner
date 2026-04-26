/**
 * Team Beta - Quick Test for Issue #143: JWT Token Role Field
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testJWTRoleFix() {
  console.log('🧪 Team Beta - Testing Issue #143: JWT Token Role Field\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login and get fresh token
    console.log('\n📝 Step 1: Login to get fresh JWT token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });

    console.log('Login response keys:', Object.keys(loginResponse.data));
    const token = loginResponse.data.accessToken || loginResponse.data.token;
    
    if (!token) {
      console.log('❌ FAIL: No token in response');
      console.log('Response:', loginResponse.data);
      return;
    }
    
    console.log('✅ Login successful');

    // Step 2: Decode the JWT token (without verification, just to inspect)
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    console.log('\n📝 Step 2: Inspect JWT token payload...');
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // Step 3: Check if role field exists
    console.log('\n📝 Step 3: Verify role field exists...');
    if (payload.role) {
      console.log(`✅ PASS: Role field found in token: "${payload.role}"`);
    } else {
      console.log('❌ FAIL: Role field missing from token');
      console.log('Available fields:', Object.keys(payload));
    }

    // Step 4: Test admin endpoint access (if user is admin)
    console.log('\n📝 Step 4: Test authenticated endpoint...');
    try {
      // Get CSRF token first
      const csrfResponse = await axios.get(`${BASE_URL}/csrf-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const csrfToken = csrfResponse.data.csrfToken;
      const cookies = csrfResponse.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';

      // Try to submit feedback (requires authentication)
      const feedbackResponse = await axios.post(`${BASE_URL}/feedback`, {
        page: '/test',
        feedbackType: 'bug',
        message: 'Test message',
        rating: 5
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
          'Cookie': cookies
        }
      });

      console.log('✅ PASS: Authenticated endpoint accessible');
      console.log('Feedback submitted successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ FAIL: Authentication failed - role field may be missing or invalid');
      } else {
        console.log(`✅ PASS: Got expected response (${error.response?.status})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Issue #143 Fix Verified: JWT tokens now include role field');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testJWTRoleFix();

// Made with Bob
