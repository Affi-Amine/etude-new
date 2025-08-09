// Comprehensive authentication test script
// Using built-in fetch (Node.js 18+)

// Test credentials from seed.ts
const testUsers = [
  {
    name: 'Admin',
    email: 'admin@lessonplatform.tn',
    password: 'admin123456'
  },
  {
    name: 'Ahmed',
    email: 'ahmed.ben.salem@gmail.com',
    password: 'teacher123'
  },
  {
    name: 'Fatma',
    email: 'fatma.trabelsi@gmail.com',
    password: 'teacher123'
  }
];

const baseUrl = 'http://localhost:3000';

async function testNextAuthCredentials(user) {
  try {
    console.log(`\n=== Testing NextAuth Credentials for ${user.name} ===`);
    
    // Test the NextAuth credentials provider endpoint
    const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: user.email,
        password: user.password,
        callbackUrl: `${baseUrl}/dashboard`,
        csrfToken: 'test-token'
      })
    });
    
    console.log(`Credentials callback response status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302 || response.status === 200) {
      console.log('✅ Credentials authentication appears successful');
      const responseText = await response.text();
      console.log('Response preview:', responseText.substring(0, 300));
    } else {
      const errorText = await response.text();
      console.log('❌ Credentials authentication failed');
      console.log('Error response:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`❌ NextAuth credentials test failed for ${user.name}:`, error.message);
  }
}

async function testDirectDatabaseAuth(user) {
  try {
    console.log(`\n=== Testing Direct Database Authentication for ${user.name} ===`);
    
    // Create a simple test endpoint call
    const response = await fetch(`${baseUrl}/api/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });
    
    console.log(`Direct auth test response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Direct authentication successful:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Direct authentication failed:', errorText);
    }
    
  } catch (error) {
    console.log(`❌ Direct database auth test failed for ${user.name}:`, error.message);
  }
}

async function testDatabaseUsers() {
  try {
    console.log('\n=== Testing Database Users Endpoint ===');
    const response = await fetch(`${baseUrl}/api/auth/test-users`);
    
    if (response.ok) {
      const users = await response.json();
      console.log('✅ Database users found:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
      });
      return users;
    } else {
      console.log('❌ Failed to fetch database users:', response.status, response.statusText);
      return [];
    }
  } catch (error) {
    console.log('❌ Error fetching database users:', error.message);
    return [];
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive authentication verification...');
  
  // Test database connection first
  const dbUsers = await testDatabaseUsers();
  
  // Test authentication for each user
  for (const user of testUsers) {
    await testNextAuthCredentials(user);
    await testDirectDatabaseAuth(user);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n🏁 Authentication verification completed!');
}

runAllTests().catch(console.error);