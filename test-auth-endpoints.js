// Test script for authentication and group creation endpoints

async function testAuthAndEndpoints() {
  try {
    console.log('🚀 Testing authentication and group creation endpoints...');
    
    // Step 1: Test authentication with provided credentials
    console.log('\n1. Testing authentication with ahmed.ben.salem@gmail.com...');
    
    const authResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ahmed.ben.salem@gmail.com',
        password: 'teacher123',
        redirect: false
      })
    });
    
    console.log('Auth response status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Auth response:', authData);
    
    if (authResponse.ok && authData.ok) {
      console.log('✅ Authentication successful');
      
      // Extract session cookie if available
      const cookies = authResponse.headers.get('set-cookie');
      console.log('Session cookies:', cookies);
      
      // Step 2: Test group creation with authentication
      console.log('\n2. Testing group creation with authentication...');
      
      const groupData = {
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
      };
      
      console.log('Sending group data:', JSON.stringify(groupData, null, 2));
      
      const groupResponse = await fetch('http://localhost:3000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify(groupData)
      });
      
      console.log('Group creation response status:', groupResponse.status);
      const groupResponseText = await groupResponse.text();
      console.log('Group creation response:', groupResponseText);
      
      if (groupResponse.status === 201) {
        console.log('✅ Group created successfully!');
        console.log('✅ ZodError has been fixed - numeric fields are properly handled');
      } else if (groupResponse.status === 400) {
        console.log('❌ Schema validation failed - checking error details...');
        try {
          const errorData = JSON.parse(groupResponseText);
          if (errorData.error && errorData.error.includes('monthlyFee')) {
            console.log('❌ monthlyFee field issue detected');
          }
          if (errorData.error && errorData.error.includes('paymentDeadline')) {
            console.log('❌ paymentDeadline field issue detected');
          }
        } catch (e) {
          console.log('Error parsing response:', e.message);
        }
      } else if (groupResponse.status === 401) {
        console.log('❌ Authentication failed - session might not be properly set');
      } else {
        console.log('⚠️  Unexpected response status');
      }
      
    } else {
      console.log('❌ Authentication failed');
      console.log('Please check if:');
      console.log('- The server is running on http://localhost:3000');
      console.log('- The credentials are correct: ahmed.ben.salem@gmail.com / teacher123');
      console.log('- The database is properly seeded');
    }
    
    // Step 3: Test with incorrect data types (should fail)
    console.log('\n3. Testing with incorrect data types (should fail)...');
    
    const badGroupData = {
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
    };
    
    const badGroupResponse = await fetch('http://localhost:3000/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(badGroupData)
    });
    
    console.log('Bad data response status:', badGroupResponse.status);
    const badResponseText = await badGroupResponse.text();
    console.log('Bad data response:', badResponseText);
    
    if (badGroupResponse.status === 400) {
      console.log('✅ Schema validation correctly rejects string values');
    } else if (badGroupResponse.status === 401) {
      console.log('✅ Authentication required (as expected)');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- Authentication test: completed');
    console.log('- Group creation test: completed');
    console.log('- Data validation test: completed');
    console.log('\n🎯 Check the results above to see if the ZodError has been resolved!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.log('\nMake sure:');
    console.log('1. The development server is running: npm run dev');
    console.log('2. The database is set up and seeded');
    console.log('3. The server is accessible at http://localhost:3000');
  }
}

testAuthAndEndpoints();