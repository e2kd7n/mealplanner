/**
 * Test script for Issue #144: Rating Field Validation Fix
 * Tests the optional rating field in feedback submission
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testUserId = '';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`Testing: ${testName}`, 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logResult(passed, message) {
  if (passed) {
    log(`✓ PASS: ${message}`, 'green');
  } else {
    log(`✗ FAIL: ${message}`, 'red');
  }
}

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  testResults.tests.push({ name, passed, details });
}

// Helper function to submit feedback
async function submitFeedback(data) {
  try {
    const response = await axios.post(`${BASE_URL}/feedback`, data, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Setup: Login to get auth token
async function setup() {
  log('\n🔧 Setting up test environment...', 'yellow');
  
  try {
    // Try to login with existing test user
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!@#',
    });
    
    authToken = loginResponse.data.token;
    testUserId = loginResponse.data.user.id;
    log('✓ Logged in successfully', 'green');
    return true;
  } catch (error) {
    // If login fails, try to register
    try {
      log('Test user not found, creating new user...', 'yellow');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test@example.com',
        password: 'Test123!@#',
        familyName: 'Test Family',
      });
      
      authToken = registerResponse.data.token;
      testUserId = registerResponse.data.user.id;
      log('✓ Registered and logged in successfully', 'green');
      return true;
    } catch (regError) {
      log('✗ Failed to setup test user', 'red');
      console.error(regError.response?.data || regError.message);
      return false;
    }
  }
}

// Test 1: Submit feedback WITHOUT rating (should succeed)
async function testNoRating() {
  logTest('Feedback submission WITHOUT rating');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback without rating',
  });
  
  const passed = result.success && result.status === 201;
  logResult(passed, 'Feedback accepted without rating');
  
  if (passed) {
    logResult(result.data.data.rating === null, `Rating stored as null: ${result.data.data.rating}`);
    recordTest('Submit without rating', passed && result.data.data.rating === null, result);
  } else {
    log(`Error: ${JSON.stringify(result.error)}`, 'red');
    recordTest('Submit without rating', false, result);
  }
}

// Test 2: Submit feedback with rating = null explicitly
async function testNullRating() {
  logTest('Feedback submission with explicit null rating');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'feature',
    message: 'Test feedback with null rating',
    rating: null,
  });
  
  const passed = result.success && result.status === 201;
  logResult(passed, 'Feedback accepted with null rating');
  
  if (passed) {
    logResult(result.data.data.rating === null, `Rating stored as null: ${result.data.data.rating}`);
    recordTest('Submit with null rating', passed && result.data.data.rating === null, result);
  } else {
    log(`Error: ${JSON.stringify(result.error)}`, 'red');
    recordTest('Submit with null rating', false, result);
  }
}

// Test 3: Submit feedback with rating = undefined explicitly
async function testUndefinedRating() {
  logTest('Feedback submission with undefined rating');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'improvement',
    message: 'Test feedback with undefined rating',
    rating: undefined,
  });
  
  const passed = result.success && result.status === 201;
  logResult(passed, 'Feedback accepted with undefined rating');
  
  if (passed) {
    logResult(result.data.data.rating === null, `Rating stored as null: ${result.data.data.rating}`);
    recordTest('Submit with undefined rating', passed && result.data.data.rating === null, result);
  } else {
    log(`Error: ${JSON.stringify(result.error)}`, 'red');
    recordTest('Submit with undefined rating', false, result);
  }
}

// Test 4: Submit feedback with valid ratings (1-5)
async function testValidRatings() {
  logTest('Feedback submission with VALID ratings (1-5)');
  
  for (let rating = 1; rating <= 5; rating++) {
    const result = await submitFeedback({
      page: '/test-page',
      feedbackType: 'other',
      message: `Test feedback with rating ${rating}`,
      rating: rating,
    });
    
    const passed = result.success && result.status === 201 && result.data.data.rating === rating;
    logResult(passed, `Rating ${rating} accepted and stored correctly`);
    recordTest(`Valid rating ${rating}`, passed, result);
  }
}

// Test 5: Submit feedback with invalid rating = 0
async function testInvalidRatingZero() {
  logTest('Feedback submission with INVALID rating = 0');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with rating 0',
    rating: 0,
  });
  
  const passed = !result.success && result.status === 400;
  logResult(passed, 'Rating 0 rejected with 400 error');
  
  if (passed) {
    const hasCorrectMessage = result.error.message?.includes('between 1 and 5');
    logResult(hasCorrectMessage, `Error message is clear: "${result.error.message}"`);
    recordTest('Invalid rating 0', passed && hasCorrectMessage, result);
  } else {
    log(`Unexpected result: ${JSON.stringify(result)}`, 'red');
    recordTest('Invalid rating 0', false, result);
  }
}

// Test 6: Submit feedback with invalid rating = 6
async function testInvalidRatingSix() {
  logTest('Feedback submission with INVALID rating = 6');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with rating 6',
    rating: 6,
  });
  
  const passed = !result.success && result.status === 400;
  logResult(passed, 'Rating 6 rejected with 400 error');
  
  if (passed) {
    const hasCorrectMessage = result.error.message?.includes('between 1 and 5');
    logResult(hasCorrectMessage, `Error message is clear: "${result.error.message}"`);
    recordTest('Invalid rating 6', passed && hasCorrectMessage, result);
  } else {
    log(`Unexpected result: ${JSON.stringify(result)}`, 'red');
    recordTest('Invalid rating 6', false, result);
  }
}

// Test 7: Submit feedback with negative rating
async function testNegativeRating() {
  logTest('Feedback submission with NEGATIVE rating');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with negative rating',
    rating: -1,
  });
  
  const passed = !result.success && result.status === 400;
  logResult(passed, 'Negative rating rejected with 400 error');
  recordTest('Negative rating', passed, result);
}

// Test 8: Edge case - empty string rating
async function testEmptyStringRating() {
  logTest('Edge case: Empty string rating');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with empty string rating',
    rating: '',
  });
  
  // Empty string should be treated as falsy and converted to null
  const passed = result.success && result.status === 201;
  logResult(passed, 'Empty string rating handled gracefully');
  
  if (passed) {
    logResult(result.data.data.rating === null, `Empty string converted to null: ${result.data.data.rating}`);
    recordTest('Empty string rating', passed && result.data.data.rating === null, result);
  } else {
    recordTest('Empty string rating', false, result);
  }
}

// Test 9: Edge case - decimal rating
async function testDecimalRating() {
  logTest('Edge case: Decimal rating (3.5)');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with decimal rating',
    rating: 3.5,
  });
  
  // Should either accept and truncate, or reject
  if (result.success) {
    log(`Decimal accepted and stored as: ${result.data.data.rating}`, 'yellow');
    recordTest('Decimal rating', true, result);
  } else {
    log(`Decimal rejected: ${result.error.message}`, 'yellow');
    recordTest('Decimal rating', true, result);
  }
}

// Test 10: Edge case - string number rating
async function testStringNumberRating() {
  logTest('Edge case: String number rating ("3")');
  
  const result = await submitFeedback({
    page: '/test-page',
    feedbackType: 'bug',
    message: 'Test feedback with string number rating',
    rating: '3',
  });
  
  // Should handle type coercion
  if (result.success && result.data.data.rating === 3) {
    logResult(true, 'String number coerced to integer correctly');
    recordTest('String number rating', true, result);
  } else if (result.success) {
    log(`String accepted but stored as: ${result.data.data.rating} (type: ${typeof result.data.data.rating})`, 'yellow');
    recordTest('String number rating', false, result);
  } else {
    log(`String number rejected: ${result.error.message}`, 'yellow');
    recordTest('String number rating', false, result);
  }
}

// Print summary
function printSummary() {
  console.log('\n');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('                    TEST SUMMARY                       ', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  log(`\nTotal Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'yellow');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}`, 'red'));
  }
  
  console.log('\n');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  // Check acceptance criteria
  log('\n📋 Acceptance Criteria Check:', 'blue');
  const criteria = [
    { name: 'Rating field is truly optional', passed: testResults.tests.find(t => t.name === 'Submit without rating')?.passed },
    { name: 'Null/undefined ratings are accepted', passed: testResults.tests.find(t => t.name === 'Submit with null rating')?.passed },
    { name: 'Valid ratings (1-5) are accepted', passed: testResults.tests.filter(t => t.name.startsWith('Valid rating')).every(t => t.passed) },
    { name: 'Invalid ratings rejected with clear error', passed: testResults.tests.find(t => t.name === 'Invalid rating 0')?.passed && testResults.tests.find(t => t.name === 'Invalid rating 6')?.passed },
    { name: 'Database stores null ratings correctly', passed: testResults.tests.find(t => t.name === 'Submit without rating')?.passed },
  ];
  
  criteria.forEach(c => {
    logResult(c.passed, c.name);
  });
  
  const allCriteriaMet = criteria.every(c => c.passed);
  console.log('\n');
  if (allCriteriaMet) {
    log('✅ ALL ACCEPTANCE CRITERIA MET!', 'green');
  } else {
    log('⚠️  Some acceptance criteria not met', 'yellow');
  }
  
  console.log('\n');
}

// Main test runner
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║     Issue #144: Rating Field Validation Testing      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');
  
  const setupSuccess = await setup();
  if (!setupSuccess) {
    log('\n❌ Setup failed. Cannot proceed with tests.', 'red');
    process.exit(1);
  }
  
  log('\n🚀 Starting tests...\n', 'yellow');
  
  // Run all tests
  await testNoRating();
  await testNullRating();
  await testUndefinedRating();
  await testValidRatings();
  await testInvalidRatingZero();
  await testInvalidRatingSix();
  await testNegativeRating();
  await testEmptyStringRating();
  await testDecimalRating();
  await testStringNumberRating();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

// Made with Bob
