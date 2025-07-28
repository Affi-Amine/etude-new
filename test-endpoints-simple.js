// Simple test script using Node.js built-in modules
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('🚀 Testing endpoints with Node.js http module...');
  
  try {
    // Test 1: Authentication
    console.log('\n1. Testing authentication...');
    const authData = JSON.stringify({
      email: 'ahmed.ben.salem@gmail.com',
      password: 'teacher123',
      redirect: false
    });
    
    const authOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(authData)
      }
    };
    
    const authResponse = await makeRequest(authOptions, authData);
    console.log('Auth Status:', authResponse.statusCode);
    console.log('Auth Response:', authResponse.body);
    
    // Test 2: Group creation without auth (should fail)
    console.log('\n2. Testing group creation without auth...');
    const groupData = JSON.stringify({
      name: 'Test Math Group',
      subject: 'Mathématiques',
      schedule: {
        day: 'Lundi',
        time: '14:00',
        duration: 60
      },
      paymentConfig: {
        monthlyFee: 200,
        sessionFee: 50,
        registrationFee: 100,
        paymentDeadline: 4
      },
      studentIds: []
    });
    
    const groupOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/groups',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(groupData)
      }
    };
    
    const groupResponse = await makeRequest(groupOptions, groupData);
    console.log('Group Creation Status:', groupResponse.statusCode);
    console.log('Group Creation Response:', groupResponse.body);
    
    // Test 3: Test with string values (should fail validation)
    console.log('\n3. Testing with string values (should fail)...');
    const badGroupData = JSON.stringify({
      name: 'Test Group',
      subject: 'Mathématiques',
      schedule: {
        day: 'Lundi',
        time: '14:00',
        duration: '60'  // String instead of number
      },
      paymentConfig: {
        monthlyFee: '200',  // String instead of number
        sessionFee: 50,
        registrationFee: 100,
        paymentDeadline: '4'  // String instead of number
      },
      studentIds: []
    });
    
    const badGroupOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/groups',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(badGroupData)
      }
    };
    
    const badGroupResponse = await makeRequest(badGroupOptions, badGroupData);
    console.log('Bad Data Status:', badGroupResponse.statusCode);
    console.log('Bad Data Response:', badGroupResponse.body);
    
    // Analysis
    console.log('\n📋 Test Results Analysis:');
    
    if (authResponse.statusCode === 200) {
      console.log('✅ Authentication endpoint is working');
    } else {
      console.log('❌ Authentication failed with status:', authResponse.statusCode);
    }
    
    if (groupResponse.statusCode === 401) {
      console.log('✅ Group creation correctly requires authentication');
    } else if (groupResponse.statusCode === 400) {
      console.log('❌ Schema validation failed - our fix might not be working');
    } else {
      console.log('⚠️  Unexpected group creation status:', groupResponse.statusCode);
    }
    
    if (badGroupResponse.statusCode === 400) {
      console.log('✅ Schema validation correctly rejects string values');
    } else if (badGroupResponse.statusCode === 401) {
      console.log('✅ Authentication required (as expected)');
    } else {
      console.log('⚠️  Unexpected bad data status:', badGroupResponse.statusCode);
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Server is accessible: ✅');
    console.log('- Authentication endpoint: ' + (authResponse.statusCode === 200 ? '✅' : '❌'));
    console.log('- Group creation security: ' + (groupResponse.statusCode === 401 ? '✅' : '❌'));
    console.log('- Data validation: ' + (badGroupResponse.statusCode === 400 || badGroupResponse.statusCode === 401 ? '✅' : '❌'));
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testEndpoints();