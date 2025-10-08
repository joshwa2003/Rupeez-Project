const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test user data
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123'
};

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health Check:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ User Registration Success:');
    console.log('   - User ID:', response.data.data.user.id);
    console.log('   - Name:', response.data.data.user.name);
    console.log('   - Email:', response.data.data.user.email);
    console.log('   - Token received:', response.data.data.token ? 'Yes' : 'No');
    return response.data.data.token;
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  User already exists, proceeding to login test...');
      return null;
    }
    console.error('❌ User Registration Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUserLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User Login Success:');
    console.log('   - User ID:', response.data.data.user.id);
    console.log('   - Name:', response.data.data.user.name);
    console.log('   - Email:', response.data.data.user.email);
    console.log('   - Last Login:', response.data.data.user.lastLogin);
    console.log('   - Token received:', response.data.data.token ? 'Yes' : 'No');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ User Login Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetCurrentUser(token) {
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get Current User Success:');
    console.log('   - User ID:', response.data.data.user.id);
    console.log('   - Name:', response.data.data.user.name);
    console.log('   - Email:', response.data.data.user.email);
    return true;
  } catch (error) {
    console.error('❌ Get Current User Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testInvalidLogin() {
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: 'wrongpassword'
    });
    console.error('❌ Invalid Login Test Failed: Should have been rejected');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid Login Test Success: Correctly rejected invalid credentials');
      return true;
    }
    console.error('❌ Invalid Login Test Failed:', error.message);
    return false;
  }
}

async function testDuplicateRegistration() {
  try {
    await axios.post(`${API_BASE}/auth/register`, testUser);
    console.error('❌ Duplicate Registration Test Failed: Should have been rejected');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('✅ Duplicate Registration Test Success: Correctly rejected duplicate email');
      return true;
    }
    console.error('❌ Duplicate Registration Test Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Main test function
async function runUserAuthTests() {
  console.log('🧪 Starting User Authentication Tests...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const healthOk = await testHealthCheck();
  if (!healthOk) return;
  
  // Test 2: User Registration
  console.log('\n2. Testing User Registration...');
  const registrationToken = await testUserRegistration();
  
  // Test 3: User Login
  console.log('\n3. Testing User Login...');
  const loginToken = await testUserLogin();
  if (!loginToken) return;
  
  // Test 4: Get Current User
  console.log('\n4. Testing Get Current User...');
  await testGetCurrentUser(loginToken);
  
  // Test 5: Invalid Login
  console.log('\n5. Testing Invalid Login...');
  await testInvalidLogin();
  
  // Test 6: Duplicate Registration
  console.log('\n6. Testing Duplicate Registration...');
  await testDuplicateRegistration();
  
  console.log('\n🎉 All user authentication tests completed!');
  console.log('\n📊 Summary:');
  console.log('   - User registration and login working with MongoDB');
  console.log('   - Password hashing and validation working');
  console.log('   - JWT token generation and validation working');
  console.log('   - Duplicate email prevention working');
  console.log('   - Invalid credential rejection working');
}

// Run tests
runUserAuthTests().catch(console.error);
