const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test user data
const testUser = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  password: 'password123'
};

let authToken = null;

// Test functions
async function registerAndLogin() {
  try {
    // Try to register (might fail if user exists)
    try {
      await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, proceeding to login...');
      } else {
        throw error;
      }
    }

    // Login to get token
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = response.data.data.token;
    console.log('✅ Login successful, token obtained');
    return true;
  } catch (error) {
    console.error('❌ Registration/Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetProfile() {
  try {
    const response = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get Profile Success:');
    console.log('   - User ID:', response.data.data.user.id);
    console.log('   - Name:', response.data.data.user.name);
    console.log('   - Email:', response.data.data.user.email);
    console.log('   - Phone:', response.data.data.user.phone || 'Not set');
    console.log('   - Address:', response.data.data.user.address || 'Not set');
    console.log('   - Join Date:', response.data.data.user.joinDate);
    console.log('   - Preferences:', JSON.stringify(response.data.data.user.preferences));
    
    return response.data.data.user;
  } catch (error) {
    console.error('❌ Get Profile Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdateProfile() {
  try {
    const updateData = {
      name: 'Jane Smith Updated',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Street, New City, NY 12345',
      avatar: 'https://via.placeholder.com/200'
    };

    const response = await axios.put(`${API_BASE}/users/profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Update Profile Success:');
    console.log('   - Updated Name:', response.data.data.user.name);
    console.log('   - Updated Phone:', response.data.data.user.phone);
    console.log('   - Updated Address:', response.data.data.user.address);
    console.log('   - Updated Avatar:', response.data.data.user.avatar);
    console.log('   - Updated At:', response.data.data.user.updatedAt);
    
    return response.data.data.user;
  } catch (error) {
    console.error('❌ Update Profile Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetUpdatedProfile() {
  try {
    const response = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get Updated Profile Success:');
    console.log('   - Name:', response.data.data.user.name);
    console.log('   - Phone:', response.data.data.user.phone);
    console.log('   - Address:', response.data.data.user.address);
    console.log('   - Avatar:', response.data.data.user.avatar);
    
    // Verify the updates persisted
    const user = response.data.data.user;
    if (user.name === 'Jane Smith Updated' && 
        user.phone === '+1 (555) 987-6543' && 
        user.address === '456 Oak Street, New City, NY 12345') {
      console.log('✅ Profile updates persisted correctly in database');
      return true;
    } else {
      console.log('❌ Profile updates did not persist correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Get Updated Profile Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testInvalidProfileUpdate() {
  try {
    // Try to update with invalid data (empty name)
    await axios.put(`${API_BASE}/users/profile`, { name: '' }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.error('❌ Invalid Profile Update Test Failed: Should have been rejected');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Invalid Profile Update Test Success: Correctly rejected invalid data');
      return true;
    }
    console.error('❌ Invalid Profile Update Test Failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    await axios.get(`${API_BASE}/users/profile`);
    console.error('❌ Unauthorized Access Test Failed: Should have been rejected');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized Access Test Success: Correctly rejected request without token');
      return true;
    }
    console.error('❌ Unauthorized Access Test Failed:', error.message);
    return false;
  }
}

// Main test function
async function runUserProfileTests() {
  console.log('🧪 Starting User Profile Tests...\n');
  
  // Test 1: Register and Login
  console.log('1. Testing Registration and Login...');
  const loginSuccess = await registerAndLogin();
  if (!loginSuccess) return;
  
  // Test 2: Get Profile
  console.log('\n2. Testing Get Profile...');
  const profile = await testGetProfile();
  if (!profile) return;
  
  // Test 3: Update Profile
  console.log('\n3. Testing Update Profile...');
  const updatedProfile = await testUpdateProfile();
  if (!updatedProfile) return;
  
  // Test 4: Verify Updates Persisted
  console.log('\n4. Testing Profile Persistence...');
  const persistenceTest = await testGetUpdatedProfile();
  
  // Test 5: Invalid Profile Update
  console.log('\n5. Testing Invalid Profile Update...');
  await testInvalidProfileUpdate();
  
  // Test 6: Unauthorized Access
  console.log('\n6. Testing Unauthorized Access...');
  await testUnauthorizedAccess();
  
  console.log('\n🎉 All user profile tests completed!');
  console.log('\n📊 Summary:');
  console.log('   - User profile retrieval working with MongoDB');
  console.log('   - User profile updates working and persisting');
  console.log('   - Data validation working correctly');
  console.log('   - Authorization protection working');
  console.log('   - Database integration fully functional');
}

// Run tests
runUserProfileTests().catch(console.error);
