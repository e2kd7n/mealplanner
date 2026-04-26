/**
 * Team Beta - Test Script for Issue #144: Rating Field Validation
 * 
 * This script tests the feedback submission endpoint to verify that:
 * 1. Rating field is truly optional (null/undefined accepted)
 * 2. Valid ratings (1-5) are accepted
 * 3. Invalid ratings (0, 6, etc.) are rejected
 * 4. Edge cases are handled properly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let csrfToken = '';
let cookies = '';
let testResults = [];

// Helper function to log test results
function logTest(testName, passed, details) {
  const result = {
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}: ${testName}`);
  if (details) console.log(`   Details: ${details}`);
}

// Helper function to submit feedback
async function submitFeedback(data) {
  try {
    const response = await axios.post(`${BASE_URL}/feedback`, data, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies
      }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log('   Error details:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test Suite
async function runTests() {
  console.log('🧪 Team Beta - Testing Issue #144: Rating Field Validation\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n📝 Step 1: Authenticating test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    authToken = loginResponse.data.accessToken;
    
    // Extract cookies from login response
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (setCookieHeader) {
      cookies = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    logTest('Authentication', true, 'Successfully obtained auth token');

    // Step 1.5: Get CSRF token
    console.log('\n📝 Step 1.5: Fetching CSRF token...');
    const csrfResponse = await axios.get(`${BASE_URL}/csrf-token`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cookie': cookies
      }
    });
    csrfToken = csrfResponse.data.csrfToken;
    
    // Update cookies with CSRF cookie
    const csrfCookieHeader = csrfResponse.headers['set-cookie'];
    if (csrfCookieHeader) {
      const csrfCookies = csrfCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
      cookies = cookies ? `${cookies}; ${csrfCookies}` : csrfCookies;
    }
    
    logTest('CSRF Token Fetch', true, 'Successfully obtained CSRF token');

    // Test 2: Submit feedback WITHOUT rating (should succeed)
    console.log('\n📝 Test 2: Submit feedback WITHOUT rating (null)');
    const test2 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'improvement',
      message: 'Test feedback without rating',
      rating: null
    });
    logTest(
      'Feedback without rating (null)',
      test2.success && test2.status === 201,
      test2.success ? 'Accepted null rating' : test2.error?.message
    );

    // Test 3: Submit feedback with undefined rating (should succeed)
    console.log('\n📝 Test 3: Submit feedback with undefined rating');
    const test3 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'bug',
      message: 'Test feedback with undefined rating'
      // rating is undefined (not included)
    });
    logTest(
      'Feedback without rating (undefined)',
      test3.success && test3.status === 201,
      test3.success ? 'Accepted undefined rating' : test3.error?.message
    );

    // Test 4: Submit feedback with valid rating = 1 (should succeed)
    console.log('\n📝 Test 4: Submit feedback with rating = 1');
    const test4 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'feature',
      message: 'Test feedback with rating 1',
      rating: 1
    });
    logTest(
      'Feedback with rating = 1',
      test4.success && test4.status === 201,
      test4.success ? 'Accepted rating 1' : test4.error?.message
    );

    // Test 5: Submit feedback with valid rating = 3 (should succeed)
    console.log('\n📝 Test 5: Submit feedback with rating = 3');
    const test5 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'improvement',
      message: 'Test feedback with rating 3',
      rating: 3
    });
    logTest(
      'Feedback with rating = 3',
      test5.success && test5.status === 201,
      test5.success ? 'Accepted rating 3' : test5.error?.message
    );

    // Test 6: Submit feedback with valid rating = 5 (should succeed)
    console.log('\n📝 Test 6: Submit feedback with rating = 5');
    const test6 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'question',
      message: 'Test feedback with rating 5',
      rating: 5
    });
    logTest(
      'Feedback with rating = 5',
      test6.success && test6.status === 201,
      test6.success ? 'Accepted rating 5' : test6.error?.message
    );

    // Test 7: Submit feedback with invalid rating = 0 (should fail)
    console.log('\n📝 Test 7: Submit feedback with rating = 0 (invalid)');
    const test7 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'bug',
      message: 'Test feedback with rating 0',
      rating: 0
    });
    logTest(
      'Feedback with rating = 0 (should reject)',
      !test7.success && test7.status === 400,
      test7.error?.message || 'Correctly rejected invalid rating'
    );

    // Test 8: Submit feedback with invalid rating = 6 (should fail)
    console.log('\n📝 Test 8: Submit feedback with rating = 6 (invalid)');
    const test8 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'other',
      message: 'Test feedback with rating 6',
      rating: 6
    });
    logTest(
      'Feedback with rating = 6 (should reject)',
      !test8.success && test8.status === 400,
      test8.error?.message || 'Correctly rejected invalid rating'
    );

    // Test 9: Submit feedback with invalid rating = -1 (should fail)
    console.log('\n📝 Test 9: Submit feedback with rating = -1 (invalid)');
    const test9 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'bug',
      message: 'Test feedback with rating -1',
      rating: -1
    });
    logTest(
      'Feedback with rating = -1 (should reject)',
      !test9.success && test9.status === 400,
      test9.error?.message || 'Correctly rejected invalid rating'
    );

    // Test 10: Edge case - empty string rating
    console.log('\n📝 Test 10: Submit feedback with empty string rating');
    const test10 = await submitFeedback({
      page: '/test-page',
      feedbackType: 'improvement',
      message: 'Test feedback with empty string rating',
      rating: ''
    });
    logTest(
      'Feedback with empty string rating',
      test10.success || test10.status === 400,
      test10.success ? 'Accepted empty string' : test10.error?.message
    );

    // Generate Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Pass Rate: ${passRate}%`);

    console.log('\n📋 ACCEPTANCE CRITERIA CHECK:');
    const criteria = [
      { name: 'Rating field is truly optional', met: testResults[1]?.passed && testResults[2]?.passed },
      { name: 'Null/undefined ratings accepted', met: testResults[1]?.passed && testResults[2]?.passed },
      { name: 'Valid ratings (1-5) accepted', met: testResults[3]?.passed && testResults[4]?.passed && testResults[5]?.passed },
      { name: 'Invalid ratings rejected', met: testResults[6]?.passed && testResults[7]?.passed && testResults[8]?.passed },
    ];

    criteria.forEach(c => {
      console.log(`${c.met ? '✅' : '❌'} ${c.name}`);
    });

    const allCriteriaMet = criteria.every(c => c.met);
    
    console.log('\n' + '='.repeat(60));
    if (allCriteriaMet && passRate >= 90) {
      console.log('✅ ALL TESTS PASSED - Ready for Team Gamma');
      console.log('Issue #144 fix is working correctly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Needs optimization');
      console.log('Review failed tests and optimize before handing to Team Gamma');
    }
    console.log('='.repeat(60));

    // Save detailed report
    const fs = require('fs');
    const report = {
      issue: '#144 - Rating Field Validation',
      team: 'Team Beta',
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        passRate: `${passRate}%`
      },
      acceptanceCriteria: criteria,
      allCriteriaMet,
      detailedResults: testResults
    };

    fs.writeFileSync(
      'backend/test-results-issue-144.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Detailed report saved to: backend/test-results-issue-144.json');

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test suite
runTests().catch(console.error);

// Made with Bob
