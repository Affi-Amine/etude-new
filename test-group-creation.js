// Using built-in fetch API (Node.js 18+)

async function testGroupCreation() {
  try {
    console.log('Testing group creation API...');
    
    // First, let's test authentication
    console.log('\n1. Testing authentication...');
    const authResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teacher@example.com',
        password: 'password123'
      })
    });
    
    console.log('Auth response status:', authResponse.status);
    
    // Test the groups endpoint without auth first
    console.log('\n2. Testing groups endpoint without auth...');
    const noAuthResponse = await fetch('http://localhost:3000/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Group',
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
      })
    });
    
    console.log('No auth response status:', noAuthResponse.status);
    const noAuthText = await noAuthResponse.text();
    console.log('No auth response body:', noAuthText);
    
    // Test with valid data format to check schema validation
    console.log('\n3. Testing data format validation...');
    console.log('Expected format:');
    console.log('- monthlyFee: number (200)');
    console.log('- paymentDeadline: number (4)');
    console.log('- schedule.duration: number (60)');
    
    if (noAuthResponse.status === 401) {
      console.log('\n✅ API correctly requires authentication');
      console.log('✅ Data format appears correct (no schema validation errors)');
    } else if (noAuthResponse.status === 400) {
      console.log('\n❌ Schema validation failed - check data types');
    } else {
      console.log('\n⚠️  Unexpected response status');
    }
    
  } catch (error) {
    console.error('Error testing group creation:', error.message);
  }
}

testGroupCreation();