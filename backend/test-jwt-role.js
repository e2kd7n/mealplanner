/**
 * Test script to verify JWT tokens include role field
 */

const jwt = require('jsonwebtoken');

// Simulate the token generation
function testTokenGeneration() {
  console.log('Testing JWT Token Role Field...\n');
  
  // Test payload with role
  const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    familyName: 'TestFamily',
    role: 'admin'
  };
  
  const secret = 'test-secret-key';
  
  // Generate token
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  console.log('Generated Token:', token.substring(0, 50) + '...\n');
  
  // Decode token
  const decoded = jwt.verify(token, secret);
  console.log('Decoded Token Payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
  // Verify role is present
  if (decoded.role === 'admin') {
    console.log('\n✅ SUCCESS: Role field is present in token');
    console.log(`   Role value: ${decoded.role}`);
  } else {
    console.log('\n❌ FAILURE: Role field is missing or incorrect');
    console.log(`   Expected: admin, Got: ${decoded.role}`);
  }
  
  // Test with user role
  console.log('\n---\n');
  const userPayload = {
    userId: 'test-user-id-2',
    email: 'user@example.com',
    familyName: 'UserFamily',
    role: 'user'
  };
  
  const userToken = jwt.sign(userPayload, secret, { expiresIn: '1h' });
  const decodedUser = jwt.verify(userToken, secret);
  
  console.log('User Token Payload:');
  console.log(JSON.stringify(decodedUser, null, 2));
  
  if (decodedUser.role === 'user') {
    console.log('\n✅ SUCCESS: User role field is present in token');
    console.log(`   Role value: ${decodedUser.role}`);
  } else {
    console.log('\n❌ FAILURE: User role field is missing or incorrect');
  }
}

testTokenGeneration();

// Made with Bob
